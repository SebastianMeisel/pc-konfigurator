"use strict";

const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

function element() {
  const listeners = {};
  return {
    hidden: false,
    disabled: false,
    open: false,
    textContent: "",
    innerHTML: "",
    className: "",
    style: { width: "", setProperty() {} },
    classList: { add() {}, toggle() {} },
    dataset: {},
    listeners,
    setAttribute(name, value) { this[name] = String(value); },
    addEventListener(name, listener) { listeners[name] = listener; },
    focus() {},
    scrollIntoView() {},
    querySelectorAll() { return []; }
  };
}

(async () => {
  const data = JSON.parse(readFileSync("quiz-questions.json", "utf8"));
  const ids = data.questions.slice(0, data.testSize).map(question => question.id);
  const elements = new Map([
    "answer-list", "submit-answer", "quiz-form", "next-question", "restart-quiz",
    "progress-text", "score-text", "progress-fill", "progress-track", "question-number",
    "question-category", "question-heading", "hint-text", "question-hint", "feedback",
    "quiz-panel", "result-panel", "result-score", "result-summary", "result-ring",
    "category-results", "recommendation", "review-list", "result-title",
    "pool-test-size", "pool-size", "hero-test-size", "hero-pool-size", "result-total"
  ].map(id => [id, element()]));
  const progressCalls = [];
  let resultCalls = 0;
  let cleared = 0;
  const document = {
    querySelector(selector) {
      if (selector.startsWith("#")) return elements.get(selector.slice(1));
      if (selector === 'input[name="answer"]:checked') return null;
      return null;
    },
    querySelectorAll() { return []; }
  };
  const window = {
    matchMedia() { return { matches: true }; },
    BuildBenchLMS: {
      getQuizSession() { return { ids, choices: ["A", "B"] }; },
      recordQuizProgress(value) { progressCalls.push(value); },
      recordQuizResult() { resultCalls += 1; },
      clearQuizSession() { cleared += 1; }
    }
  };
  const context = {
    window,
    document,
    fetch: async () => ({ ok: true, json: async () => data }),
    console,
    crypto: webcrypto,
    Uint32Array,
    Math,
    Map,
    Set,
    Array,
    Number,
    String,
    JSON,
    Promise
  };
  context.globalThis = context;
  vm.runInNewContext(readFileSync("quiz.js", "utf8"), context, { filename: "quiz.js" });
  await new Promise(resolve => setImmediate(resolve));

  if (elements.get("progress-text").textContent !== "Frage 3 von 20") {
    throw new Error("Ein begonnenes Quiz wird nicht bei Frage 3 fortgesetzt.");
  }
  if (progressCalls.at(-1)?.answered !== 2 || progressCalls.at(-1)?.session?.ids.length !== 20) {
    throw new Error("Der wiederaufgenommene Quizstand wird nicht korrekt gemeldet.");
  }
  if (resultCalls !== 0) throw new Error("Ein Teilstand wurde fälschlich als Ergebnis gemeldet.");

  elements.get("restart-quiz").listeners.click();
  if (cleared !== 1 || progressCalls.at(-1)?.answered !== 0) {
    throw new Error("Ein neuer Test löscht den alten Wiederaufnahmestand nicht.");
  }
  console.log("Quiz-Wiederaufnahme bestanden (2 Antworten wiederhergestellt, Neustart geprüft).");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
