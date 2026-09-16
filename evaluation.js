(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);
  const scrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const clamp = value => Math.max(0, Math.min(100, Math.round(value)));
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const euro = value => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(value || 0);

  const criteria = {
    cpu:{label:"CPU-Leistung"},
    gpu:{label:"GPU-Eignung"},
    ram:{label:"Arbeitsspeicher"},
    storage:{label:"Massenspeicher"},
    network:{label:"Netzwerk"},
    efficiency:{label:"Energieeffizienz"},
    value:{label:"Wirtschaftlichkeit"}
  };

  const scenarios = [
    {
      id:"office", title:"Office-Arbeitsplatz",
      description:"Browser, Kommunikation, Office-Suite, Fachanwendungen und mehrere Bildschirme bei niedrigen Betriebs- und Anschaffungskosten.",
      budget:900, powerTarget:220, ram:[16,32],
      weights:{cpu:15,gpu:5,ram:15,storage:20,network:15,efficiency:20,value:10}
    },
    {
      id:"developer", title:"Entwickler-Arbeitsplatz",
      description:"IDE, Container, lokale Datenbanken, Builds, Testumgebungen und mehrere parallel laufende Dienste.",
      budget:1500, powerTarget:360, ram:[32,64],
      weights:{cpu:25,gpu:5,ram:25,storage:20,network:10,efficiency:5,value:10}
    },
    {
      id:"cad", title:"CAD-Arbeitsplatz",
      description:"Interaktive 3D-Modelle, technische Zeichnungen und Render-Vorschauen; Zertifizierungen der konkreten CAD-Software bleiben gesondert zu prüfen.",
      budget:2200, powerTarget:520, ram:[32,64],
      weights:{cpu:20,gpu:35,ram:15,storage:10,network:5,efficiency:5,value:10}
    },
    {
      id:"video", title:"Videoschnitt-Arbeitsplatz",
      description:"Mehrspur-Schnitt, Effekte, Vorschau, Proxy-Erstellung und Export hochauflösender Medien.",
      budget:2500, powerTarget:580, ram:[32,96],
      weights:{cpu:25,gpu:25,ram:20,storage:20,network:5,efficiency:2,value:3}
    },
    {
      id:"ai", title:"Lokale KI-Nutzung",
      description:"Lokale Sprachmodelle, Bildgenerierung und Experimente. VRAM, Software-Ökosystem und Modellquantisierung sind besonders wichtig.",
      budget:3000, powerTarget:680, ram:[64,96],
      weights:{cpu:10,gpu:45,ram:20,storage:10,network:5,efficiency:5,value:5}
    }
  ];

  const cpuProfiles = {
    "9600x":{single:88,multi:62},"9800x3d":{single:96,multi:73},"9950x3d":{single:97,multi:100},
    "245k":{single:88,multi:75},"265k":{single:92,multi:92},"285k":{single:95,multi:100},
    "7600":{single:80,multi:52},"7800x3d":{single:91,multi:68},"14600k":{single:82,multi:74},
    "5800x3d":{single:75,multi:58},"12700k":{single:73,multi:72}
  };

  const gpuProfiles = {
    "5060ti":{cad:70,video:72,ai:78},"5070":{cad:78,video:80,ai:72},"5080":{cad:94,video:96,ai:95},
    "9070":{cad:73,video:78,ai:55},"9070xt":{cad:82,video:85,ai:60},
    "4070super":{cad:76,video:80,ai:70},"7800xt":{cad:70,video:73,ai:48},
    "3080":{cad:68,video:67,ai:55},"6800xt":{cad:64,video:65,ai:42}
  };

  const onboardNetwork = {
    x870:{lan:5,wifi:7},b850m:{lan:2.5,wifi:6.5},z890:{lan:2.5,wifi:7},b860i:{lan:2.5,wifi:7},
    b650:{lan:2.5,wifi:6.5},z790d4:{lan:2.5,wifi:6.5},b550m:{lan:1,wifi:5}
  };
  const ethernetOptions = {
    onboard:{name:"Onboard-LAN",price:0,lan:null},i210:{name:"Intel I210-T1",price:25,lan:1},
    i225:{name:"Intel I225-T1",price:39,lan:2.5},xg100:{name:"ASUS XG-C100C",price:99,lan:10},
    x550:{name:"Intel X550-T2",price:89,lan:10}
  };
  const wifiOptions = {
    onboard:{name:"Onboard-WLAN",price:0,tier:null},ax210:{name:"Intel AX210",price:35,tier:6.5},
    ax200:{name:"Intel AX200",price:25,tier:6},txe75e:{name:"TP-Link TXE75E",price:49,tier:6.5},
    be92:{name:"ASUS PCE-BE92BT",price:89,tier:7}
  };

  const suggestions = {
    cpu:"Eine CPU mit höherer Einzelkern- beziehungsweise Mehrkernleistung passend zur Anwendung wählen.",
    gpu:"GPU-Leistung, VRAM-Größe, Codec-Unterstützung und Software-Ökosystem gezielt erhöhen beziehungsweise prüfen.",
    ram:"Arbeitsspeicher bis zur empfohlenen Kapazität ausbauen und Dual-Channel-Bestückung verwenden.",
    storage:"Schnellere oder größere NVMe-SSD vorsehen; für Mediendaten ein getrenntes Arbeits- und Backup-Laufwerk planen.",
    network:"Netzwerkkarte, Switch, Verkabelung und Access Point gemeinsam auf die benötigte Datenrate abstimmen.",
    efficiency:"Leistungsaufnahme reduzieren oder effizientere CPU-, GPU- und Netzteilvarianten vergleichen.",
    value:"Leistung auf den tatsächlichen Bedarf begrenzen oder das Budget für dieses Szenario neu priorisieren."
  };

  function readJson(key,fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  }

  const snapshot = readJson("buildbench-evaluation-v1",null);
  const networkSelection = readJson("buildbench-network-v1",{ethernet:"onboard",wifi:"onboard"});
  let activeScenario = scenarios.some(item => item.id === location.hash.slice(1)) ? location.hash.slice(1) : "office";
  let evaluations = [];
  const difficultyLabels = { beginner:"Einsteiger", standard:"Standard", expert:"Experte" };

  function component(id) {
    return snapshot?.components?.[id] || null;
  }

  function generationText(item) {
    if (!item?.generation) return "aktuelle Generation";
    return item.generation === 1 ? "eine Generation zurück" : "zwei Generationen zurück";
  }

  function parseCapacity(value) {
    const match = String(value || "").replace(",",".").match(/([0-9.]+)\s*TB/i);
    return match ? Number(match[1]) : 0;
  }

  function parseVram(gpu) {
    const text = gpu?.specs?.join(" ") || "";
    const match = text.match(/(\d+)\s*GB\s*GDDR/i);
    return match ? Number(match[1]) : 0;
  }

  function capacityScore(value,minimum,ideal) {
    if (!value) return 0;
    if (value >= ideal) return 100;
    if (value >= minimum) return 70 + 30 * (value - minimum) / Math.max(1,ideal - minimum);
    return 70 * value / minimum;
  }

  function cpuScore(scenario) {
    const cpu = component("cpu");
    if (!cpu) return {score:0,reason:"Keine CPU ausgewählt."};
    const profile = cpuProfiles[cpu.id] || {single:clamp(45+(cpu.cores||0)*3),multi:clamp(30+(cpu.cores||0)*4)};
    let score;
    if (scenario.id === "office") score = 45 + profile.single * .55;
    else if (scenario.id === "cad") score = profile.single * .7 + profile.multi * .3;
    else if (scenario.id === "video") score = profile.single * .25 + profile.multi * .75;
    else if (scenario.id === "ai") score = profile.single * .35 + profile.multi * .65;
    else score = profile.single * .35 + profile.multi * .65;
    const tuning = snapshot?.difficulty?.mode === "expert" ? Number(snapshot.difficulty.cpuTuning || 0) : 0;
    score += tuning * .25;
    return {
      score:clamp(score),
      reason:`${cpu.name}: ${cpu.cores} Kerne, modellierte Einzelkern-/Mehrkernwerte ${profile.single}/${profile.multi}; ${generationText(cpu)}.${tuning ? ` Expertensimulation mit +${tuning} % Power-Limit; realer Leistungsgewinn ist meist deutlich kleiner.` : ""}`
    };
  }

  function gpuScore(scenario) {
    const gpu = component("gpu");
    if (!gpu) {
      const score = scenario.id === "office" ? 55 : scenario.id === "developer" ? 40 : 0;
      return {score,reason:"Keine dedizierte GPU ausgewählt; integrierte Grafik und deren Monitoranschlüsse müssten gesondert geprüft werden."};
    }
    const profile = gpuProfiles[gpu.id] || {cad:50,video:50,ai:40};
    const vram = parseVram(gpu);
    let score;
    if (scenario.id === "office") score = 92;
    else if (scenario.id === "developer") score = 75 + Math.min(15,vram/2);
    else score = profile[scenario.id] ?? 60;
    const special = scenario.id === "ai"
      ? "Für lokale KI zählen neben Rechenleistung besonders VRAM und Framework-Unterstützung."
      : scenario.id === "cad"
        ? "Die Freigabe des konkreten CAD-Herstellers ist nicht Teil dieses Modells."
        : scenario.id === "video"
          ? "Codec-Unterstützung und Beschleunigung hängen zusätzlich von der Schnittsoftware ab."
          : "Für Standarddarstellung ist die Leistung mehr als ausreichend.";
    const tuning = snapshot?.difficulty?.mode === "expert" ? Number(snapshot.difficulty.gpuTuning || 0) : 0;
    score += tuning * .2;
    return {score:clamp(score),reason:`${gpu.name} mit ${vram || "unbekanntem"} GB VRAM und ${gpu.power} W Basislast.${tuning ? ` Expertensimulation mit +${tuning} % Power-Limit; Leistung skaliert nicht proportional.` : ""} ${special}`};
  }

  function ramScore(scenario) {
    const ram = component("ram");
    if (!ram) return {score:0,reason:"Kein Arbeitsspeicher ausgewählt."};
    const [minimum,ideal] = scenario.ram;
    const base = capacityScore(ram.capacity,minimum,ideal);
    const speedBonus = ram.type === "DDR5" ? 3 : 0;
    return {
      score:clamp(base+speedBonus),
      reason:`${ram.capacity} GB ${ram.type} bei ${ram.speed} MT/s. Für dieses Szenario gelten ${minimum} GB als Mindest- und ${ideal} GB als Zielgröße.`
    };
  }

  function storageScore(scenario) {
    const storage = component("storage");
    if (!storage) return {score:0,reason:"Kein Massenspeicher ausgewählt."};
    const capacity = parseCapacity(storage.capacity);
    let performance = storage.interface === "NVMe" ? 68 + (storage.pcieGen || 3) * 6 : storage.mount === "3.5" ? 32 : 62;
    const idealCapacity = scenario.id === "office" ? 1 : scenario.id === "developer" ? 2 : scenario.id === "cad" ? 2 : scenario.id === "video" ? 4 : 2;
    const capacityPart = capacityScore(capacity,Math.min(1,idealCapacity),idealCapacity);
    let score = performance * .72 + capacityPart * .28;
    if (scenario.id === "video" && storage.mount === "3.5") score -= 18;
    return {
      score:clamp(score),
      reason:`${storage.name}: ${storage.interface}${storage.pcieGen ? " über PCIe "+storage.pcieGen+".0" : ""}, ${storage.capacity}. Zielgröße für das Szenario: etwa ${idealCapacity} TB schneller Arbeitsspeicher.`
    };
  }

  function networkDetails() {
    const board = component("motherboard");
    const onboard = onboardNetwork[board?.id] || {lan:1,wifi:0};
    const ethernet = ethernetOptions[networkSelection.ethernet] || ethernetOptions.onboard;
    const wifi = wifiOptions[networkSelection.wifi] || wifiOptions.onboard;
    return {
      ethernet,wifi,
      lan:ethernet.lan ?? onboard.lan,
      wifiTier:wifi.tier ?? onboard.wifi,
      cost:ethernet.price+wifi.price
    };
  }

  function networkScore() {
    if (!component("motherboard")) return {score:0,reason:"Ohne Mainboard lassen sich Onboard-Netzwerk und verfügbare PCIe-Steckplätze nicht bewerten."};
    const net = networkDetails();
    const wired = net.lan >= 10 ? 100 : net.lan >= 5 ? 90 : net.lan >= 2.5 ? 82 : 68;
    const wireless = net.wifiTier >= 7 ? 100 : net.wifiTier >= 6.5 ? 88 : net.wifiTier >= 6 ? 78 : net.wifiTier >= 5 ? 62 : 25;
    return {
      score:clamp(wired*.72+wireless*.28),
      reason:`${net.ethernet.name}: ${net.lan} Gbit/s; ${net.wifi.name}: ${net.wifiTier ? "Wi-Fi "+String(net.wifiTier).replace(".5","E") : "kein WLAN"}. Reale Leistung wird durch Switch, Kabel, Access Point und Gegenstelle begrenzt.`
    };
  }

  function efficiencyScore(scenario) {
    const cpu = component("cpu"), gpu = component("gpu"), psu = component("psu");
    if (!cpu || !psu) return {score:0,reason:"CPU und Netzteil werden für die Effizienzbewertung benötigt."};
    const load = snapshot?.power?.load || (cpu.power||0)+(gpu?.power||0)+110;
    const over = Math.max(0,load-scenario.powerTarget);
    const legacyPenalty = ((cpu.generation||0)+(gpu?.generation||0))*3 + (psu.atx3 === false ? 4 : 0);
    const score = clamp(100-over*.16-legacyPenalty);
    return {
      score,
      reason:`Geschätzte Volllast ${load} W gegenüber ${scenario.powerTarget} W Szenario-Richtwert; Netzteil ${psu.watts} W, ${psu.atx3 ? "ATX 3.x" : "ATX 2.4"}.`
    };
  }

  function totalPrice() {
    return (snapshot?.total || 0) + networkDetails().cost;
  }

  function valueScore(scenario) {
    if (!snapshot) return {score:0,reason:"Keine Preisbasis vorhanden."};
    const total = totalPrice();
    const ratio = total/scenario.budget;
    let score = ratio <= 1 ? 100 : 100-(ratio-1)*85;
    if (ratio < .35) score -= 8;
    return {
      score:clamp(score),
      reason:`Modellpreis ${euro(total)} gegenüber ${euro(scenario.budget)} Orientierungsbudget. Gebrauchtpreise, Lizenzen, Peripherie und Betriebskosten sind nicht enthalten.`
    };
  }

  function scoreCriterion(key,scenario) {
    if (key === "cpu") return cpuScore(scenario);
    if (key === "gpu") return gpuScore(scenario);
    if (key === "ram") return ramScore(scenario);
    if (key === "storage") return storageScore(scenario);
    if (key === "network") return networkScore(scenario);
    if (key === "efficiency") return efficiencyScore(scenario);
    return valueScore(scenario);
  }

  function evaluate(scenario) {
    const breakdown = Object.entries(scenario.weights).map(([key,weight]) => {
      const result = scoreCriterion(key,scenario);
      return {...result,key,label:criteria[key].label,weight,contribution:result.score*weight/100};
    });
    return {...scenario,breakdown,score:clamp(breakdown.reduce((sum,item)=>sum+item.contribution,0))};
  }

  function grade(score) {
    if (score >= 85) return {label:"Sehr gut geeignet",className:"excellent",color:"#65e6c4"};
    if (score >= 70) return {label:"Gut geeignet",className:"good",color:"#56c8ff"};
    if (score >= 55) return {label:"Bedingt geeignet",className:"limited",color:"#ffc857"};
    return {label:"Wenig geeignet",className:"poor",color:"#ff6b7a"};
  }

  function renderSnapshot() {
    const state = $("#snapshot-state");
    const chips = $("#snapshot-chips");
    const warning = $("#snapshot-warning");
    if (!snapshot?.components) {
      state.textContent = "keine Konfiguration";
      state.className = "snapshot-state warning";
      chips.innerHTML = '<a class="btn btn-primary" href="index.html">Jetzt konfigurieren</a>';
      warning.hidden = false;
      warning.textContent = "Öffne den Konfigurator, wähle Komponenten und kehre anschließend zu dieser Seite zurück.";
      return;
    }

    const labels = {case:"Gehäuse",motherboard:"Mainboard",cpu:"CPU",gpu:"GPU",ram:"RAM",psu:"Netzteil",storage:"Speicher"};
    const selected = Object.entries(labels).filter(([key])=>component(key));
    const missing = Object.entries(labels).filter(([key])=>!component(key)).map(([,label])=>label);
    state.textContent = missing.length ? `${missing.length} Kernangaben fehlen` : "auswertbar";
    state.className = `snapshot-state ${missing.length ? "warning" : "good"}`;
    chips.innerHTML = selected.map(([key,label])=>`<span class="snapshot-chip"><b>${label}</b> ${escapeHtml(component(key).name)}</span>`).join("") +
      `<span class="snapshot-chip"><b>Modus</b> ${difficultyLabels[snapshot.difficulty?.mode] || "Standard"}</span><span class="snapshot-chip"><b>Preis</b> ${euro(totalPrice())}</span><span class="snapshot-chip"><b>Last</b> ${snapshot.power?.load || 0} W</span>`;
    warning.hidden = !missing.length;
    warning.textContent = missing.length ? `Fehlend: ${missing.join(", ")}. Nicht belegte Kriterien erhalten 0 Punkte und senken die Bewertung.` : "";
  }

  function renderScenarios() {
    evaluations = scenarios.map(evaluate);
    const best = Math.max(...evaluations.map(item=>item.score));
    $("#scenario-grid").innerHTML = evaluations.map(item => {
      const result = grade(item.score);
      return `<button class="scenario-card ${item.id===activeScenario ? "active" : ""} ${item.score===best ? "best" : ""}" type="button" data-scenario="${item.id}" aria-pressed="${item.id===activeScenario}">
        <h3>${item.title}</h3>
        <div class="scenario-score"><strong style="color:${result.color}">${item.score}</strong><span>/ 100</span></div>
        <div class="mini-track" aria-hidden="true" style="--value:${item.score}%;--score-color:${result.color}"><i></i></div>
        <p>${result.label}</p>
        ${item.score===best ? '<span class="visually-hidden">Beste Eignung im Vergleich.</span>' : ""}
      </button>`;
    }).join("");
    document.querySelectorAll(".scenario-card").forEach(button=>button.addEventListener("click",()=>{
      activeScenario=button.dataset.scenario;
      history.replaceState(null,"",`#${activeScenario}`);
      renderScenarios();
      renderDetail();
      $("#detail-title").focus({preventScroll:true});
      $("#detail-panel").scrollIntoView({behavior:scrollBehavior,block:"start"});
    }));
  }

  function strengthText(item) {
    return `${item.label}: ${item.score}/100 – ${item.reason}`;
  }

  function renderDetail() {
    const result = evaluations.find(item=>item.id===activeScenario) || evaluations[0];
    const resultGrade = grade(result.score);
    $("#detail-title").textContent = result.title;
    $("#detail-description").textContent = result.description;
    $("#detail-score").textContent = result.score;
    $("#score-ring").style.setProperty("--score-percent",`${result.score}%`);
    $("#score-ring").style.setProperty("--ring-color",resultGrade.color);
    $("#score-ring").setAttribute("aria-label",`Gesamtwertung für ${result.title}: ${result.score} von 100 Punkten, ${resultGrade.label}.`);
    $("#verdict").innerHTML = `<strong>${resultGrade.label}.</strong> Die Gesamtwertung beträgt ${result.score} von 100 Punkten. Hohe Einzelwerte gleichen schwache Kriterien nur entsprechend ihrer ausgewiesenen Gewichtung aus.`;

    $("#criteria-body").innerHTML = result.breakdown.map(item=>{
      const color=grade(item.score).color;
      return `<tr>
        <td class="criterion-name">${item.label}</td>
        <td>${item.weight} %</td>
        <td class="rating-cell"><div class="rating-value"><span>${grade(item.score).label}</span><strong>${item.score}</strong></div><div class="rating-track" style="--value:${item.score}%;--bar-color:${color}"><i></i></div></td>
        <td>${item.contribution.toFixed(1).replace(".",",")} P</td>
        <td class="reason-cell">${escapeHtml(item.reason)}</td>
      </tr>`;
    }).join("");

    const strengths=result.breakdown.filter(item=>item.score>=80).sort((a,b)=>b.contribution-a.contribution).slice(0,3);
    const gaps=result.breakdown.filter(item=>item.score<65).sort((a,b)=>a.score-b.score).slice(0,4);
    $("#strength-list").innerHTML = strengths.length
      ? strengths.map(item=>`<li>${escapeHtml(strengthText(item))}</li>`).join("")
      : "<li>Der Entwurf erreicht in keinem gewichteten Kriterium mindestens 80 Punkte.</li>";
    $("#improvement-list").innerHTML = gaps.length
      ? gaps.map(item=>`<li><strong>${item.label} (${item.score}/100):</strong> ${escapeHtml(suggestions[item.key])}</li>`).join("")
      : "<li>Kein kritischer Engpass im Modell. Nun reale Benchmarks, Softwarefreigaben und Gesamtkosten prüfen.</li>";
    window.BuildBenchLMS?.recordEvaluation({
      scenario: result.id,
      score: result.score,
      hasConfiguration: Boolean(snapshot?.components)
    });
  }

  $("#print-button")?.addEventListener("click",()=>window.print());
  renderSnapshot();
  renderScenarios();
  renderDetail();
})();
