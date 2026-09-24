#!/usr/bin/env python3
"""BuildBench-Inhaltsdaten zwischen JSON und XLSX austauschen.

Die Arbeitsmappe enthält Kategorien, je ein Blatt pro Komponentengruppe,
Lernkarten, Hinweise, Kompatibilitätsregeln und Netzwerkdaten.
Das Skript verwendet ausschließlich die Python-Standardbibliothek.

Beispiele:
    python3 tools/content_xlsx.py export
    python3 tools/content_xlsx.py import --force
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

from quiz_xlsx import (
    NS_MAIN,
    NS_PACKAGE_REL,
    NS_REL,
    QuizDataError,
    atomic_replace,
    check_archive,
    column_name,
    prepare_output,
    read_sheet,
    shared_strings,
    sheet_paths,
    value_at,
)


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONTENT_DIR = ROOT / "content"
DEFAULT_XLSX = ROOT / "buildbench-content.xlsx"
FILES = {
    "components": "components.json",
    "lessons": "lessons.json",
    "network": "network.json",
    "compatibility": "compatibility-rules.json",
}
BASE_COMPONENT_FIELDS = ("id", "maker", "name", "price", "generation", "recommended", "beginnerVariant", "specs")
SOURCE_FIELDS = ("modelNumber", "sourceUrl", "gpuFamilyUrl", "datasheetUrl", "manualUrl", "sourceCheckedAt")
PRESERVED_FIELDS = (*SOURCE_FIELDS, "chipMaker")
ARRAY_FIELDS = {
    "form",
    "psu",
    "radiators",
    "drives",
    "specs",
    "sockets",
    "forms",
    "driveMounts",
    "provides",
}
BOOLEAN_FIELDS = {"recommended", "atx3", "fluid"}
INTEGER_FIELDS = {
    "price",
    "generation",
    "maxGpu",
    "maxGpuWithFront360",
    "maxCooler",
    "m2",
    "m2Gen",
    "sata",
    "standoff",
    "cores",
    "power",
    "length",
    "modules",
    "capacity",
    "speed",
    "watts",
    "height",
    "radiator",
    "pcieGen",
    "count",
    "volume",
    "slot",
    "order",
}
SECTION_NAMES = ("install", "safety", "check")
SHEET_HEADERS = {
    "Kategorien": ("id", "label", "title", "description", "lessonId"),
    "Lernkarten": ("id", "title", "role"),
    "Hinweise": ("lessonId", "section", "order", "text"),
    "Netzwerk": (
        "groupId",
        "groupLabel",
        "lessonId",
        "id",
        "name",
        "price",
        "slot",
        "speed",
        "specs",
        "generation",
    ),
    "Mainboard-Netz": ("id", "name", "form", "lan", "wifi"),
    "Kompatibilität": ("code", "title", "consequence", "remedy", "learningHint"),
}


class ContentDataError(QuizDataError):
    """Ungültige BuildBench-Inhalte oder Arbeitsmappendaten."""


def nonempty(value: object, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ContentDataError(f"{field} darf nicht leer sein.")
    return value.strip()


def valid_id(value: object, field: str) -> str:
    result = nonempty(value, field)
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", result):
        raise ContentDataError(f"{field} enthält unzulässige Zeichen: {result!r}.")
    return result


def unique(values: list[str], label: str) -> None:
    if len(values) != len(set(values)):
        raise ContentDataError(f"{label} enthält doppelte IDs.")


def json_file(content_dir: Path, kind: str) -> Path:
    return content_dir / FILES[kind]


def load_json(path: Path) -> object:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError as exc:
        raise ContentDataError(f"JSON-Datei nicht gefunden: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ContentDataError(
            f"Ungültiges JSON in {path}, Zeile {exc.lineno}: {exc.msg}"
        ) from exc


def validate_components(data: object, *, require_gpu_chip_maker: bool = True) -> dict:
    if not isinstance(data, dict) or data.get("schemaVersion") != 1:
        raise ContentDataError("components.json benötigt schemaVersion 1.")
    categories = data.get("categories")
    groups = data.get("components")
    if not isinstance(categories, list) or not categories or not isinstance(groups, dict):
        raise ContentDataError("Kategorien oder Komponenten fehlen.")
    normalized_categories = []
    normalized_groups: dict[str, list[dict]] = {}
    category_ids = []
    for index, category in enumerate(categories, start=1):
        if not isinstance(category, dict):
            raise ContentDataError(f"Kategorie {index} ist ungültig.")
        category_id = valid_id(category.get("id"), f"Kategorie {index}, id")
        category_ids.append(category_id)
        normalized_categories.append(
            {
                "id": category_id,
                "label": nonempty(category.get("label"), f"{category_id}, label"),
                "title": nonempty(category.get("title"), f"{category_id}, title"),
                "description": nonempty(
                    category.get("description"), f"{category_id}, description"
                ),
                "lessonId": nonempty(category.get("lessonId"), f"{category_id}, lessonId"),
            }
        )
        items = groups.get(category_id)
        if not isinstance(items, list) or not items:
            raise ContentDataError(f"Komponentengruppe {category_id} ist leer.")
        normalized_items = []
        ids = []
        for row, item in enumerate(items, start=2):
            if not isinstance(item, dict):
                raise ContentDataError(f"{category_id}, Zeile {row}: ungültiges Objekt.")
            item_id = valid_id(item.get("id"), f"{category_id}, Zeile {row}, id")
            ids.append(item_id)
            maker = nonempty(item.get("maker"), f"{category_id}/{item_id}, maker")
            name = nonempty(item.get("name"), f"{category_id}/{item_id}, name")
            price = item.get("price")
            if not isinstance(price, int) or isinstance(price, bool) or price < 0:
                raise ContentDataError(f"{category_id}/{item_id}: price muss eine nichtnegative Ganzzahl sein.")
            specs = item.get("specs")
            if not isinstance(specs, list) or not specs:
                raise ContentDataError(f"{category_id}/{item_id}: specs muss eine Liste sein.")
            normalized = {"id": item_id, "maker": maker, "name": name, "price": price}
            for key, value in item.items():
                if key not in normalized:
                    normalized[key] = value
            normalized["specs"] = [
                nonempty(value, f"{category_id}/{item_id}, specs") for value in specs
            ]
            generation = normalized.get("generation")
            if generation is not None and generation not in (1, 2):
                raise ContentDataError(f"{category_id}/{item_id}: generation muss 1 oder 2 sein.")
            if "recommended" in normalized and not isinstance(normalized["recommended"], bool):
                raise ContentDataError(f"{category_id}/{item_id}: recommended muss wahr oder falsch sein.")
            if normalized.get("beginnerVariant") not in (None, "a", "b"):
                raise ContentDataError(f"{category_id}/{item_id}: beginnerVariant muss a oder b sein.")
            if category_id == "gpu" and require_gpu_chip_maker and normalized.get("chipMaker") not in ("AMD", "NVIDIA"):
                raise ContentDataError(f"{category_id}/{item_id}: chipMaker muss AMD oder NVIDIA sein.")
            for field in SOURCE_FIELDS:
                value = normalized.get(field)
                if value is not None and (not isinstance(value, str) or not value.strip()):
                    raise ContentDataError(f"{category_id}/{item_id}: {field} muss Text enthalten.")
                if field.endswith("Url") and value is not None and not re.fullmatch(r"https://[^\s]+", value):
                    raise ContentDataError(f"{category_id}/{item_id}: {field} muss eine HTTPS-Adresse sein.")
            if normalized.get("sourceCheckedAt") and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", normalized["sourceCheckedAt"]):
                raise ContentDataError(f"{category_id}/{item_id}: sourceCheckedAt muss YYYY-MM-DD sein.")
            normalized_items.append(normalized)
        unique(ids, f"Komponentengruppe {category_id}")
        if sum(item.get("recommended") is True for item in normalized_items) != 1:
            raise ContentDataError(f"{category_id}: genau eine Einsteigerempfehlung wird benötigt.")
        for variant in ("a", "b"):
            if sum(item.get("beginnerVariant") == variant for item in normalized_items) != 1:
                raise ContentDataError(f"{category_id}: Einsteigerpfad {variant.upper()} benötigt genau eine Komponente.")
        normalized_groups[category_id] = normalized_items
    unique(category_ids, "Kategorien")
    if set(groups) != set(category_ids):
        raise ContentDataError("Komponentengruppen und Kategorien stimmen nicht überein.")
    return {
        "$schema": "components.schema.json",
        "schemaVersion": 1,
        "categories": normalized_categories,
        "components": normalized_groups,
    }


def validate_lessons(data: object) -> dict:
    if not isinstance(data, dict) or data.get("schemaVersion") != 1:
        raise ContentDataError("lessons.json benötigt schemaVersion 1.")
    lessons = data.get("lessons")
    if not isinstance(lessons, list) or not lessons:
        raise ContentDataError("Lernkarten fehlen.")
    normalized = []
    ids = []
    for row, lesson in enumerate(lessons, start=2):
        if not isinstance(lesson, dict):
            raise ContentDataError(f"Lernkarte in Zeile {row} ist ungültig.")
        lesson_id = nonempty(lesson.get("id"), f"Lernkarte Zeile {row}, id")
        ids.append(lesson_id)
        entry = {
            "id": lesson_id,
            "title": nonempty(lesson.get("title"), f"{lesson_id}, title"),
            "role": nonempty(lesson.get("role"), f"{lesson_id}, role"),
        }
        for section in SECTION_NAMES:
            values = lesson.get(section)
            if not isinstance(values, list) or not values:
                raise ContentDataError(f"{lesson_id}: {section} muss mindestens einen Hinweis enthalten.")
            entry[section] = [
                nonempty(value, f"{lesson_id}, {section}") for value in values
            ]
        normalized.append(entry)
    unique(ids, "Lernkarten")
    return {
        "$schema": "lessons.schema.json",
        "schemaVersion": 1,
        "lessons": normalized,
    }


def validate_network(data: object, components: dict, lessons: dict) -> dict:
    if not isinstance(data, dict) or data.get("schemaVersion") != 1:
        raise ContentDataError("network.json benötigt schemaVersion 1.")
    groups = data.get("groups")
    boards = data.get("boards")
    if not isinstance(groups, list) or not isinstance(boards, dict):
        raise ContentDataError("Netzwerkgruppen oder Mainboard-Netzdaten fehlen.")
    lesson_ids = {lesson["id"] for lesson in lessons["lessons"]}
    normalized_groups = []
    group_ids = []
    for group in groups:
        if not isinstance(group, dict):
            raise ContentDataError("Eine Netzwerkgruppe ist ungültig.")
        group_id = valid_id(group.get("id"), "Netzwerkgruppe, id")
        group_ids.append(group_id)
        lesson_id = nonempty(group.get("lessonId"), f"{group_id}, lessonId")
        if lesson_id not in lesson_ids:
            raise ContentDataError(f"{group_id}: Lernkarte {lesson_id!r} fehlt.")
        options = group.get("options")
        if not isinstance(options, list) or not options:
            raise ContentDataError(f"{group_id}: Optionen fehlen.")
        normalized_options = []
        option_ids = []
        for option in options:
            if not isinstance(option, dict):
                raise ContentDataError(f"{group_id}: Option ist ungültig.")
            option_id = valid_id(option.get("id"), f"{group_id}, option id")
            option_ids.append(option_id)
            price = option.get("price")
            slot = option.get("slot")
            if not isinstance(price, int) or isinstance(price, bool) or price < 0:
                raise ContentDataError(f"{group_id}/{option_id}: price ist ungültig.")
            if not isinstance(slot, int) or isinstance(slot, bool) or slot < 0:
                raise ContentDataError(f"{group_id}/{option_id}: slot ist ungültig.")
            entry = {
                "id": option_id,
                "name": nonempty(option.get("name"), f"{group_id}/{option_id}, name"),
                "price": price,
                "slot": slot,
                "speed": nonempty(option.get("speed"), f"{group_id}/{option_id}, speed"),
                "specs": nonempty(option.get("specs"), f"{group_id}/{option_id}, specs"),
            }
            if option.get("generation") not in (None, ""):
                generation = option.get("generation")
                if generation not in (1, 2):
                    raise ContentDataError(f"{group_id}/{option_id}: generation muss 1 oder 2 sein.")
                entry["generation"] = generation
            normalized_options.append(entry)
        unique(option_ids, f"Netzwerkgruppe {group_id}")
        if "onboard" not in option_ids:
            raise ContentDataError(f"{group_id}: Onboard-Option fehlt.")
        normalized_groups.append(
            {
                "id": group_id,
                "label": nonempty(group.get("label"), f"{group_id}, label"),
                "lessonId": lesson_id,
                "options": normalized_options,
            }
        )
    unique(group_ids, "Netzwerkgruppen")
    if set(group_ids) != {"ethernet", "wifi"}:
        raise ContentDataError("Es werden die Netzwerkgruppen ethernet und wifi benötigt.")
    board_ids = {
        item["id"] for item in components["components"].get("motherboard", [])
    }
    if set(boards) != board_ids:
        raise ContentDataError("Mainboard-Netzdaten müssen alle Mainboards genau einmal abdecken.")
    normalized_boards = {}
    for board_id, board in boards.items():
        if not isinstance(board, dict):
            raise ContentDataError(f"Mainboard-Netzdaten für {board_id} sind ungültig.")
        normalized_boards[board_id] = {
            "name": nonempty(board.get("name"), f"{board_id}, name"),
            "form": nonempty(board.get("form"), f"{board_id}, form"),
            "lan": nonempty(board.get("lan"), f"{board_id}, lan"),
            "wifi": nonempty(board.get("wifi"), f"{board_id}, wifi"),
        }
    return {
        "$schema": "network.schema.json",
        "schemaVersion": 1,
        "groups": normalized_groups,
        "boards": normalized_boards,
    }


def validate_compatibility(data: object) -> dict:
    if not isinstance(data, dict) or data.get("schemaVersion") != 1:
        raise ContentDataError("compatibility-rules.json benötigt schemaVersion 1.")
    rules = data.get("rules")
    if not isinstance(rules, list) or not rules:
        raise ContentDataError("Kompatibilitätsregeln fehlen.")
    normalized = []
    codes = []
    for row, rule in enumerate(rules, start=2):
        if not isinstance(rule, dict):
            raise ContentDataError(f"Kompatibilitätsregel in Zeile {row} ist ungültig.")
        code = nonempty(rule.get("code"), f"Kompatibilität Zeile {row}, code")
        if not re.fullmatch(r"[A-Z][A-Z0-9_]+", code):
            raise ContentDataError(f"Kompatibilität Zeile {row}: ungültiger Code {code!r}.")
        codes.append(code)
        normalized.append(
            {
                "code": code,
                "title": nonempty(rule.get("title"), f"{code}, title"),
                "consequence": nonempty(rule.get("consequence"), f"{code}, consequence"),
                "remedy": nonempty(rule.get("remedy"), f"{code}, remedy"),
                "learningHint": nonempty(rule.get("learningHint"), f"{code}, learningHint"),
            }
        )
    unique(codes, "Kompatibilitätsregeln")
    return {
        "$schema": "compatibility-rules.schema.json",
        "schemaVersion": 1,
        "rules": normalized,
    }


def load_content(content_dir: Path) -> dict[str, dict]:
    components = validate_components(load_json(json_file(content_dir, "components")))
    lessons = validate_lessons(load_json(json_file(content_dir, "lessons")))
    network = validate_network(
        load_json(json_file(content_dir, "network")), components, lessons
    )
    compatibility = validate_compatibility(
        load_json(json_file(content_dir, "compatibility"))
    )
    return {"components": components, "lessons": lessons, "network": network, "compatibility": compatibility}


def xml_attr(value: object) -> str:
    return escape(str(value), {'"': "&quot;"})


def inline_text(value: object) -> str:
    text = "" if value is None else str(value)
    preserve = ' xml:space="preserve"' if text != text.strip() or "\n" in text else ""
    return f'<is><t{preserve}>{escape(text)}</t></is>'


def cell(reference: str, value: object, style: int = 2) -> str:
    if value is None or value == "":
        return f'<c r="{reference}" s="{style}" t="inlineStr"><is><t></t></is></c>'
    if isinstance(value, bool):
        value = "true" if value else "false"
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return f'<c r="{reference}" s="{style}"><v>{value}</v></c>'
    return f'<c r="{reference}" s="{style}" t="inlineStr">{inline_text(value)}</c>'


def workbook_value(value: object) -> object:
    if isinstance(value, list):
        return "\n".join(str(item) for item in value)
    return value


def component_fields(items: list[dict]) -> list[str]:
    fields = list(BASE_COMPONENT_FIELDS)
    for item in items:
        for key in item:
            if key not in fields:
                fields.append(key)
    return fields


def component_sheet_name(category_id: str) -> str:
    name = "K_" + category_id
    if len(name) > 31:
        raise ContentDataError(f"Kategorie-ID ist für einen Blattnamen zu lang: {category_id}")
    return name


def content_sheets(data: dict[str, dict]) -> list[tuple[str, list[list[object]], list[int]]]:
    components = data["components"]
    lessons = data["lessons"]
    network = data["network"]
    compatibility = data["compatibility"]
    instructions = [
        ["BuildBench-Inhalte bearbeiten", "JSON bleibt die verbindliche Datenquelle."],
        ["Export", "python3 tools/content_xlsx.py export"],
        ["Import", "python3 tools/content_xlsx.py import --force"],
        ["Listen", "Mehrere Werte innerhalb einer Zelle durch Zeilenumbrüche trennen."],
        ["Komponenten", "Neue Modelle in das passende Blatt K_<Kategorie-ID> eintragen."],
        ["Lernkarten", "Titel und Aufgabe im Blatt Lernkarten, einzelne Anweisungen im Blatt Hinweise bearbeiten."],
        ["Kompatibilität", "Titel, Auswirkung, Lösung und Lernhinweis im Blatt Kompatibilität bearbeiten. Die Regelcodes nicht ändern."],
        ["Sicherheit", "Formeln und beschädigte Arbeitsmappen werden beim Import abgewiesen."],
        ["Hinweis", "Neue technische Felder benötigen zusätzlich passende Programmlogik."],
    ]
    sheets: list[tuple[str, list[list[object]], list[int]]] = [
        ("Anleitung", instructions, [30, 95]),
        (
            "Kategorien",
            [list(SHEET_HEADERS["Kategorien"])]
            + [[category[key] for key in SHEET_HEADERS["Kategorien"]] for category in components["categories"]],
            [18, 24, 32, 78, 22],
        ),
    ]
    for category in components["categories"]:
        items = components["components"][category["id"]]
        fields = component_fields(items)
        rows = [fields] + [
            [workbook_value(item.get(field, "")) for field in fields] for item in items
        ]
        widths = [16 if field == "id" else 24 for field in fields]
        for index, field in enumerate(fields):
            if field in {"name", "specs", "sockets", "provides"}:
                widths[index] = 38
            elif field == "beginnerVariant":
                widths[index] = 18
            elif field in {"recommended", "generation"}:
                widths[index] = 14
        sheets.append((component_sheet_name(category["id"]), rows, widths))
    sheets.append(
        (
            "Lernkarten",
            [list(SHEET_HEADERS["Lernkarten"])]
            + [[lesson["id"], lesson["title"], lesson["role"]] for lesson in lessons["lessons"]],
            [22, 34, 100],
        )
    )
    hint_rows = [list(SHEET_HEADERS["Hinweise"])]
    for lesson in lessons["lessons"]:
        for section in SECTION_NAMES:
            for order, text in enumerate(lesson[section], start=1):
                hint_rows.append([lesson["id"], section, order, text])
    sheets.append(("Hinweise", hint_rows, [22, 14, 12, 110]))
    network_rows = [list(SHEET_HEADERS["Netzwerk"])]
    for group in network["groups"]:
        for option in group["options"]:
            network_rows.append(
                [
                    group["id"],
                    group["label"],
                    group["lessonId"],
                    option["id"],
                    option["name"],
                    option["price"],
                    option["slot"],
                    option["speed"],
                    option["specs"],
                    option.get("generation", ""),
                ]
            )
    sheets.append(("Netzwerk", network_rows, [14, 18, 18, 16, 38, 12, 12, 22, 42, 14]))
    board_rows = [list(SHEET_HEADERS["Mainboard-Netz"])] + [
        [board_id, board["name"], board["form"], board["lan"], board["wifi"]]
        for board_id, board in network["boards"].items()
    ]
    sheets.append(("Mainboard-Netz", board_rows, [18, 44, 14, 18, 18]))
    rule_rows = [list(SHEET_HEADERS["Kompatibilität"])] + [
        [rule[key] for key in SHEET_HEADERS["Kompatibilität"]]
        for rule in compatibility["rules"]
    ]
    sheets.append(("Kompatibilität", rule_rows, [28, 38, 80, 80, 90]))
    return sheets


def build_sheet_xml(
    rows: list[list[object]], widths: list[int], *, table: bool = True
) -> str:
    max_columns = max((len(row) for row in rows), default=1)
    columns = "".join(
        f'<col min="{index}" max="{index}" width="{width}" customWidth="1"/>'
        for index, width in enumerate(widths, start=1)
    )
    xml_rows = []
    for row_index, values in enumerate(rows, start=1):
        style = 1 if table and row_index == 1 else 2
        cells = "".join(
            cell(f"{column_name(column_index)}{row_index}", value, style)
            for column_index, value in enumerate(values, start=1)
        )
        height = 30 if row_index == 1 else (48 if any("\n" in str(value) for value in values) else 24)
        xml_rows.append(f'<row r="{row_index}" ht="{height}" customHeight="1">{cells}</row>')
    last_row = max(1, len(rows))
    last_column = column_name(max_columns)
    frozen = (
        '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>'
        '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>'
        if table
        else ""
    )
    auto_filter = f'<autoFilter ref="A1:{last_column}{last_row}"/>' if table else ""
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="{NS_MAIN}">
  <sheetViews><sheetView workbookViewId="0">{frozen}</sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>{columns}</cols>
  <sheetData>{"".join(xml_rows)}</sheetData>
  {auto_filter}
  <pageMargins left="0.35" right="0.35" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>'''


def package_parts(data: dict[str, dict]) -> dict[str, str]:
    sheets = content_sheets(data)
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    overrides = "".join(
        f'<Override PartName="/xl/worksheets/sheet{index}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        for index in range(1, len(sheets) + 1)
    )
    workbook_sheets = "".join(
        f'<sheet name="{xml_attr(name)}" sheetId="{index}" r:id="rId{index}"/>'
        for index, (name, _, _) in enumerate(sheets, start=1)
    )
    relationships = "".join(
        f'<Relationship Id="rId{index}" Type="{NS_REL}/worksheet" Target="worksheets/sheet{index}.xml"/>'
        for index in range(1, len(sheets) + 1)
    )
    style_rel = len(sheets) + 1
    parts = {
        "[Content_Types].xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  {overrides}
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
  <dc:title>BuildBench-Inhaltsdaten</dc:title><dc:creator>BuildBench</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>''',
        "docProps/app.xml": '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>BuildBench content_xlsx.py</Application></Properties>''',
        "xl/workbook.xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="{NS_MAIN}" xmlns:r="{NS_REL}">
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="14000"/></bookViews>
  <sheets>{workbook_sheets}</sheets>
  <calcPr calcId="191029" fullCalcOnLoad="1"/>
</workbook>''',
        "xl/_rels/workbook.xml.rels": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PACKAGE_REL}">
  {relationships}
  <Relationship Id="rId{style_rel}" Type="{NS_REL}/styles" Target="styles.xml"/>
</Relationships>''',
        "xl/styles.xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="{NS_MAIN}">
  <fonts count="2">
    <font><sz val="10"/><name val="Arial"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Arial"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF17365D"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border/>
    <border><bottom style="thin"><color rgb="FFD9E2F3"/></bottom></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>''',
    }
    for index, (name, rows, widths) in enumerate(sheets, start=1):
        parts[f"xl/worksheets/sheet{index}.xml"] = build_sheet_xml(
            rows, widths, table=name != "Anleitung"
        )
    return parts


def export_xlsx(content_dir: Path, xlsx_path: Path, force: bool) -> None:
    data = load_content(content_dir)
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
    component_count = sum(len(items) for items in data["components"]["components"].values())
    print(
        f"{component_count} Komponenten, {len(data['lessons']['lessons'])} Lernkarten "
        f"und {len(data['compatibility']['rules'])} Kompatibilitätsregeln exportiert: {xlsx_path}"
    )


def rows_by_sheet(xlsx_path: Path) -> dict[str, list[list[object]]]:
    try:
        with zipfile.ZipFile(xlsx_path, "r") as archive:
            check_archive(archive)
            strings = shared_strings(archive)
            paths = sheet_paths(archive)
            return {
                name: read_sheet(archive, path, strings)
                for name, path in paths.items()
            }
    except FileNotFoundError as exc:
        raise ContentDataError(f"XLSX-Datei nicht gefunden: {xlsx_path}") from exc
    except zipfile.BadZipFile as exc:
        raise ContentDataError(f"Keine gültige XLSX-Datei: {xlsx_path}") from exc


def require_headers(rows: list[list[object]], expected: tuple[str, ...], sheet: str) -> None:
    if not rows:
        raise ContentDataError(f"Blatt {sheet!r} ist leer.")
    actual = tuple(str(value).strip() for value in rows[0])
    if actual != expected:
        raise ContentDataError(f"Spaltenüberschriften im Blatt {sheet!r} wurden verändert.")


def bool_value(value: object, field: str) -> bool:
    normalized = str(value).strip().lower()
    if normalized in {"true", "wahr", "ja", "1"}:
        return True
    if normalized in {"false", "falsch", "nein", "0"}:
        return False
    raise ContentDataError(f"{field}: boolescher Wert muss true/false oder ja/nein sein.")


def int_value(value: object, field: str) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError) as exc:
        raise ContentDataError(f"{field}: Ganzzahl erwartet.") from exc
    if isinstance(value, float) and value != number:
        raise ContentDataError(f"{field}: Ganzzahl erwartet.")
    return number


def parse_component_value(field: str, value: object, category_id: str) -> object:
    if field in ARRAY_FIELDS and not (field == "form" and category_id != "case"):
        parts = [part.strip() for part in str(value).splitlines() if part.strip()]
        return [int_value(part, f"{category_id}, {field}") for part in parts] if field == "radiators" else parts
    if value == "":
        return None
    if field in BOOLEAN_FIELDS:
        return bool_value(value, f"{category_id}, {field}")
    if field in INTEGER_FIELDS and not (
        (field == "capacity" and category_id == "storage")
        or (field == "speed" and category_id != "ram")
    ):
        return int_value(value, f"{category_id}, {field}")
    return str(value).strip()


def nonblank_rows(rows: list[list[object]]) -> list[list[object]]:
    return [row for row in rows if any(str(value).strip() for value in row)]


def content_from_workbook(xlsx_path: Path) -> dict[str, dict]:
    sheets = rows_by_sheet(xlsx_path)
    for sheet, headers in SHEET_HEADERS.items():
        if sheet not in sheets:
            raise ContentDataError(f"Erforderliches Blatt fehlt: {sheet}")
        require_headers(sheets[sheet], headers, sheet)

    categories = []
    for row in nonblank_rows(sheets["Kategorien"][1:]):
        categories.append(
            {
                "id": str(value_at(row, 0)).strip(),
                "label": str(value_at(row, 1)).strip(),
                "title": str(value_at(row, 2)).strip(),
                "description": str(value_at(row, 3)).strip(),
                "lessonId": str(value_at(row, 4)).strip(),
            }
        )
    components: dict[str, list[dict]] = {}
    for category in categories:
        category_id = category["id"]
        sheet_name = component_sheet_name(category_id)
        if sheet_name not in sheets or not sheets[sheet_name]:
            raise ContentDataError(f"Komponentenblatt fehlt: {sheet_name}")
        headers = [str(value).strip() for value in sheets[sheet_name][0]]
        if not headers or len(headers) != len(set(headers)) or any(not value for value in headers):
            raise ContentDataError(f"{sheet_name}: Überschriften sind leer oder doppelt.")
        if not set(BASE_COMPONENT_FIELDS).issubset(headers):
            raise ContentDataError(f"{sheet_name}: Pflichtspalten fehlen.")
        items = []
        for row in nonblank_rows(sheets[sheet_name][1:]):
            item = {}
            for index, field in enumerate(headers):
                parsed = parse_component_value(field, value_at(row, index), category_id)
                if parsed is not None:
                    item[field] = parsed
            items.append(item)
        components[category_id] = items
    component_data = validate_components(
        {"schemaVersion": 1, "categories": categories, "components": components},
        require_gpu_chip_maker=False,
    )

    lesson_base = {}
    lesson_order = []
    for row in nonblank_rows(sheets["Lernkarten"][1:]):
        lesson_id = str(value_at(row, 0)).strip()
        lesson_order.append(lesson_id)
        lesson_base[lesson_id] = {
            "id": lesson_id,
            "title": str(value_at(row, 1)).strip(),
            "role": str(value_at(row, 2)).strip(),
            "install": [],
            "safety": [],
            "check": [],
        }
    hint_rows: dict[tuple[str, str], list[tuple[int, str]]] = {}
    for row_number, row in enumerate(nonblank_rows(sheets["Hinweise"][1:]), start=2):
        lesson_id = str(value_at(row, 0)).strip()
        section = str(value_at(row, 1)).strip()
        if lesson_id not in lesson_base:
            raise ContentDataError(f"Hinweise Zeile {row_number}: Lernkarte {lesson_id!r} fehlt.")
        if section not in SECTION_NAMES:
            raise ContentDataError(f"Hinweise Zeile {row_number}: Bereich ist ungültig.")
        order = int_value(value_at(row, 2), f"Hinweise Zeile {row_number}, order")
        text = str(value_at(row, 3)).strip()
        hint_rows.setdefault((lesson_id, section), []).append((order, text))
    for lesson_id in lesson_order:
        for section in SECTION_NAMES:
            values = sorted(hint_rows.get((lesson_id, section), []))
            orders = [order for order, _ in values]
            if orders != list(range(1, len(orders) + 1)):
                raise ContentDataError(f"{lesson_id}/{section}: Reihenfolge muss lückenlos bei 1 beginnen.")
            lesson_base[lesson_id][section] = [text for _, text in values]
    lesson_data = validate_lessons(
        {"schemaVersion": 1, "lessons": [lesson_base[key] for key in lesson_order]}
    )

    group_meta: dict[str, dict] = {}
    for row in nonblank_rows(sheets["Netzwerk"][1:]):
        group_id = str(value_at(row, 0)).strip()
        group = group_meta.setdefault(
            group_id,
            {
                "id": group_id,
                "label": str(value_at(row, 1)).strip(),
                "lessonId": str(value_at(row, 2)).strip(),
                "options": [],
            },
        )
        if group["label"] != str(value_at(row, 1)).strip() or group["lessonId"] != str(value_at(row, 2)).strip():
            raise ContentDataError(f"Netzwerkgruppe {group_id}: label oder lessonId ist uneinheitlich.")
        option = {
            "id": str(value_at(row, 3)).strip(),
            "name": str(value_at(row, 4)).strip(),
            "price": int_value(value_at(row, 5), f"{group_id}, price"),
            "slot": int_value(value_at(row, 6), f"{group_id}, slot"),
            "speed": str(value_at(row, 7)).strip(),
            "specs": str(value_at(row, 8)).strip(),
        }
        if value_at(row, 9) != "":
            option["generation"] = int_value(value_at(row, 9), f"{group_id}, generation")
        group["options"].append(option)
    boards = {}
    for row in nonblank_rows(sheets["Mainboard-Netz"][1:]):
        board_id = str(value_at(row, 0)).strip()
        boards[board_id] = {
            "name": str(value_at(row, 1)).strip(),
            "form": str(value_at(row, 2)).strip(),
            "lan": str(value_at(row, 3)).strip(),
            "wifi": str(value_at(row, 4)).strip(),
        }
    network_data = validate_network(
        {"schemaVersion": 1, "groups": list(group_meta.values()), "boards": boards},
        component_data,
        lesson_data,
    )
    rules = []
    for row in nonblank_rows(sheets["Kompatibilität"][1:]):
        rules.append(
            {
                "code": str(value_at(row, 0)).strip(),
                "title": str(value_at(row, 1)).strip(),
                "consequence": str(value_at(row, 2)).strip(),
                "remedy": str(value_at(row, 3)).strip(),
                "learningHint": str(value_at(row, 4)).strip(),
            }
        )
    compatibility_data = validate_compatibility(
        {"schemaVersion": 1, "rules": rules}
    )
    return {
        "components": component_data,
        "lessons": lesson_data,
        "network": network_data,
        "compatibility": compatibility_data,
    }


def import_xlsx(xlsx_path: Path, content_dir: Path, force: bool) -> None:
    data = content_from_workbook(xlsx_path)
    existing_components = json_file(content_dir, "components")
    if existing_components.exists():
        previous = validate_components(load_json(existing_components))
        workbook_sheets = rows_by_sheet(xlsx_path)
        for category in data["components"]["categories"]:
            category_id = category["id"]
            sheet_name = component_sheet_name(category_id)
            headers = {str(value).strip() for value in workbook_sheets[sheet_name][0]}
            old_items = {item["id"]: item for item in previous["components"].get(category_id, [])}
            for item in data["components"]["components"][category_id]:
                old = old_items.get(item["id"], {})
                if category_id == "gpu" and "sourceUrl" not in headers and old and (item["name"], item["maker"]) != (old["name"], old["maker"]):
                    raise ContentDataError("Das Grafikkartenblatt enthält alte Modellnamen. Erst eine aktuelle Arbeitsmappe exportieren.")
                for field in PRESERVED_FIELDS:
                    if field not in headers and field in old:
                        item[field] = old[field]
    data["components"] = validate_components(data["components"])
    content_dir.mkdir(parents=True, exist_ok=True)
    targets = [json_file(content_dir, kind) for kind in FILES]
    existing = [path for path in targets if path.exists()]
    if existing and not force:
        raise ContentDataError(
            "Zieldateien existieren bereits. Zum Ersetzen --force verwenden: "
            + ", ".join(str(path) for path in existing)
        )
    temporary: list[tuple[Path, Path]] = []
    try:
        for kind, filename in FILES.items():
            target = content_dir / filename
            handle, temp_name = tempfile.mkstemp(
                prefix=target.stem + "-", suffix=".tmp", dir=content_dir
            )
            temp_path = Path(temp_name)
            with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as output:
                json.dump(data[kind], output, ensure_ascii=False, indent=2)
                output.write("\n")
            temporary.append((temp_path, target))
        for temp_path, target in temporary:
            atomic_replace(temp_path, target)
    finally:
        for temp_path, _ in temporary:
            temp_path.unlink(missing_ok=True)
    print(f"Vier JSON-Dateien importiert: {content_dir}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="BuildBench-Inhaltsdaten zwischen JSON und XLSX austauschen."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    export_parser = subparsers.add_parser("export", help="JSON als XLSX exportieren")
    export_parser.add_argument("--content-dir", type=Path, default=DEFAULT_CONTENT_DIR)
    export_parser.add_argument("--xlsx", type=Path, default=DEFAULT_XLSX)
    export_parser.add_argument("--force", action="store_true")
    import_parser = subparsers.add_parser("import", help="XLSX als JSON importieren")
    import_parser.add_argument("--xlsx", type=Path, default=DEFAULT_XLSX)
    import_parser.add_argument("--content-dir", type=Path, default=DEFAULT_CONTENT_DIR)
    import_parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        if args.command == "export":
            export_xlsx(args.content_dir.resolve(), args.xlsx.resolve(), args.force)
        else:
            import_xlsx(args.xlsx.resolve(), args.content_dir.resolve(), args.force)
    except ContentDataError as error:
        print(f"Fehler: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
