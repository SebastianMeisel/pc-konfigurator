"use strict";

const { readFileSync, readdirSync } = require("node:fs");

const componentSvgNames = readdirSync("assets/svg/components")
  .filter(name => name.endsWith(".svg"))
  .map(name => `assets/svg/components/${name}`);
const portSvgNames = readdirSync("assets/svg/ports")
  .filter(name => name.endsWith(".svg"))
  .map(name => `assets/svg/ports/${name}`);

const files = Object.fromEntries(
  ["index.html", "evaluation.html", "quiz.html", "styles.css", "education.css", "evaluation.css", "quiz.css", "app.js", "education.js", "evaluation.js", "quiz.js", "scorm.js", "svg-loader.js", "content-loader.js", "assets/svg/inside-view.svg", "assets/svg/ports-view.svg", ...componentSvgNames, ...portSvgNames, "imsmanifest.xml", "content/components.json", "content/components.schema.json", "content/lessons.json", "content/lessons.schema.json", "content/network.json", "content/network.schema.json", "quiz-questions.json", "quiz-questions.schema.json", "tools/quiz_xlsx.py", "tools/content_xlsx.py", "tools/package_scorm.py"]
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
checkHtml("quiz.html");

for (const name of ["index.html", "evaluation.html", "quiz.html"]) {
  assert(/<aside class="ai-disclosure" data-ai-disclosure aria-labelledby="ai-disclosure-title">/.test(files[name]), `${name}: KI-Transparenzhinweis fehlt`);
  assert(/id="ai-disclosure-title">Transparenzhinweis zur KI-Unterstützung/.test(files[name]), `${name}: KI-Transparenzhinweis ist nicht eindeutig bezeichnet`);
  assert(/Die Anwendung selbst verwendet kein KI-Modell/.test(files[name]), `${name}: Abgrenzung zur Laufzeit-KI fehlt`);
  assert(/data-lms-status role="status" aria-live="polite"/.test(files[name]), `${name}: zugängliche ILIAS-Statusmeldung fehlt`);
  assert(/<script src="scorm\.js"/.test(files[name]), `${name}: SCORM-Anbindung fehlt`);
}

assert(/id="pc-view-host"[^>]+role="status"/.test(files["index.html"]), "index.html: Ladeplatzhalter der Innenansicht fehlt");
assert(/id="port-view-host"[^>]+role="status"/.test(files["index.html"]), "index.html: Ladeplatzhalter der Anschlussansicht fehlt");
assert(/id="pc-view"[^>]+aria-labelledby="svg-title"[^>]+aria-describedby="svg-description visual-text"/.test(files["assets/svg/inside-view.svg"]), "inside-view.svg: Textalternative der Innenansicht fehlt");
assert(/id="port-view"[^>]+aria-labelledby="port-title"[^>]+aria-describedby="port-description visual-text"/.test(files["assets/svg/ports-view.svg"]), "ports-view.svg: Textalternative der Anschlussansicht fehlt");
assert(/id="inside-content"[^>]+data-editable-layer="dynamic-components"/.test(files["assets/svg/inside-view.svg"]), "inside-view.svg: dynamische Ebene fehlt");
assert(/id="ports-content"[^>]+data-editable-layer="dynamic-ports"/.test(files["assets/svg/ports-view.svg"]), "ports-view.svg: dynamische Ebene fehlt");
assert(/script, foreignObject/.test(files["svg-loader.js"]) && /name\.startsWith\("on"\)/.test(files["svg-loader.js"]), "svg-loader.js: SVG-Bereinigung fehlt");
assert(componentSvgNames.length === 14, `Komponenten-SVGs: 14 erwartet, ${componentSvgNames.length} gefunden`);
assert(portSvgNames.length === 7, `Anschluss-SVGs: 7 erwartet, ${portSvgNames.length} gefunden`);
for (const name of [...componentSvgNames, ...portSvgNames]) {
  assert(/<svg[^>]+viewBox=/.test(files[name]), `${name}: viewBox fehlt`);
  assert(/<title(?:\s+[^>]*)?>\s*[^<]+\s*<\/title>/.test(files[name]), `${name}: zugänglicher Titel fehlt`);
  assert(/<desc(?:\s+[^>]*)?>\s*[^<]+\s*<\/desc>/.test(files[name]), `${name}: Beschreibung fehlt`);
  assert(files["imsmanifest.xml"].includes(`<file href="${name}"/>`), `${name}: Eintrag im SCORM-Manifest fehlt`);
}
assert(/<dialog[^>]+id="lesson-dialog"[^>]+aria-labelledby="lesson-dialog-title"/.test(files["index.html"]), "index.html: Dialogbezeichnung fehlt");
assert(/<caption class="visually-hidden">/.test(files["evaluation.html"]), "evaluation.html: Tabellenbeschriftung fehlt");
assert(/class="criteria-table-wrap"[^>]+role="region"[^>]+aria-label="Tabelle der gewichteten Kriterien; horizontal verschiebbar"/.test(files["evaluation.html"]), "evaluation.html: zugänglicher Tabellenbereich fehlt");
assert(/id="score-ring"[^>]+role="img"[^>]+aria-label=/.test(files["evaluation.html"]), "evaluation.html: Bezeichnung der Ergebnisgrafik fehlt");
assert(/<fieldset[^>]+id="question-fieldset"/.test(files["quiz.html"]), "quiz.html: semantische Fragengruppe fehlt");
assert(/<legend[^>]+id="question-heading"/.test(files["quiz.html"]), "quiz.html: Fragenbezeichnung fehlt");
assert(/role="progressbar"[^>]+aria-valuemin="0"[^>]+aria-valuemax="20"/.test(files["quiz.html"]), "quiz.html: zugängliche Fortschrittsanzeige fehlt");
assert(/id="feedback"[^>]+role="status"[^>]+aria-live="polite"/.test(files["quiz.html"]), "quiz.html: Rückmeldung wird nicht angekündigt");

const css = files["styles.css"];
assert(/:focus-visible/.test(css), "styles.css: sichtbare Fokusmarkierung fehlt");
assert(/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(css), "styles.css: reduzierte Bewegung fehlt");
assert(/@media\s*\(prefers-contrast:\s*more\)/.test(css), "styles.css: hoher Kontrast fehlt");
assert(/@media\s*\(forced-colors:\s*active\)/.test(css), "styles.css: erzwungene Farben fehlen");
assert(/\.visually-hidden\s*\{/.test(css), "styles.css: Hilfsklasse für Screenreader fehlt");
assert(/\.ai-disclosure\s*\{/.test(css), "styles.css: Gestaltung des KI-Transparenzhinweises fehlt");

assert(/reasons\.length[^\n]+aria-disabled="true"/.test(files["app.js"]), "app.js: inkompatible Optionen sind nicht zugänglich markiert");
assert(/BuildBenchContent\?\.ready/.test(files["app.js"]) && /BuildBenchContent\?\.ready/.test(files["education.js"]), "App: externe Inhaltsdaten werden nicht gemeinsam geladen");
assert(/fetch\(url,\s*\{\s*cache:\s*"no-store"\s*\}\)/.test(files["content-loader.js"]), "content-loader.js: JSON-Daten werden nicht geladen");
assert(/const escapeHtml/.test(files["app.js"]) && /escapeHtml\(item\.name\)/.test(files["app.js"]), "app.js: bearbeitbare Inhalte werden nicht maskiert");
assert(/querySelector\("#inside-content"\)/.test(files["app.js"]), "app.js: externe Innenansicht wird nicht befüllt");
for (const name of componentSvgNames) {
  const basename = name.split("/").pop();
  assert(files["app.js"].includes(`"${basename}"`), `app.js: ${basename} wird nicht aus einer Einzeldatei geladen`);
}
assert(!/reasons\.length\s*\?\s*"disabled"/.test(files["app.js"]), "app.js: inkompatible Optionen werden aus der Tastaturfolge entfernt");
assert(/dialogTrigger[^\n]+dialogTrigger\.focus/.test(files["education.js"]), "education.js: Dialogfokus wird nicht zurückgegeben");
assert(/data-lesson-id=/.test(files["app.js"]) && /dataset\.lessonId/.test(files["education.js"]), "Lernkarten: stabile Zuordnung über lessonId fehlt");
assert(/networkGroups\[type\]\.lessonId/.test(files["education.js"]), "Netzwerkoptionen: Lernkartenverweis aus JSON wird nicht verwendet");
assert(/dataset\.portDescription/.test(files["education.js"]), "education.js: dynamische Anschlussbeschreibung fehlt");
assert(/querySelector\("#ports-content"\)/.test(files["education.js"]), "education.js: externe Anschlussansicht wird nicht befüllt");
for (const name of portSvgNames) {
  const basename = name.split("/").pop().replace(/\.svg$/, "");
  assert(files["education.js"].includes(`"${basename}"`), `education.js: ${basename}.svg wird nicht aus einer Einzeldatei geladen`);
}
assert(/\$\("#score-ring"\)\.setAttribute\("aria-label"/.test(files["evaluation.js"]), "evaluation.js: Ergebnisgrafik wird nicht aktualisiert");
assert(/prefers-reduced-motion/.test(files["evaluation.js"]), "evaluation.js: Scrollbewegung respektiert Systemeinstellung nicht");
const quizData = JSON.parse(files["quiz-questions.json"]);
const quizSchema = JSON.parse(files["quiz-questions.schema.json"]);
const quizIds = quizData.questions.map((question) => question.id);
assert(quizData.schemaVersion === 1, "quiz-questions.json: falsche Schema-Version");
assert(quizData.testSize === 20, "quiz-questions.json: Testgröße ist nicht 20");
assert(quizData.questions.length >= 100, "quiz-questions.json: Fragenpool enthält weniger als 100 Fragen");
assert(new Set(quizIds).size === quizIds.length, "quiz-questions.json: doppelte Fragen-IDs");
assert(quizData.questions.every((question) => question.hint && question.options?.length === 4), "quiz-questions.json: Hinweis oder vier Antworten fehlen");
assert(quizData.questions.every((question) => question.options.every((option) => option.text && option.feedback)), "quiz-questions.json: Antwort oder Feedback ist leer");
assert(quizData.questions.every((question) => question.options.some((option) => option.id === question.correctAnswer)), "quiz-questions.json: richtige Antwort fehlt");
assert(quizSchema.properties?.questions?.items?.properties?.correctAnswer, "quiz-questions.schema.json: Schema für richtige Antwort fehlt");
assert(/fetch\("quiz-questions\.json"/.test(files["quiz.js"]), "quiz.js: JSON-Fragenpool wird nicht geladen");
assert(/def export_xlsx/.test(files["tools/quiz_xlsx.py"]) && /def import_xlsx/.test(files["tools/quiz_xlsx.py"]), "tools/quiz_xlsx.py: Import oder Export fehlt");
assert(/def export_xlsx/.test(files["tools/content_xlsx.py"]) && /def import_xlsx/.test(files["tools/content_xlsx.py"]), "tools/content_xlsx.py: Import oder Export fehlt");
for (const name of ["components", "lessons", "network"]) {
  assert(JSON.parse(files["content/" + name + ".json"]).schemaVersion === 1, "content/" + name + ".json: falsche Schema-Version");
  assert(JSON.parse(files["content/" + name + ".schema.json"]).type === "object", "content/" + name + ".schema.json: Schema fehlt");
  assert(files["imsmanifest.xml"].includes('<file href="content/' + name + '.json"/>'), "imsmanifest.xml: content/" + name + ".json fehlt");
}
assert(/recordConfigurator/.test(files["scorm.js"]) && /recordQuizResult/.test(files["scorm.js"]), "scorm.js: Lernfortschrittsfunktionen fehlen");
assert(/cmi\.suspend_data/.test(files["scorm.js"]) && /cmi\.core\.score\.raw/.test(files["scorm.js"]), "scorm.js: SCORM-Fortschrittsfelder fehlen");
assert(/adlcp:scormtype="sco"/.test(files["imsmanifest.xml"]) && /<schemaversion>1\.2<\/schemaversion>/.test(files["imsmanifest.xml"]), "imsmanifest.xml: SCORM-1.2-SCO fehlt");
assert(/PACKAGE_FILES/.test(files["tools/package_scorm.py"]) && /imsmanifest\.xml/.test(files["tools/package_scorm.py"]), "tools/package_scorm.py: Paketdefinition fehlt");
assert(/question-heading[^\n]+focus/.test(files["quiz.js"]), "quiz.js: Fokusführung zwischen Fragen fehlt");
assert(/@media\(prefers-reduced-motion:reduce\)/.test(files["quiz.css"]), "quiz.css: reduzierte Bewegung fehlt");
try {
  new Function(files["quiz.js"]);
  assert(true, "quiz.js: JavaScript-Syntax ist ungültig");
} catch {
  assert(false, "quiz.js: JavaScript-Syntax ist ungültig");
}

if (failures.length) {
  console.error("Barrierefreiheitsprüfung fehlgeschlagen:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Barrierefreiheitsprüfung bestanden (${checks} Prüfungen).`);
