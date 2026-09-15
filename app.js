(async () => {
  "use strict";

  await window.BuildBenchSVG?.ready;

  const content = await window.BuildBenchContent?.ready;
  if (!content) throw new Error("BuildBenchContent ist nicht verfügbar.");
  const { categories, components: data } = content.components;

  const state = {
    active: 0,
    selections: Object.fromEntries(categories.map(c => [c.id, null]))
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
    reset: $("#reset-button"), example: $("#example-button"), copy: $("#copy-button"), toast: $("#toast")
  };

  const money = value => value === 0 ? "enthalten" : new Intl.NumberFormat("de-DE", { style:"currency", currency:"EUR", maximumFractionDigits:0 }).format(value);
  const selected = (category, selections = state.selections) => data[category].find(item => item.id === selections[category]) || null;
  const configWith = (category, id) => ({ ...state.selections, [category]: id });
  const requiredPower = selections => {
    const cpu = selected("cpu", selections), gpu = selected("gpu", selections);
    const load = (cpu?.power || 0) + (gpu?.power || 0) + ((cpu || gpu) ? 110 : 0);
    return { load, recommended: load ? Math.ceil(load * 1.3 / 50) * 50 : 0 };
  };

  function compatibility(category, item, selections = configWith(category, item.id)) {
    const reasons = [];
    const c = selected("case", selections), board = selected("motherboard", selections);
    const cpu = selected("cpu", selections), gpu = selected("gpu", selections);
    const ram = selected("ram", selections), psu = selected("psu", selections);
    const cooler = selected("cooler", selections), storage = selected("storage", selections);
    const standoffs = selected("standoffs", selections);

    if (category === "case") {
      if (board && !item.form.includes(board.form)) reasons.push(`${board.form}-Mainboard passt nicht`);
      if (gpu && gpu.length > item.maxGpu) reasons.push(`GPU ist ${gpu.length - item.maxGpu} mm zu lang`);
      if (cooler?.kind === "air" && cooler.height > item.maxCooler) reasons.push(`Kühler ist ${cooler.height - item.maxCooler} mm zu hoch`);
      if (cooler && cooler.kind !== "air" && !item.radiators.includes(cooler.radiator)) reasons.push(`${cooler.radiator}-mm-Radiator nicht möglich`);
      if (psu && !item.psu.includes(psu.form)) reasons.push(`${psu.form}-Netzteil wird nicht unterstützt`);
      if (storage && !item.drives.includes(storage.mount)) reasons.push(`kein ${storage.mount}-Laufwerksplatz`);
    }
    if (category === "motherboard") {
      if (c && !c.form.includes(item.form)) reasons.push(`${item.form} passt nicht in ${c.name}`);
      if (cpu && cpu.socket !== item.socket) reasons.push(`CPU benötigt ${cpu.socket}`);
      if (ram && ram.type !== item.memory) reasons.push(`RAM ist ${ram.type}, Board benötigt ${item.memory}`);
      if (storage?.mount === "M.2" && item.m2 < 1) reasons.push("kein M.2-Steckplatz");
      if (storage?.interface === "SATA" && item.sata < 1) reasons.push("kein SATA-Anschluss");
    }
    if (category === "cpu") {
      if (board && board.socket !== item.socket) reasons.push(`Mainboard hat ${board.socket}`);
    }
    if (category === "gpu") {
      if (c && item.length > c.maxGpu) reasons.push(`${item.length} mm überschreiten ${c.maxGpu} mm`);
    }
    if (category === "ram") {
      if (board && board.memory !== item.type) reasons.push(`Mainboard benötigt ${board.memory}`);
    }
    if (category === "psu") {
      if (c && !c.psu.includes(item.form)) reasons.push(`Gehäuse unterstützt nur ${c.psu.join("/")}`);
      const need = requiredPower(selections).recommended;
      if (need && item.watts < need) reasons.push(`mindestens ${need} W empfohlen`);
    }
    if (category === "cooler") {
      if (cpu && !item.sockets.includes(cpu.socket)) reasons.push(`keine Halterung für ${cpu.socket}`);
      if (cpu && item.capacity < cpu.power) reasons.push(`Kühlleistung unter ${cpu.power} W CPU-Spitze`);
      if (c && item.kind === "air" && item.height > c.maxCooler) reasons.push(`${item.height} mm überschreiten ${c.maxCooler} mm`);
      if (c && item.kind !== "air" && !c.radiators.includes(item.radiator)) reasons.push(`kein Platz für ${item.radiator}-mm-Radiator`);
    }
    if (category === "storage") {
      if (board && item.mount === "M.2" && board.m2 < 1) reasons.push("Mainboard besitzt keinen M.2-Slot");
      if (board && item.interface === "SATA" && board.sata < 1) reasons.push("Mainboard besitzt keinen SATA-Port");
      if (c && !c.drives.includes(item.mount)) reasons.push(`Gehäuse hat keinen ${item.mount}-Platz`);
    }
    if (category === "standoffs") {
      if (board && !item.forms.includes(board.form)) reasons.push(`nicht für ${board.form} vorgesehen`);
      if (board && item.count < board.standoff) reasons.push(`${board.standoff} Stück erforderlich`);
      if (c && item.thread !== c.thread) reasons.push(`Gehäusegewinde ist ${c.thread}`);
    }
    if (category === "screws") {
      if (standoffs && item.thread !== standoffs.thread) reasons.push(`Abstandhalter haben ${standoffs.thread}`);
      if (board && item.count < board.standoff) reasons.push(`${board.standoff} Mainboard-Schrauben erforderlich`);
      if (storage && ["2.5","3.5"].includes(storage.mount) && !item.driveMounts.includes(storage.mount)) reasons.push(`keine Schrauben für ${storage.mount} Zoll`);
    }
    if (category === "cables") {
      if (storage?.interface === "SATA" && !item.provides.includes("sata")) reasons.push("SATA-Datenkabel fehlt");
      if (gpu?.connector === "12V-2x6" && !psu?.atx3 && !item.provides.includes("12V-2x6")) reasons.push("12V-2x6-GPU-Kabel fehlt");
      if (gpu?.connector === "12V-2x6" && !item.provides.includes("12V-2x6") && psu?.atx3 !== true) reasons.push("moderner GPU-Stecker nicht enthalten");
    }
    if (category === "coolant") {
      if (cooler?.kind === "custom" && !item.fluid) reasons.push("Custom Loop benötigt 1 Liter Kühlmittel");
      if (cooler && cooler.kind !== "custom" && item.fluid) reasons.push("für diesen Kühler nicht erforderlich");
      if (!cooler && item.fluid) reasons.push("erst einen Custom-Loop-Kühler wählen");
    }
    return reasons;
  }

  function reconcile(changedCategory) {
    const removed = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const category of categories) {
        if (category.id === changedCategory || !state.selections[category.id]) continue;
        const item = selected(category.id);
        const reasons = compatibility(category.id, item, state.selections);
        if (reasons.length) {
          removed.push(`${category.label}: ${item.name} (${reasons[0]})`);
          state.selections[category.id] = null;
          changed = true;
        }
      }
    }
    if (removed.length) showToast(`Entfernt: ${removed.join(" · ")}`, 5200);
  }

  function save() {
    try { localStorage.setItem("buildbench-config-v1", JSON.stringify(state.selections)); } catch (_) {}
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem("buildbench-config-v1"));
      if (!saved) return;
      for (const category of categories) {
        if (data[category.id].some(item => item.id === saved[category.id])) state.selections[category.id] = saved[category.id];
      }
    } catch (_) {}
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
    const items = data[category.id];
    refs.kicker.textContent = `Schritt ${state.active + 1} von ${categories.length}`;
    refs.title.textContent = category.title;
    refs.description.textContent = category.description;
    const available = items.filter(item => compatibility(category.id, item).length === 0).length;
    refs.count.textContent = `${available} von ${items.length} wählbar`;
    const generationHint = items.some(item => item.generation) ? "Vorgängermodelle sind als Lern- und Budgetoptionen markiert; Verfügbarkeit, Effizienz, Garantie und Firmware-Support gesondert bewerten." : "";
    const context = [contextMessage(category.id), generationHint].filter(Boolean).join(" ");
    refs.note.hidden = !context;
    refs.note.textContent = context || "";

    refs.grid.innerHTML = items.map(item => {
      const reasons = compatibility(category.id, item);
      const isSelected = state.selections[category.id] === item.id;
      return `<button class="component-card ${isSelected ? "selected" : ""} ${reasons.length ? "blocked" : ""} ${item.generation ? "legacy-card" : ""}"
          data-id="${escapeHtml(item.id)}" type="button" ${reasons.length ? 'aria-disabled="true"' : ""} aria-pressed="${isSelected}">
        <span class="card-top"><span><span class="maker">${escapeHtml(item.maker)}</span>${item.generation ? `<span class="generation-badge generation-${item.generation}">${item.generation === 1 ? "1 Gen. zurück" : "2 Gen. zurück"}</span>` : ""}</span><span class="price">${escapeHtml(money(item.price))}</span></span>
        <h3>${escapeHtml(item.name)}</h3>
        <ul class="specs">${item.specs.map(spec => `<li>${escapeHtml(spec)}</li>`).join("")}</ul>
        ${reasons.length ? `<span class="block-reason">${escapeHtml(reasons.join(" · "))}</span>` :
          `<span class="card-foot"><span>${item.recommended ? "Empfohlene Balance" : isSelected ? "Ausgewählt" : "Auswählen"}</span><span class="select-indicator">${isSelected ? "✓" : ""}</span></span>`}
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
      const reason = button.querySelector(".block-reason")?.textContent || "Diese Komponente ist mit der aktuellen Auswahl nicht kompatibel.";
      showToast(`Nicht wählbar: ${reason}`, 5200);
    }));
    refs.previous.disabled = state.active === 0;
    refs.next.textContent = state.active === categories.length - 1 ? "Zur Übersicht" : "Weiter";
  }

  function contextMessage(category) {
    const c = selected("case"), board = selected("motherboard"), cpu = selected("cpu"), gpu = selected("gpu"), cooler = selected("cooler");
    const power = requiredPower(state.selections);
    const messages = {
      motherboard: c ? `Das Gehäuse unterstützt ${c.form.join(", ")}.` : "",
      cpu: board ? `Benötigter Sockel: ${board.socket}.` : "Ohne Mainboard bleiben AM5, AM4, LGA1851 und LGA1700 wählbar.",
      gpu: c ? `Maximale Grafikkartenlänge: ${c.maxGpu} mm.` : "",
      psu: power.recommended ? `Für diese CPU/GPU-Kombination werden mindestens ${power.recommended} W empfohlen.` : "CPU und GPU auswählen, um die Reserve zu berechnen.",
      cooler: [cpu ? `CPU-Spitze: ${cpu.power} W.` : "", c ? `Maximale Kühlerhöhe: ${c.maxCooler} mm.` : ""].filter(Boolean).join(" "),
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
      const margin = cooler.capacity - cpu.power;
      list.push({ type: margin < 45 ? "warning" : "success", title: margin < 45 ? "Kühlreserve knapp" : "Kühlleistung passend", text:`Modellierte Reserve: ${margin} W.` });
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
    refs.diagnostics.innerHTML = items.slice(0,5).map(item => `<div class="diagnostic ${item.type}">
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
        components: Object.fromEntries(categories.map(category => [category.id, selected(category.id)]))
      }));
    } catch (_) {}
    window.BuildBenchLMS?.recordConfigurator({
      selected: chosen,
      total: categories.length,
      step: state.active + 1
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
    renderNav(); renderPicker(); renderSummary(); renderDiagnostics(); renderSvg();
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
    Object.assign(state.selections, {
      case:"north", motherboard:"x870", cpu:"9800x3d", gpu:"5070", ram:"32-6000", psu:"rm850x",
      cooler:"nhd15", storage:"990pro", standoffs:"case-set", screws:"case-screws", cables:"modern", coolant:"none"
    });
    state.active = 0; save(); render(); showToast("Ausgewogenen Gaming-Build geladen.");
  });
  refs.copy.addEventListener("click", async () => {
    const lines = ["BuildBench PC-Konfiguration", ""];
    categories.forEach(category => {
      const item = selected(category.id);
      lines.push(`${category.label}: ${item ? item.name + " – " + money(item.price) : "offen"}`);
    });
    lines.push("", `Gesamt: ${refs.price.textContent}`, `Leistung: ${refs.power.textContent}`);
    try { await navigator.clipboard.writeText(lines.join("\n")); showToast("Stückliste kopiert."); }
    catch (_) { showToast("Kopieren wurde vom Browser blockiert."); }
  });

  load();
  render();
})();
