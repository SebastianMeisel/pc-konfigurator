# PC-Konfigurator

Interaktive, vollständig clientseitige Webanwendung zum Zusammenstellen eines Desktop-PCs.

Die Anwendung bewertet unter anderem Sockel, Formfaktor, Arbeitsspeicherstandard, GPU-Länge, Kühlerhöhe, Radiatorplätze, Netzteilreserve, Laufwerksplätze und Montagematerial. Nicht passende Varianten bleiben sichtbar und zeigen den Grund ihrer Sperre. Eine dynamische SVG-Schnittansicht visualisiert den aktuellen Bauzustand.

## Start

`index.html` direkt öffnen oder einen lokalen Webserver starten:

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` aufrufen.

## Bereitstellung

Der Workflow unter `.github/workflows/pages.yml` veröffentlicht den Stand des `main`-Branches über GitHub Pages.

## Hinweise

Die hinterlegten Preise sind unverbindliche Orientierungswerte. Abmessungen und elektrische Anforderungen beziehen sich auf die modellierten Referenzvarianten; konkrete Herstellerkarten und Sondereditionen können abweichen. Vor einem Kauf sollten die Datenblätter der exakten Artikelnummern geprüft werden.

## Lizenz

MIT
