"use strict";

const { readFileSync } = require("node:fs");
const vm = require("node:vm");

const components = JSON.parse(readFileSync("content/components.json", "utf8"));
const network = JSON.parse(readFileSync("content/network.json", "utf8"));
const saved = new Map([
  ["buildbench-config-v1", JSON.stringify({cpu:"9600x",gpu:"5070"})],
  ["buildbench-network-v1", JSON.stringify({ethernet:"i210",wifi:"onboard"})]
]);
const nodes = Object.fromEntries(["#research-current-content","#research-network","#research-progress","#research-overview-list"].map(id => [id,{innerHTML:"",textContent:""}]));
const listeners = {};
const document = {
  querySelector(selector) { return selector === "#category-nav button[aria-current='step']" ? {dataset:{index:"2"}} : nodes[selector] || null; },
  addEventListener(name, fn) { listeners[name] = fn; }
};
const context = {
  document,
  localStorage:{ getItem:key=>saved.get(key) || null, setItem:(key,value)=>saved.set(key,value) },
  window:{ BuildBenchContent:{ready:Promise.resolve({components,network})} },
  URL,
  JSON,
  Object,
  Array,
  String,
  Number
};
vm.runInNewContext(readFileSync("research.js","utf8"), context, {filename:"research.js"});

setImmediate(() => {
  const research = context.window.BuildBenchResearch;
  if (!nodes["#research-current-content"].innerHTML.includes("Ryzen 5 9600X")) throw new Error("CPU-Sammelkarte fehlt.");
  if (!nodes["#research-network"].innerHTML.includes("Intel I210-T1")) throw new Error("Netzwerkkarte fehlt.");
  if (!nodes["#research-progress"].textContent.includes("0 von 3")) throw new Error("Anfangsstand falsch.");

  const watts = {value:"",disabled:true};
  const card = {dataset:{researchCategory:"cpu",researchId:"9600x"},querySelector:()=>watts};
  for (const [field,value] of [["price","235"],["powerKind","documented"],["watts","88"],["source","Datenblatt CPU, Abschnitt Leistung"]]) {
    listeners[field === "powerKind" ? "change" : "input"]({target:{dataset:{researchField:field},value,closest:()=>card}});
  }
  if (watts.disabled || research.get("cpu","9600x").watts !== "88") throw new Error("Leistungsangabe wurde nicht gespeichert.");
  if (!nodes["#research-progress"].textContent.includes("1 von 3")) throw new Error("Sammelfortschritt falsch.");
  if (!saved.get("buildbench-research-v1").includes("Datenblatt CPU")) throw new Error("Lokale Speicherung fehlt.");

  saved.set("buildbench-config-v1", JSON.stringify({cpu:"9800x3d",gpu:"5070"}));
  research.render();
  if (nodes["#research-current-content"].innerHTML.includes('value="235"')) throw new Error("Daten einer anderen CPU wurden übernommen.");
  research.clear();
  if (Object.keys(JSON.parse(saved.get("buildbench-research-v1"))).length) throw new Error("Zurücksetzen hat die Daten behalten.");
  console.log("Datensammlung bestanden (Bauteile, Netzwerkkarten, Speicherung, Wechsel und Reset).");
});
