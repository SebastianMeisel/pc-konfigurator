(async () => {
  "use strict";

  await window.BuildBenchSVG?.ready;

  const content = await window.BuildBenchContent?.ready;
  if (!content) throw new Error("BuildBenchContent ist nicht verfügbar.");
  const difficultyModel = window.BuildBenchDifficulty;
  if (!difficultyModel) throw new Error("BuildBenchDifficulty ist nicht verfügbar.");
  const { categories, components: data } = content.components;
  const ruleCatalog = Object.fromEntries(content.compatibility.rules.map(rule => [rule.code, rule]));

  const state = {
    active: 0,
    selections: Object.fromEntries(categories.map(c => [c.id, null])),
    difficulty: difficultyModel.sanitize()
  };

  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const scrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const refs = {
    nav: $("#category-nav"), grid: $("#component-grid"), kicker: $("#category-kicker"),
    title: $("#category-title"), description: $("#category-description"), count: $("#selection-count"),
    note: $("#context-note"), previous: $("#previous-button"), next: $("#next-button"),
    progress: $("#progress-label"), power: $("#power-label"), price: $("#price-label"),
    diagnostics: $("#diagnostics-list"), health: $("#health-badge"), build: $("#build-list"),
    svg: $("#pc-view"), viewLegend: $("#view-legend"), buildName: $("#build-name"),
    reset: $("#reset-button"), example: $("#example-button"), copy: $("#copy-button"), toast: $("#toast"),
    compatibilityDialog: $("#compatibility-dialog"), compatibilityTitle: $("#compatibility-dialog-title"),
    compatibilityIntro: $("#compatibility-dialog-intro"), compatibilityContent: $("#compatibility-dialog-content"),
    difficultySummary: $("#difficulty-summary"), expertControls: $("#expert-controls"),
    cpuTuning: $("#cpu-tuning"), gpuTuning: $("#gpu-tuning"), coolingProfile: $("#cooling-profile"), leakTest: $("#leak-test")
  };
  let compatibilityTrigger = null;

  const money = value => value === 0 ? "enthalten" : new Intl.NumberFormat("de-DE", { style:"currency", currency:"EUR", maximumFractionDigits:0 }).format(value);
  const selected = (category, selections = state.selections) => data[category].find(item => item.id === selections[category]) || null;
  const configWith = (category, id) => ({ ...state.selections, [category]: id });
  const requiredPower = selections => {
    const cpu = selected("cpu", selections), gpu = selected("gpu", selections);
    return difficultyModel.power(cpu, gpu, state.difficulty);
  };
  const requiredCooling = (selections = state.selections) => difficultyModel.cooling(selected("cpu", selections), state.difficulty);

  function issue(code, evidence) {
    const rule = ruleCatalog[code];
    if (!rule) throw new Error("Unbekannte Kompatibilitätsregel: " + code);
    return { ...rule, evidence };
  }

  function compatibility(category, item, selections = configWith(category, item.id)) {
    const issues = [];
    const c = selected("case", selections), board = selected("motherboard", selections);
    const cpu = selected("cpu", selections), gpu = selected("gpu", selections);
    const ram = selected("ram", selections), psu = selected("psu", selections);
    const cooler = selected("cooler", selections), storage = selected("storage", selections);
    const standoffs = selected("standoffs", selections);

    if (category === "case") {
      if (board && !item.form.includes(board.form)) issues.push(issue("CASE_BOARD_FORM", `Gewählt: ${board.form}-Mainboard. Das Gehäuse unterstützt: ${item.form.join(", ")}.`));
      if (gpu && gpu.length > item.maxGpu) issues.push(issue("CASE_GPU_LENGTH", `Grafikkarte: ${gpu.length} mm. Gehäusegrenze: ${item.maxGpu} mm. Differenz: ${gpu.length - item.maxGpu} mm.`));
      if (cooler?.kind === "air" && cooler.height > item.maxCooler) issues.push(issue("CASE_COOLER_HEIGHT", `Kühler: ${cooler.height} mm. Gehäusegrenze: ${item.maxCooler} mm. Differenz: ${cooler.height - item.maxCooler} mm.`));
      if (cooler && cooler.kind !== "air" && !item.radiators.includes(cooler.radiator)) issues.push(issue("CASE_RADIATOR_SIZE", `Radiator: ${cooler.radiator} mm. Unterstützt: ${item.radiators.join(", ")} mm.`));
      if (psu && !item.psu.includes(psu.form)) issues.push(issue("CASE_PSU_FORM", `Netzteil: ${psu.form}. Unterstützt: ${item.psu.join(", ")}.`));
      if (storage && !item.drives.includes(storage.mount)) issues.push(issue("CASE_DRIVE_MOUNT", `Laufwerk: ${storage.mount}. Vorhandene Plätze: ${item.drives.join(", ") || "keine"}.`));
    }
    if (category === "motherboard") {
      if (c && !c.form.includes(item.form)) issues.push(issue("BOARD_CASE_FORM", `Mainboard: ${item.form}. Das Gehäuse ${c.name} unterstützt: ${c.form.join(", ")}.`));
      if (cpu && cpu.socket !== item.socket) issues.push(issue("BOARD_CPU_SOCKET", `CPU-Sockel: ${cpu.socket}. Mainboard-Sockel: ${item.socket}.`));
      if (ram && ram.type !== item.memory) issues.push(issue("BOARD_RAM_TYPE", `Arbeitsspeicher: ${ram.type}. Mainboard: ${item.memory}.`));
      if (storage?.mount === "M.2" && item.m2 < 1) issues.push(issue("BOARD_M2_SLOT", `Ausgewählt ist eine M.2-SSD; das Mainboard hat ${item.m2} M.2-Steckplätze.`));
      if (storage?.interface === "SATA" && item.sata < 1) issues.push(issue("BOARD_SATA_PORT", `Ausgewählt ist ein SATA-Laufwerk; das Mainboard hat ${item.sata} SATA-Ports.`));
    }
    if (category === "cpu") {
      if (board && board.socket !== item.socket) issues.push(issue("CPU_BOARD_SOCKET", `CPU-Sockel: ${item.socket}. Mainboard-Sockel: ${board.socket}.`));
    }
    if (category === "gpu") {
      if (c && item.length > c.maxGpu) issues.push(issue("GPU_CASE_LENGTH", `Grafikkarte: ${item.length} mm. Gehäusegrenze: ${c.maxGpu} mm. Differenz: ${item.length - c.maxGpu} mm.`));
    }
    if (category === "ram") {
      if (board && board.memory !== item.type) issues.push(issue("RAM_BOARD_TYPE", `Arbeitsspeicher: ${item.type}. Mainboard: ${board.memory}.`));
    }
    if (category === "psu") {
      if (c && !c.psu.includes(item.form)) issues.push(issue("PSU_CASE_FORM", `Netzteil: ${item.form}. Das Gehäuse unterstützt: ${c.psu.join(", ")}.`));
      const need = requiredPower(selections).recommended;
      if (need && item.watts < need) issues.push(issue("PSU_POWER", `Netzteil: ${item.watts} W. Modellierte Empfehlung: mindestens ${need} W. Fehlende Reserve: ${need - item.watts} W.`));
    }
    if (category === "cooler") {
      if (cpu && !item.sockets.includes(cpu.socket)) issues.push(issue("COOLER_CPU_SOCKET", `CPU-Sockel: ${cpu.socket}. Kühlerfreigaben: ${item.sockets.join(", ")}.`));
      const coolingNeed = requiredCooling(selections);
      if (cpu && item.capacity < coolingNeed) issues.push(issue("COOLER_CAPACITY", `Modellierte Kühlerleistung: ${item.capacity} W. Erforderlich für CPU, Power-Limit und Kühlziel: ${coolingNeed} W. Fehlbetrag: ${coolingNeed - item.capacity} W.`));
      if (c && item.kind === "air" && item.height > c.maxCooler) issues.push(issue("COOLER_CASE_HEIGHT", `Kühler: ${item.height} mm. Gehäusegrenze: ${c.maxCooler} mm. Differenz: ${item.height - c.maxCooler} mm.`));
      if (c && item.kind !== "air" && !c.radiators.includes(item.radiator)) issues.push(issue("COOLER_RADIATOR_SIZE", `Radiator: ${item.radiator} mm. Im Gehäuse unterstützt: ${c.radiators.join(", ")} mm.`));
    }
    if (category === "storage") {
      if (board && item.mount === "M.2" && board.m2 < 1) issues.push(issue("STORAGE_BOARD_M2", `Speicher: ${item.mount}. Mainboard: ${board.m2} M.2-Steckplätze.`));
      if (board && item.interface === "SATA" && board.sata < 1) issues.push(issue("STORAGE_BOARD_SATA", `Speicherinterface: ${item.interface}. Mainboard: ${board.sata} SATA-Ports.`));
      if (c && !c.drives.includes(item.mount)) issues.push(issue("STORAGE_CASE_MOUNT", `Laufwerk: ${item.mount}. Das Gehäuse bietet: ${c.drives.join(", ") || "keine passenden Plätze"}.`));
    }
    if (category === "standoffs") {
      if (board && !item.forms.includes(board.form)) issues.push(issue("STANDOFF_BOARD_FORM", `Mainboard: ${board.form}. Satz vorgesehen für: ${item.forms.join(", ")}.`));
      if (board && item.count < board.standoff) issues.push(issue("STANDOFF_COUNT", `Vorhanden: ${item.count}. Erforderlich: ${board.standoff}. Es fehlen ${board.standoff - item.count}.`));
      if (c && item.thread !== c.thread) issues.push(issue("STANDOFF_THREAD", `Abstandhalter: ${item.thread}. Gehäusegewinde: ${c.thread}.`));
    }
    if (category === "screws") {
      if (standoffs && item.thread !== standoffs.thread) issues.push(issue("SCREW_STANDOFF_THREAD", `Schrauben: ${item.thread}. Abstandhalter: ${standoffs.thread}.`));
      if (board && item.count < board.standoff) issues.push(issue("SCREW_COUNT", `Vorhanden: ${item.count}. Erforderlich: ${board.standoff}. Es fehlen ${board.standoff - item.count}.`));
      if (storage && ["2.5","3.5"].includes(storage.mount) && !item.driveMounts.includes(storage.mount)) issues.push(issue("SCREW_DRIVE_MOUNT", `Laufwerk: ${storage.mount} Zoll. Schraubensatz unterstützt: ${item.driveMounts.join(", ") || "keine Laufwerke"}.`));
    }
    if (category === "cables") {
      if (storage?.interface === "SATA" && !item.provides.includes("sata")) issues.push(issue("CABLE_SATA_DATA", `Das gewählte SATA-Laufwerk benötigt ein Datenkabel; dieser Satz enthält keines.`));
      if (gpu?.connector === "12V-2x6" && !psu?.atx3 && !item.provides.includes("12V-2x6")) issues.push(issue("CABLE_GPU_POWER", `Grafikkarte: ${gpu.connector}. Netzteil ohne nativen ATX-3.x-Anschluss; der Kabelsatz enthält keinen passenden Adapter.`));
    }
    if (category === "coolant") {
      if (cooler?.kind === "custom" && !item.fluid) issues.push(issue("COOLANT_REQUIRED", `Ausgewählt ist ein offener Wasserkreislauf; die Option enthält ${item.volume || 0} Liter Kühlmittel.`));
      if (cooler && cooler.kind !== "custom" && item.fluid) issues.push(issue("COOLANT_UNNECESSARY", `Kühlertyp: ${cooler.kind === "air" ? "Luftkühler" : "geschlossene AIO"}. Gewählt: ${item.volume || 0} Liter separates Kühlmittel.`));
      if (!cooler && item.fluid) issues.push(issue("COOLANT_NEEDS_COOLER", `Gewählt: ${item.volume || 0} Liter Kühlmittel. Ein passender offener Wasserkreislauf ist noch nicht ausgewählt.`));
    }
    return issues;
  }

  function reconcile(changedCategory) {
    const removed = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const category of categories) {
        if (category.id === changedCategory || !state.selections[category.id]) continue;
        const item = selected(category.id);
        const issues = compatibility(category.id, item, state.selections);
        if (issues.length) {
          removed.push(`${category.label}: ${item.name} (${issues[0].title}: ${issues[0].evidence})`);
          state.selections[category.id] = null;
          changed = true;
        }
      }
    }
    if (removed.length) showToast(`Entfernt: ${removed.join(" · ")}`, 5200);
  }

  function save() {
    try { localStorage.setItem("buildbench-config-v1", JSON.stringify(state.selections)); } catch (_) {}
    try { localStorage.setItem("buildbench-difficulty-v1", JSON.stringify(state.difficulty)); } catch (_) {}
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem("buildbench-config-v1"));
      if (!saved) return;
      for (const category of categories) {
        if (data[category.id].some(item => item.id === saved[category.id])) state.selections[category.id] = saved[category.id];
      }
    } catch (_) {}
    try { state.difficulty = difficultyModel.sanitize(JSON.parse(localStorage.getItem("buildbench-difficulty-v1"))); }
    catch (_) { state.difficulty = difficultyModel.sanitize(); }
  }

  function renderNav() {
    refs.nav.innerHTML = categories.map((category, index) => {
      const item = selected(category.id);
      const problem = item && compatibility(category.id, item, state.selections).length;
      return `<button class="category-button ${index === state.active ? "active" : ""} ${item ? "complete" : ""} ${problem ? "problem" : ""}" data-index="${index}" data-lesson-id="${escapeHtml(category.lessonId)}" type="button" ${index === state.active ? 'aria-current="step"' : ""}>
        <span class="step-index">${String(index + 1).padStart(2,"0")}</span>
        <span class="category-label">${escapeHtml(category.label)}</span>
        <span class="category-state" aria-hidden="true">${problem ? "!" : item ? "✓" : "·"}</span>
      </button>`;
    }).join("");
    refs.nav.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
      const targetIndex = Number(button.dataset.index);
      state.active = targetIndex;
      render();
      refs.nav.querySelector(`[data-index="${targetIndex}"]`)?.focus();
    }));
  }

  function renderPicker() {
    const category = categories[state.active];
    const allItems = data[category.id];
    const items = difficultyModel.visibleItems(allItems, state.selections[category.id], state.difficulty);
    refs.kicker.textContent = `Schritt ${state.active + 1} von ${categories.length}`;
    refs.title.textContent = category.title;
    refs.description.textContent = category.description;
    const available = items.filter(item => compatibility(category.id, item).length === 0).length;
    refs.count.textContent = state.difficulty.mode === "beginner"
      ? `${available} geführte Option${available === 1 ? "" : "en"} · ${allItems.length} im Standardmodus`
      : `${available} von ${items.length} wählbar`;
    const generationHint = items.some(item => item.generation) ? "Vorgängermodelle sind als Lern- und Budgetoptionen markiert; Verfügbarkeit, Effizienz, Garantie und Firmware-Support gesondert bewerten." : "";
    const beginnerHint = state.difficulty.mode === "beginner" ? "Der Einsteigermodus zeigt die kuratierte Empfehlung; Lerninfo und Kompatibilitätsprüfung bleiben vollständig aktiv." : "";
    const context = [beginnerHint, contextMessage(category.id), generationHint].filter(Boolean).join(" ");
    refs.note.hidden = !context;
    refs.note.textContent = context || "";

    refs.grid.innerHTML = items.map(item => {
      const issues = compatibility(category.id, item);
      const isSelected = state.selections[category.id] === item.id;
      return `<button class="component-card ${isSelected ? "selected" : ""} ${issues.length ? "blocked" : ""} ${item.generation ? "legacy-card" : ""}"
          data-id="${escapeHtml(item.id)}" type="button" ${issues.length ? `aria-haspopup="dialog" aria-label="Nicht wählbar: ${escapeHtml(item.name)}. Kompatibilitätsdetails anzeigen"` : `aria-pressed="${isSelected}"`}>
        <span class="card-top"><span><span class="maker">${escapeHtml(item.maker)}</span>${item.generation ? `<span class="generation-badge generation-${item.generation}">${item.generation === 1 ? "1 Gen. zurück" : "2 Gen. zurück"}</span>` : ""}</span><span class="price">${escapeHtml(money(item.price))}</span></span>
        <h3>${escapeHtml(item.name)}</h3>
        <ul class="specs">${item.specs.map(spec => `<li>${escapeHtml(spec)}</li>`).join("")}</ul>
        ${issues.length ? `<span class="block-reason"><span>${escapeHtml(issues.map(entry => entry.title).join(" · "))}</span><span class="block-action">Details anzeigen</span></span>` :
          `<span class="card-foot"><span>${state.difficulty.mode === "beginner" ? "Geführte Empfehlung" : item.recommended ? "Empfohlene Balance" : isSelected ? "Ausgewählt" : "Auswählen"}</span><span class="select-indicator">${isSelected ? "✓" : ""}</span></span>`}
      </button>`;
    }).join("");

    refs.grid.querySelectorAll(".component-card:not(.blocked)").forEach(button => button.addEventListener("click", () => {
      const targetId = button.dataset.id;
      const wasSelected = state.selections[category.id] === targetId;
      state.selections[category.id] = wasSelected ? null : targetId;
      if (!wasSelected) reconcile(category.id);
      save();
      render();
      refs.grid.querySelector(`[data-id="${targetId}"]`)?.focus();
    }));
    refs.grid.querySelectorAll(".component-card.blocked").forEach(button => button.addEventListener("click", () => {
      const item = items.find(entry => entry.id === button.dataset.id);
      if (item) openCompatibilityDialog(category, item, compatibility(category.id, item));
    }));
    refs.previous.disabled = state.active === 0;
    refs.next.textContent = state.active === categories.length - 1 ? "Zur Übersicht" : "Weiter";
  }

  function renderDifficulty() {
    const settings = state.difficulty;
    document.body.dataset.difficulty = settings.mode;
    document.querySelectorAll('input[name="difficulty"]').forEach(input => { input.checked = input.value === settings.mode; });
    refs.expertControls.hidden = settings.mode !== "expert";
    refs.cpuTuning.value = String(settings.cpuTuning);
    refs.gpuTuning.value = String(settings.gpuTuning);
    refs.coolingProfile.value = settings.coolingProfile;
    refs.leakTest.checked = settings.leakTest;
    refs.difficultySummary.textContent = difficultyModel.summary(settings);
  }

  function detailRow(label, value) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    return row;
  }

  function openCompatibilityDialog(category, item, issues) {
    compatibilityTrigger = document.activeElement;
    refs.compatibilityTitle.textContent = item.name;
    refs.compatibilityIntro.textContent = `${issues.length} Kompatibilitätsproblem${issues.length === 1 ? "" : "e"} in der Gruppe ${category.label}. Die Karte bleibt fokussierbar, damit die Begründung mit Tastatur und Screenreader erreichbar ist.`;
    refs.compatibilityContent.replaceChildren();
    issues.forEach((entry, index) => {
      const article = document.createElement("article");
      article.className = "compatibility-issue";
      const heading = document.createElement("h3");
      heading.textContent = `${index + 1}. ${entry.title}`;
      const details = document.createElement("dl");
      details.append(
        detailRow("Prüfung", entry.evidence),
        detailRow("Auswirkung", entry.consequence),
        detailRow("Lösung", entry.remedy),
        detailRow("Lernhinweis", entry.learningHint)
      );
      article.append(heading, details);
      refs.compatibilityContent.append(article);
    });
    if (!refs.compatibilityDialog.open) refs.compatibilityDialog.showModal();
  }

  function closeCompatibilityDialog() {
    if (refs.compatibilityDialog.open) refs.compatibilityDialog.close();
  }

  function contextMessage(category) {
    const c = selected("case"), board = selected("motherboard"), cpu = selected("cpu"), gpu = selected("gpu"), cooler = selected("cooler");
    const power = requiredPower(state.selections);
    const messages = {
      motherboard: c ? `Das Gehäuse unterstützt ${c.form.join(", ")}.` : "",
      cpu: board ? `Benötigter Sockel: ${board.socket}.` : "Ohne Mainboard bleiben AM5, AM4, LGA1851 und LGA1700 wählbar.",
      gpu: c ? `Maximale Grafikkartenlänge: ${c.maxGpu} mm.` : "",
      psu: power.recommended ? `Für diese CPU/GPU-Kombination${state.difficulty.mode === "expert" ? " einschließlich Power-Limits" : ""} werden mindestens ${power.recommended} W empfohlen.` : "CPU und GPU auswählen, um die Reserve zu berechnen.",
      cooler: [cpu ? `Modellierter Kühlbedarf: ${requiredCooling()} W.` : "", c ? `Maximale Kühlerhöhe: ${c.maxCooler} mm.` : ""].filter(Boolean).join(" "),
      coolant: cooler?.kind === "custom" ? "Der offene Kreislauf benötigt mindestens einen Liter gebrauchsfertiges Kühlmittel." : cooler ? "Der ausgewählte Kühler ist geschlossen und benötigt kein separates Kühlmittel." : ""
    };
    return messages[category] || "";
  }

  function diagnostics() {
    const list = [];
    const missing = categories.filter(c => !state.selections[c.id]);
    const c = selected("case"), board = selected("motherboard"), cpu = selected("cpu");
    const gpu = selected("gpu"), psu = selected("psu"), cooler = selected("cooler");
    const storage = selected("storage"), cables = selected("cables"), ram = selected("ram");
    const power = requiredPower(state.selections);

    const modeLabel = difficultyModel.modes[state.difficulty.mode].label;
    list.push({ type:"info", title:`Modus: ${modeLabel}`, text:difficultyModel.summary(state.difficulty) });
    if (state.difficulty.mode === "expert" && (state.difficulty.cpuTuning || state.difficulty.gpuTuning)) {
      list.push({ type:"warning", title:"Power-Limits aktiv", text:`CPU +${state.difficulty.cpuTuning} %, GPU +${state.difficulty.gpuTuning} %. Stabilität, Temperaturen und reale Leistungsaufnahme müssen mit geeigneten Tests geprüft werden.` });
    }
    if (state.difficulty.mode === "expert" && cooler?.kind === "custom") {
      list.push(state.difficulty.leakTest
        ? { type:"success", title:"Dichtheitstest dokumentiert", text:"Vor dem Anschluss der übrigen Komponenten den gefüllten Kreislauf erneut visuell prüfen." }
        : { type:"warning", title:"Dichtheitstest offen", text:"Custom Loop zunächst nur mit der Pumpe betreiben und mindestens Anschlüsse, Pumpe, Reservoir und Radiator auf Leckagen prüfen." });
    }

    if (!missing.length) list.push({ type:"success", title:"Stückliste vollständig", text:"Alle zwölf Gruppen sind gewählt und die modellierten Regeln sind erfüllt." });
    else list.push({ type:"info", title:`${missing.length} Auswahl${missing.length === 1 ? "" : "en"} offen`, text:missing.slice(0,4).map(x => x.label).join(", ") + (missing.length > 4 ? " …" : "") });

    const legacyParts = [[board,"Mainboard"],[cpu,"CPU"],[gpu,"GPU"],[ram,"RAM"],[psu,"Netzteil"],[storage,"SSD"]].filter(([item]) => item?.generation);
    if (legacyParts.length) {
      const oldest = Math.max(...legacyParts.map(([item]) => item.generation));
      list.push({ type:"info", title:`Vorgängerplattform: bis zu ${oldest} Generation${oldest === 1 ? "" : "en"} zurück`, text:legacyParts.map(([item,label]) => `${label}: ${item.name}`).join(" · ") + ". Preis, Restgarantie, Effizienz und Supportzeitraum vergleichen." });
    }
    if (board && storage?.pcieGen > board.m2Gen) {
      list.push({ type:"warning", title:"NVMe wird ausgebremst", text:`Die PCIe-${storage.pcieGen}.0-SSD arbeitet im M.2-Steckplatz dieses Boards höchstens mit PCIe ${board.m2Gen}.0. PCIe bleibt abwärtskompatibel.` });
    }
    if (psu && psu.atx3 === false && gpu?.connector === "12V-2x6") {
      list.push({ type:"warning", title:"GPU-Stromadapter nötig", text:"Das ältere ATX-2.4-Netzteil besitzt keinen nativen 12V-2x6-Anschluss. Nur den vorgesehenen Adapter mit getrennten PCIe-Leitungen verwenden." });
    }

    if (c && board) list.push({ type:"success", title:"Formfaktor passt", text:`${board.form}-Mainboard kann im ${c.name} montiert werden.` });
    if (board && cpu) list.push({ type:"success", title:"Sockel stimmt überein", text:`${cpu.name} und ${board.name} verwenden ${cpu.socket}.` });
    if (gpu && c) list.push({ type:"success", title:"Grafikkarte hat Platz", text:`${c.maxGpu - gpu.length} mm Reserve bis zur Gehäusegrenze.` });
    if (psu && power.recommended) {
      const reserve = psu.watts - power.load;
      list.push({ type: reserve < 100 ? "warning" : "success", title: reserve < 100 ? "Netzteilreserve knapp" : "Netzteil ausreichend", text:`${psu.watts} W Nennleistung, etwa ${reserve} W oberhalb der geschätzten Volllast.` });
    }
    if (cpu && cooler) {
      const coolingNeed = requiredCooling();
      const margin = cooler.capacity - coolingNeed;
      list.push({ type: margin < 45 ? "warning" : "success", title: margin < 45 ? "Kühlreserve knapp" : "Kühlleistung passend", text:`Modellierter Bedarf ${coolingNeed} W, Reserve ${margin} W.` });
    }
    if (storage?.interface === "SATA" && cables?.provides.includes("sata")) list.push({ type:"success", title:"SATA-Verkabelung vorhanden", text:"Datenkabel und Laufwerksmontage wurden berücksichtigt." });
    if (selected("ram")?.speed > 6000 && cpu?.maker === "AMD") list.push({ type:"warning", title:"RAM-Profil prüfen", text:"DDR5 über 6000 MT/s kann auf AM5 eine manuelle Abstimmung oder einen niedrigeren Teiler benötigen." });
    return list;
  }

  function renderDiagnostics() {
    const items = diagnostics();
    const rank = items.some(x => x.type === "error") ? "error" : items.some(x => x.type === "warning") ? "warning" : items.some(x => x.type === "info") ? "neutral" : "good";
    refs.health.className = `health-badge ${rank}`;
    refs.health.textContent = rank === "error" ? "Fehler" : rank === "warning" ? "Prüfen" : rank === "good" ? "Kompatibel" : "In Arbeit";
    const icons = { success:"✓", warning:"!", error:"×", info:"i" };
    refs.diagnostics.innerHTML = items.slice(0,7).map(item => `<div class="diagnostic ${item.type}">
      <span class="diagnostic-icon">${icons[item.type]}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p></div>
    </div>`).join("");
  }

  function renderSummary() {
    const chosen = categories.filter(c => state.selections[c.id]).length;
    const total = categories.reduce((sum, c) => sum + (selected(c.id)?.price || 0), 0);
    const power = requiredPower(state.selections);
    refs.progress.textContent = `${chosen} / ${categories.length}`;
    refs.price.textContent = money(total);
    refs.power.textContent = power.recommended ? `${power.load} W · ${power.recommended} W empf.` : "–";
    refs.build.innerHTML = categories.map(category => {
      const item = selected(category.id);
      return `<div class="build-row ${item ? "" : "empty"}" role="listitem"><span class="build-category">${escapeHtml(category.label)}</span><span class="build-item">${escapeHtml(item ? item.name : "noch offen")}</span><span class="build-price">${escapeHtml(item ? money(item.price) : "–")}</span></div>`;
    }).join("");

    try {
      localStorage.setItem("buildbench-evaluation-v1", JSON.stringify({
        version: 1,
        updatedAt: new Date().toISOString(),
        total,
        power,
        difficulty: state.difficulty,
        components: Object.fromEntries(categories.map(category => [category.id, selected(category.id)]))
      }));
    } catch (_) {}
    window.BuildBenchLMS?.recordConfigurator({
      selected: chosen,
      total: categories.length,
      step: state.active + 1,
      mode: state.difficulty.mode,
      cpuTuning: state.difficulty.cpuTuning,
      gpuTuning: state.difficulty.gpuTuning,
      coolingProfile: state.difficulty.coolingProfile
    });
  }

  const svgText = (x,y,text,size=12,fill="#90a6c0",anchor="start") => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${escapeHtml(text)}</text>`;

  const svgImage = (href,x,y,width,height,extra="") =>
    `<image href="${href}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="none" ${extra}/>`;

  function renderSvg() {
    const c = selected("case"), board = selected("motherboard"), cpu = selected("cpu"), gpu = selected("gpu");
    const ram = selected("ram"), psu = selected("psu"), cooler = selected("cooler"), storage = selected("storage");
    const standoffs = selected("standoffs"), screws = selected("screws"), cables = selected("cables"), coolant = selected("coolant");
    const caseW = c?.size === "Mini-ITX" ? 390 : c?.size === "Micro-Tower" ? 450 : 520;
    const x = (680-caseW)/2, y = 48, h = 620;
    const boardW = board?.form === "ITX" ? 190 : board?.form === "mATX" ? 290 : 350;
    const boardH = board?.form === "ITX" ? 190 : board?.form === "mATX" ? 300 : 390;
    const bx = x+48, by = y+88, cpuX=bx+82, cpuY=by+66;
    const accent = "#65e6c4", blue="#56c8ff", gold="#ffc857", red="#ff6b7a";
    const coolantColor = coolant?.fluid ? coolant.color : blue;
    const componentPath = "assets/svg/components/";

    let svg = `<g class="part active-part">${svgImage(componentPath+"case.svg",x,y,caseW,h)}</g>
      ${svgText(x+caseW/2,y+37,c?.name || "GEHÄUSE",12,c?accent:"#607590","middle")}`;

    if (board) {
      const holes = [[12,12],[boardW-12,12],[12,boardH-12],[boardW-12,boardH-12],[boardW/2,12],[boardW/2,boardH-12]];
      svg += `<g class="part active-part">
        ${svgImage(componentPath+"motherboard.svg",bx,by,boardW,boardH)}
        ${standoffs ? holes.map(([hx,hy])=>svgImage(componentPath+"standoffs.svg",bx+hx-8,by+hy-8,16,16)).join("") : ""}
        ${svgText(bx+12,by+boardH-15,board.form+" · "+board.socket,10,"#8ed8c9")}
      </g>`;
    } else {
      svg += `<g class="part empty-part"><rect x="${bx}" y="${by}" width="330" height="380" rx="7" fill="none" stroke="#53708c" stroke-width="2" stroke-dasharray="9 8"/>${svgText(bx+165,by+190,"MAINBOARD",14,"#6c829a","middle")}</g>`;
    }

    if (cpu && board) {
      svg += `<g class="part active-part">${svgImage(componentPath+"cpu.svg",cpuX,cpuY,76,76)}${svgText(cpuX+38,cpuY+43,cpu.label,17,"#ffffff","middle")}</g>`;
    }

    if (ram && board) {
      svg += `<g class="part active-part">${[0,1,2,3].map(i=>svgImage(componentPath+"ram.svg",bx+boardW-63+i*12,by+45,10,Math.min(145,boardH*.42))).join("")}${svgText(bx+boardW-39,by+205,ram.capacity+" GB",9,accent,"middle")}</g>`;
    }

    if (cooler && cpu && board) {
      if (cooler.kind === "air") {
        svg += `<g class="part active-part">${svgImage(componentPath+"cpu-cooler-air.svg",cpuX-18,cpuY-18,112,112)}</g>`;
      } else {
        const radW = Math.min(caseW-90, cooler.radiator === 360 ? 330 : 225);
        const radX=x+48, radY=y+34;
        svg += `<g class="part active-part">
          ${svgImage(componentPath+"cpu-cooler-liquid.svg",radX,radY,radW,190)}
          ${svgText(cpuX+38,cpuY+42,cooler.kind==="custom"?"LOOP":"AIO",11,"#dcebf5","middle")}
          ${cooler.kind==="custom" ? svgImage(componentPath+"coolant.svg",x+caseW-105,y+300,44,150) : ""}
          ${cooler.kind==="custom" ? `<rect x="${x+caseW-103}" y="${y+302}" width="40" height="146" rx="18" fill="${coolantColor}" fill-opacity=".24" stroke="${coolantColor}" stroke-width="3"/>` : ""}
        </g>`;
      }
    }

    if (gpu && board) {
      const gpuW=Math.min(gpu.length*1.08,caseW-92), gx=bx+18, gy=by+Math.min(boardH-105,245);
      svg += `<g class="part active-part">
        ${svgImage(componentPath+"gpu.svg",gx-14,gy,gpuW+14,92)}
        <rect x="${gx}" y="${gy+1}" width="${gpuW-2}" height="89" rx="8" fill="none" stroke="${gpu.maker==="AMD"?red:accent}" stroke-width="2"/>
        ${svgText(gx+gpuW/2,gy+51,gpu.label,12,"#eaf6ff","middle")}
      </g>`;
    } else {
      svg += `<g class="part empty-part"><rect x="${bx+18}" y="${by+245}" width="${Math.min(320,caseW-92)}" height="88" rx="8" fill="none" stroke="#53708c" stroke-width="2" stroke-dasharray="9 8"/>${svgText(bx+165,by+294,"GRAFIKKARTE",12,"#6c829a","middle")}</g>`;
    }

    if (psu) {
      const psuW=psu.form==="SFX"?145:190;
      svg += `<g class="part active-part">${svgImage(componentPath+"psu.svg",x+42,y+h-118,psuW,88)}${svgText(x+54,y+h-100,psu.watts+" W",11,gold)}</g>`;
    } else {
      svg += `<g class="part empty-part"><rect x="${x+42}" y="${y+h-118}" width="190" height="88" rx="7" fill="none" stroke="#53708c" stroke-width="2" stroke-dasharray="9 8"/>${svgText(x+137,y+h-70,"NETZTEIL",12,"#6c829a","middle")}</g>`;
    }

    if (storage && board) {
      if (storage.mount === "M.2") {
        const storageW=Math.min(135,boardW-95);
        svg += `<g class="part active-part">${svgImage(componentPath+"storage-m2.svg",bx+70,by+boardH-74,storageW,23)}${svgText(bx+70+storageW/2,by+boardH-57,"M.2",9,"#fff","middle")}</g>`;
      } else {
        svg += `<g class="part active-part">${svgImage(componentPath+"storage-sata.svg",x+caseW-150,y+h-112,92,70)}${svgText(x+caseW-104,y+h-63,storage.mount+'"',10,"#dcebf5","middle")}</g>`;
      }
    }

    if (cables && (psu || gpu || storage)) {
      svg += `<g class="part active-part" opacity=".9">${svgImage(componentPath+"cables.svg",x+175,y+300,Math.max(190,caseW-205),245)}</g>`;
    }

    if (screws && board) {
      const screwPoints = [[bx+12,by+12],[bx+boardW-12,by+12],[bx+12,by+boardH-12],[bx+boardW-12,by+boardH-12]];
      svg += `<g class="part active-part">${screwPoints.map(([sx,sy])=>svgImage(componentPath+"screws.svg",sx-8,sy-8,16,16)).join("")}</g>`;
    }

    svg += `<g opacity=".75"><path d="M${x} 690H${x+caseW}" stroke="#5a7189"/><path d="M${x} 683v14M${x+caseW} 683v14" stroke="#5a7189"/>${svgText(x+caseW/2,706,c?.size||"PC-GEHÄUSE",10,"#71879d","middle")}</g>`;
    const layer = refs.svg.querySelector("#inside-content");
    if (!layer) return;
    layer.innerHTML = svg;
    refs.buildName.textContent = cpu && gpu ? `${cpu.label} / ${gpu.label}` : c?.name || "Dein System";
    refs.viewLegend.innerHTML = [
      [accent,"Mainboard / Auswahl"],[gold,"Stromversorgung"],[blue,"Speicher / Kühlung"],[red,"Grafik / Last"]
    ].map(([color,label])=>`<span><i style="background:${color}" aria-hidden="true"></i>${label}</span>`).join("");
    const visualText = document.querySelector("#visual-text");
    if (visualText) {
      const installed = [
        c ? `Gehäuse ${c.name}` : "kein Gehäuse",
        board ? `Mainboard ${board.name}` : "kein Mainboard",
        cpu ? `CPU ${cpu.name}` : "keine CPU",
        gpu ? `Grafikkarte ${gpu.name}` : "keine Grafikkarte",
        ram ? `${ram.capacity} GB Arbeitsspeicher` : "kein Arbeitsspeicher",
        storage ? `Speicher ${storage.name}` : "kein Massenspeicher",
        psu ? `Netzteil ${psu.name}` : "kein Netzteil",
        cooler ? `Kühler ${cooler.name}` : "kein CPU-Kühler"
      ];
      visualText.dataset.insideDescription = `Innenansicht des PCs: ${installed.join(", ")}.`;
      if (!refs.svg.hasAttribute("hidden")) visualText.textContent = visualText.dataset.insideDescription;
    }
  }

  function showToast(message, duration=3000) {
    refs.toast.textContent = message;
    refs.toast.classList.add("visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => refs.toast.classList.remove("visible"), duration);
  }

  function render() {
    renderDifficulty(); renderNav(); renderPicker(); renderSummary(); renderDiagnostics(); renderSvg();
  }

  refs.previous.addEventListener("click", () => { if (state.active > 0) { state.active--; render(); window.scrollTo({top:0,behavior:scrollBehavior}); } });
  refs.next.addEventListener("click", () => {
    if (state.active < categories.length - 1) state.active++;
    else document.querySelector(".diagnostics-panel").scrollIntoView({behavior:scrollBehavior,block:"start"});
    render();
  });
  refs.reset.addEventListener("click", () => {
    if (!Object.values(state.selections).some(Boolean) || confirm("Die gesamte Auswahl zurücksetzen?")) {
      for (const category of categories) state.selections[category.id] = null;
      state.active = 0; save(); render(); showToast("Konfiguration zurückgesetzt.");
    }
  });
  refs.example.addEventListener("click", () => {
    if (state.difficulty.mode === "beginner") {
      for (const category of categories) state.selections[category.id] = data[category.id].find(item => item.recommended)?.id || null;
      state.active = 0; save(); render(); showToast("Geführten Einsteiger-Build geladen.");
    } else {
      Object.assign(state.selections, {
        case:"north", motherboard:"x870", cpu:"9800x3d", gpu:"5070", ram:"32-6000", psu:"rm850x",
        cooler:"nhd15", storage:"990pro", standoffs:"case-set", screws:"case-screws", cables:"modern", coolant:"none"
      });
      state.active = 0; save(); render(); showToast("Ausgewogenen Gaming-Build geladen.");
    }
  });
  refs.copy.addEventListener("click", async () => {
    const lines = ["BuildBench PC-Konfiguration", ""];
    categories.forEach(category => {
      const item = selected(category.id);
      lines.push(`${category.label}: ${item ? item.name + " – " + money(item.price) : "offen"}`);
    });
    lines.push("", `Schwierigkeitsgrad: ${difficultyModel.modes[state.difficulty.mode].label}`, `Gesamt: ${refs.price.textContent}`, `Leistung: ${refs.power.textContent}`);
    try { await navigator.clipboard.writeText(lines.join("\n")); showToast("Stückliste kopiert."); }
    catch (_) { showToast("Kopieren wurde vom Browser blockiert."); }
  });

  document.querySelectorAll("#compatibility-dialog .compatibility-dialog-close").forEach(button => button.addEventListener("click", closeCompatibilityDialog));
  refs.compatibilityDialog.addEventListener("click", event => {
    if (event.target === refs.compatibilityDialog) closeCompatibilityDialog();
  });
  refs.compatibilityDialog.addEventListener("close", () => {
    if (compatibilityTrigger && typeof compatibilityTrigger.focus === "function") compatibilityTrigger.focus();
    compatibilityTrigger = null;
  });

  document.querySelectorAll('input[name="difficulty"]').forEach(input => input.addEventListener("change", () => {
    state.difficulty = difficultyModel.sanitize({ ...state.difficulty, mode: input.value });
    reconcile("difficulty"); save(); render();
  }));
  for (const [control, key] of [[refs.cpuTuning,"cpuTuning"],[refs.gpuTuning,"gpuTuning"],[refs.coolingProfile,"coolingProfile"]]) {
    control.addEventListener("change", () => {
      state.difficulty = difficultyModel.sanitize({ ...state.difficulty, [key]: control.value });
      reconcile("difficulty"); save(); render();
    });
  }
  refs.leakTest.addEventListener("change", () => {
    state.difficulty = difficultyModel.sanitize({ ...state.difficulty, leakTest: refs.leakTest.checked });
    save(); render();
  });

  load();
  render();
})();
