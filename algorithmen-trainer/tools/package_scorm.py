#!/usr/bin/env python3
"""Erzeugt ein reproduzierbares, in ILIAS importierbares SCORM-1.2-Paket."""
from __future__ import annotations

import argparse
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
FILES = ("imsmanifest.xml", "index.html", "styles.css", "app.js", "scorm.js", "content/algorithms.json", "content/exercises.json", "content/algorithms.schema.json", "content/exercises.schema.json")
TIMESTAMP = (2020, 1, 1, 0, 0, 0)

def validate() -> None:
    missing = [name for name in FILES if not (ROOT / name).is_file()]
    if missing: raise ValueError("Fehlende Dateien: " + ", ".join(missing))
    tree = ET.parse(ROOT / "imsmanifest.xml")
    ns = {"ims": "http://www.imsproject.org/xsd/imscp_rootv1p1p2"}
    declared = {node.get("href") for node in tree.findall(".//ims:file", ns)}
    if declared != set(FILES) - {"imsmanifest.xml"}: raise ValueError("Manifest und Paketdateien stimmen nicht überein.")

def build(output: Path, force: bool) -> None:
    if output.exists() and not force: raise FileExistsError(f"Ausgabedatei existiert: {output}")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".tmp")
    try:
        with zipfile.ZipFile(temporary, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name in FILES:
                info = zipfile.ZipInfo(name, TIMESTAMP); info.compress_type = zipfile.ZIP_DEFLATED; info.external_attr = 0o100644 << 16
                archive.writestr(info, (ROOT / name).read_bytes())
        with zipfile.ZipFile(temporary) as archive:
            if archive.namelist()[0] != "imsmanifest.xml" or archive.testzip() is not None: raise ValueError("Das erzeugte Paket ist ungültig.")
        temporary.replace(output)
    finally:
        if temporary.exists(): temporary.unlink()

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "dist" / "algodesk-scorm-1.2.zip")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    try: validate(); build(args.output, args.force)
    except (OSError, ValueError, ET.ParseError) as error:
        print(f"Fehler: {error}", file=sys.stderr); return 2
    print(f"SCORM-1.2-Paket erstellt: {args.output.resolve()}"); return 0

if __name__ == "__main__": raise SystemExit(main())
