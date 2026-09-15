#!/usr/bin/env node
"use strict";
const fs = require("node:fs");
const vm = require("node:vm");

const root = __dirname;
const read = name => fs.readFileSync(`${root}/${name}`, "utf8");
const algorithms = JSON.parse(read("content/algorithms.json"));
const exercises = JSON.parse(read("content/exercises.json"));
const html = read("index.html");
const manifest = read("imsmanifest.xml");
const failures = [];
let checks = 0;
function assert(condition, message) { checks += 1; if (!condition) failures.push(message); }

assert(algorithms.schemaVersion === 1, "Algorithmen: falsche Schemaversion");
assert(algorithms.algorithms.length === 4, "Vier Algorithmen werden erwartet");
const algorithmIds = new Set();
for (const algorithm of algorithms.algorithms) {
  assert(!algorithmIds.has(algorithm.id), `Doppelte Algorithmus-ID: ${algorithm.id}`); algorithmIds.add(algorithm.id);
  assert(algorithm.lines.length >= 8, `${algorithm.id}: Pseudocode zu kurz`);
  assert(["search", "sort"].includes(algorithm.kind), `${algorithm.id}: ungültige Art`);
  for (const field of ["best", "average", "worst", "memory"]) assert(Boolean(algorithm.complexity[field]), `${algorithm.id}: Komplexität ${field} fehlt`);
}
assert(exercises.deskTests.length === 6, "Sechs Schreibtischtests werden erwartet");
assert(exercises.debugChallenges.length === 5, "Fünf Fehlerfälle werden erwartet");
for (const exercise of [...exercises.deskTests, ...exercises.debugChallenges]) assert(algorithmIds.has(exercise.algorithm), `${exercise.id}: unbekannter Algorithmus`);
for (const challenge of exercises.debugChallenges) assert(challenge.options.filter(option => option.correct).length === 1, `${challenge.id}: genau eine richtige Antwort erforderlich`);
for (const id of ["main-content", "erkunden", "schreibtischtest", "fehlersuche", "help-dialog"]) assert(html.includes(`id="${id}"`), `HTML-ID fehlt: ${id}`);
assert(/<html lang="de">/.test(html), "Dokumentsprache fehlt");
assert(/class="skip-link"/.test(html), "Sprunglink fehlt");
assert(/aria-live="polite"/.test(html), "Live-Region fehlt");
assert(!/tabindex=["']?[1-9]/.test(html), "Positiver tabindex ist nicht barrierefrei");
for (const file of ["index.html", "styles.css", "app.js", "scorm.js", "content/algorithms.json", "content/exercises.json", "content/algorithms.schema.json", "content/exercises.schema.json"]) assert(manifest.includes(`href="${file}"`), `Manifest-Eintrag fehlt: ${file}`);

const dummy = new Proxy(function () {}, { get: (_, key) => key === "disabled" ? false : dummy, set: () => true, apply: () => dummy });
const context = {
  console, setInterval, clearInterval,
  matchMedia: () => ({ matches: true }),
  document: { querySelector: () => dummy, querySelectorAll: () => [], createElement: () => dummy, createTextNode: value => value },
  addEventListener: () => {},
  fetch: () => new Promise(() => {}),
  window: { AlgoDeskLMS: null },
  Option: function () {}
};
vm.createContext(context); vm.runInContext(read("app.js"), context);
const traces = [
  ["binary-search", [3, 7, 11, 18, 24, 31, 42], 24, 6],
  ["binary-search", [2, 5, 9, 14], 13, 11],
  ["bubble-sort", [6, 2, 5, 1], undefined, 9],
  ["insertion-sort", [7, 3, 5, 2], undefined, 9],
  ["selection-sort", [8, 3, 6, 1], undefined, 9]
];
for (const [id, values, target, finalLine] of traces) {
  const trace = context.createTrace(id, values, target);
  assert(trace.length > 1, `${id}: Ausführungsspur fehlt`);
  assert(trace.every(item => item.line >= 1 && item.line <= algorithms.algorithms.find(a => a.id === id).lines.length), `${id}: ungültige Zeilennummer`);
  assert(trace.at(-1).line === finalLine, `${id}: falscher Abschluss`);
  if (id.endsWith("sort")) assert(JSON.stringify(trace.at(-1).array) === JSON.stringify([...values].sort((a, b) => a - b)), `${id}: falsches Sortierergebnis`);
}

if (failures.length) { console.error("Prüfung fehlgeschlagen:\n- " + failures.join("\n- ")); process.exit(1); }
console.log(`AlgoDesk-Prüfung bestanden (${checks} Prüfungen, ${algorithms.algorithms.length} Algorithmen, ${exercises.deskTests.length + exercises.debugChallenges.length} Übungen).`);
