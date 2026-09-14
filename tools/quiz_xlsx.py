#!/usr/bin/env python3
"""BuildBench-Quizdaten zwischen JSON und XLSX austauschen.

Das Skript verwendet ausschließlich die Python-Standardbibliothek.

Beispiele:
    python3 tools/quiz_xlsx.py export
    python3 tools/quiz_xlsx.py import --force
    python3 tools/quiz_xlsx.py export --json daten.json --xlsx fragen.xlsx
"""

from __future__ import annotations

import argparse
import json
import os
import posixpath
import re
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_JSON = ROOT / "quiz-questions.json"
DEFAULT_XLSX = ROOT / "quiz-questions.xlsx"
LETTERS = ("A", "B", "C", "D")
HEADERS = (
    "ID",
    "Kategorie",
    "Frage",
    "Hinweis",
    "Antwort A",
    "Feedback A",
    "Antwort B",
    "Feedback B",
    "Antwort C",
    "Feedback C",
    "Antwort D",
    "Feedback D",
    "Richtige Antwort",
)
MAX_ARCHIVE_SIZE = 50 * 1024 * 1024
MAX_ENTRY_SIZE = 10 * 1024 * 1024

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PACKAGE_REL = "http://schemas.openxmlformats.org/package/2006/relationships"


class QuizDataError(ValueError):
    """Ungültige Quiz- oder Arbeitsmappendaten."""


def nonempty(value: object, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise QuizDataError(f"{field} darf nicht leer sein.")
    return value.strip()


def validate_quiz(data: object) -> dict:
    if not isinstance(data, dict):
        raise QuizDataError("Die JSON-Wurzel muss ein Objekt sein.")
    if data.get("schemaVersion") != 1:
        raise QuizDataError("Es wird ausschließlich schemaVersion 1 unterstützt.")
    title = nonempty(data.get("title"), "title")
    test_size = data.get("testSize")
    if not isinstance(test_size, int) or isinstance(test_size, bool) or test_size < 1:
        raise QuizDataError("testSize muss eine positive Ganzzahl sein.")
    questions = data.get("questions")
    if not isinstance(questions, list):
        raise QuizDataError("questions muss eine Liste sein.")
    if len(questions) < test_size:
        raise QuizDataError(
            f"Der Pool enthält {len(questions)} Fragen, die Testgröße ist aber {test_size}."
        )

    normalized_questions = []
    seen_ids: set[str] = set()
    for row_number, question in enumerate(questions, start=2):
        if not isinstance(question, dict):
            raise QuizDataError(f"Frage in Tabellenzeile {row_number} ist kein Objekt.")
        question_id = nonempty(question.get("id"), f"ID in Zeile {row_number}")
        if not re.fullmatch(r"q[0-9]{3,}", question_id):
            raise QuizDataError(
                f"ID {question_id!r} muss dem Muster q001, q002, … entsprechen."
            )
        if question_id in seen_ids:
            raise QuizDataError(f"ID {question_id!r} kommt mehrfach vor.")
        seen_ids.add(question_id)

        options = question.get("options")
        if not isinstance(options, list) or len(options) != 4:
            raise QuizDataError(f"{question_id}: Genau vier Antworten sind erforderlich.")
        option_map = {}
        for option in options:
            if not isinstance(option, dict):
                raise QuizDataError(f"{question_id}: Eine Antwort ist ungültig.")
            option_id = option.get("id")
            if option_id not in LETTERS or option_id in option_map:
                raise QuizDataError(
                    f"{question_id}: Antwort-IDs müssen A, B, C und D eindeutig enthalten."
                )
            option_map[option_id] = {
                "id": option_id,
                "text": nonempty(option.get("text"), f"{question_id}, Antwort {option_id}"),
                "feedback": nonempty(
                    option.get("feedback"), f"{question_id}, Feedback {option_id}"
                ),
            }
        if set(option_map) != set(LETTERS):
            raise QuizDataError(f"{question_id}: Antworten A bis D sind erforderlich.")
        correct = question.get("correctAnswer")
        if correct not in LETTERS:
            raise QuizDataError(f"{question_id}: Richtige Antwort muss A, B, C oder D sein.")

        normalized_questions.append(
            {
                "id": question_id,
                "category": nonempty(
                    question.get("category"), f"{question_id}, Kategorie"
                ),
                "question": nonempty(
                    question.get("question"), f"{question_id}, Frage"
                ),
                "hint": nonempty(question.get("hint"), f"{question_id}, Hinweis"),
                "options": [option_map[letter] for letter in LETTERS],
                "correctAnswer": correct,
            }
        )

    return {
        "$schema": "./quiz-questions.schema.json",
        "schemaVersion": 1,
        "title": title,
        "testSize": test_size,
        "questions": normalized_questions,
    }


def load_json(path: Path) -> dict:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return validate_quiz(json.load(handle))
    except FileNotFoundError as exc:
        raise QuizDataError(f"JSON-Datei nicht gefunden: {path}") from exc
    except json.JSONDecodeError as exc:
        raise QuizDataError(
            f"Ungültiges JSON in {path}, Zeile {exc.lineno}: {exc.msg}"
        ) from exc


def column_name(index: int) -> str:
    result = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result


def xml_text(value: object) -> str:
    text = "" if value is None else str(value)
    preserve = ' xml:space="preserve"' if text != text.strip() else ""
    return f"<is><t{preserve}>{escape(text)}</t></is>"


def string_cell(reference: str, value: object, style: int = 0) -> str:
    return (
        f'<c r="{reference}" s="{style}" t="inlineStr">'
        f"{xml_text(value)}</c>"
    )


def number_cell(reference: str, value: int, style: int = 0) -> str:
    return f'<c r="{reference}" s="{style}"><v>{value}</v></c>'


def question_rows(data: dict) -> list[list[str]]:
    rows = []
    for question in data["questions"]:
        options = {option["id"]: option for option in question["options"]}
        row = [
            question["id"],
            question["category"],
            question["question"],
            question["hint"],
        ]
        for letter in LETTERS:
            row.extend([options[letter]["text"], options[letter]["feedback"]])
        row.append(question["correctAnswer"])
        rows.append(row)
    return rows


def build_questions_sheet(data: dict) -> str:
    widths = (12, 28, 48, 30, 42, 50, 42, 50, 42, 50, 42, 50, 18)
    cols = "".join(
        f'<col min="{index}" max="{index}" width="{width}" customWidth="1"/>'
        for index, width in enumerate(widths, start=1)
    )
    header_cells = "".join(
        string_cell(f"{column_name(index)}1", header, 1)
        for index, header in enumerate(HEADERS, start=1)
    )
    rows = [f'<row r="1" ht="30" customHeight="1">{header_cells}</row>']
    for row_index, values in enumerate(question_rows(data), start=2):
        cells = []
        for col_index, value in enumerate(values, start=1):
            style = 3 if col_index == 13 else 2
            cells.append(
                string_cell(f"{column_name(col_index)}{row_index}", value, style)
            )
        rows.append(
            f'<row r="{row_index}" ht="68" customHeight="1">{"".join(cells)}</row>'
        )
    last_row = len(rows)
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="{NS_MAIN}">
  <sheetViews><sheetView workbookViewId="0"><pane xSplit="4" ySplit="1" topLeftCell="E2" activePane="bottomRight" state="frozen"/><selection pane="topRight" activeCell="E1" sqref="E1"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/><selection pane="bottomRight" activeCell="E2" sqref="E2"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>{cols}</cols>
  <sheetData>{"".join(rows)}</sheetData>
  <autoFilter ref="A1:M{last_row}"/>
  <dataValidations count="1"><dataValidation type="list" allowBlank="0" showErrorMessage="1" errorTitle="Ungültige Lösung" error="Bitte A, B, C oder D auswählen." sqref="M2:M{last_row}"><formula1>"A,B,C,D"</formula1></dataValidation></dataValidations>
  <pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>'''


def build_config_sheet(data: dict) -> str:
    values = [
        ("Einstellung", "Wert"),
        ("schemaVersion", data["schemaVersion"]),
        ("testSize", data["testSize"]),
        ("title", data["title"]),
        ("", ""),
        ("Bearbeitung", "Im Blatt „Fragen“ dürfen Zeilen ergänzt, geändert oder gelöscht werden."),
        ("Pflichtfelder", "ID, Kategorie, Frage, Hinweis, vier Antworten, vier Feedbacktexte und richtige Antwort."),
        ("Import", "Formeln sind aus Sicherheitsgründen nicht zulässig. Richtige Antwort: A, B, C oder D."),
    ]
    rows = []
    for row_index, (key, value) in enumerate(values, start=1):
        style = 1 if row_index == 1 else 2
        first = string_cell(f"A{row_index}", key, style)
        if isinstance(value, int):
            second = number_cell(f"B{row_index}", value, style)
        else:
            second = string_cell(f"B{row_index}", value, style)
        height = 30 if row_index == 1 else (38 if row_index >= 6 else 22)
        rows.append(
            f'<row r="{row_index}" ht="{height}" customHeight="1">{first}{second}</row>'
        )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="{NS_MAIN}">
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="88" customWidth="1"/></cols>
  <sheetData>{"".join(rows)}</sheetData>
  <pageMargins left="0.5" right="0.5" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>'''


def package_parts(data: dict) -> dict[str, str]:
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )
    return {
        "[Content_Types].xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>''',
        "_rels/.rels": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PACKAGE_REL}">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>''',
        "docProps/core.xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>{escape(data["title"])}</dc:title><dc:creator>BuildBench</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>''',
        "docProps/app.xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>BuildBench quiz_xlsx.py</Application></Properties>''',
        "xl/workbook.xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="{NS_MAIN}" xmlns:r="{NS_REL}">
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="14000"/></bookViews>
  <sheets><sheet name="Fragen" sheetId="1" r:id="rId1"/><sheet name="Konfiguration" sheetId="2" r:id="rId2"/></sheets>
  <calcPr calcId="191029" fullCalcOnLoad="1"/>
</workbook>''',
        "xl/_rels/workbook.xml.rels": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PACKAGE_REL}">
  <Relationship Id="rId1" Type="{NS_REL}/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="{NS_REL}/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="{NS_REL}/styles" Target="styles.xml"/>
</Relationships>''',
        "xl/styles.xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="{NS_MAIN}">
  <fonts count="3">
    <font><sz val="10"/><name val="Aptos"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Aptos"/></font>
    <font><b/><color rgb="FF7A4E00"/><sz val="10"/><name val="Aptos"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF17365D"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2"><border/><border><bottom style="thin"><color rgb="FFD9E2F3"/></bottom></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>''',
        "xl/worksheets/sheet1.xml": build_questions_sheet(data),
        "xl/worksheets/sheet2.xml": build_config_sheet(data),
    }


def prepare_output(path: Path, force: bool) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and not force:
        raise QuizDataError(
            f"Ausgabedatei existiert bereits: {path}. Zum Ersetzen --force verwenden."
        )


def atomic_replace(temp_path: Path, output_path: Path) -> None:
    os.replace(temp_path, output_path)


def export_xlsx(json_path: Path, xlsx_path: Path, force: bool) -> None:
    data = load_json(json_path)
    prepare_output(xlsx_path, force)
    handle, temp_name = tempfile.mkstemp(
        prefix=xlsx_path.stem + "-", suffix=".tmp", dir=xlsx_path.parent
    )
    os.close(handle)
    temp_path = Path(temp_name)
    try:
        with zipfile.ZipFile(temp_path, "w", zipfile.ZIP_DEFLATED) as archive:
            for name, content in package_parts(data).items():
                archive.writestr(name, content.encode("utf-8"))
        atomic_replace(temp_path, xlsx_path)
    finally:
        temp_path.unlink(missing_ok=True)
    print(f"{len(data['questions'])} Fragen exportiert: {xlsx_path}")


def check_archive(archive: zipfile.ZipFile) -> None:
    total = 0
    for info in archive.infolist():
        normalized = posixpath.normpath(info.filename)
        if normalized.startswith("../") or normalized.startswith("/"):
            raise QuizDataError("Die XLSX-Datei enthält einen unsicheren Dateipfad.")
        if info.file_size > MAX_ENTRY_SIZE:
            raise QuizDataError(f"XLSX-Bestandteil ist zu groß: {info.filename}")
        total += info.file_size
    if total > MAX_ARCHIVE_SIZE:
        raise QuizDataError("Die entpackte XLSX-Datei ist größer als 50 MiB.")


def shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return [
        "".join(node.text or "" for node in item.findall(f".//{{{NS_MAIN}}}t"))
        for item in root.findall(f"{{{NS_MAIN}}}si")
    ]


def sheet_paths(archive: zipfile.ZipFile) -> dict[str, str]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in relationships.findall(f"{{{NS_PACKAGE_REL}}}Relationship")
    }
    result = {}
    for sheet in workbook.findall(f".//{{{NS_MAIN}}}sheet"):
        rel_id = sheet.attrib[f"{{{NS_REL}}}id"]
        target = targets.get(rel_id)
        if not target:
            continue
        path = posixpath.normpath(posixpath.join("xl", target.lstrip("/")))
        if target.startswith("/"):
            path = target.lstrip("/")
        result[sheet.attrib["name"]] = path
    return result


def cell_column(reference: str) -> int:
    match = re.match(r"([A-Z]+)", reference)
    if not match:
        raise QuizDataError(f"Ungültige Zelladresse: {reference}")
    value = 0
    for char in match.group(1):
        value = value * 26 + ord(char) - 64
    return value


def read_sheet(
    archive: zipfile.ZipFile, path: str, strings: list[str]
) -> list[list[object]]:
    root = ET.fromstring(archive.read(path))
    rows: list[list[object]] = []
    for row in root.findall(f".//{{{NS_MAIN}}}sheetData/{{{NS_MAIN}}}row"):
        values: dict[int, object] = {}
        for cell in row.findall(f"{{{NS_MAIN}}}c"):
            if cell.find(f"{{{NS_MAIN}}}f") is not None:
                raise QuizDataError(
                    f"Formel in Zelle {cell.attrib.get('r', '?')} ist nicht zulässig."
                )
            cell_type = cell.attrib.get("t")
            if cell_type == "inlineStr":
                value: object = "".join(
                    node.text or "" for node in cell.findall(f".//{{{NS_MAIN}}}t")
                )
            else:
                node = cell.find(f"{{{NS_MAIN}}}v")
                raw = "" if node is None or node.text is None else node.text
                if cell_type == "s":
                    try:
                        value = strings[int(raw)]
                    except (ValueError, IndexError) as exc:
                        raise QuizDataError("Ungültiger Shared-String-Verweis.") from exc
                elif cell_type in {"str", "b"}:
                    value = raw
                else:
                    try:
                        number = float(raw)
                        value = int(number) if number.is_integer() else number
                    except ValueError:
                        value = raw
            values[cell_column(cell.attrib["r"])] = value
        width = max(values, default=0)
        rows.append([values.get(index, "") for index in range(1, width + 1)])
    return rows


def value_at(row: list[object], index: int) -> object:
    return row[index] if index < len(row) else ""


def data_from_workbook(xlsx_path: Path) -> dict:
    try:
        with zipfile.ZipFile(xlsx_path, "r") as archive:
            check_archive(archive)
            strings = shared_strings(archive)
            paths = sheet_paths(archive)
            if "Fragen" not in paths or "Konfiguration" not in paths:
                raise QuizDataError(
                    "Die Arbeitsmappe benötigt die Blätter „Fragen“ und „Konfiguration“."
                )
            question_data = read_sheet(archive, paths["Fragen"], strings)
            config_data = read_sheet(archive, paths["Konfiguration"], strings)
    except FileNotFoundError as exc:
        raise QuizDataError(f"XLSX-Datei nicht gefunden: {xlsx_path}") from exc
    except zipfile.BadZipFile as exc:
        raise QuizDataError(f"Keine gültige XLSX-Datei: {xlsx_path}") from exc
    except (KeyError, ET.ParseError) as exc:
        raise QuizDataError("Die XLSX-Struktur ist unvollständig oder beschädigt.") from exc

    if not question_data:
        raise QuizDataError("Das Blatt „Fragen“ ist leer.")
    actual_headers = tuple(str(value).strip() for value in question_data[0])
    if actual_headers != HEADERS:
        raise QuizDataError(
            "Die Spaltenüberschriften im Blatt „Fragen“ wurden verändert."
        )

    config = {}
    for row in config_data[1:]:
        key = str(value_at(row, 0)).strip()
        if key in {"schemaVersion", "testSize", "title"}:
            config[key] = value_at(row, 1)
    try:
        schema_version = int(config["schemaVersion"])
        test_size = int(config["testSize"])
        title = str(config["title"]).strip()
    except (KeyError, TypeError, ValueError) as exc:
        raise QuizDataError(
            "Konfiguration benötigt schemaVersion, testSize und title."
        ) from exc

    questions = []
    for row_number, row in enumerate(question_data[1:], start=2):
        if not any(str(value).strip() for value in row):
            continue
        options = []
        for option_index, letter in enumerate(LETTERS):
            text_column = 4 + option_index * 2
            options.append(
                {
                    "id": letter,
                    "text": str(value_at(row, text_column)).strip(),
                    "feedback": str(value_at(row, text_column + 1)).strip(),
                }
            )
        questions.append(
            {
                "id": str(value_at(row, 0)).strip(),
                "category": str(value_at(row, 1)).strip(),
                "question": str(value_at(row, 2)).strip(),
                "hint": str(value_at(row, 3)).strip(),
                "options": options,
                "correctAnswer": str(value_at(row, 12)).strip().upper(),
            }
        )
    return validate_quiz(
        {
            "schemaVersion": schema_version,
            "title": title,
            "testSize": test_size,
            "questions": questions,
        }
    )


def import_xlsx(xlsx_path: Path, json_path: Path, force: bool) -> None:
    data = data_from_workbook(xlsx_path)
    prepare_output(json_path, force)
    handle, temp_name = tempfile.mkstemp(
        prefix=json_path.stem + "-", suffix=".tmp", dir=json_path.parent
    )
    temp_path = Path(temp_name)
    try:
        with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as output:
            json.dump(data, output, ensure_ascii=False, indent=2)
            output.write("\n")
        atomic_replace(temp_path, json_path)
    finally:
        temp_path.unlink(missing_ok=True)
    print(f"{len(data['questions'])} Fragen importiert: {json_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="BuildBench-Quizdaten zwischen JSON und XLSX austauschen."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    export_parser = subparsers.add_parser("export", help="JSON als XLSX exportieren")
    export_parser.add_argument("--json", type=Path, default=DEFAULT_JSON)
    export_parser.add_argument("--xlsx", type=Path, default=DEFAULT_XLSX)
    export_parser.add_argument("--force", action="store_true")
    import_parser = subparsers.add_parser("import", help="XLSX als JSON importieren")
    import_parser.add_argument("--xlsx", type=Path, default=DEFAULT_XLSX)
    import_parser.add_argument("--json", type=Path, default=DEFAULT_JSON)
    import_parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.command == "export":
            export_xlsx(args.json.resolve(), args.xlsx.resolve(), args.force)
        else:
            import_xlsx(args.xlsx.resolve(), args.json.resolve(), args.force)
    except QuizDataError as error:
        print(f"Fehler: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
