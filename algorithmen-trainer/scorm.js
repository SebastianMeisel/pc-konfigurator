(() => {
  "use strict";
  const LOCAL_KEY = "algodesk-progress-v1";
  const TOTAL = { explored: 4, desk: 6, debug: 5 };
  let api = null, connected = false, finished = false;
  let state = { v: 1, explored: [], desk: [], debug: [], location: "index.html" };

  function uniqueStrings(value, maximum) { return Array.isArray(value) ? [...new Set(value.filter(item => typeof item === "string"))].slice(0, maximum) : []; }
  function sanitize(value) {
    return { v: 1, explored: uniqueStrings(value?.explored, TOTAL.explored), desk: uniqueStrings(value?.desk, TOTAL.desk), debug: uniqueStrings(value?.debug, TOTAL.debug), location: String(value?.location || "index.html").slice(0, 255) };
  }
  function findApi(start) {
    let current = start;
    for (let depth = 0; current && depth < 20; depth += 1) {
      try { if (current.API && typeof current.API.LMSInitialize === "function") return current.API; if (current.parent === current) break; current = current.parent; } catch (_) { break; }
    }
    return null;
  }
  function call(name, argument = "") { try { return api && typeof api[name] === "function" ? api[name](argument) : null; } catch (error) { console.warn("SCORM-Aufruf fehlgeschlagen:", name, error); return null; } }
  function success(value) { return value === true || String(value).toLowerCase() === "true"; }
  function percent() {
    const completed = state.explored.length + state.desk.length + state.debug.length;
    const total = TOTAL.explored + TOTAL.desk + TOTAL.debug;
    return Math.round(completed / total * 100);
  }
  function renderProgress() {
    const value = percent(), bar = document.querySelector("[role=progressbar]"), banner = document.querySelector("[data-lms-status]");
    const output = document.querySelector("#progress-percent"), fill = document.querySelector("#progress-fill"), detail = document.querySelector("#progress-detail");
    if (output) output.textContent = `${value} %`; if (fill) fill.style.width = `${value}%`; if (bar) { bar.setAttribute("aria-valuenow", value); bar.setAttribute("aria-valuetext", `${value} Prozent abgeschlossen`); }
    if (detail) detail.textContent = `${state.explored.length}/${TOTAL.explored} erkundet · ${state.desk.length}/${TOTAL.desk} Schreibtischtests · ${state.debug.length}/${TOTAL.debug} Fehlerfälle`;
    if (banner && connected) { banner.hidden = false; banner.textContent = `ILIAS-Lernfortschritt aktiv · automatisch gespeichert · ${value} %`; }
  }
  function persist() {
    state = sanitize(state); const score = percent();
    if (connected) {
      call("LMSSetValue", "cmi.suspend_data", JSON.stringify(state)); call("LMSSetValue", "cmi.core.lesson_location", state.location);
      call("LMSSetValue", "cmi.core.score.min", "0"); call("LMSSetValue", "cmi.core.score.max", "100"); call("LMSSetValue", "cmi.core.score.raw", String(score));
      call("LMSSetValue", "cmi.core.lesson_status", score >= 80 ? "passed" : "incomplete"); call("LMSCommit", "");
    } else { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch (_) {} }
    renderProgress();
  }
  function add(kind, id) { if (!state[kind].includes(id)) state[kind].push(id); state.location = `index.html#${kind === "explored" ? "erkunden" : kind === "desk" ? "schreibtischtest" : "fehlersuche"}`; persist(); }
  function initialize() {
    api = findApi(window);
    if (!api) { try { api = window.opener ? findApi(window.opener) : null; } catch (_) {} }
    if (api && success(call("LMSInitialize", ""))) {
      connected = true; const stored = call("LMSGetValue", "cmi.suspend_data");
      if (stored) { try { state = sanitize(JSON.parse(stored)); } catch (_) {} }
      const status = call("LMSGetValue", "cmi.core.lesson_status"); if (!status || status === "not attempted") call("LMSSetValue", "cmi.core.lesson_status", "incomplete");
    } else { try { state = sanitize(JSON.parse(localStorage.getItem(LOCAL_KEY))); } catch (_) {} }
    persist();
  }
  function finish() { if (finished) return; persist(); if (connected) call("LMSFinish", ""); finished = true; }
  window.AlgoDeskLMS = { recordExplored: id => add("explored", id), recordDesk: id => add("desk", id), recordDebug: id => add("debug", id), getState: () => JSON.parse(JSON.stringify(state)) };
  addEventListener("DOMContentLoaded", initialize, { once: true }); addEventListener("pagehide", finish, { once: true });
})();
