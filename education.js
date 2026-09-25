(async () => {
  "use strict";

  await window.BuildBenchSVG?.ready;

  const content = await window.BuildBenchContent?.ready;
  if (!content) throw new Error("BuildBenchContent ist nicht verfügbar.");
  const lessons = Object.fromEntries(content.lessons.lessons.map(lesson => [lesson.id, lesson]));
  const networkGroups = Object.fromEntries(content.network.groups.map(group => [group.id, group]));
  const networkGroupOrder = content.network.groups.map(group => group.id);
  const catalog = Object.fromEntries(content.network.groups.map(group => [group.id, group.options]));
  const boards = content.network.boards;

  const networkState = {ethernet:"onboard", wifi:"onboard"};
  let activeView = "inside";
  let dialogTrigger = null;

  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const euro = value => value === 0 ? "enthalten" : new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(value);

  function baseSelections() {
    try { return JSON.parse(localStorage.getItem("buildbench-config-v1")) || {}; }
    catch (_) { return {}; }
  }

  function isBeginner() {
    try { return JSON.parse(localStorage.getItem("buildbench-difficulty-v1"))?.mode === "beginner"; }
    catch (_) { return false; }
  }

  function loadNetwork() {
    try {
      const saved = JSON.parse(localStorage.getItem("buildbench-network-v1"));
      for (const type of ["ethernet","wifi"]) {
        if (catalog[type].some(item => item.id === saved?.[type])) networkState[type] = saved[type];
      }
    } catch (_) {}
  }

  function saveNetwork() {
    try { localStorage.setItem("buildbench-network-v1", JSON.stringify(networkState)); }
    catch (_) {}
  }

  function chosen(type) {
    return catalog[type].find(item => item.id === networkState[type]) || catalog[type][0];
  }

  function blockReason(type, item) {
    const base = baseSelections();
    const board = boards[base.motherboard];
    if (!item.slot) return "";
    if (board?.form === "ITX" && base.gpu) return "ITX-Steckplatz wird bereits von der Grafikkarte belegt";
    if (item.slot >= 4 && board?.form === "ITX") return "kein freier PCIe-x4-Steckplatz";
    if (type === "wifi" && chosen("ethernet").slot && board?.form === "mATX" && item.slot) return "";
    return "";
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("visible"), 3200);
  }

  function list(items) {
    return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function openLesson(key, product = null) {
    const lesson = lessons[key] || lessons.Grundregeln;
    $("#lesson-dialog-title").textContent = lesson.title;
    $("#lesson-dialog-content").innerHTML = `
      <p class="lesson-lead">${escapeHtml(lesson.role)}</p>
      ${product ? `<div class="lesson-product"><strong>Variante:</strong> ${escapeHtml(product.name)} · ${escapeHtml(product.speed)} · ${escapeHtml(product.specs)}</div>` : ""}
      <div class="lesson-grid">
        <section class="lesson-section"><h3>Aufgabe &amp; Installation</h3>${list(lesson.install)}</section>
        <section class="lesson-section safety"><h3>Sicherheit</h3>${list(lesson.safety)}</section>
        <section class="lesson-section"><h3>Funktionsprüfung</h3>${list(lesson.check)}</section>
        <section class="lesson-section"><h3>Arbeitsauftrag</h3>${list([
          "Begründe die Auswahl anhand mindestens zweier technischer Merkmale.",
          "Dokumentiere Anschluss, Einbaulage und Prüfschritt.",
          "Nenne eine mögliche Fehlerursache und ein geeignetes Diagnoseverfahren."
        ])}</section>
      </div>`;
    const dialog = $("#lesson-dialog");
    dialogTrigger = document.activeElement;
    if (!dialog.open) dialog.showModal();
  }

  function closeLesson() {
    const dialog = $("#lesson-dialog");
    if (dialog?.open) dialog.close();
  }

  function currentLessonKey() {
    return $(".category-button.active")?.dataset.lessonId || "Grundregeln";
  }

  function renderNetwork() {
    const root = $("#network-options");
    if (!root) return;
    root.innerHTML = networkGroupOrder.map(type => {
      const title = networkGroups[type].label + "-Karte";
      return `<section class="network-group">
        <h3 class="network-group-title">${title}<span>eine Option</span></h3>
        <div class="network-card-grid">${catalog[type].map(item => {
          const reason = isBeginner() ? blockReason(type,item) : "";
          const selected = networkState[type] === item.id;
          return `<article class="network-card ${selected ? "selected" : ""} ${reason ? "blocked" : ""}">
            <button class="network-select" type="button" data-network-type="${type}" data-network-id="${item.id}" aria-pressed="${selected}" ${reason ? "aria-disabled=\"true\"" : ""}>
              <strong>${escapeHtml(item.name)}</strong>
              ${item.generation ? `<span class="generation-badge generation-${item.generation}">${item.generation === 1 ? "1 Gen. zurück" : "2 Gen. zurück"}</span>` : ""}
              <small>${escapeHtml(item.speed)} · <span class="network-price">${euro(item.price)}</span></small>
              <small>${escapeHtml(item.specs)}</small>
            </button>
            <button class="network-info" type="button" data-network-info="${type}" data-network-id="${item.id}" aria-label="Lerninfo zu ${escapeHtml(item.name)}">i</button>
            ${reason ? `<div class="network-reason">× ${escapeHtml(reason)}</div>` : ""}
          </article>`;
        }).join("")}</div>
      </section>`;
    }).join("");

    root.querySelectorAll(".network-select").forEach(button => button.addEventListener("click", () => {
      if (button.getAttribute("aria-disabled") === "true") {
        showToast(button.closest(".network-card").querySelector(".network-reason")?.textContent.replace(/^×\s*/,"") || "Option nicht kompatibel.");
        return;
      }
      networkState[button.dataset.networkType] = button.dataset.networkId;
      const selectedType = button.dataset.networkType;
      const selectedId = button.dataset.networkId;
      saveNetwork();
      renderNetwork();
      renderPorts();
      window.BuildBenchResearch?.render();
      root.querySelector(`[data-network-type="${selectedType}"][data-network-id="${selectedId}"]`)?.focus();
    }));
    root.querySelectorAll(".network-info").forEach(button => button.addEventListener("click", () => {
      const type = button.dataset.networkInfo;
      const item = catalog[type].find(entry => entry.id === button.dataset.networkId);
      openLesson(networkGroups[type].lessonId, item);
    }));

    $("#network-total").textContent = "Preis selbst erfassen";
    renderNetworkDiagnostics();
  }

  function renderNetworkDiagnostics() {
    if (!isBeginner()) {
      $("#network-diagnostics").innerHTML = '<div class="network-note info"><b>i</b><span>Prüfe die Erweiterungskarten nach der Zusammenstellung in der Auswertung zusammen mit den übrigen Bauteilen.</span></div>';
      return;
    }
    const base = baseSelections();
    const board = boards[base.motherboard];
    const ethernet = chosen("ethernet");
    const wifi = chosen("wifi");
    const notes = [];
    if (!board) notes.push(["info","i","Mainboard wählen, um Onboard-Schnittstellen und freie Steckplätze sicher zu bewerten."]);
    else notes.push(["success","✓",`${board.name}: Onboard-LAN ${board.lan}, Onboard-WLAN ${board.wifi}.`]);
    if (ethernet.slot) notes.push(["warning","!","Zusatz-LAN ist nur sinnvoll, wenn Switch, Gegenstelle und Verkabelung die gewünschte Datenrate unterstützen."]);
    if (wifi.slot) notes.push(["info","i","Für Bluetooth wird bei PCIe-WLAN-Karten meist zusätzlich ein interner USB-2.0-Header benötigt."]);
    if (board?.form === "ITX" && base.gpu) notes.push(["warning","!","Mit einer Grafikkarte ist der einzige ITX-PCIe-Steckplatz belegt; nutze die Onboard-Netzwerkschnittstellen."]);
    $("#network-diagnostics").innerHTML = notes.map(([type,icon,text]) =>
      `<div class="network-note ${type}"><b>${icon}</b><span>${escapeHtml(text)}</span></div>`
    ).join("");
  }

  function svgText(x,y,text,size=12,fill="#9bb0c8",anchor="start") {
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${escapeHtml(text)}</text>`;
  }

  const portAssetPath = "assets/svg/ports/";
  function portImage(name,x,y,width,height) {
    return `<image href="${portAssetPath+name}.svg" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="none"/>`;
  }

  function usbPair(x,y,color="#56c8ff") {
    return `<g>${portImage("usb-a",x,y,26,19)}${portImage("usb-a",x+28,y,26,19)}<path d="M${x+5} ${y+22}h44" stroke="${color}" stroke-width="2"/></g>`;
  }

  function rj45(x,y,label) {
    return `<g class="port-group">${portImage("rj45",x,y,80,58)}${svgText(x+40,y+75,label,9,"#65e6c4","middle")}</g>`;
  }

  function renderPorts() {
    const svg = $("#port-view");
    if (!svg) return;
    const base = baseSelections();
    const board = boards[base.motherboard];
    const ethernet = chosen("ethernet");
    const wifi = chosen("wifi");
    const hasGpu = Boolean(base.gpu);
    const onboardWifi = wifi.id === "onboard";
    let out = `<g class="port-group"><rect x="112" y="112" width="290" height="276" rx="9" fill="#132437" stroke="#67819a" stroke-width="2"/>
      ${svgText(257,137,board ? board.name : "MAINBOARD-I/O (BEISPIEL)",10,"#cfe0ef","middle")}
      ${usbPair(134,162)}${usbPair(134,199,"#4d7fa1")}${usbPair(134,236,"#4d7fa1")}
      ${portImage("usb-c",218,162,42,27)}
      ${svgText(239,203,"USB-C",9,"#56c8ff","middle")}
      ${portImage("hdmi",278,162,54,24)}${portImage("displayport",339,162,54,24)}${svgText(335,207,"HDMI · DisplayPort",9,"#b69ae9","middle")}
      ${rj45(279,226,board?.lan || ethernet.speed)}
      ${[0,1,2,3,4].map(i=>portImage("audio-jack",133+i*47,320,30,30)).join("")}
      ${svgText(242,371,"Audio 3,5 mm",9,"#a9bdd0","middle")}</g>
      <g class="port-group"><rect x="438" y="112" width="124" height="276" rx="9" fill="url(#rearMesh)" stroke="#516a82"/>
      ${[0,1,2].map(i=>`<circle cx="500" cy="${175+i*68}" r="27" fill="#0a1522" stroke="#607992" stroke-width="3"/><path d="M477 ${175+i*68}h46M500 ${152+i*68}v46" stroke="#334c63" stroke-width="4"/>`).join("")}
      ${svgText(500,367,"Gehäuselüfter",9,"#8299af","middle")}</g>`;

    if (onboardWifi || wifi.slot) {
      out += `<g class="port-group">${portImage("wifi-antenna",370,88,44,90)}${portImage("wifi-antenna",398,115,44,90)}${svgText(399,216,wifi.speed,9,"#ffc857","middle")}</g>`;
    }

    out += `<g class="port-group"><rect x="112" y="425" width="450" height="90" rx="7" fill="#101d2b" stroke="${hasGpu ? "#ff6b7a" : "#50677d"}" stroke-width="2"/>
      ${svgText(130,449,hasGpu ? "GRAFIKKARTE" : "FREIE SLOTBLENDEN",10,hasGpu ? "#ff9aa5" : "#71879d")}
      ${hasGpu ? `${portImage("displayport",254,458,66,28)}${portImage("displayport",333,458,66,28)}${portImage("hdmi",412,458,66,28)}${svgText(365,505,"2× DisplayPort · HDMI",9,"#b69ae9","middle")}` : svgText(337,477,"keine dedizierte GPU gewählt",10,"#71879d","middle")}</g>`;

    let expansionY = 548;
    if (ethernet.slot) {
      out += `<g class="port-group"><rect x="112" y="${expansionY}" width="450" height="44" rx="6" fill="#112334" stroke="#65e6c4"/>${rj45(438,expansionY-7,ethernet.speed)}${svgText(130,expansionY+27,ethernet.name,10,"#d9e8f3")}</g>`;
      expansionY += 58;
    }
    if (wifi.slot) {
      out += `<g class="port-group"><rect x="112" y="${expansionY}" width="450" height="44" rx="6" fill="#112334" stroke="#ffc857"/>${portImage("wifi-antenna",482,expansionY-22,32,66)}${portImage("wifi-antenna",518,expansionY-22,32,66)}${svgText(130,expansionY+27,wifi.name+" · Antennen",10,"#ffe2a1")}</g>`;
    }
    const layer = svg.querySelector("#ports-content");
    if (!layer) return;
    layer.innerHTML = out;
    const visualText = $("#visual-text");
    if (visualText) {
      const boardText = board ? board.name : "kein Mainboard ausgewählt";
      const gpuText = hasGpu ? "Grafikausgänge der gewählten Grafikkarte" : "keine Grafikkarte und daher keine dedizierten Grafikausgänge";
      visualText.dataset.portDescription = `Rückansicht: ${boardText}; USB-A, USB-C, Audio und Mainboard-Bildausgänge; ${gpuText}; Ethernet über ${ethernet.name}; WLAN über ${wifi.name}.`;
      if (!svg.hasAttribute("hidden")) visualText.textContent = visualText.dataset.portDescription;
    }
  }

  function setView(view) {
    activeView = view === "ports" ? "ports" : "inside";
    const insideView = $("#pc-view");
    const portView = $("#port-view");

    if (activeView === "inside") {
      insideView.removeAttribute("hidden");
      portView.setAttribute("hidden","");
    } else {
      renderPorts();
      insideView.setAttribute("hidden","");
      portView.removeAttribute("hidden");
    }

    document.querySelectorAll(".view-button").forEach(button => {
      const active = button.dataset.view === activeView;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",String(active));
    });

    $("#view-legend").innerHTML = activeView === "ports"
      ? '<span><i style="background:#56c8ff" aria-hidden="true"></i>USB</span><span><i style="background:#65e6c4" aria-hidden="true"></i>Ethernet</span><span><i style="background:#ffc857" aria-hidden="true"></i>WLAN</span><span><i style="background:#b69ae9" aria-hidden="true"></i>Bildausgabe</span>'
      : '<span><i style="background:#65e6c4" aria-hidden="true"></i>Mainboard / Auswahl</span><span><i style="background:#ffc857" aria-hidden="true"></i>Stromversorgung</span><span><i style="background:#56c8ff" aria-hidden="true"></i>Speicher / Kühlung</span><span><i style="background:#ff6b7a" aria-hidden="true"></i>Grafik / Last</span>';
    const visualText = $("#visual-text");
    if (visualText) {
      visualText.textContent = activeView === "ports"
        ? visualText.dataset.portDescription || "Rückansicht der Peripherieanschlüsse."
        : visualText.dataset.insideDescription || "Innenansicht der ausgewählten PC-Komponenten.";
    }
  }

  function refreshAfterConfiguratorRender() {
    renderNetwork();
    renderPorts();
    window.BuildBenchResearch?.render();
    const button = $("#lesson-button");
    if (button) button.setAttribute("aria-label",`Lerninformationen: ${currentLessonKey()}`);
    if (activeView === "ports") setView("ports");
  }

  async function copyExtended(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const lines = ["BuildBench PC-Konfiguration", ""];
    const choices = baseSelections();
    function collected(type, id) {
      if (!id || id === "onboard") return "";
      const entry = window.BuildBenchResearch?.get(type, id) || {};
      const parts = [];
      if (entry.price !== undefined && entry.price !== "") parts.push(`${entry.price} €`);
      if (entry.watts !== undefined && entry.watts !== "") parts.push(`${entry.watts} W (${entry.powerKind === "estimated" ? "geschätzt" : "Herstellerwert"})`);
      else if (entry.powerKind === "none") parts.push("keine separate Leistungsangabe");
      if (entry.source) parts.push(`Quelle/Annahme: ${entry.source}`);
      return parts.length ? " – " + parts.join(" · ") : "";
    }
    document.querySelectorAll(".build-row").forEach(row => {
      const category = row.querySelector(".build-category")?.textContent.trim();
      const item = row.querySelector(".build-item")?.textContent.trim();
      if (category) lines.push(`${category}: ${item || "offen"}${collected(row.dataset.category, choices[row.dataset.category])}`);
    });
    lines.push(`Ethernet: ${chosen("ethernet").name}${collected("ethernet", chosen("ethernet").id)}`);
    lines.push(`WLAN: ${chosen("wifi").name}${collected("wifi", chosen("wifi").id)}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      showToast("Stückliste einschließlich Netzwerk kopiert.");
    } catch (_) {
      showToast("Kopieren wurde vom Browser blockiert.");
    }
  }

  function resetNetworkDefaults() {
    networkState.ethernet = "onboard";
    networkState.wifi = "onboard";
    saveNetwork();
    renderNetwork();
    renderPorts();
    window.BuildBenchResearch?.render();
  }

  loadNetwork();
  renderNetwork();
  renderPorts();
  window.BuildBenchResearch?.render();

  $("#copy-button")?.addEventListener("click", copyExtended, true);
  $("#reset-button")?.addEventListener("click", () => setTimeout(() => {
    const values = Object.values(baseSelections());
    if (!values.some(Boolean)) resetNetworkDefaults();
  }, 0));
  $("#example-button")?.addEventListener("click", () => setTimeout(resetNetworkDefaults, 0));
  $("#safety-button")?.addEventListener("click", () => openLesson("Grundregeln"));
  $("#lesson-button")?.addEventListener("click", () => openLesson(currentLessonKey()));
  document.querySelectorAll("#lesson-dialog .dialog-close").forEach(button => button.addEventListener("click", closeLesson));
  $("#lesson-dialog")?.addEventListener("click", event => {
    if (event.target === $("#lesson-dialog")) closeLesson();
  });
  $("#lesson-dialog")?.addEventListener("close", () => {
    if (dialogTrigger && typeof dialogTrigger.focus === "function") dialogTrigger.focus();
    dialogTrigger = null;
  });
  document.querySelectorAll(".view-button").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));

  const observer = new MutationObserver(() => {
    clearTimeout(observer.timer);
    observer.timer = setTimeout(refreshAfterConfiguratorRender, 0);
  });
  const observed = $("#build-list");
  if (observed) observer.observe(observed,{childList:true,subtree:true});

})();
