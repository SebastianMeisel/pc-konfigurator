# AlgoDesk

Interaktive Unterrichts-Web-App für Fachinformatik-Berufe. Sie visualisiert Pseudocode zu binärer Suche, Bubble Sort, Insertion Sort und Selection Sort. Lernende können Abläufe schrittweise ausführen, geführte Schreibtischtests bearbeiten und typische Fehler analysieren. Ausführliche Erklärungen führen in einfacher Sprache in Ablauf, Voraussetzungen, Stärken, Grenzen und O-Komplexität ein.

## Lokal starten

```bash
cd algorithmen-trainer
python3 -m http.server 8000
```

Danach `http://localhost:8000` öffnen. Ein Webserver ist nötig, weil die Lerninhalte aus JSON-Dateien geladen werden.

## Inhalte bearbeiten

- `content/algorithms.json`: Beschreibungen, Komplexitäten und Pseudocodezeilen
- `content/exercises.json`: Schreibtischtests, Fehlerfälle und Hilfetexte
- Die zugehörigen `*.schema.json`-Dateien beschreiben und validieren das Format.

Die IDs der vorhandenen Algorithmen sollten nicht geändert werden, da die Ausführungslogik sie verwendet. Weitere Aufgaben dürfen dieselben Algorithmen mit anderen Testdaten kombinieren.

## Prüfen und für ILIAS paketieren

```bash
node --check app.js
node --check scorm.js
node check.js
python3 tools/package_scorm.py --force
unzip -t dist/algodesk-scorm-1.2.zip
```

Das erzeugte ZIP wird in ILIAS als **SCORM-1.2-Lernmodul** importiert. Bearbeitete Algorithmen, abgeschlossene Schreibtischtests und gelöste Fehlerfälle fließen in den übermittelten Prozentwert ein; ab 80 % meldet die App `passed`. Außerhalb eines LMS wird derselbe Fortschritt im Browser gespeichert.

## Barrierefreiheit und Datenschutz

Alle wesentlichen Funktionen sind per Tastatur erreichbar. Zustandsänderungen werden zusätzlich als Text und Tabellenzeilen ausgegeben; Farbe ist nicht der einzige Informationsträger. Bei reduzierter Bewegung laufen Animationen langsamer beziehungsweise ohne Übergang. Die Anwendung überträgt keine Lern- oder Eingabedaten an externe Dienste.
