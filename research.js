(() => {
  "use strict";

  const KEY = "buildbench-research-v1";
  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  let entries = {};
  let content = null;
  try { entries = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) {}
  if (!entries || typeof entries !== "object" || Array.isArray(entries)) entries = {};

  const entryKey = (category, id) => `${category}:${id}`;
  const get = (category, id) => entries[entryKey(category, id)] || {};
  function store() {
    try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch (_) {}
  }
  function selectedItems(content) {
    let selections = {}, network = {};
    try { selections = JSON.parse(localStorage.getItem("buildbench-config-v1")) || {}; } catch (_) {}
    try { network = JSON.parse(localStorage.getItem("buildbench-network-v1")) || {}; } catch (_) {}
    const parts = content.components.categories.map((category, index) => {
      const item = content.components.components[category.id].find(candidate => candidate.id === selections[category.id]);
      return item ? { category:category.id, label:category.label, item, index } : null;
    }).filter(Boolean);
    for (const group of content.network.groups) {
      const item = group.options.find(candidate => candidate.id === network[group.id]);
      if (item && item.id !== "onboard") parts.push({ category:group.id, label:group.label + "-Karte", item, index:-1 });
    }
    return parts;
  }
  function sourceLink(item) {
    if (!item.sourceUrl) return "";
    try {
      const url = new URL(item.sourceUrl);
      if (url.protocol === "https:") return `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">Herstellerangaben ↗</a>`;
    } catch (_) {}
    return "";
  }
  function form(part) {
    const { category, item, label } = part;
    const saved = get(category, item.id);
    const prefix = `research-${category}`;
    const kind = ["documented", "estimated", "unknown", "none"].includes(saved.powerKind) ? saved.powerKind : "unknown";
    return `<div class="research-card" data-research-category="${escapeHtml(category)}" data-research-id="${escapeHtml(item.id)}">
      <p><strong>${escapeHtml(label)}: ${escapeHtml(item.name)}</strong> ${sourceLink(item)}</p>
      <small>Angaben auf der Auswahlkarte: ${escapeHtml((Array.isArray(item.specs) ? item.specs : [item.specs || item.speed]).filter(Boolean).join(" · "))}. Erfasse die Quelle oder deine Annahme.</small>
      <div class="research-fields">
        <label for="${prefix}-price">Preis (€)
          <input id="${prefix}-price" data-research-field="price" type="number" min="0" step="0.01" inputmode="decimal" value="${escapeHtml(saved.price ?? "")}" placeholder="z. B. ${item.price}">
        </label>
        <label for="${prefix}-power-kind">Leistungsangabe
          <select id="${prefix}-power-kind" data-research-field="powerKind">
            <option value="unknown" ${kind === "unknown" ? "selected" : ""}>Noch offen</option>
            <option value="documented" ${kind === "documented" ? "selected" : ""}>Herstellerwert</option>
            <option value="estimated" ${kind === "estimated" ? "selected" : ""}>Eigene Schätzung</option>
            <option value="none" ${kind === "none" ? "selected" : ""}>Keine separate Angabe</option>
          </select>
        </label>
        <label for="${prefix}-watts">Leistung (W)
          <input id="${prefix}-watts" data-research-field="watts" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(saved.watts ?? "")}" ${kind === "unknown" || kind === "none" ? "disabled" : ""} placeholder="Watt">
        </label>
        <label for="${prefix}-source">Quelle / Fundstelle oder Annahme
          <input id="${prefix}-source" data-research-field="source" type="text" maxlength="300" value="${escapeHtml(saved.source ?? "")}" placeholder="z. B. Produktblatt, Abschnitt Leistung">
        </label>
      </div>
      ${category === "psu" ? '<small>Die Wattzahl des Netzteils ist seine Nennleistung, nicht die Leistungsaufnahme des PCs.</small>' : ""}
    </div>`;
  }
  function complete(part) {
    const entry = get(part.category, part.item.id);
    const hasWatts = ["documented", "estimated"].includes(entry.powerKind) && entry.watts !== "" && entry.watts !== undefined;
    return entry.price !== "" && entry.price !== undefined &&
      (["cpu", "gpu"].includes(part.category) ? hasWatts : ["none", "unknown"].includes(entry.powerKind) || hasWatts) &&
      Boolean(entry.source?.trim());
  }
  function renderOverview(parts) {
    const done = parts.filter(complete).length;
    $("#research-progress").textContent = `${done} von ${parts.length} ausgewählten Bauteilen dokumentiert. Die Gesamtsummen berechnest du in der Auswertung.`;
    $("#research-overview-list").innerHTML = parts.map(part => `<li>${escapeHtml(part.label)}: ${escapeHtml(part.item.name)} – ${complete(part) ? "dokumentiert" : "Angaben ergänzen"}</li>`).join("") || "<li>Wähle zunächst ein Bauteil aus.</li>";
  }
  function render() {
    if (!content) return;
    const parts = selectedItems(content);
    const active = $("#category-nav button[aria-current='step']")?.dataset.index;
    const current = parts.find(part => part.index === Number(active));
    $("#research-current-content").innerHTML = current ? form(current) : "<p>Wähle oben ein Bauteil. Hier kannst du anschließend seine Angaben festhalten.</p>";
    const network = parts.filter(part => part.index === -1);
    $("#research-network").innerHTML = network.length ? `<h3>Daten zu Erweiterungskarten sammeln</h3>${network.map(form).join("")}` : "";
    renderOverview(parts);
  }
  document.addEventListener("input", update);
  document.addEventListener("change", update);
  function update(event) {
    const field = event.target.dataset?.researchField;
    if (!field) return;
    const card = event.target.closest(".research-card");
    if (!card) return;
    const key = entryKey(card.dataset.researchCategory, card.dataset.researchId);
    const entry = entries[key] || {};
    entry[field] = event.target.value;
    if (field === "powerKind") {
      const watts = card.querySelector('[data-research-field="watts"]');
      watts.disabled = !["documented", "estimated"].includes(entry.powerKind);
      if (watts.disabled) { watts.value = ""; entry.watts = ""; }
    }
    entries[key] = entry;
    store();
    if (content) renderOverview(selectedItems(content));
  }
  function clear() { entries = {}; store(); render(); }
  window.BuildBenchResearch = Object.freeze({ render, clear, get });
  window.BuildBenchContent.ready.then(data => { content = data; render(); });
})();
