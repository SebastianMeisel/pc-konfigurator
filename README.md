# PC-Konfigurator

Interaktive, vollständig clientseitige Webanwendung zum Zusammenstellen eines Desktop-PCs und als Unterrichtsmaterial für Fachinformatik-Berufe.

Die Anwendung bewertet unter anderem Sockel, Formfaktor, Arbeitsspeicherstandard, GPU-Länge, Kühlerhöhe, Radiatorplätze, Netzteilreserve, Laufwerksplätze und Montagematerial. Nicht passende Varianten bleiben sichtbar und zeigen den Grund ihrer Sperre. Eine dynamische SVG-Schnittansicht visualisiert den aktuellen Bauzustand.

## Lernfunktionen

- Kontextbezogene Lernkarten zu Aufgabe, Einbau, Sicherheit und Funktionsprüfung jeder Komponentengruppe
- Zentrale Sicherheitsregeln für ESD-Schutz, Spannungsfreiheit und Erstinbetriebnahme
- Umschaltbare SVG-Innen- und Rückansicht mit beschrifteten Peripherieanschlüssen
- Auswahl integrierter oder zusätzlicher Ethernet- und WLAN-Schnittstellen
- Hinweise zu PCIe-Steckplätzen, Bluetooth-USB-Headern, Antennen, Kabelkategorien und Netzwerk-Infrastruktur
- Automatische Berücksichtigung der Netzwerk-Erweiterungen im Gesamtpreis
- Klar markierte Komponenten aus ein bis zwei Vorgängergenerationen für Plattformvergleich, Budgetplanung und Gebrauchtmarkt-Szenarien
- Gemischte AM5-, AM4-, LGA1851- und LGA1700-Plattformen mit DDR5-/DDR4-Prüfung sowie PCIe-Abwärtskompatibilität
- Zweite Seite „Auswertung“ mit gewichteter Nutzwertanalyse für Office, Entwicklung, CAD, Videoschnitt und lokale KI
- Transparente Teilwertungen, gewichtete Beiträge, Begründungen, Stärken, Verbesserungsbedarf und Druckansicht
- Barrierearmer Multiple-Choice-Test mit 20 zufälligen Fragen aus einem Pool von 100, Hinweisen, Sofortfeedback, Themenauswertung und Nachbesprechung

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

## Barrierefreiheit

Die Bedienoberfläche ist auf WCAG 2.2 ausgerichtet. Dazu gehören Sprunglinks, eine durchgängige Tastaturbedienung, sichtbare Fokusmarkierungen, semantische Statusmeldungen, zugängliche Dialoge sowie Textalternativen für die dynamischen PC- und Anschlussgrafiken. Hohe Kontraste, vergrößerte Bedienelemente, erzwungene Systemfarben und reduzierte Bewegung werden berücksichtigt.

Der automatisierte Test `a11y-check.js` schützt zentrale HTML-, CSS- und JavaScript-Merkmale vor Regressionen. Er ersetzt keine vollständige manuelle Prüfung mit Screenreader, Tastatur, Browser-Zoom und unterschiedlichen Betriebssystem-Kontrastmodi.

## KI-Transparenz

Die Anwendung selbst ist kein KI-System: Konfiguration, Kompatibilitätsprüfung, Zufallsauswahl und Quiz-Auswertung laufen vollständig lokal anhand fest programmierter Regeln. Es werden keine Eingaben an einen KI-Dienst übermittelt.

Inhalte und Quellcode wurden mit Unterstützung generativer KI erstellt. Ein auf allen Seiten sichtbarer Transparenzhinweis macht dies kenntlich und empfiehlt vor dem Unterrichtseinsatz eine fachliche Prüfung anhand aktueller Herstellerunterlagen. Die Kennzeichnung erfolgt vorsorglich im Hinblick auf Artikel 50 der EU-KI-Verordnung und soll nicht den Eindruck erwecken, dass die Anwendung selbst KI einsetzt.

## Start

Für den Quiz-Datenabruf muss die Anwendung über einen lokalen Webserver gestartet werden:

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` aufrufen.

## Bereitstellung

Der Workflow unter `.github/workflows/pages.yml` prüft die JavaScript-Dateien sowie zentrale Barrierefreiheitsmerkmale und veröffentlicht den Stand des `main`-Branches über GitHub Pages.

## Hinweise

Die hinterlegten Preise sind unverbindliche Orientierungswerte. Abmessungen und elektrische Anforderungen beziehen sich auf die modellierten Referenzvarianten; konkrete Herstellerkarten und Sondereditionen können abweichen. Die Lernhinweise ersetzen keine Herstellerhandbücher, betrieblichen Sicherheitsvorgaben oder Elektrofachkenntnisse. Vor Kauf und Montage sind die Datenblätter der exakten Artikelnummern zu prüfen.

## Lizenz

MIT