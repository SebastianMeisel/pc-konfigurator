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

## Start

`index.html` direkt öffnen oder einen lokalen Webserver starten:

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` aufrufen.

## Bereitstellung

Der Workflow unter `.github/workflows/pages.yml` prüft die JavaScript-Dateien und veröffentlicht den Stand des `main`-Branches über GitHub Pages.

## Hinweise

Die hinterlegten Preise sind unverbindliche Orientierungswerte. Abmessungen und elektrische Anforderungen beziehen sich auf die modellierten Referenzvarianten; konkrete Herstellerkarten und Sondereditionen können abweichen. Die Lernhinweise ersetzen keine Herstellerhandbücher, betrieblichen Sicherheitsvorgaben oder Elektrofachkenntnisse. Vor Kauf und Montage sind die Datenblätter der exakten Artikelnummern zu prüfen.

## Lizenz

MIT