(() => {
  "use strict";

  const modes = Object.freeze({
    beginner: Object.freeze({
      label: "Einsteiger",
      description: "Bietet zwei vollständige, in sich kompatible Baupfade. Die erste Auswahl legt den Pfad fest."
    }),
    standard: Object.freeze({
      label: "Standard",
      description: "Zeigt den vollständigen Katalog mit den grundlegenden Kompatibilitätsprüfungen."
    }),
    expert: Object.freeze({
      label: "Experte",
      description: "Erweitert die Berechnung um Power-Limits, Dauerlast, Lautstärkeziel und Custom-Loop-Prüfung."
    })
  });

  const defaults = Object.freeze({
    mode: "standard",
    cpuTuning: 0,
    gpuTuning: 0,
    coolingProfile: "sustained",
    leakTest: false
  });

  const beginnerVariants = Object.freeze({
    a: Object.freeze({ label: "Pfad A", description: "Erweiterbarer ATX-Tower mit offenem Wasserkreislauf" }),
    b: Object.freeze({ label: "Pfad B", description: "Kompakter Mini-ITX-PC mit geschlossener Wasserkühlung" })
  });

  const allowedTuning = [0, 10, 20];
  const coolingFactors = Object.freeze({ performance: 1, sustained: 1.1, quiet: 1.2 });

  function sanitize(value = {}) {
    return {
      mode: modes[value.mode] ? value.mode : defaults.mode,
      cpuTuning: allowedTuning.includes(Number(value.cpuTuning)) ? Number(value.cpuTuning) : defaults.cpuTuning,
      gpuTuning: allowedTuning.includes(Number(value.gpuTuning)) ? Number(value.gpuTuning) : defaults.gpuTuning,
      coolingProfile: coolingFactors[value.coolingProfile] ? value.coolingProfile : defaults.coolingProfile,
      leakTest: value.leakTest === true
    };
  }

  function activeTuning(settings) {
    const clean = sanitize(settings);
    return clean.mode === "expert" ? clean : { ...clean, cpuTuning: 0, gpuTuning: 0 };
  }

  function power(cpu, gpu, settings) {
    const active = activeTuning(settings);
    const cpuLoad = Math.round((cpu?.power || 0) * (1 + active.cpuTuning / 100));
    const gpuLoad = Math.round((gpu?.power || 0) * (1 + active.gpuTuning / 100));
    const load = cpuLoad + gpuLoad + ((cpu || gpu) ? 110 : 0);
    return {
      cpuLoad,
      gpuLoad,
      load,
      recommended: load ? Math.ceil(load * 1.3 / 50) * 50 : 0
    };
  }

  function cooling(cpu, settings) {
    if (!cpu) return 0;
    const active = activeTuning(settings);
    const profileFactor = active.mode === "expert" ? coolingFactors[active.coolingProfile] : 1;
    return Math.ceil(cpu.power * (1 + active.cpuTuning / 100) * profileFactor);
  }

  function visibleItems(items, selectedId, settings) {
    const clean = sanitize(settings);
    if (clean.mode !== "beginner") return items;
    return items.filter(item => beginnerVariants[item.beginnerVariant]);
  }

  function summary(settings) {
    const clean = sanitize(settings);
    if (clean.mode !== "expert") return modes[clean.mode].description;
    const profile = { performance: "maximale Lüfterleistung", sustained: "Dauerlast +10 %", quiet: "leise Kühlung +20 %" }[clean.coolingProfile];
    return `CPU-Power-Limit +${clean.cpuTuning} %, GPU-Power-Limit +${clean.gpuTuning} %, Kühlziel: ${profile}.`;
  }

  window.BuildBenchDifficulty = Object.freeze({ modes, defaults, beginnerVariants, sanitize, power, cooling, visibleItems, summary });
})();
