"use strict";

const { readFileSync } = require("node:fs");
const vm = require("node:vm");

const catalog = JSON.parse(readFileSync("content/components.json", "utf8"));
const components = Object.fromEntries(catalog.categories.map(({id})=>[id,catalog.components[id][0]]));
const research = Object.fromEntries(Object.entries(components).map(([key,item])=>[`${key}:${item.id}`,{
  price:String(item.price), powerKind:["cpu","gpu"].includes(key) ? "documented" : "unknown",
  watts:["cpu","gpu"].includes(key) ? String(item.power) : "", source:"Auswahlkarte"
}]));
research["ethernet:i210"] = {price:"25",powerKind:"unknown",watts:"",source:"Netzwerkkarte"};
const expectedPrice = Object.values(components).reduce((sum,item)=>sum+item.price,25);
const expectedLoad = components.cpu.power + components.gpu.power + 110;
const data = new Map([
  ["buildbench-evaluation-v1",JSON.stringify({total:expectedPrice-25,components,power:{load:expectedLoad},difficulty:{mode:"standard"},compatibility:{issueCount:0}})],
  ["buildbench-network-v1",JSON.stringify({ethernet:"i210",wifi:"onboard"})],
  ["buildbench-research-v1",JSON.stringify(research)]
]);

function openEvaluation() {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id,{
      value:"", innerHTML:"", textContent:"", hidden:false, dataset:{}, style:{setProperty(){}},
      classList:{toggle(){}}, addEventListener(name,fn){this[name]=fn}, setAttribute(){}, focus(){}, scrollIntoView(){}
    });
    return nodes.get(id);
  };
  const context = {
    window:{matchMedia:()=>({matches:false}),print(){}},
    document:{querySelector:node,querySelectorAll:()=>[]},
    localStorage:{getItem:key=>data.get(key) || null,setItem:(key,value)=>data.set(key,value)},
    location:{hash:""}, history:{replaceState(){}},
    console, Date, JSON, Math, Number, Object, String, Array, RegExp, Set, Intl
  };
  vm.runInNewContext(readFileSync("evaluation.js","utf8"),context,{filename:"evaluation.js"});
  return node;
}

let node = openEvaluation();
if (node("#snapshot-chips").innerHTML.includes(`${expectedPrice} €`)) throw new Error("Gesamtpreis wurde vor der eigenen Rechnung angezeigt.");
node("#calculated-price").value = String(expectedPrice-10);
node("#calculated-load").value = String(expectedLoad);
node("#calculation-form").submit({preventDefault(){}});
if (!node("#calculation-feedback").textContent.includes("Prüfe die Summe")) throw new Error("Hinweis auf Preisfehler fehlt.");
node("#calculated-price").value = String(expectedPrice);
node("#calculation-form").submit({preventDefault(){}});
if (!JSON.parse(data.get("buildbench-calculation-v1")).verified) throw new Error("Korrekte Rechnung nicht gespeichert.");
if (!node("#snapshot-chips").innerHTML.includes(`${expectedLoad} W`)) throw new Error("Geprüfte Last wird nicht angezeigt.");

research["cpu:"+components.cpu.id].price = String(components.cpu.price+1);
data.set("buildbench-research-v1",JSON.stringify(research));
node = openEvaluation();
if (node("#snapshot-chips").innerHTML.includes(`${expectedLoad} W`)) throw new Error("Geänderte Datensammlung hat die Prüfung nicht zurückgesetzt.");
console.log("Eigene Rechnung bestanden (Hinweise, Prüfung, Speicherung und Ungültigkeit bei Datenänderung).");
