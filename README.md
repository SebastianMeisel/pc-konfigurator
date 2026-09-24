# PC-Konfigurator

Interaktive, vollständig clientseitige Webanwendung zum Zusammenstellen eines Desktop-PCs und als Unterrichtsmaterial für Fachinformatik-Berufe.

Die Anwendung bewertet unter anderem Sockel, Formfaktor, Arbeitsspeicherstandard, GPU-Länge, Kühlerhöhe, Radiatorplätze, Netzteilreserve, Laufwerksplätze und Montagematerial. Im Einsteigermodus bleiben nicht passende Varianten sichtbar und erklären ihre Sperre. In Standard und Experte können Lernende frei wählen; erst die Auswertung meldet, ob die Bauteile zusammenpassen. Bei Problemen sollen sie die Ursache anhand der Datenblätter selbst finden, den Bauvorschlag korrigieren und erneut auswerten. Eine dynamische SVG-Schnittansicht visualisiert den aktuellen Bauzustand. Mainboard und Grafikkarte verwenden dabei ein gemeinsames, an realen Millimetermaßen orientiertes Skalierungsmodell für ATX, mATX und Mini-ITX.

## Lernfunktionen

- Kontextbezogene Lernkarten zu Aufgabe, Einbau, Sicherheit und Funktionsprüfung jeder Komponentengruppe
- Zentrale Sicherheitsregeln für ESD-Schutz, Spannungsfreiheit und Erstinbetriebnahme
- Umschaltbare SVG-Innen- und Rückansicht mit beschrifteten Peripherieanschlüssen
- Auswahl integrierter oder zusätzlicher Ethernet- und WLAN-Schnittstellen
- Hinweise zu PCIe-Steckplätzen, Bluetooth-USB-Headern, Antennen, Kabelkategorien und Netzwerk-Infrastruktur
- Automatische Berücksichtigung der Netzwerk-Erweiterungen im Gesamtpreis
- Klar markierte Komponenten aus ein bis zwei Vorgängergenerationen für Plattformvergleich, Budgetplanung und Gebrauchtmarkt-Szenarien
- Drei Schwierigkeitsgrade: zwei angeleitete Einsteiger-Baupfade mit unmittelbarem Feedback, freier Standardkatalog und Expertenmodus mit Fehlersuche in der Auswertung
- Herstellerangaben und Datenblätter für eindeutig identifizierte Modelle; im Standard- und Expertenmodus ersetzt Quellenarbeit die technischen Kurzangaben auf den Auswahlkarten
- In der Auswertung lokal gespeicherte Notizen zu Konflikt, Herstellerfundstelle und begründeter Korrektur
- Expertenparameter für CPU-/GPU-Power-Limits, Dauerlast- oder Lautstärkereserve und dokumentierten Custom-Loop-Dichtheitstest
- Gemischte AM5-, AM4-, LGA1851- und LGA1700-Plattformen mit DDR5-/DDR4-Prüfung sowie PCIe-Abwärtskompatibilität
- Zweite Seite „Auswertung“ mit gewichteter Nutzwertanalyse für Office, Entwicklung, CAD, Videoschnitt und lokale KI
- Transparente Teilwertungen, gewichtete Beiträge, Begründungen, Stärken, Verbesserungsbedarf und Druckansicht
- Barrierearmer Multiple-Choice-Test mit 20 zufälligen Fragen aus einem Pool von 100, Hinweisen, Sofortfeedback, Themenauswertung und Nachbesprechung
- SCORM-1.2-Anbindung für ILIAS mit Lernstatus, Punktzahl, Bearbeitungsposition, Sitzungszeit und Wiederaufnahme eines begonnenen Quiz

## Komponenten und Erklärtexte bearbeiten

Die Dateien `content/components.json`, `content/lessons.json`, `content/network.json` und `content/compatibility-rules.json` sind die verbindlichen Datenquellen. Die gleichnamigen Schema-Dateien unterstützen JSON-Editoren bei der Eingabeprüfung. Die technische Prüfung bleibt in JavaScript; Titel, Auswirkung, Lösung und Lernhinweis jeder Kompatibilitätsregel lassen sich dagegen redaktionell in JSON oder Excel bearbeiten.

Die Quellen stehen optional direkt am Produkt als `sourceUrl` (Herstellerseite zum konkreten Artikel), `datasheetUrl` (PDF), `manualUrl`, `modelNumber` und `sourceCheckedAt` (YYYY-MM-DD). Alle neun Grafikkarten sind konkrete MSI- oder Sapphire-Modelle mit Herstellerseite; für die fünf MSI-Modelle sind zusätzlich PDF-Datenblätter verlinkt. Die Länge, der Stromanschluss und die Leistungsaufnahme der Karten stammen aus den Modellangaben. Die Sapphire RX 6800 XT misst laut Hersteller 266,7 mm; für die ganzzahlige Längenprüfung wird vorsichtshalber auf 267 mm aufgerundet. `chipMaker` kennzeichnet AMD bzw. NVIDIA unabhängig vom Kartenhersteller. `gpuFamilyUrl` führt weiterhin zu den allgemeinen Angaben zum GPU-Typ und ist ausdrücklich keine Quelle für die Abmessungen des Kartenmodells. Nur HTTPS-Adressen verwenden und vor dem Eintrag prüfen, ob Seite, Modell, Speicherkapazität und Revision tatsächlich übereinstimmen. Für 44 weitere eindeutig zuordenbare Einträge sind Herstellerquellen hinterlegt. Allgemeines Montagezubehör zeigt einen Recherchehinweis. Die modellierten Werte der Kompatibilitätsprüfung bleiben eigenständige Unterrichtsdaten; bei Abweichungen haben die aktuellen Herstellerunterlagen Vorrang und die Werte müssen redaktionell korrigiert werden. Beim North berücksichtigt die Prüfung 300 mm GPU-Länge mit 360-mm-Front-Radiator statt der allgemeinen Grenze von 355 mm.

Für die Bearbeitung in Excel oder LibreOffice steht die erzeugte Arbeitsmappe [`buildbench-content.xlsx`](buildbench-content.xlsx) bereit. Sie enthält:

- Kategorien und je ein Tabellenblatt `K_<Kategorie-ID>` für die Komponenten
- Lernkarten mit Titel und Aufgabenbeschreibung sowie ein normalisiertes Blatt für Installations-, Sicherheits- und Prüfanweisungen
- Ethernet-/WLAN-Optionen und die zugehörigen Mainboard-Netzdaten
- Kompatibilitätsregeln mit Ursache, Auswirkung, Lösung und Lernhinweis

Eine aktuelle Arbeitsmappe mit den neuen Quellen-Spalten wird aus den JSON-Dateien erzeugt mit:

```bash
python3 tools/content_xlsx.py export --force
```

Nach der Bearbeitung werden alle vier JSON-Dateien gemeinsam aktualisiert mit. Beim Import einer älteren Arbeitsmappe bleiben vorhandene Quellenfelder der unveränderten Komponenten erhalten:

```bash
python3 tools/content_xlsx.py import --force
```

Listenwerte wie Spezifikationen, Sockel oder unterstützte Formfaktoren stehen innerhalb einer Zelle jeweils in einer eigenen Zeile. In jedem Komponentenblatt ordnet `beginnerVariant` genau eine Komponente dem Pfad `a` und genau eine dem Pfad `b` zu. Beide Pfade müssen über alle Kategorien hinweg jeweils eine kompatible Gesamtkonfiguration bilden; `recommended` bleibt davon unabhängig die Standardempfehlung. Beim Import werden Formeln abgewiesen sowie Pflichtfelder, Datentypen, eindeutige IDs und Querverweise geprüft. Ohne `--force` überschreibt das Skript keine vorhandenen Dateien. Abweichende Pfade lassen sich mit `--content-dir` und `--xlsx` angeben.

Neue Modelle können ohne Programmänderung in einer vorhandenen Kategorie ergänzt werden, sofern alle von den bestehenden Einträgen verwendeten technischen Felder ausgefüllt sind. Neue Kategorien oder neue technische Eigenschaften benötigen zusätzlich passende Anzeige-, Kompatibilitäts- oder Bewertungslogik.

Die Notizen der Auswertung werden je Kundenauftrag im aktuellen Browser gespeichert. Für eine Abgabe müssen die Lernenden sie über die Druckansicht oder eine andere vereinbarte Methode einreichen.

Ein neu erzeugtes SCORM-Paket enthält die aktuellen Quellen und Oberflächenänderungen:

```bash
python3 tools/package_scorm.py --force
```

## Quizfragen bearbeiten

Die Datei `quiz-questions.json` ist die verbindliche Datenquelle des Wissenstests. `quiz-questions.schema.json` beschreibt das Format für Editoren mit JSON-Schema-Unterstützung. Jede Frage enthält vier Antworten, individuelles Feedback und den Buchstaben der richtigen Antwort.

Das Werkzeug `tools/quiz_xlsx.py` benötigt nur Python 3 und keine zusätzlichen Pakete. Es erzeugt eine formatierte Arbeitsmappe:

```bash
python3 tools/quiz_xlsx.py export
```

Nach der Bearbeitung wird die XLSX-Datei wieder in JSON übernommen:

```bash
python3 tools/quiz_xlsx.py import --force
```

Standardmäßig verwendet das Skript `quiz-questions.json` und `quiz-questions.xlsx` im Projektverzeichnis. Abweichende Pfade können mit `--json` und `--xlsx` angegeben werden. Ohne `--force` werden vorhandene Dateien nicht überschrieben. Der Import prüft IDs, Pflichtfelder, vier eindeutige Antworten, die richtige Lösung und lehnt Tabellenformeln ab.

## SVG-Grafiken bearbeiten

Die beiden Darstellungen liegen als eigenständige, mit Inkscape oder einem Texteditor bearbeitbare Dateien vor:

- `assets/svg/inside-view.svg` – Innenansicht, Farbdefinitionen und dynamische Komponentenebene
- `assets/svg/ports-view.svg` – Rückansicht, Gehäusegrundform und dynamische Anschlussebene

`svg-loader.js` lädt und prüft beide Vorlagen beim Start. Die variablen Bauteile werden anschließend von `app.js` beziehungsweise `education.js` in die klar benannten Gruppen `#inside-content` und `#ports-content` eingesetzt. IDs dieser Gruppen sowie die zugänglichen `title`- und `desc`-Elemente müssen beim Bearbeiten erhalten bleiben.

Die eigentlichen Symbole sind ebenfalls einzeln ausgelagert:

| Ordner | Enthaltene SVG-Dateien |
| --- | --- |
| `assets/svg/components/` | Gehäuse, Mainboard, CPU, GPU, RAM, Netzteil, Luft- und Flüssigkeitskühler, M.2- und SATA-Speicher, Abstandhalter, Schrauben, Kabel und Kühlmittel |
| `assets/svg/ports/` | USB-A, USB-C, RJ45, HDMI, DisplayPort, 3,5-mm-Audio und WLAN-Antenne |

Die Ansichten referenzieren diese Dateien mit SVG-`image`-Elementen. Geometrie und Farben eines Bauteils oder Anschlusses können daher direkt in seiner Datei geändert werden, ohne die JavaScript-Zeichenlogik umzubauen. `viewBox`, `title` und `desc` sollten erhalten bleiben.

## Barrierefreiheit

Die Bedienoberfläche ist auf WCAG 2.2 ausgerichtet. Dazu gehören Sprunglinks, eine durchgängige Tastaturbedienung, sichtbare Fokusmarkierungen, semantische Statusmeldungen, zugängliche Dialoge sowie Textalternativen für die dynamischen PC- und Anschlussgrafiken. Hohe Kontraste, vergrößerte Bedienelemente, erzwungene Systemfarben und reduzierte Bewegung werden berücksichtigt.

Der automatisierte Test `a11y-check.js` schützt zentrale HTML-, CSS- und JavaScript-Merkmale vor Regressionen. Er ersetzt keine vollständige manuelle Prüfung mit Screenreader, Tastatur, Browser-Zoom und unterschiedlichen Betriebssystem-Kontrastmodi.

## KI-Transparenz

Die Anwendung selbst ist kein KI-System: Konfiguration, Kompatibilitätsprüfung, Zufallsauswahl und Quiz-Auswertung laufen vollständig lokal anhand fest programmierter Regeln. Es werden keine Eingaben an einen KI-Dienst übermittelt.

Inhalte und Quellcode wurden mit Unterstützung generativer KI erstellt. Ein auf allen Seiten sichtbarer Transparenzhinweis macht dies kenntlich und empfiehlt vor dem Unterrichtseinsatz eine fachliche Prüfung anhand aktueller Herstellerunterlagen. Die Kennzeichnung erfolgt vorsorglich im Hinblick auf Artikel 50 der EU-KI-Verordnung und soll nicht den Eindruck erwecken, dass die Anwendung selbst KI einsetzt.

## Start

Für den Abruf der Inhalts- und Quizdaten muss die Anwendung über einen lokalen Webserver gestartet werden:

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` aufrufen. Alle für die Oberfläche benötigten Schriften liegen unter `assets/fonts/` und werden lokal geladen. DM Sans und JetBrains Mono stammen aus [google/fonts](https://github.com/google/fonts) (Stand: Commit `23e54b51ddffbc7713c583748e3bd86f62b1fa4a`); die jeweiligen SIL-Open-Font-License-Texte liegen daneben. Nur ausdrücklich angeklickte Hersteller-Produktblätter führen zu externen Webseiten.

## In ILIAS verwenden

Das fertige SCORM-Paket kann unter [buildbench-scorm-1.2.zip](https://sebastianmeisel.github.io/pc-konfigurator/dist/buildbench-scorm-1.2.zip) heruntergeladen oder lokal ohne zusätzliche Python-Pakete erzeugt werden:

```bash
python3 tools/package_scorm.py
```

Eine vorhandene Datei wird nur mit `--force` ersetzt. Anschließend die ZIP-Datei in ILIAS als „SCORM/AICC-Lernmodul“ importieren. Je nach ILIAS-Konfiguration muss die Lernfortschrittsanzeige zusätzlich für den Kurs beziehungsweise das Objekt aktiviert werden.

Innerhalb von ILIAS verwendet die Anwendung die SCORM-1.2-Laufzeitschnittstelle. Erfasst werden besuchte Bereiche, Anzahl ausgewählter Komponenten, Schwierigkeitsgrad und Expertenparameter, betrachtetes Anwendungsszenario, Quiz-Fortschritt, bestes Quiz-Ergebnis und benötigte Sitzungszeit. Ein begonnenes Quiz wird über `cmi.suspend_data` wiederaufgenommen. Ab 70 Prozent wird der SCORM-Status „bestanden“ gesetzt. Außerhalb eines LMS bleibt die Anwendung vollständig nutzbar und speichert den Arbeitsstand nur lokal im Browser.

Das SCORM-Paket enthält auch die lokal eingebundenen Schriften und ihre Lizenzen. Es übermittelt keine Lerndaten an GitHub oder andere externe Dienste. Bei der SCORM-Nutzung werden die Fortschrittsdaten ausschließlich über die von ILIAS bereitgestellte Schnittstelle gespeichert.

## Bereitstellung

Der Workflow unter `.github/workflows/pages.yml` prüft die JavaScript-Dateien, die SCORM-Kommunikation, das Importpaket sowie zentrale Barrierefreiheitsmerkmale. Er veröffentlicht den Stand des `main`-Branches über GitHub Pages und stellt die aktuelle SCORM-ZIP-Datei als Download bereit.

## Weitere Unterrichtsanwendung: AlgoDesk

Unter `algorithmen-trainer/` befindet sich eine eigenständige Web-App für binäre Suche, Bubble Sort, Insertion Sort und Selection Sort. Sie verbindet zeilenweise Pseudocode-Ausführung mit geführten Schreibtischtests und Aufgaben zur Fehlersuche. Die Lerninhalte liegen in bearbeitbaren JSON-Dateien; Lernfortschritt wird lokal oder über SCORM 1.2 in ILIAS gespeichert.

- [AlgoDesk online öffnen](https://sebastianmeisel.github.io/pc-konfigurator/algorithmen-trainer/)
- [AlgoDesk-SCORM-Paket herunterladen](https://sebastianmeisel.github.io/pc-konfigurator/algorithmen-trainer/dist/algodesk-scorm-1.2.zip)
- Technische Hinweise: `algorithmen-trainer/README.md`

## Hinweise

Die hinterlegten Preise sind unverbindliche Orientierungswerte. Die GPU-Abmessungen und Leistungsangaben beziehen sich auf die namentlich ausgewiesenen Kartenmodelle. Bei anderen Revisionen und Modellen müssen die Angaben erneut geprüft werden. Die Lernhinweise ersetzen keine Herstellerhandbücher, betrieblichen Sicherheitsvorgaben oder Elektrofachkenntnisse. Vor Kauf und Montage sind die Datenblätter der exakten Artikelnummern zu prüfen.

## Lizenz

MIT
