"use strict";

const $ = selector => document.querySelector(selector);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let algorithms = [];
let complexityGuide = null;
let exercises = { deskTests: [], debugChallenges: [], helpCards: [] };
let activeTrace = [];
let activeStep = -1;
let deskTrace = [];
let deskStep = 0;
let deskMistakes = 0;
let autoTimer = null;

function byId(id) { return algorithms.find(item => item.id === id); }
function clone(values) { return [...values]; }
function step(line, array, vars, action, marks = {}) {
  return { line, array: clone(array), vars: { ...vars }, action, active: marks.active || [], compare: marks.compare || [], done: marks.done || [] };
}
function variablesText(vars) {
  return Object.entries(vars).map(([key, value]) => `${key}=${value}`).join(", ") || "–";
}

function binaryTrace(input, target) {
  const a = clone(input).sort((x, y) => x - y), trace = [];
  trace.push(step(1, a, { gesucht: target }, "Funktion mit sortierter Liste aufrufen."));
  let left = 0;
  trace.push(step(2, a, { links: left, gesucht: target }, "Linke Intervallgrenze setzen.", { active: [left] }));
  let right = a.length - 1;
  trace.push(step(3, a, { links: left, rechts: right, gesucht: target }, "Rechte Intervallgrenze setzen.", { active: [left, right] }));
  while (left <= right) {
    trace.push(step(4, a, { links: left, rechts: right, gesucht: target }, `${left} ≤ ${right} ist wahr: Das Suchintervall ist nicht leer.`, { active: [left, right] }));
    const middle = Math.floor((left + right) / 2);
    trace.push(step(5, a, { links: left, rechts: right, mitte: middle, gesucht: target }, `Mitte des Intervalls ist Index ${middle}.`, { active: [middle] }));
    if (a[middle] === target) {
      trace.push(step(6, a, { links: left, rechts: right, mitte: middle, gesucht: target }, `A[${middle}] ist ${target}: Treffer gefunden.`, { active: [middle], done: [middle] }));
      return trace;
    }
    trace.push(step(6, a, { links: left, rechts: right, mitte: middle, gesucht: target }, `A[${middle}] = ${a[middle]} ist nicht ${target}.`, { compare: [middle] }));
    if (a[middle] < target) {
      trace.push(step(7, a, { links: left, rechts: right, mitte: middle, gesucht: target }, `${a[middle]} < ${target}: rechts von mitte weitersuchen.`, { compare: [middle] }));
      left = middle + 1;
      trace.push(step(8, a, { links: left, rechts: right, mitte: middle, gesucht: target }, `Index ${middle} und alle kleineren Indizes ausschließen.`, { active: left <= right ? [left, right] : [] }));
    } else {
      trace.push(step(7, a, { links: left, rechts: right, mitte: middle, gesucht: target }, `${a[middle]} < ${target} ist falsch.`, { compare: [middle] }));
      trace.push(step(9, a, { links: left, rechts: right, mitte: middle, gesucht: target }, "Der gesuchte Wert kann nur links von mitte liegen.", { compare: [middle] }));
      right = middle - 1;
      trace.push(step(10, a, { links: left, rechts: right, mitte: middle, gesucht: target }, `Index ${middle} und alle größeren Indizes ausschließen.`, { active: left <= right ? [left, right] : [] }));
    }
  }
  trace.push(step(4, a, { links: left, rechts: right, gesucht: target }, `${left} ≤ ${right} ist falsch: Das Suchintervall ist leer.`));
  trace.push(step(11, a, { links: left, rechts: right, gesucht: target, ergebnis: -1 }, "Der Wert ist nicht enthalten; -1 zurückgeben."));
  return trace;
}

function bubbleTrace(input) {
  const a = clone(input), trace = [step(1, a, {}, "Prozedur aufrufen.")], n = a.length;
  for (let end = n - 1; end >= 1; end -= 1) {
    trace.push(step(2, a, { ende: end }, `Neuer Durchlauf bis Index ${end}.`, { active: [end] }));
    let swapped = false;
    trace.push(step(3, a, { ende: end, getauscht: "FALSCH" }, "Tausch-Merker zurücksetzen."));
    for (let i = 0; i <= end - 1; i += 1) {
      trace.push(step(4, a, { ende: end, i, getauscht: swapped ? "WAHR" : "FALSCH" }, `Nachbarpaar an Index ${i} und ${i + 1} wählen.`, { compare: [i, i + 1] }));
      trace.push(step(5, a, { ende: end, i, getauscht: swapped ? "WAHR" : "FALSCH" }, `${a[i]} > ${a[i + 1]} ist ${a[i] > a[i + 1] ? "wahr" : "falsch"}.`, { compare: [i, i + 1] }));
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swapped = true;
        trace.push(step(6, a, { ende: end, i, getauscht: "FALSCH" }, "Benachbarte Werte tauschen.", { active: [i, i + 1] }));
        trace.push(step(7, a, { ende: end, i, getauscht: "WAHR" }, "Tausch-Merker setzen.", { active: [i, i + 1] }));
      }
    }
    trace.push(step(8, a, { ende: end, getauscht: swapped ? "WAHR" : "FALSCH" }, swapped ? "Es gab einen Tausch; ein weiterer Durchlauf ist nötig." : "Kein Tausch: Die Liste ist bereits sortiert.", { done: Array.from({ length: n - end }, (_, k) => end + k) }));
    if (!swapped) break;
  }
  trace.push(step(9, a, { ergebnis: "sortiert" }, "Sortierte Liste zurückgeben.", { done: a.map((_, i) => i) }));
  return trace;
}

function insertionTrace(input) {
  const a = clone(input), trace = [step(1, a, {}, "Prozedur aufrufen.")];
  for (let i = 1; i < a.length; i += 1) {
    trace.push(step(2, a, { i }, `Element an Index ${i} in den sortierten linken Bereich einfügen.`, { active: [i], done: Array.from({ length: i }, (_, k) => k) }));
    const value = a[i];
    trace.push(step(3, a, { i, wert: value }, `Einzufügenden Wert ${value} sichern.`, { active: [i] }));
    let j = i - 1;
    trace.push(step(4, a, { i, j, wert: value }, `Vergleich links bei Index ${j} beginnen.`, { compare: [j, i] }));
    while (j >= 0 && a[j] > value) {
      trace.push(step(5, a, { i, j, wert: value }, `${a[j]} > ${value}: Wert muss nach rechts.`, { compare: [j, j + 1] }));
      a[j + 1] = a[j];
      trace.push(step(6, a, { i, j, wert: value }, `${a[j]} um eine Position nach rechts verschieben.`, { active: [j, j + 1] }));
      j -= 1;
      trace.push(step(7, a, { i, j, wert: value }, `Vergleichsindex auf ${j} verringern.`, { active: j >= 0 ? [j] : [] }));
    }
    trace.push(step(5, a, { i, j, wert: value }, j < 0 ? "Linker Rand erreicht." : `${a[j]} > ${value} ist falsch.`, { compare: j >= 0 ? [j] : [] }));
    a[j + 1] = value;
    trace.push(step(8, a, { i, j, wert: value }, `${value} an Index ${j + 1} einsetzen.`, { active: [j + 1], done: Array.from({ length: i + 1 }, (_, k) => k) }));
  }
  trace.push(step(9, a, { ergebnis: "sortiert" }, "Sortierte Liste zurückgeben.", { done: a.map((_, i) => i) }));
  return trace;
}

function selectionTrace(input) {
  const a = clone(input), trace = [step(1, a, {}, "Prozedur aufrufen.")];
  for (let left = 0; left <= a.length - 2; left += 1) {
    trace.push(step(2, a, { links: left }, `Unsortierter Bereich beginnt bei Index ${left}.`, { active: [left], done: Array.from({ length: left }, (_, k) => k) }));
    let min = left;
    trace.push(step(3, a, { links: left, min }, `A[${left}] = ${a[left]} ist zunächst das kleinste bekannte Element.`, { active: [min] }));
    for (let i = left + 1; i < a.length; i += 1) {
      trace.push(step(4, a, { links: left, min, i }, `A[${i}] mit aktuellem Minimum A[${min}] vergleichen.`, { compare: [i, min] }));
      trace.push(step(5, a, { links: left, min, i }, `${a[i]} < ${a[min]} ist ${a[i] < a[min] ? "wahr" : "falsch"}.`, { compare: [i, min] }));
      if (a[i] < a[min]) {
        min = i;
        trace.push(step(6, a, { links: left, min, i }, `Neues Minimum an Index ${min} merken.`, { active: [min] }));
      }
    }
    trace.push(step(7, a, { links: left, min }, min !== left ? "Minimum liegt noch nicht an der linken Grenze." : "Minimum steht bereits richtig.", { compare: [left, min] }));
    if (min !== left) {
      [a[left], a[min]] = [a[min], a[left]];
      trace.push(step(8, a, { links: left, min }, `Werte an Index ${left} und ${min} tauschen.`, { active: [left, min], done: Array.from({ length: left + 1 }, (_, k) => k) }));
    }
  }
  trace.push(step(9, a, { ergebnis: "sortiert" }, "Sortierte Liste zurückgeben.", { done: a.map((_, i) => i) }));
  return trace;
}

function createTrace(id, values, target) {
  if (id === "binary-search") return binaryTrace(values, target);
  if (id === "bubble-sort") return bubbleTrace(values);
  if (id === "insertion-sort") return insertionTrace(values);
  if (id === "selection-sort") return selectionTrace(values);
  throw new Error("Unbekannter Algorithmus.");
}

function parseValues() {
  const parts = $("#values-input").value.split(",").map(value => value.trim()).filter(Boolean);
  if (!parts.length || parts.length > 12 || parts.some(value => !/^-?\d+$/.test(value))) throw new Error("Gib 1 bis 12 ganze Zahlen ein, getrennt durch Kommas.");
  return parts.map(Number);
}

function renderCode(algorithm) {
  const list = $("#pseudocode"); list.replaceChildren();
  algorithm.lines.forEach(line => { const item = document.createElement("li"); item.textContent = line; list.append(item); });
  $("#complexity-badge").textContent = `Ø ${algorithm.complexity.average} · Speicher ${algorithm.complexity.memory}`;
  const details = $("#algorithm-details"); details.replaceChildren();
  const summary = document.createElement("p"); summary.className = "lead-explanation"; summary.textContent = algorithm.plainExplanation; details.append(summary);
  const requirement = document.createElement("p"); requirement.className = "requirement-note"; const requirementTitle = document.createElement("strong"); requirementTitle.textContent = "Wichtige Voraussetzung: "; requirement.append(requirementTitle, document.createTextNode(algorithm.requirement)); details.append(requirement);

  const stepsTitle = document.createElement("h4"); stepsTitle.textContent = "Ablauf in fünf einfachen Schritten"; details.append(stepsTitle);
  const steps = document.createElement("ol"); steps.className = "plain-steps"; algorithm.steps.forEach(text => { const item = document.createElement("li"); item.textContent = text; steps.append(item); }); details.append(steps);

  const example = document.createElement("div"); example.className = "worked-example";
  const exampleTitle = document.createElement("h4"); exampleTitle.textContent = "Kurzes Beispiel";
  const exampleInput = document.createElement("code"); exampleInput.textContent = algorithm.example.input;
  const exampleText = document.createElement("p"); exampleText.textContent = algorithm.example.text; example.append(exampleTitle, exampleInput, exampleText); details.append(example);

  const prosAndCons = document.createElement("div"); prosAndCons.className = "pros-cons";
  [["Stärken", algorithm.strengths], ["Grenzen", algorithm.limits]].forEach(([title, entries]) => { const section = document.createElement("section"), heading = document.createElement("h4"), bullets = document.createElement("ul"); heading.textContent = title; entries.forEach(text => { const item = document.createElement("li"); item.textContent = text; bullets.append(item); }); section.append(heading, bullets); prosAndCons.append(section); }); details.append(prosAndCons);

  const properties = document.createElement("p"); properties.className = "algorithm-properties"; properties.textContent = `Stabil: ${algorithm.properties.stable}. In-place: ${algorithm.properties.inPlace}.`; details.append(properties);
  const complexityTitle = document.createElement("h4"); complexityTitle.textContent = "Warum diese O-Bewertung gilt"; details.append(complexityTitle);
  const dl = document.createElement("dl"); dl.className = "property-list";
  [["Bester Fall", "best"], ["Mittlerer Fall", "average"], ["Schlechtester Fall", "worst"], ["Zusatzspeicher", "memory"]].forEach(([term, key]) => {
    const wrap = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd"), explanation = document.createElement("p"); dt.textContent = term; dd.textContent = algorithm.complexity[key]; explanation.textContent = algorithm.complexityExplanation[key]; wrap.append(dt, dd, explanation); dl.append(wrap);
  }); details.append(dl);
}

function renderComplexityGuide() {
  const introduction = $("#complexity-introduction"); introduction.replaceChildren();
  [complexityGuide.intro, complexityGuide.nMeaning, complexityGuide.important].forEach((text, index) => { const paragraph = document.createElement("p"); if (index === 2) paragraph.className = "requirement-note"; paragraph.textContent = text; introduction.append(paragraph); });
  const cases = $("#complexity-cases"); cases.replaceChildren(); complexityGuide.cases.forEach(entry => { const article = document.createElement("article"), heading = document.createElement("h3"), text = document.createElement("p"); heading.textContent = entry.name; text.textContent = entry.text; article.append(heading, text); cases.append(article); });
  const growth = $("#complexity-growth"); growth.replaceChildren(); complexityGuide.growth.forEach(entry => { const row = document.createElement("tr"); [entry.notation, entry.name, entry.simple, entry.whenDoubles, entry.example].forEach((value, index) => { const cell = document.createElement(index === 0 ? "th" : "td"); if (index === 0) cell.scope = "row"; cell.textContent = value; row.append(cell); }); growth.append(row); });
  $("#complexity-number-example").textContent = complexityGuide.numberExample;
}

function renderState(item) {
  document.querySelectorAll("#pseudocode li").forEach((line, index) => line.classList.toggle("active", index + 1 === item.line));
  const array = $("#array-view"); array.replaceChildren();
  item.array.forEach((value, index) => {
    const cell = document.createElement("span"); cell.className = "array-cell";
    if (item.active.includes(index)) cell.classList.add("active");
    if (item.compare.includes(index)) cell.classList.add("compare");
    if (item.done.includes(index)) cell.classList.add("done");
    const number = document.createElement("span"), label = document.createElement("small"); number.textContent = value; label.textContent = `[${index}]`; cell.append(number, label); array.append(cell);
  });
  array.setAttribute("aria-label", `Feld: ${item.array.join(", ")}. ${item.action}`);
  const variables = $("#variables"); variables.replaceChildren();
  Object.entries(item.vars).forEach(([name, value]) => { const wrap = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = name; dd.textContent = value; wrap.append(dt, dd); variables.append(wrap); });
  $("#action-text").textContent = item.action;
  $("#step-counter").textContent = `Schritt ${activeStep + 1} von ${activeTrace.length}`;
  $("#previous-step").disabled = activeStep <= 0;
  $("#next-step").disabled = activeStep >= activeTrace.length - 1;
  if (activeStep === activeTrace.length - 1) window.AlgoDeskLMS?.recordExplored($("#algorithm-select").value);
}

function prepareRun() {
  try {
    const values = parseValues(), id = $("#algorithm-select").value, target = Number($("#target-input").value);
    if (id === "binary-search" && !Number.isFinite(target)) throw new Error("Gib einen ganzen Suchwert ein.");
    activeTrace = createTrace(id, values, target); activeStep = 0; stopAuto(); renderState(activeTrace[0]);
    $("#auto-run").disabled = activeTrace.length < 2;
    $("#load-error").hidden = true;
  } catch (error) { $("#load-error").textContent = error.message; $("#load-error").hidden = false; }
}
function stopAuto() { if (autoTimer) clearInterval(autoTimer); autoTimer = null; $("#auto-run").textContent = "Automatisch"; }
function toggleAuto() {
  if (autoTimer) { stopAuto(); return; }
  $("#auto-run").textContent = "Pause";
  autoTimer = setInterval(() => { if (activeStep >= activeTrace.length - 1) { stopAuto(); return; } activeStep += 1; renderState(activeTrace[activeStep]); }, reducedMotion ? 1200 : 750);
}

function algorithmChanged() {
  const algorithm = byId($("#algorithm-select").value); renderCode(algorithm);
  $("#target-label").hidden = algorithm.kind !== "search"; stopAuto(); activeTrace = []; activeStep = -1;
  $("#step-counter").textContent = "Schritt 0 von 0"; $("#previous-step").disabled = true; $("#next-step").disabled = true; $("#auto-run").disabled = true;
}

function deskExercise() { return exercises.deskTests.find(item => item.id === $("#desk-select").value); }
function startDesk() {
  const exercise = deskExercise(); deskTrace = createTrace(exercise.algorithm, exercise.values, exercise.target); deskStep = 0; deskMistakes = 0;
  $("#line-choice-fieldset").disabled = false;
  $("#desk-task-title").textContent = exercise.title; $("#desk-difficulty").textContent = exercise.difficulty;
  $("#desk-input").textContent = `A = [${exercise.values.join(", ")}]${exercise.target !== undefined ? ` · gesucht = ${exercise.target}` : ""}`;
  $("#desk-log").innerHTML = '<tr><td colspan="5">Noch kein Schritt protokolliert.</td></tr>';
  $("#desk-feedback").hidden = true; renderDeskChoices();
}
function choiceLines(correctLine, algorithm) {
  const available = algorithm.lines.map((_, index) => index + 1).filter(line => line !== correctLine);
  available.sort((a, b) => Math.abs(a - correctLine) - Math.abs(b - correctLine));
  return [correctLine, ...available.slice(0, 3)].sort((a, b) => ((a * 17 + deskStep * 7) % 13) - ((b * 17 + deskStep * 7) % 13));
}
function renderDeskChoices() {
  if (deskStep >= deskTrace.length) return;
  const item = deskTrace[deskStep], algorithm = byId(deskExercise().algorithm), container = $("#line-choices"); container.replaceChildren();
  choiceLines(item.line, algorithm).forEach(lineNumber => {
    const label = document.createElement("label"); label.className = "choice";
    const input = document.createElement("input"); input.type = "radio"; input.name = "desk-line"; input.value = lineNumber;
    const text = document.createElement("span"); text.textContent = `Zeile ${lineNumber}: ${algorithm.lines[lineNumber - 1].trim()}`; label.append(input, text); container.append(label);
  });
  $("#line-choice-legend").textContent = deskStep === 0 ? "Welche Zeile wird zuerst ausgeführt?" : "Welche Zeile wird als Nächstes ausgeführt?";
  $("#desk-position").textContent = `Schritt ${deskStep + 1} von ${deskTrace.length}`; $("#check-line").disabled = true;
}
function appendDeskRow(item) {
  const body = $("#desk-log"); if (deskStep === 0) body.replaceChildren();
  const row = document.createElement("tr");
  [deskStep + 1, item.line, `[${item.array.join(", ")}]`, variablesText(item.vars), item.action].forEach(value => { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); });
  body.append(row);
}
function checkDeskLine() {
  const selected = document.querySelector('input[name="desk-line"]:checked'); if (!selected) return;
  const expected = deskTrace[deskStep], feedback = $("#desk-feedback");
  if (Number(selected.value) !== expected.line) {
    deskMistakes += 1; feedback.className = "feedback wrong"; feedback.innerHTML = `<strong>Noch nicht.</strong> Prüfe Abbruchbedingungen und die zuletzt geänderten Variablen.`; feedback.hidden = false; return;
  }
  appendDeskRow(expected); deskStep += 1; feedback.className = "feedback";
  if (deskStep >= deskTrace.length) {
    feedback.innerHTML = `<strong>Schreibtischtest abgeschlossen.</strong> ${deskMistakes ? `Du hast ${deskMistakes} Fehlversuch${deskMistakes === 1 ? "" : "e"} korrigiert.` : "Alle Zeilen wurden direkt richtig bestimmt."}`;
    feedback.hidden = false; $("#line-choice-fieldset").disabled = true; $("#check-line").disabled = true; $("#desk-position").textContent = "Abgeschlossen"; window.AlgoDeskLMS?.recordDesk(deskExercise().id); return;
  }
  feedback.innerHTML = `<strong>Richtig.</strong> ${expected.action}`; feedback.hidden = false; renderDeskChoices();
}

function debugChallenge() { return exercises.debugChallenges.find(item => item.id === $("#debug-select").value); }
function renderDebug() {
  const challenge = debugChallenge(); $("#debug-task-title").textContent = challenge.title;
  $("#debug-input").textContent = `Testfall: A = [${challenge.values.join(", ")}]${challenge.target !== undefined ? ` · gesucht = ${challenge.target}` : ""}`;
  const code = $("#buggy-code"); code.replaceChildren(); challenge.buggyLines.forEach(line => { const li = document.createElement("li"); li.textContent = line; code.append(li); });
  $("#debug-question").textContent = challenge.question; const options = $("#debug-options"); options.replaceChildren();
  challenge.options.forEach(option => { const label = document.createElement("label"); label.className = "choice"; const input = document.createElement("input"); input.type = "radio"; input.name = "debug-answer"; input.value = option.id; const span = document.createElement("span"); span.textContent = option.text; label.append(input, span); options.append(label); });
  $("#debug-feedback").hidden = true; $("#check-debug").disabled = true;
}
function checkDebug(event) {
  event.preventDefault(); const challenge = debugChallenge(), selected = document.querySelector('input[name="debug-answer"]:checked'); if (!selected) return;
  const option = challenge.options.find(item => item.id === selected.value), feedback = $("#debug-feedback"); feedback.className = `feedback${option.correct ? "" : " wrong"}`;
  feedback.replaceChildren(); const strong = document.createElement("strong"); strong.textContent = option.correct ? "Fehler gefunden. " : "Noch nicht richtig. "; feedback.append(strong, document.createTextNode(option.correct ? challenge.explanation : "Führe den angegebenen Testfall Zeile für Zeile aus."));
  if (option.correct) { const evidence = document.createElement("p"); evidence.textContent = `Beleg aus dem Schreibtischtest: ${challenge.evidence}`; feedback.append(evidence); window.AlgoDeskLMS?.recordDebug(challenge.id); }
  feedback.hidden = false;
}

function openHelp(title) {
  const card = exercises.helpCards.find(item => item.title === title); if (!card) return;
  $("#help-dialog-title").textContent = card.title; $("#help-dialog-text").textContent = card.text; $("#help-dialog").showModal();
}
function populate() {
  algorithms.forEach(item => $("#algorithm-select").add(new Option(item.name, item.id)));
  exercises.deskTests.forEach(item => $("#desk-select").add(new Option(`${byId(item.algorithm).name}: ${item.title}`, item.id)));
  exercises.debugChallenges.forEach(item => $("#debug-select").add(new Option(`${byId(item.algorithm).name}: ${item.title}`, item.id)));
  const help = $("#help-grid"); exercises.helpCards.forEach(card => { const article = document.createElement("article"); article.className = "help-card"; const title = document.createElement("h3"), text = document.createElement("p"); title.textContent = card.title; text.textContent = card.text; article.append(title, text); help.append(article); });
  renderComplexityGuide(); algorithmChanged(); prepareRun(); startDesk(); renderDebug();
}
function validateData(algorithmData, exerciseData) {
  if (algorithmData?.schemaVersion !== 2 || !algorithmData.complexityGuide || !Array.isArray(algorithmData.algorithms) || algorithmData.algorithms.length < 2) throw new Error("Die Algorithmusdaten sind ungültig.");
  const ids = new Set(); algorithmData.algorithms.forEach(item => { if (!item.id || ids.has(item.id) || !Array.isArray(item.lines) || !item.lines.length || !item.plainExplanation || !Array.isArray(item.steps) || !item.complexityExplanation) throw new Error("Algorithmus-ID, Pseudocode oder Erläuterung ungültig."); ids.add(item.id); });
  if (exerciseData?.schemaVersion !== 1 || !Array.isArray(exerciseData.deskTests) || !Array.isArray(exerciseData.debugChallenges)) throw new Error("Die Übungsdaten sind ungültig.");
  [...exerciseData.deskTests, ...exerciseData.debugChallenges].forEach(item => { if (!ids.has(item.algorithm)) throw new Error(`Unbekannter Algorithmus in ${item.id}.`); });
}

$("#algorithm-select").addEventListener("change", algorithmChanged);
$("#prepare-run").addEventListener("click", prepareRun);
$("#previous-step").addEventListener("click", () => { stopAuto(); if (activeStep > 0) { activeStep -= 1; renderState(activeTrace[activeStep]); } });
$("#next-step").addEventListener("click", () => { stopAuto(); if (activeStep < activeTrace.length - 1) { activeStep += 1; renderState(activeTrace[activeStep]); } });
$("#auto-run").addEventListener("click", toggleAuto);
$("#desk-select").addEventListener("change", startDesk);
$("#restart-desk").addEventListener("click", startDesk);
$("#line-choices").addEventListener("change", () => { $("#check-line").disabled = false; });
$("#check-line").addEventListener("click", checkDeskLine);
$("#desk-hint").addEventListener("click", () => { const item = deskTrace[deskStep]; $("#desk-feedback").className = "feedback"; $("#desk-feedback").textContent = `Hinweis: ${item.action}`; $("#desk-feedback").hidden = false; });
$("#debug-select").addEventListener("change", renderDebug);
$("#debug-options").addEventListener("change", () => { $("#check-debug").disabled = false; });
$("#debug-form").addEventListener("submit", checkDebug);
document.querySelectorAll("[data-help]").forEach(button => button.addEventListener("click", () => openHelp(button.dataset.help)));
addEventListener("pagehide", stopAuto);

Promise.all([
  fetch("content/algorithms.json", { cache: "no-cache" }).then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }),
  fetch("content/exercises.json", { cache: "no-cache" }).then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
]).then(([algorithmData, exerciseData]) => { validateData(algorithmData, exerciseData); algorithms = algorithmData.algorithms; complexityGuide = algorithmData.complexityGuide; exercises = exerciseData; populate(); })
  .catch(error => { console.error(error); $("#load-error").textContent = "Die Lerninhalte konnten nicht geladen werden. Starte die Anwendung über einen Webserver und prüfe die JSON-Dateien."; $("#load-error").hidden = false; });
