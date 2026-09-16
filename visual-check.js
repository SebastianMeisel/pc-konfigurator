"use strict";

const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const window = {};
vm.runInNewContext(readFileSync("visual-model.js", "utf8"), { window, Object, Math }, { filename: "visual-model.js" });
const model = window.BuildBenchVisualModel;
const failures = [];
let checks = 0;
const assert = (condition, message) => { checks += 1; if (!condition) failures.push(message); };

const atx = model.layout("Midi-Tower", "ATX", 242);
const matx = model.layout("Micro-Tower", "mATX", 304);
const itx = model.layout("Mini-ITX", "ITX", 304);

assert(atx.boardWidth === 312 && atx.boardHeight === 390, "ATX-Abmessungen sind falsch skaliert");
assert(matx.boardWidth === matx.boardHeight && matx.boardWidth === 312, "mATX muss quadratisch skaliert werden");
assert(itx.boardWidth === itx.boardHeight && itx.boardWidth === 218, "ITX muss quadratisch skaliert werden");
assert(atx.gpuWidth === 310, "GPU und ATX-Mainboard verwenden keinen gemeinsamen Maßstab");
assert(itx.gpuWidth <= itx.caseWidth - 84, "GPU überschreitet die innere Gehäusebreite");
assert(itx.boardWidth / itx.gpuWidth >= 0.7, "ITX-Mainboard erscheint im Verhältnis zur GPU zu klein");
assert([atx, matx, itx].every(item => item.boardWidth < item.caseWidth - 70), "Mainboard überschreitet die Gehäusebreite");

if (failures.length) {
  console.error("Prüfung der Innenansicht fehlgeschlagen:");
  failures.forEach(failure => console.error("- " + failure));
  process.exit(1);
}
console.log(`Prüfung der Innenansicht bestanden (${checks} Prüfungen).`);
