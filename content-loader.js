(() => {
  "use strict";

  const sources = Object.freeze({
    components: "content/components.json",
    lessons: "content/lessons.json",
    network: "content/network.json",
    compatibility: "content/compatibility-rules.json"
  });

  const unique = (values, label) => {
    if (new Set(values).size !== values.length) throw new Error("Doppelte IDs in " + label + ".");
  };

  function validate(components, lessons, network, compatibility) {
    if (components?.schemaVersion !== 1 || lessons?.schemaVersion !== 1 || network?.schemaVersion !== 1 || compatibility?.schemaVersion !== 1) {
      throw new Error("Nicht unterstützte Version der Inhaltsdaten.");
    }
    if (!Array.isArray(components.categories) || !components.categories.length || !components.components) {
      throw new Error("Der Komponentenkatalog ist unvollständig.");
    }
    unique(components.categories.map(category => category.id), "Kategorien");
    for (const category of components.categories) {
      const items = components.components[category.id];
      if (!Array.isArray(items) || !items.length) {
        throw new Error("Komponenten für " + category.id + " fehlen.");
      }
      unique(items.map(item => item.id), "Komponenten/" + category.id);
    }
    if (!Array.isArray(lessons.lessons) || !lessons.lessons.length) {
      throw new Error("Lernkarten fehlen.");
    }
    unique(lessons.lessons.map(lesson => lesson.id), "Lernkarten");
    if (!Array.isArray(network.groups) || !network.boards) {
      throw new Error("Netzwerkdaten fehlen.");
    }
    unique(network.groups.map(group => group.id), "Netzwerkgruppen");
    for (const group of network.groups) {
      if (!Array.isArray(group.options) || !group.options.some(option => option.id === "onboard")) {
        throw new Error("Onboard-Option für " + group.id + " fehlt.");
      }
      unique(group.options.map(option => option.id), "Netzwerk/" + group.id);
    }
    if (!Array.isArray(compatibility.rules) || !compatibility.rules.length) {
      throw new Error("Kompatibilitätsregeln fehlen.");
    }
    unique(compatibility.rules.map(rule => rule.code), "Kompatibilitätsregeln");
    for (const rule of compatibility.rules) {
      if (![rule.code, rule.title, rule.consequence, rule.remedy, rule.learningHint].every(value => typeof value === "string" && value.trim())) {
        throw new Error("Kompatibilitätsregel " + (rule.code || "ohne Code") + " ist unvollständig.");
      }
    }
    return { components, lessons, network, compatibility };
  }

  async function loadJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(url + " konnte nicht geladen werden (HTTP " + response.status + ").");
    }
    return response.json();
  }

  const ready = Promise.all(Object.values(sources).map(loadJson))
    .then(([components, lessons, network, compatibility]) => validate(components, lessons, network, compatibility));

  ready.catch(error => {
    console.error("BuildBench-Inhalte konnten nicht geladen werden:", error);
    const message = "Inhaltsdaten konnten nicht geladen werden. Bitte die App über einen Webserver starten und die JSON-Dateien prüfen.";
    for (const selector of ["#component-grid", "#network-options"]) {
      const node = document.querySelector(selector);
      if (node) {
        node.textContent = message;
        node.setAttribute("role", "alert");
      }
    }
  });

  window.BuildBenchContent = Object.freeze({ ready, sources });
})();
