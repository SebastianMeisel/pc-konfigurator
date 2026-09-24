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
  for (const variant of ["a", "b"]) {
    assert(items.filter(item => item.beginnerVariant === variant).length === 1, category.id + ": Einsteigerpfad " + variant.toUpperCase() + " benötigt genau eine Komponente");
  }
  unique(items.map(item => item.id), category.id);
  for (const item of items) {
    componentCount += 1;
    assert(item.id && item.maker && item.name, category.id + ": Stammdaten fehlen");
    assert(Number.isInteger(item.price) && item.price >= 0, category.id + "/" + item.id + ": Preis ist ungültig");
    assert(Array.isArray(item.specs) && item.specs.length > 0, category.id + "/" + item.id + ": specs fehlen");
    assert(item.generation === undefined || item.generation === 1 || item.generation === 2, category.id + "/" + item.id + ": generation ist ungültig");
    if (item.maxGpuWithFront360 !== undefined) assert(Number.isInteger(item.maxGpuWithFront360) && item.maxGpuWithFront360 > 0 && item.maxGpuWithFront360 <= item.maxGpu, `${category.id}/${item.id}: maxGpuWithFront360 ist ungültig`);
    for (const field of ["sourceUrl", "datasheetUrl", "manualUrl"]) {
      if (item[field] === undefined) continue;
      let valid = false;
      try { valid = new URL(item[field]).protocol === "https:"; } catch (_) {}
      assert(valid, `${category.id}/${item.id}: ${field} muss eine HTTPS-Adresse sein`);
    }
    assert(!item.sourceCheckedAt || /^\d{4}-\d{2}-\d{2}$/.test(item.sourceCheckedAt), `${category.id}/${item.id}: sourceCheckedAt muss YYYY-MM-DD sein`);
  }
}
assert(componentCount >= 72, "Der Komponentenkatalog enthält weniger als 72 Einträge");

function beginnerConfig(variant) {
  return Object.fromEntries(
    categoryIds.map(categoryId => [
      categoryId,
      components.components[categoryId].find(item => item.beginnerVariant === variant)
    ])
  );
}

for (const variant of ["a", "b"]) {
  const config = beginnerConfig(variant);
  const label = "Einsteigerpfad " + variant.toUpperCase();
  const pcCase = config.case;
  const board = config.motherboard;
  const cpu = config.cpu;
  const gpu = config.gpu;
  const ram = config.ram;
  const psu = config.psu;
  const cooler = config.cooler;
  const storage = config.storage;
  const standoffs = config.standoffs;
  const screws = config.screws;
  const cables = config.cables;
  const coolant = config.coolant;
  const load = cpu.power + gpu.power + 110;
  const recommendedPower = Math.ceil(load * 1.3 / 50) * 50;

  assert(pcCase.form.includes(board.form), label + ": Mainboard passt nicht ins Gehäuse");
  const gpuLimit = cooler.radiator === 360 && pcCase.maxGpuWithFront360 ? pcCase.maxGpuWithFront360 : pcCase.maxGpu;
  assert(gpuLimit >= gpu.length, label + ": Grafikkarte ist zu lang");
  assert(pcCase.psu.includes(psu.form), label + ": Netzteilform passt nicht ins Gehäuse");
  assert(pcCase.drives.includes(storage.mount), label + ": Laufwerk passt nicht ins Gehäuse");
  assert(board.socket === cpu.socket, label + ": CPU-Sockel passt nicht zum Mainboard");
  assert(board.memory === ram.type, label + ": RAM-Typ passt nicht zum Mainboard");
  assert(storage.mount !== "M.2" || board.m2 > 0, label + ": M.2-Steckplatz fehlt");
  assert(storage.interface !== "SATA" || board.sata > 0, label + ": SATA-Anschluss fehlt");
  assert(psu.watts >= recommendedPower, label + ": Netzteilreserve ist zu klein");
  assert(cooler.sockets.includes(cpu.socket), label + ": Kühler passt nicht zum CPU-Sockel");
  assert(cooler.capacity >= cpu.power, label + ": Kühlerleistung ist zu klein");
  assert(cooler.kind === "air" ? cooler.height <= pcCase.maxCooler : pcCase.radiators.includes(cooler.radiator), label + ": Kühler passt nicht ins Gehäuse");
  assert(standoffs.forms.includes(board.form) && standoffs.count >= board.standoff, label + ": Abstandhalter passen nicht zum Mainboard");
  assert(standoffs.thread === pcCase.thread, label + ": Abstandhaltergewinde passt nicht zum Gehäuse");
  assert(screws.thread === standoffs.thread && screws.count >= board.standoff, label + ": Schrauben passen nicht zu den Abstandhaltern");
  assert(!["2.5", "3.5"].includes(storage.mount) || screws.driveMounts.includes(storage.mount), label + ": Schrauben für das Laufwerk fehlen");
  assert(storage.interface !== "SATA" || cables.provides.includes("sata"), label + ": SATA-Datenkabel fehlt");
  assert(cooler.kind === "custom" ? coolant.fluid === true : coolant.fluid === false, label + ": Kühlmittel passt nicht zum Kühlertyp");
}

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
