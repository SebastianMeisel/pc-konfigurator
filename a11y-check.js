"use strict";

const { readFileSync } = require("node:fs");

const files = Object.fromEntries(
  ["index.html", "evaluation.html", "styles.css", "education.css", "evaluation.css", "app.js", "education.js", "evaluation.js"]
    .map((name) => [name, readFileSync(name, "utf8")])
);

const failures = [];
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function checkHtml(name) {
  const html = files[name];
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert(/<html\s+lang="de"/.test(html), `${name}: Dokumentsprache fehlt`);
  assert(/<meta\s+name="viewport"/.test(html), `${name}: Viewport-Angabe fehlt`);
  assert(/class="skip-link"\s+href="#main-content"/.test(html), `${name}: Sprunglink fehlt`);
  assert(/<main[^>]+id="main-content"[^>]+tabindex="-1"/.test(html), `${name}: fokussierbares Hauptziel fehlt`);
  assert(!/tabindex="[1-9]\d*"/.test(html), `${name}: positiver tabindex gefunden`);
  assert(duplicates.length === 0, `${name}: doppelte IDs: ${[...new Set(duplicates)].join(", ")}`);
}

checkHtml("index.html");
checkHtml("evaluation.html");

assert(/id="pc-view"[^>]+aria-labelledby="svg-title"[^>]+aria-describedby="svg-description visual-text"/.test(files["index.html"]), "index.html: Textalternative der Innenansicht fehlt");
assert(/id="port-view"[^>]+aria-labelledby="port-title"[^>]+aria-describedby="port-description visual-text"/.test(files["index.html"]), "index.html: Textalternative der Anschlussansicht fehlt");
assert(/<dialog[^>]+id="lesson-dialog"[^>]+aria-labelledby="lesson-dialog-title"/.test(files["index.html"]), "index.html: Dialogbezeichnung fehlt");
assert(/<caption class="visually-hidden">/.test(files["evaluation.html"]), "evaluation.html: Tabellenbeschriftung fehlt");
assert(/class="criteria-table-wrap"[^>]+role="region"[^>]+aria-label="Tabelle der gewichteten Kriterien; horizontal verschiebbar"/.test(files["evaluation.html"]), "evaluation.html: zugänglicher Tabellenbereich fehlt");
assert(/id="score-ring"[^>]+role="img"[^>]+aria-label=/.test(files["evaluation.html"]), "evaluation.html: Bezeichnung der Ergebnisgrafik fehlt");

const css = files["styles.css"];
assert(/:focus-visible/.test(css), "styles.css: sichtbare Fokusmarkierung fehlt");
assert(/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css), "styles.css: reduzierte Bewegung fehlt");
assert(/@media\s*\(prefers-contrast:\s*more\)/.test(css), "styles.css: hoher Kontrast fehlt");
assert(/@media\s*\(forced-colors:\s*active\)/.test(css), "styles.css: erzwungene Farben fehlen");
assert(/\.visually-hidden\s*\{/.test(css), "styles.css: Hilfsklasse für Screenreader fehlt");

assert(/reasons\.length[^\n]+aria-disabled="true"/.test(files["app.js"]), "app.js: inkompatible Optionen sind nicht zugänglich markiert");
assert(!/reasons\.length\s*\?\s*"disabled"/.test(files["app.js"]), "app.js: inkompatible Optionen werden aus der Tastaturfolge entfernt");
assert(/dialogTrigger[^\n]+dialogTrigger\.focus/.test(files["education.js"]), "education.js: Dialogfokus wird nicht zurückgegeben");
assert(/dataset\.portDescription/.test(files["education.js"]), "education.js: dynamische Anschlussbeschreibung fehlt");
assert(/\$\("#score-ring"\)\.setAttribute\("aria-label"/.test(files["evaluation.js"]), "evaluation.js: Ergebnisgrafik wird nicht aktualisiert");
assert(/prefers-reduced-motion/.test(files["evaluation.js"]), "evaluation.js: Scrollbewegung respektiert Systemeinstellung nicht");

if (failures.length) {
  console.error("Barrierefreiheitsprüfung fehlgeschlagen:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Barrierefreiheitsprüfung bestanden (${checks} Prüfungen).`);
