"use strict";

const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const window = {};
vm.runInNewContext(readFileSync("difficulty.js", "utf8"), { window, Object, Array, Number, Math }, { filename: "difficulty.js" });
const model = window.BuildBenchDifficulty;
const failures = [];
let checks = 0;
const assert = (condition, message) => { checks += 1; if (!condition) failures.push(message); };

assert(Object.keys(model.modes).length === 3, "Drei Schwierigkeitsgrade werden erwartet");
assert(model.sanitize({ mode: "unbekannt", cpuTuning: 99 }).mode === "standard", "Ungültiger Modus wird nicht abgefangen");
assert(model.sanitize({ mode: "expert", cpuTuning: 10, gpuTuning: 20 }).gpuTuning === 20, "Gültiges Tuning geht verloren");

const items = [{ id: "a", recommended: true }, { id: "b", beginnerContrast: true }, { id: "c" }];
assert(model.visibleItems(items, null, { mode: "beginner" }).length === 2, "Einsteigermodus zeigt nicht Empfehlung und Lernkontrast");
assert(model.visibleItems(items, "c", { mode: "beginner" }).length === 3, "Bestehende Auswahl wird im Einsteigermodus verborgen");
assert(model.visibleItems(items, null, { mode: "standard" }).length === 3, "Standardmodus zeigt nicht alle Varianten");

const base = model.power({ power: 100 }, { power: 200 }, { mode: "standard" });
const expert = model.power({ power: 100 }, { power: 200 }, { mode: "expert", cpuTuning: 20, gpuTuning: 10 });
assert(base.load === 410, "Grundlast ist falsch");
assert(expert.load === 450 && expert.recommended > base.recommended, "Power-Limits werden nicht berücksichtigt");
assert(model.cooling({ power: 200 }, { mode: "expert", coolingProfile: "quiet" }) > model.cooling({ power: 200 }, { mode: "expert", coolingProfile: "performance" }), "Kühlprofil verändert den Kühlbedarf nicht");

if (failures.length) {
  console.error("Schwierigkeitsprüfung fehlgeschlagen:");
  failures.forEach(failure => console.error("- " + failure));
  process.exit(1);
}
console.log(`Schwierigkeitsprüfung bestanden (${checks} Prüfungen).`);
