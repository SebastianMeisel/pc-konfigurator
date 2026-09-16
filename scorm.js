(() => {
  "use strict";

  const LOCAL_KEY = "buildbench-lms-progress-v1";
  const PASS_SCORE = 70;
  const SUSPEND_DATA_LIMIT = 3900;
  const pageNames = {
    "index.html": "configurator",
    "evaluation.html": "evaluation",
    "quiz.html": "quiz"
  };
  const sessionStarted = Date.now();
  let api = null;
  let connected = false;
  let finished = false;

  function emptyState() {
    return {
      v: 1,
      pages: { configurator: 0, evaluation: 0, quiz: 0 },
      config: { selected: 0, total: 12, step: 1, mode: "standard", cpuTuning: 0, gpuTuning: 0, coolingProfile: "sustained" },
      evaluation: { scenario: "", score: 0, available: 0 },
      quiz: { answered: 0, total: 20, current: 0, best: 0, attempts: 0 },
      session: { ids: [], choices: [] },
      location: "index.html"
    };
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, number(value)));
  }

  function sanitizeState(value) {
    const source = value && typeof value === "object" ? value : {};
    const defaults = emptyState();
    const ids = Array.isArray(source.session?.ids)
      ? source.session.ids.filter(id => /^q\d{3,}$/.test(String(id))).slice(0, 100)
      : [];
    const choices = Array.isArray(source.session?.choices)
      ? source.session.choices.filter(choice => ["A", "B", "C", "D"].includes(choice)).slice(0, ids.length)
      : [];
    return {
      v: 1,
      pages: {
        configurator: source.pages?.configurator ? 1 : 0,
        evaluation: source.pages?.evaluation ? 1 : 0,
        quiz: source.pages?.quiz ? 1 : 0
      },
      config: {
        selected: clamp(source.config?.selected, 0, 12),
        total: clamp(source.config?.total || defaults.config.total, 1, 99),
        step: clamp(source.config?.step || defaults.config.step, 1, 99),
        mode: ["beginner","standard","expert"].includes(source.config?.mode) ? source.config.mode : defaults.config.mode,
        cpuTuning: [0,10,20].includes(number(source.config?.cpuTuning)) ? number(source.config.cpuTuning) : 0,
        gpuTuning: [0,10,20].includes(number(source.config?.gpuTuning)) ? number(source.config.gpuTuning) : 0,
        coolingProfile: ["performance","sustained","quiet"].includes(source.config?.coolingProfile) ? source.config.coolingProfile : defaults.config.coolingProfile
      },
      evaluation: {
        scenario: String(source.evaluation?.scenario || "").slice(0, 24),
        score: clamp(source.evaluation?.score, 0, 100),
        available: source.evaluation?.available ? 1 : 0
      },
      quiz: {
        answered: clamp(source.quiz?.answered, 0, 100),
        total: clamp(source.quiz?.total || defaults.quiz.total, 1, 100),
        current: clamp(source.quiz?.current, 0, 100),
        best: clamp(source.quiz?.best, 0, 100),
        attempts: clamp(source.quiz?.attempts, 0, 999)
      },
      session: { ids, choices },
      location: String(source.location || defaults.location).slice(0, 255)
    };
  }

  function readLocalState() {
    try {
      return sanitizeState(JSON.parse(localStorage.getItem(LOCAL_KEY)));
    } catch (_) {
      return emptyState();
    }
  }

  let state = emptyState();

  function findApi(start) {
    let current = start;
    for (let depth = 0; current && depth < 20; depth += 1) {
      try {
        if (current.API && typeof current.API.LMSInitialize === "function") return current.API;
        if (current.parent === current) break;
        current = current.parent;
      } catch (_) {
        break;
      }
    }
    return null;
  }

  function discoverApi() {
    const parentApi = findApi(window);
    if (parentApi) return parentApi;
    try {
      return window.opener ? findApi(window.opener) : null;
    } catch (_) {
      return null;
    }
  }

  function apiCall(method, argument = "") {
    if (!api || typeof api[method] !== "function") return null;
    try {
      return api[method](argument);
    } catch (error) {
      console.warn("SCORM-Aufruf fehlgeschlagen:", method, error);
      return null;
    }
  }

  function succeeded(result) {
    return result === true || String(result).toLowerCase() === "true";
  }

  function getValue(name) {
    const result = apiCall("LMSGetValue", name);
    return result === null ? "" : String(result);
  }

  function setScormValue(name, value) {
    if (!api || typeof api.LMSSetValue !== "function") return false;
    try {
      return succeeded(api.LMSSetValue(name, String(value)));
    } catch (error) {
      console.warn("SCORM-Wert konnte nicht gespeichert werden:", name, error);
      return false;
    }
  }

  function statusText() {
    if (state.quiz.attempts > 0 && state.quiz.best >= PASS_SCORE) return "passed";
    if (state.quiz.attempts > 0) return "failed";
    return "incomplete";
  }

  function serializeState() {
    let serialized = JSON.stringify(state);
    if (serialized.length > SUSPEND_DATA_LIMIT) {
      state.session = { ids: [], choices: [] };
      serialized = JSON.stringify(state);
    }
    return serialized;
  }

  function updateStatusBanner() {
    const banner = document.querySelector("[data-lms-status]");
    if (!banner || !connected) return;
    document.body.classList.add("lms-connected");
    banner.hidden = false;
    const score = state.quiz.attempts ? ` · bestes Quiz-Ergebnis ${state.quiz.best} %` : "";
    banner.textContent = `ILIAS-Lernfortschritt aktiv · automatisch gespeichert${score}`;
  }

  function persist(commit = true) {
    state = sanitizeState(state);
    if (!connected) {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
      } catch (_) {}
    } else {
      setScormValue("cmi.suspend_data", serializeState());
      setScormValue("cmi.core.lesson_location", state.location);
      setScormValue("cmi.core.lesson_status", statusText());
      if (state.quiz.attempts > 0) {
        setScormValue("cmi.core.score.min", "0");
        setScormValue("cmi.core.score.max", "100");
        setScormValue("cmi.core.score.raw", String(state.quiz.best));
      }
      if (commit) apiCall("LMSCommit", "");
    }
    updateStatusBanner();
  }

  function currentPage() {
    const filename = location.pathname.split("/").pop() || "index.html";
    return pageNames[filename] ? filename : "index.html";
  }

  function initialize() {
    api = discoverApi();
    if (api && succeeded(apiCall("LMSInitialize", ""))) {
      connected = true;
      const stored = getValue("cmi.suspend_data");
      if (stored) {
        try {
          state = sanitizeState(JSON.parse(stored));
        } catch (error) {
          console.warn("ILIAS-Fortschrittsdaten konnten nicht gelesen werden:", error);
        }
      } else {
        state = emptyState();
      }
      if (!getValue("cmi.core.lesson_status") || getValue("cmi.core.lesson_status") === "not attempted") {
        setScormValue("cmi.core.lesson_status", "incomplete");
      }
    } else {
      state = readLocalState();
    }
    const page = currentPage();
    state.pages[pageNames[page]] = 1;
    state.location = page;
    persist();
  }

  function recordConfigurator(details = {}) {
    state.config = {
      selected: clamp(details.selected, 0, 12),
      total: clamp(details.total || 12, 1, 99),
      step: clamp(details.step || 1, 1, 99),
      mode: ["beginner","standard","expert"].includes(details.mode) ? details.mode : "standard",
      cpuTuning: [0,10,20].includes(number(details.cpuTuning)) ? number(details.cpuTuning) : 0,
      gpuTuning: [0,10,20].includes(number(details.gpuTuning)) ? number(details.gpuTuning) : 0,
      coolingProfile: ["performance","sustained","quiet"].includes(details.coolingProfile) ? details.coolingProfile : "sustained"
    };
    state.location = `index.html#schritt-${state.config.step}`;
    persist();
  }

  function recordEvaluation(details = {}) {
    state.evaluation = {
      scenario: String(details.scenario || "").slice(0, 24),
      score: clamp(details.score, 0, 100),
      available: details.hasConfiguration ? 1 : 0
    };
    state.location = details.scenario ? `evaluation.html#${state.evaluation.scenario}` : "evaluation.html";
    persist();
  }

  function setQuizSession(session = {}) {
    state.session = sanitizeState({ ...state, session }).session;
  }

  function recordQuizProgress(details = {}) {
    if (details.session) setQuizSession(details.session);
    state.quiz.answered = clamp(details.answered, 0, 100);
    state.quiz.total = clamp(details.total || state.quiz.total, 1, 100);
    state.quiz.current = clamp(details.score, 0, state.quiz.total);
    state.location = `quiz.html#frage-${Math.min(state.quiz.answered + 1, state.quiz.total)}`;
    persist();
  }

  function recordQuizResult(details = {}) {
    const maximum = clamp(details.maxScore || state.quiz.total, 1, 100);
    const raw = clamp(details.score, 0, maximum);
    const percent = Math.round(raw / maximum * 100);
    state.quiz.answered = maximum;
    state.quiz.total = maximum;
    state.quiz.current = raw;
    state.quiz.best = Math.max(state.quiz.best, percent);
    state.quiz.attempts += 1;
    state.location = "quiz.html#ergebnis";
    persist();
  }

  function clearQuizSession() {
    state.session = { ids: [], choices: [] };
    state.quiz.answered = 0;
    state.quiz.current = 0;
    state.location = "quiz.html";
    persist();
  }

  function getQuizSession() {
    return {
      ids: [...state.session.ids],
      choices: [...state.session.choices]
    };
  }

  function sessionTime() {
    const seconds = Math.max(0, (Date.now() - sessionStarted) / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = (seconds % 60).toFixed(2).padStart(5, "0");
    return `${String(hours).padStart(4, "0")}:${String(minutes).padStart(2, "0")}:${rest}`;
  }

  function finish() {
    if (!connected || finished) return;
    finished = true;
    persist(false);
    setScormValue("cmi.core.session_time", sessionTime());
    setScormValue("cmi.core.exit", "suspend");
    apiCall("LMSCommit", "");
    apiCall("LMSFinish", "");
  }

  window.BuildBenchLMS = Object.freeze({
    get connected() { return connected; },
    getState: () => JSON.parse(JSON.stringify(state)),
    getQuizSession,
    recordConfigurator,
    recordEvaluation,
    recordQuizProgress,
    recordQuizResult,
    clearQuizSession,
    commit: () => persist()
  });

  window.addEventListener("pagehide", finish, { once: true });
  initialize();
})();
