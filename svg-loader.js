(() => {
  "use strict";

  const templates = [
    {
      host: "pc-view-host",
      source: "assets/svg/inside-view.svg",
      id: "pc-view",
      layer: "inside-content",
      title: "Schnittansicht des zusammengestellten PCs",
      description: "Die Innenansicht konnte nicht vollständig geladen werden."
    },
    {
      host: "port-view-host",
      source: "assets/svg/ports-view.svg",
      id: "port-view",
      layer: "ports-content",
      title: "Rückansicht mit Peripherieanschlüssen",
      description: "Die Anschlussansicht konnte nicht vollständig geladen werden."
    }
  ];

  function safeSvg(documentNode, expected) {
    const root = documentNode.documentElement;
    if (root?.namespaceURI !== "http://www.w3.org/2000/svg" || root.id !== expected.id) {
      throw new Error(`Unerwartete SVG-Wurzel in ${expected.source}`);
    }
    root.querySelectorAll("script, foreignObject").forEach(node => node.remove());
    root.querySelectorAll("*").forEach(node => {
      for (const attribute of [...node.attributes]) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim();
        if (name.startsWith("on")) node.removeAttribute(attribute.name);
        if ((name === "href" || name.endsWith(":href")) && !value.startsWith("#")) {
          node.removeAttribute(attribute.name);
        }
      }
    });
    if (!root.querySelector(`#${expected.layer}`)) {
      throw new Error(`Dynamische Ebene #${expected.layer} fehlt in ${expected.source}`);
    }
    return root;
  }

  function fallbackSvg(expected) {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.id = expected.id;
    svg.setAttribute("viewBox", "0 0 680 720");
    svg.setAttribute("role", "img");
    const title = document.createElementNS(namespace, "title");
    title.textContent = expected.title;
    const description = document.createElementNS(namespace, "desc");
    description.textContent = expected.description;
    const layer = document.createElementNS(namespace, "g");
    layer.id = expected.layer;
    svg.append(title, description, layer);
    return svg;
  }

  async function loadTemplate(expected) {
    const host = document.getElementById(expected.host);
    if (!host) throw new Error(`SVG-Platzhalter #${expected.host} fehlt`);
    let svg;
    try {
      const response = await fetch(expected.source, { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsed = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
      if (parsed.querySelector("parsererror")) throw new Error("XML ist ungültig");
      svg = document.importNode(safeSvg(parsed, expected), true);
      svg.dataset.source = expected.source;
    } catch (error) {
      console.error(`SVG-Vorlage ${expected.source} konnte nicht geladen werden:`, error);
      svg = fallbackSvg(expected);
      svg.dataset.loadError = "true";
    }
    if (host.hidden) svg.setAttribute("hidden", "");
    host.replaceWith(svg);
    return svg;
  }

  const ready = Promise.all(templates.map(loadTemplate));
  window.BuildBenchSVG = Object.freeze({ ready });
})();
