"use strict";

const { readFileSync } = require("node:fs");
const vm = require("node:vm");

const source = readFileSync("scorm.js", "utf8");
const values = {
  "cmi.core.lesson_status": "not attempted",
  "cmi.suspend_data": "",
  "cmi.core.entry": "ab-initio"
};
const calls = [];
const listeners = {};
const statusNode = { hidden: true, textContent: "" };
const classNames = new Set();
const storage = new Map();
const API = {
  LMSInitialize(value) { calls.push(["initialize", value]); return "true"; },
  LMSGetValue(name) { calls.push(["get", name]); return values[name] || ""; },
  LMSSetValue(name, value) { calls.push(["set", name, value]); values[name] = value; return "true"; },
  LMSCommit(value) { calls.push(["commit", value]); return "true"; },
  LMSFinish(value) { calls.push(["finish", value]); return "true"; }
};
const window = {
  API,
  opener: null,
  location: { pathname: "/course/index.html" },
  addEventListener(name, listener) { listeners[name] = listener; }
};
window.parent = window;

const context = {
  window,
  document: {
    body: { classList: { add(name) { classNames.add(name); } } },
    querySelector(selector) { return selector === "[data-lms-status]" ? statusNode : null; }
  },
  location: window.location,
  localStorage: {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, value); }
  },
  console,
  Date,
  JSON,
  Math,
  Number,
  Object,
  String,
  Array,
  RegExp,
  Set
};

vm.runInNewContext(source, context, { filename: "scorm.js" });
const lms = window.BuildBenchLMS;
if (!lms?.connected) throw new Error("SCORM-API wurde nicht initialisiert.");
if (statusNode.hidden || !classNames.has("lms-connected")) throw new Error("ILIAS-Status wird nicht angezeigt.");
if (storage.size !== 0) throw new Error("ILIAS-Fortschritt wurde zusätzlich im lokalen Browser gespeichert.");

lms.recordConfigurator({ selected: 12, total: 12, step: 12 });
lms.recordEvaluation({ scenario: "developer", score: 88, hasConfiguration: true });
lms.recordQuizProgress({
  answered: 2,
  total: 20,
  score: 1,
  session: { ids: ["q001", "q002"], choices: ["A", "B"] }
});
if (JSON.stringify(lms.getQuizSession()) !== JSON.stringify({ ids: ["q001", "q002"], choices: ["A", "B"] })) {
  throw new Error("Quiz-Wiederaufnahmedaten stimmen nicht.");
}
lms.recordQuizResult({ score: 17, maxScore: 20 });

if (values["cmi.core.lesson_status"] !== "passed") throw new Error("Bestehensstatus wurde nicht gesetzt.");
if (values["cmi.core.score.raw"] !== "85") throw new Error("Prozentwert wurde nicht gespeichert.");
if (values["cmi.core.lesson_location"] !== "quiz.html#ergebnis") throw new Error("Lernposition wurde nicht gespeichert.");
if (!values["cmi.suspend_data"] || values["cmi.suspend_data"].length > 4096) throw new Error("Suspend-Daten fehlen oder sind zu groß.");
listeners.pagehide();
if (!calls.some(call => call[0] === "finish")) throw new Error("SCORM-Sitzung wurde nicht beendet.");
if (!/^\d{4}:\d{2}:\d{2}\.\d{2}$/.test(values["cmi.core.session_time"])) throw new Error("Sitzungszeit ist ungültig.");

console.log(`SCORM-Integration bestanden (${calls.length} API-Aufrufe, ${values["cmi.suspend_data"].length} Bytes Suspend-Daten).`);
