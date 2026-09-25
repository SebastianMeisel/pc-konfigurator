#!/usr/bin/env python3
"""Erzeugt ein in ILIAS importierbares SCORM-1.2-Paket."""

from __future__ import annotations

import argparse
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "dist" / "buildbench-scorm-1.2.zip"
SVG_ASSETS = tuple(
    str(path.relative_to(ROOT))
    for path in sorted((ROOT / "assets" / "svg").rglob("*.svg"))
)
FONT_ASSETS = tuple(
    str(path.relative_to(ROOT))
    for path in sorted((ROOT / "assets" / "fonts").iterdir())
    if path.is_file()
)
PACKAGE_FILES = (
    "imsmanifest.xml",
    "index.html",
    "evaluation.html",
    "quiz.html",
    "styles.css",
    "education.css",
    "evaluation.css",
    "quiz.css",
    "app.js",
    "education.js",
    "evaluation.js",
    "quiz.js",
    "scorm.js",
    "svg-loader.js",
    "content-loader.js",
    "difficulty.js",
    "visual-model.js",
    "research.js",
    *FONT_ASSETS,
    *SVG_ASSETS,
    "content/components.json",
    "content/components.schema.json",
    "content/lessons.json",
    "content/lessons.schema.json",
    "content/network.json",
    "content/network.schema.json",
    "content/compatibility-rules.json",
    "content/compatibility-rules.schema.json",
    "quiz-questions.json",
    "quiz-questions.schema.json",
    "favicon.svg",
)
FIXED_TIMESTAMP = (2020, 1, 1, 0, 0, 0)


def validate_sources() -> None:
    missing = [name for name in PACKAGE_FILES if not (ROOT / name).is_file()]
    if missing:
        raise ValueError("Fehlende Paketdateien: " + ", ".join(missing))

    manifest = ROOT / "imsmanifest.xml"
    tree = ET.parse(manifest)
    root = tree.getroot()
    namespace = {"ims": "http://www.imsproject.org/xsd/imscp_rootv1p1p2"}
    resources = root.findall(".//ims:resource", namespace)
    if len(resources) != 1 or resources[0].get("href") != "index.html":
        raise ValueError("Das Manifest muss genau eine SCO-Ressource mit index.html als Startdatei enthalten.")
    declared = {node.get("href") for node in root.findall(".//ims:file", namespace)}
    expected = set(PACKAGE_FILES) - {"imsmanifest.xml"}
    if declared != expected:
        missing_entries = sorted(expected - declared)
        extra_entries = sorted(declared - expected)
        details = []
        if missing_entries:
            details.append("nicht deklariert: " + ", ".join(missing_entries))
        if extra_entries:
            details.append("unerwartet: " + ", ".join(extra_entries))
        raise ValueError("Manifest und Paketdateien stimmen nicht überein (" + "; ".join(details) + ").")


def write_package(output: Path, force: bool) -> None:
    output = output.resolve()
    if output.exists() and not force:
        raise FileExistsError(f"Ausgabedatei existiert bereits: {output}. Zum Ersetzen --force verwenden.")
    if output == ROOT or ROOT in output.parents and output.name in PACKAGE_FILES:
        raise ValueError("Die Ausgabedatei darf keine Quelldatei überschreiben.")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".tmp")
    if temporary.exists():
        temporary.unlink()

    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name in PACKAGE_FILES:
                data = (ROOT / name).read_bytes()
                info = zipfile.ZipInfo(name, FIXED_TIMESTAMP)
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, data)
        with zipfile.ZipFile(temporary) as archive:
            if archive.testzip() is not None:
                raise ValueError("Das erzeugte ZIP-Archiv ist beschädigt.")
            if archive.namelist()[0] != "imsmanifest.xml":
                raise ValueError("imsmanifest.xml liegt nicht an erster Stelle im Paket.")
        temporary.replace(output)
    finally:
        if temporary.exists():
            temporary.unlink()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Pfad der SCORM-ZIP-Datei")
    parser.add_argument("--force", action="store_true", help="vorhandene Ausgabedatei ersetzen")
    args = parser.parse_args()
    try:
        validate_sources()
        write_package(args.output, args.force)
    except (OSError, ValueError, ET.ParseError) as error:
        print(f"Fehler: {error}", file=sys.stderr)
        return 2
    print(f"SCORM-1.2-Paket erstellt: {args.output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
