"use strict";

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const contentDir = process.argv[2] || "content";
const schemaDir = process.argv[3] || "content";
const read = name => JSON.parse(readFileSync(join(contentDir, name), "utf8"));
const readSchema = name => JSON.parse(readFileSync(join(schemaDir, name), "utf8"));
const components = read("components.json");
const lessons = read("lessons.json");
const network = read("network.json");
const compatibility = read("compatibility-rules.json");
const failures = [];
let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function unique(values, label) {
  assert(new Set(values).size === values.length, label + ": doppelte IDs");
}

assert(components.schemaVersion === 1, "components.json: falsche Schema-Version");
assert(lessons.schemaVersion === 1, "lessons.json: falsche Schema-Version");
assert(network.schemaVersion === 1, "network.json: falsche Schema-Version");
assert(compatibility.schemaVersion === 1, "compatibility-rules.json: falsche Schema-Version");
assert(Array.isArray(components.categories) && components.categories.length >= 12, "Komponentenkategorien fehlen");

const categoryIds = components.categories.map(category => category.id);
unique(categoryIds, "Kategorien");
assert(
  JSON.stringify([...categoryIds].sort()) === JSON.stringify(Object.keys(components.components).sort()),
  "Kategorien und Komponentengruppen stimmen nicht überein"
);

let componentCount = 0;
for (const category of components.categories) {
  const items = components.components[category.id];
  assert(category.id && category.label && category.title && category.description && category.lessonId, category.id + ": Kategorietexte oder Lernkartenverweis fehlen");
  assert(Array.isArray(items) && items.length > 0, category.id + ": Komponenten fehlen");
  assert(items.filter(item => item.recommended === true).length === 1, category.id + ": genau eine Einsteigerempfehlung wird benötigt");
  unique(items.map(item => item.id), category.id);
  for (const item of items) {
    componentCount += 1;
    assert(item.id && item.maker && item.name, category.id + ": Stammdaten fehlen");
    assert(Number.isInteger(item.price) && item.price >= 0, category.id + "/" + item.id + ": Preis ist ungültig");
    assert(Array.isArray(item.specs) && item.specs.length > 0, category.id + "/" + item.id + ": specs fehlen");
    assert(item.generation === undefined || item.generation === 1 || item.generation === 2, category.id + "/" + item.id + ": generation ist ungültig");
  }
}
assert(componentCount >= 72, "Der Komponentenkatalog enthält weniger als 72 Einträge");

assert(Array.isArray(lessons.lessons) && lessons.lessons.length >= 16, "Lernkarten fehlen");
const lessonIds = lessons.lessons.map(lesson => lesson.id);
unique(lessonIds, "Lernkarten");
for (const lesson of lessons.lessons) {
  assert(lesson.id && lesson.title && lesson.role, String(lesson.id) + ": Lernkartentexte fehlen");
  for (const section of ["install", "safety", "check"]) {
    assert(Array.isArray(lesson[section]) && lesson[section].length > 0, lesson.id + "/" + section + ": Hinweise fehlen");
  }
}
for (const category of components.categories) {
  assert(lessonIds.includes(category.lessonId), category.id + ": Lernkarte " + category.lessonId + " fehlt");
}

assert(Array.isArray(network.groups), "Netzwerkgruppen fehlen");
unique(network.groups.map(group => group.id), "Netzwerkgruppen");
assert(
  JSON.stringify(network.groups.map(group => group.id).sort()) === JSON.stringify(["ethernet", "wifi"]),
  "Netzwerkgruppen ethernet und wifi werden benötigt"
);
for (const group of network.groups) {
  assert(lessonIds.includes(group.lessonId), group.id + ": zugehörige Lernkarte fehlt");
  assert(Array.isArray(group.options) && group.options.some(option => option.id === "onboard"), group.id + ": Onboard-Option fehlt");
  unique(group.options.map(option => option.id), "Netzwerk/" + group.id);
}

const boardIds = components.components.motherboard.map(board => board.id).sort();
assert(
  JSON.stringify(boardIds) === JSON.stringify(Object.keys(network.boards).sort()),
  "Mainboard-Netzdaten decken den Katalog nicht genau ab"
);
for (const [id, board] of Object.entries(network.boards)) {
  assert(board.name && board.form && board.lan && board.wifi, id + ": Mainboard-Netzdaten sind unvollständig");
}

assert(Array.isArray(compatibility.rules) && compatibility.rules.length >= 30, "Kompatibilitätsregeln fehlen");
const ruleCodes = compatibility.rules.map(rule => rule.code);
unique(ruleCodes, "Kompatibilitätsregeln");
for (const rule of compatibility.rules) {
  assert(/^[A-Z][A-Z0-9_]+$/.test(rule.code), String(rule.code) + ": ungültiger Regelcode");
  assert([rule.title, rule.consequence, rule.remedy, rule.learningHint].every(value => typeof value === "string" && value.trim()), rule.code + ": Erklärung ist unvollständig");
}
const appSource = readFileSync("app.js", "utf8");
const usedRuleCodes = [...appSource.matchAll(/issue\("([A-Z0-9_]+)"/g)].map(match => match[1]);
unique(usedRuleCodes, "In app.js verwendete Kompatibilitätsregeln");
assert(usedRuleCodes.every(code => ruleCodes.includes(code)), "app.js verwendet einen unbekannten Regelcode");
assert(ruleCodes.every(code => usedRuleCodes.includes(code)), "Regelkatalog enthält ungenutzte Codes");

for (const name of ["components.schema.json", "lessons.schema.json", "network.schema.json", "compatibility-rules.schema.json"]) {
  const schema = readSchema(name);
  assert(schema.$schema && schema.$id && schema.type === "object", name + ": JSON-Schema ist unvollständig");
}

if (failures.length) {
  console.error("Inhaltsprüfung fehlgeschlagen:");
  failures.forEach(failure => console.error("- " + failure));
  process.exit(1);
}

console.log("Inhaltsprüfung bestanden (" + checks + " Prüfungen, " + componentCount + " Komponenten, " + lessons.lessons.length + " Lernkarten, " + compatibility.rules.length + " Kompatibilitätsregeln).");
