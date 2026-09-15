(async () => {
  "use strict";

  await window.BuildBenchSVG?.ready;

  const categories = [
    { id: "case", label: "Gehäuse", title: "Gehäuse auswählen", description: "Das Gehäuse setzt die Grenzen für Mainboard, Grafikkarte, Kühler, Radiator und Netzteil." },
    { id: "motherboard", label: "Mainboard", title: "Mainboard auswählen", description: "Formfaktor, CPU-Sockel, RAM-Typ und Laufwerksanschlüsse müssen zusammenpassen." },
    { id: "cpu", label: "CPU", title: "Prozessor auswählen", description: "Die CPU bestimmt Sockel, Kühlbedarf und einen wesentlichen Teil der Leistungsaufnahme." },
    { id: "gpu", label: "Grafikkarte", title: "Grafikkarte auswählen", description: "Geprüft werden Kartenlänge, Leistungsaufnahme und Stromanschluss." },
    { id: "ram", label: "Arbeitsspeicher", title: "Arbeitsspeicher auswählen", description: "Alle angebotenen Kits sind DDR5; Kapazität und Takt richten sich nach dem Einsatzzweck." },
    { id: "psu", label: "Netzteil", title: "Netzteil auswählen", description: "Die Empfehlung enthält 30 % Reserve für Lastspitzen, Alterung und spätere Erweiterungen." },
    { id: "cooler", label: "CPU-Kühler", title: "CPU-Kühler auswählen", description: "Höhe oder Radiatorgröße, Sockel und Kühlleistung werden gemeinsam geprüft." },
    { id: "storage", label: "Festplatte", title: "Massenspeicher auswählen", description: "M.2/NVMe sitzt direkt auf dem Mainboard; SATA-Laufwerke benötigen Platz und Datenkabel." },
    { id: "standoffs", label: "Abstandhalter", title: "Abstandhalter auswählen", description: "Anzahl, Gewinde und Mainboard-Formfaktor entscheiden über die sichere Montage." },
    { id: "screws", label: "Schrauben", title: "Schraubensatz auswählen", description: "Der Satz muss Mainboard und gegebenenfalls SATA-Laufwerke abdecken." },
    { id: "cables", label: "Kabel", title: "Kabelsatz auswählen", description: "SATA-Datenkabel und moderne GPU-Stecker werden abhängig von der Auswahl verlangt." },
    { id: "coolant", label: "Kühlmittel", title: "Kühlmittel auswählen", description: "Luftkühler und geschlossene AIOs benötigen kein Kühlmittel; ein Custom Loop dagegen schon." }
  ];

  const data = {
    case: [
      { id:"north", maker:"Fractal Design", name:"North", price:145, form:["ATX","mATX","ITX"], maxGpu:355, maxCooler:170, psu:["ATX"], radiators:[120,240,280,360], drives:["M.2","2.5","3.5"], thread:"6-32", size:"Midi-Tower", recommended:true, specs:["ATX · mATX · ITX","GPU 355 mm","Kühler 170 mm"] },
      { id:"4000d", maker:"Corsair", name:"4000D Airflow", price:105, form:["ATX","mATX","ITX"], maxGpu:360, maxCooler:170, psu:["ATX"], radiators:[120,240,280,360], drives:["M.2","2.5","3.5"], thread:"6-32", size:"Midi-Tower", specs:["ATX · mATX · ITX","GPU 360 mm","360-mm-Radiator"] },
      { id:"ap201", maker:"ASUS", name:"Prime AP201", price:89, form:["mATX","ITX"], maxGpu:338, maxCooler:170, psu:["ATX"], radiators:[120,240,280,360], drives:["M.2","2.5","3.5"], thread:"6-32", size:"Micro-Tower", specs:["mATX · ITX","GPU 338 mm","Mesh"] },
      { id:"nr200p", maker:"Cooler Master", name:"NR200P V2", price:119, form:["ITX"], maxGpu:356, maxCooler:67, psu:["SFX","SFX-L"], radiators:[120,240,280], drives:["M.2","2.5"], thread:"6-32", size:"Mini-ITX", specs:["ITX","GPU 356 mm","SFX-Netzteil"] }
    ],
    motherboard: [
      { id:"x870", maker:"MSI", name:"MAG X870 Tomahawk WiFi", price:319, form:"ATX", socket:"AM5", memory:"DDR5", m2:4, m2Gen:5, sata:4, standoff:9, specs:["AM5","ATX","4× M.2 · Wi-Fi 7"], recommended:true },
      { id:"b850m", maker:"ASRock", name:"B850M Pro RS WiFi", price:199, form:"mATX", socket:"AM5", memory:"DDR5", m2:3, m2Gen:5, sata:4, standoff:8, specs:["AM5","mATX","3× M.2 · Wi-Fi 6E"] },
      { id:"z890", maker:"Gigabyte", name:"Z890 AORUS Elite WiFi7", price:299, form:"ATX", socket:"LGA1851", memory:"DDR5", m2:4, m2Gen:5, sata:4, standoff:9, specs:["LGA1851","ATX","4× M.2 · Wi-Fi 7"] },
      { id:"b860i", maker:"ASUS", name:"ROG Strix B860-I Gaming WiFi", price:239, form:"ITX", socket:"LGA1851", memory:"DDR5", m2:2, m2Gen:5, sata:2, standoff:4, specs:["LGA1851","ITX","2× M.2 · Wi-Fi 7"] },
      { id:"b650", maker:"MSI", name:"B650 Gaming Plus WiFi", price:159, form:"ATX", socket:"AM5", memory:"DDR5", m2:2, m2Gen:4, sata:4, standoff:9, generation:1, specs:["AM5","ATX · DDR5","PCIe 4.0 · Wi-Fi 6E"] },
      { id:"z790d4", maker:"MSI", name:"PRO Z790-P WiFi DDR4", price:179, form:"ATX", socket:"LGA1700", memory:"DDR4", m2:4, m2Gen:4, sata:4, standoff:9, generation:1, specs:["LGA1700","ATX · DDR4","4× M.2 · Wi-Fi 6E"] },
      { id:"b550m", maker:"MSI", name:"B550M PRO-VDH WiFi", price:109, form:"mATX", socket:"AM4", memory:"DDR4", m2:2, m2Gen:4, sata:4, standoff:8, generation:2, specs:["AM4","mATX · DDR4","PCIe 4.0 · Wi-Fi 5"] }
    ],
    cpu: [
      { id:"9600x", maker:"AMD", name:"Ryzen 5 9600X", price:235, socket:"AM5", cores:6, power:88, label:"R5", specs:["6C / 12T","bis 5,4 GHz","88 W PPT"], recommended:true },
      { id:"9800x3d", maker:"AMD", name:"Ryzen 7 9800X3D", price:529, socket:"AM5", cores:8, power:162, label:"R7", specs:["8C / 16T","3D V-Cache","162 W PPT"] },
      { id:"9950x3d", maker:"AMD", name:"Ryzen 9 9950X3D", price:749, socket:"AM5", cores:16, power:230, label:"R9", specs:["16C / 32T","3D V-Cache","230 W PPT"] },
      { id:"245k", maker:"Intel", name:"Core Ultra 5 245K", price:299, socket:"LGA1851", cores:14, power:159, label:"U5", specs:["14 Kerne","bis 5,2 GHz","159 W Turbo"] },
      { id:"265k", maker:"Intel", name:"Core Ultra 7 265K", price:399, socket:"LGA1851", cores:20, power:250, label:"U7", specs:["20 Kerne","bis 5,5 GHz","250 W Turbo"] },
      { id:"285k", maker:"Intel", name:"Core Ultra 9 285K", price:589, socket:"LGA1851", cores:24, power:250, label:"U9", specs:["24 Kerne","bis 5,7 GHz","250 W Turbo"] },
      { id:"7600", maker:"AMD", name:"Ryzen 5 7600", price:169, socket:"AM5", cores:6, power:88, label:"R5", generation:1, specs:["6C / 12T","Zen 4 · AM5","88 W PPT"] },
      { id:"7800x3d", maker:"AMD", name:"Ryzen 7 7800X3D", price:329, socket:"AM5", cores:8, power:162, label:"R7", generation:1, specs:["8C / 16T","Zen 4 · 3D V-Cache","162 W PPT"] },
      { id:"14600k", maker:"Intel", name:"Core i5-14600K", price:219, socket:"LGA1700", cores:14, power:181, label:"i5", generation:1, specs:["14 Kerne / 20 Threads","Raptor Lake Refresh","181 W Turbo"] },
      { id:"5800x3d", maker:"AMD", name:"Ryzen 7 5800X3D", price:229, socket:"AM4", cores:8, power:142, label:"R7", generation:2, specs:["8C / 16T","Zen 3 · 3D V-Cache","142 W PPT"] },
      { id:"12700k", maker:"Intel", name:"Core i7-12700K", price:199, socket:"LGA1700", cores:12, power:190, label:"i7", generation:2, specs:["12 Kerne / 20 Threads","Alder Lake","190 W Turbo"] }
    ],
    gpu: [
      { id:"5060ti", maker:"NVIDIA", name:"GeForce RTX 5060 Ti 16 GB", price:499, length:242, power:180, connector:"8-pin", label:"5060 Ti", specs:["16 GB GDDR7","242 mm","180 W"], recommended:true },
      { id:"5070", maker:"NVIDIA", name:"GeForce RTX 5070 12 GB", price:649, length:242, power:250, connector:"12V-2x6", label:"RTX 5070", specs:["12 GB GDDR7","242 mm","250 W"] },
      { id:"5080", maker:"NVIDIA", name:"GeForce RTX 5080 16 GB", price:1199, length:304, power:360, connector:"12V-2x6", label:"RTX 5080", specs:["16 GB GDDR7","304 mm","360 W"] },
      { id:"9070", maker:"AMD", name:"Radeon RX 9070 16 GB", price:659, length:289, power:220, connector:"2× 8-pin", label:"RX 9070", specs:["16 GB GDDR6","289 mm","220 W"] },
      { id:"9070xt", maker:"AMD", name:"Radeon RX 9070 XT 16 GB", price:759, length:304, power:304, connector:"3× 8-pin", label:"9070 XT", specs:["16 GB GDDR6","304 mm","304 W"] },
      { id:"4070super", maker:"NVIDIA", name:"GeForce RTX 4070 SUPER 12 GB", price:499, length:267, power:220, connector:"12V-2x6", label:"4070 S", generation:1, specs:["12 GB GDDR6X","267 mm","220 W"] },
      { id:"7800xt", maker:"AMD", name:"Radeon RX 7800 XT 16 GB", price:449, length:267, power:263, connector:"2× 8-pin", label:"7800 XT", generation:1, specs:["16 GB GDDR6","267 mm","263 W"] },
      { id:"3080", maker:"NVIDIA", name:"GeForce RTX 3080 10 GB", price:349, length:285, power:320, connector:"2× 8-pin", label:"RTX 3080", generation:2, specs:["10 GB GDDR6X","285 mm","320 W"] },
      { id:"6800xt", maker:"AMD", name:"Radeon RX 6800 XT 16 GB", price:329, length:267, power:300, connector:"2× 8-pin", label:"6800 XT", generation:2, specs:["16 GB GDDR6","267 mm","300 W"] }
    ],
    ram: [
      { id:"32-6000", maker:"G.Skill", name:"Flare X5 32 GB", price:109, type:"DDR5", modules:2, capacity:32, speed:6000, specs:["2× 16 GB","DDR5-6000","CL30"], recommended:true },
      { id:"64-6000", maker:"Kingston", name:"Fury Beast 64 GB", price:209, type:"DDR5", modules:2, capacity:64, speed:6000, specs:["2× 32 GB","DDR5-6000","CL30"] },
      { id:"64-6400", maker:"Corsair", name:"Vengeance RGB 64 GB", price:229, type:"DDR5", modules:2, capacity:64, speed:6400, specs:["2× 32 GB","DDR5-6400","RGB"] },
      { id:"96-6400", maker:"Crucial", name:"Pro 96 GB", price:289, type:"DDR5", modules:2, capacity:96, speed:6400, specs:["2× 48 GB","DDR5-6400","CL40"] },
      { id:"32-3600", maker:"G.Skill", name:"Ripjaws V 32 GB", price:69, type:"DDR4", modules:2, capacity:32, speed:3600, generation:1, specs:["2× 16 GB","DDR4-3600","CL16"] },
      { id:"64-3200", maker:"Kingston", name:"Fury Beast 64 GB DDR4", price:119, type:"DDR4", modules:2, capacity:64, speed:3200, generation:2, specs:["2× 32 GB","DDR4-3200","CL16"] }
    ],
    psu: [
      { id:"rm650e", maker:"Corsair", name:"RM650e", price:99, form:"ATX", watts:650, atx3:true, specs:["650 W","ATX 3.1","80 Plus Gold"] },
      { id:"pp750", maker:"be quiet!", name:"Pure Power 12 M 750W", price:119, form:"ATX", watts:750, atx3:true, specs:["750 W","ATX 3.1","80 Plus Gold"], recommended:true },
      { id:"rm850x", maker:"Corsair", name:"RM850x", price:159, form:"ATX", watts:850, atx3:true, specs:["850 W","ATX 3.1","vollmodular"] },
      { id:"vertex1000", maker:"Seasonic", name:"Vertex GX-1000", price:209, form:"ATX", watts:1000, atx3:true, specs:["1000 W","ATX 3.0","80 Plus Gold"] },
      { id:"vsfx750", maker:"Cooler Master", name:"V SFX Gold 750", price:149, form:"SFX", watts:750, atx3:true, specs:["750 W","SFX","80 Plus Gold"] },
      { id:"focus750", maker:"Seasonic", name:"Focus GX-750", price:89, form:"ATX", watts:750, atx3:false, generation:1, specs:["750 W","ATX 2.4","2× PCIe 8-Pin"] },
      { id:"straight850", maker:"be quiet!", name:"Straight Power 11 850W", price:109, form:"ATX", watts:850, atx3:false, generation:2, specs:["850 W","ATX 2.4","80 Plus Gold"] }
    ],
    cooler: [
      { id:"freezer36", maker:"ARCTIC", name:"Freezer 36", price:35, kind:"air", height:159, capacity:220, sockets:["AM5","AM4","LGA1851","LGA1700"], specs:["Tower-Kühler","159 mm","220 W Klasse"], recommended:true },
      { id:"nhd15", maker:"Noctua", name:"NH-D15 G2", price:149, kind:"air", height:168, capacity:280, sockets:["AM5","AM4","LGA1851","LGA1700"], specs:["Dual-Tower","168 mm","High-End"] },
      { id:"lf240", maker:"ARCTIC", name:"Liquid Freezer III 240", price:79, kind:"aio", radiator:240, capacity:300, sockets:["AM5","AM4","LGA1851","LGA1700"], specs:["240-mm-AIO","geschlossen","300 W Klasse"] },
      { id:"lf360", maker:"ARCTIC", name:"Liquid Freezer III 360", price:99, kind:"aio", radiator:360, capacity:350, sockets:["AM5","AM4","LGA1851","LGA1700"], specs:["360-mm-AIO","geschlossen","350 W Klasse"] },
      { id:"custom360", maker:"Alphacool", name:"Core Custom Loop 360", price:389, kind:"custom", radiator:360, capacity:450, sockets:["AM5","AM4","LGA1851","LGA1700"], specs:["360-mm-Radiator","offener Kreislauf","450 W Klasse"] }
    ],
    storage: [
      { id:"990pro", maker:"Samsung", name:"990 PRO 2 TB", price:169, interface:"NVMe", mount:"M.2", capacity:"2 TB", pcieGen:4, specs:["M.2 2280","PCIe 4.0 NVMe","2 TB"], recommended:true },
      { id:"sn850x", maker:"WD_BLACK", name:"SN850X 4 TB", price:299, interface:"NVMe", mount:"M.2", capacity:"4 TB", pcieGen:4, specs:["M.2 2280","PCIe 4.0 NVMe","4 TB"] },
      { id:"t705", maker:"Crucial", name:"T705 2 TB", price:279, interface:"NVMe", mount:"M.2", capacity:"2 TB", pcieGen:5, specs:["M.2 2280","PCIe 5.0 NVMe","2 TB"] },
      { id:"mx500", maker:"Crucial", name:"MX500 2 TB", price:139, interface:"SATA", mount:"2.5", capacity:"2 TB", specs:["2,5 Zoll","SATA 6 Gb/s","2 TB"] },
      { id:"ironwolf", maker:"Seagate", name:"IronWolf 8 TB", price:189, interface:"SATA", mount:"3.5", capacity:"8 TB", specs:["3,5 Zoll HDD","SATA 6 Gb/s","8 TB"] },
      { id:"980pro", maker:"Samsung", name:"980 PRO 1 TB", price:79, interface:"NVMe", mount:"M.2", capacity:"1 TB", pcieGen:4, generation:1, specs:["M.2 2280","PCIe 4.0 NVMe","1 TB"] },
      { id:"970evo", maker:"Samsung", name:"970 EVO Plus 1 TB", price:59, interface:"NVMe", mount:"M.2", capacity:"1 TB", pcieGen:3, generation:2, specs:["M.2 2280","PCIe 3.0 NVMe","1 TB"] }
    ],
    standoffs: [
      { id:"case-set", maker:"Gehäusezubehör", name:"Vorinstalliertes Set", price:0, count:9, forms:["ATX","mATX","ITX"], thread:"6-32", specs:["9 Stück","6-32","im Gehäuse"], recommended:true },
      { id:"brass-9", maker:"InLine", name:"Messing-Abstandhalter 9er", price:8, count:9, forms:["ATX","mATX","ITX"], thread:"6-32", specs:["9 Stück","6-32","Messing"] },
      { id:"brass-6", maker:"Delock", name:"Abstandhalter 6er", price:6, count:6, forms:["mATX","ITX"], thread:"6-32", specs:["6 Stück","6-32","mATX / ITX"] },
      { id:"metric-12", maker:"StarTech", name:"M3 Abstandhalter 12er", price:10, count:12, forms:["ATX","mATX","ITX"], thread:"M3", specs:["12 Stück","M3","Universalset"] }
    ],
    screws: [
      { id:"case-screws", maker:"Gehäusezubehör", name:"Mainboard-Schraubensatz", price:0, count:9, thread:"6-32", driveMounts:[], specs:["9 Stück","6-32","im Gehäuse"], recommended:true },
      { id:"pc-box", maker:"InLine", name:"PC-Schraubenbox 50-teilig", price:12, count:20, thread:"6-32", driveMounts:["2.5","3.5"], specs:["50-teilig","Mainboard + Laufwerke","sortiert"] },
      { id:"m3-kit", maker:"Delock", name:"M3 Montagesatz", price:8, count:12, thread:"M3", driveMounts:["2.5"], specs:["12 Stück","M3","für 2,5 Zoll"] },
      { id:"thumb-kit", maker:"Corsair", name:"Tool-free Schraubenset", price:15, count:9, thread:"6-32", driveMounts:["2.5","3.5"], specs:["9 Board-Schrauben","Rändelschrauben","Laufwerksmontage"] }
    ],
    cables: [
      { id:"basic", maker:"Mainboardzubehör", name:"Basis-Kabelsatz", price:0, provides:["eps","pcie"], specs:["24-Pin ATX","EPS 8-Pin","PCIe 8-Pin"] },
      { id:"sata", maker:"CableMod", name:"Basis + SATA-Datenkabel", price:12, provides:["eps","pcie","sata"], specs:["ATX / EPS","PCIe 8-Pin","SATA-Datenkabel"], recommended:true },
      { id:"modern", maker:"be quiet!", name:"ATX 3.1 Komplettsatz", price:25, provides:["eps","pcie","sata","12V-2x6"], specs:["ATX / EPS","SATA","12V-2x6"] },
      { id:"managed", maker:"Corsair", name:"Premium-Kabel + PWM-Hub", price:49, provides:["eps","pcie","sata","12V-2x6","pwm"], specs:["vollständiger Satz","12V-2x6","PWM-Hub"] }
    ],
    coolant: [
      { id:"none", maker:"Nicht erforderlich", name:"Kein Kühlmittel", price:0, fluid:false, volume:0, color:"transparent", specs:["Luftkühlung","geschlossene AIO","wartungsfrei"], recommended:true },
      { id:"clear", maker:"Alphacool", name:"Tec Protect 2 Clear 1 l", price:15, fluid:true, volume:1, color:"#79dff5", specs:["1 Liter","klar","gebrauchsfertig"] },
      { id:"blue", maker:"Corsair", name:"Hydro X XL8 Blue 1 l", price:19, fluid:true, volume:1, color:"#3f8cff", specs:["1 Liter","blau","Korrosionsschutz"] },
      { id:"red", maker:"EK", name:"CryoFuel Blood Red 1 l", price:18, fluid:true, volume:1, color:"#ee4860", specs:["1 Liter","rot","gebrauchsfertig"] }
    ]
  };

  const state = {
    active: 0,
    selections: Object.fromEntries(categories.map(c => [c.id, null]))
  };

  const $ = selector => document.querySelector(selector);
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
      return `<button class="category-button ${index === state.active ? "active" : ""} ${item ? "complete" : ""} ${problem ? "problem" : ""}" data-index="${index}" type="button" ${index === state.active ? 'aria-current="step"' : ""}>
        <span class="step-index">${String(index + 1).padStart(2,"0")}</span>
        <span class="category-label">${category.label}</span>
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
          data-id="${item.id}" type="button" ${reasons.length ? 'aria-disabled="true"' : ""} aria-pressed="${isSelected}">
        <span class="card-top"><span><span class="maker">${item.maker}</span>${item.generation ? `<span class="generation-badge generation-${item.generation}">${item.generation === 1 ? "1 Gen. zurück" : "2 Gen. zurück"}</span>` : ""}</span><span class="price">${money(item.price)}</span></span>
        <h3>${item.name}</h3>
        <ul class="specs">${item.specs.map(spec => `<li>${spec}</li>`).join("")}</ul>
        ${reasons.length ? `<span class="block-reason">${reasons.join(" · ")}</span>` :
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
      <span class="diagnostic-icon">${icons[item.type]}</span><div><strong>${item.title}</strong><p>${item.text}</p></div>
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
      return `<div class="build-row ${item ? "" : "empty"}" role="listitem"><span class="build-category">${category.label}</span><span class="build-item">${item ? item.name : "noch offen"}</span><span class="build-price">${item ? money(item.price) : "–"}</span></div>`;
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

  const svgText = (x,y,text,size=12,fill="#90a6c0",anchor="start") => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${text}</text>`;
  function fan(cx,cy,r,color="#34516d") {
    return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="#091421" stroke="#3c5874" stroke-width="3"/>
      <circle cx="${cx}" cy="${cy}" r="${r-8}" fill="none" stroke="${color}" stroke-width="2" opacity=".7"/>
      ${[0,60,120,180,240,300].map(a => `<ellipse cx="${cx}" cy="${cy-r/2}" rx="${r*.18}" ry="${r*.36}" fill="${color}" opacity=".56" transform="rotate(${a} ${cx} ${cy})"/>`).join("")}
      <circle cx="${cx}" cy="${cy}" r="${r*.18}" fill="#718ca7"/></g>`;
  }

  function renderSvg() {
    const c = selected("case"), board = selected("motherboard"), cpu = selected("cpu"), gpu = selected("gpu");
    const ram = selected("ram"), psu = selected("psu"), cooler = selected("cooler"), storage = selected("storage");
    const standoffs = selected("standoffs"), screws = selected("screws"), cables = selected("cables"), coolant = selected("coolant");
    const caseW = c?.size === "Mini-ITX" ? 390 : c?.size === "Micro-Tower" ? 450 : 520;
    const x = (680-caseW)/2, y = 48, h = 620, boardW = board?.form === "ITX" ? 190 : board?.form === "mATX" ? 290 : 350;
    const boardH = board?.form === "ITX" ? 190 : board?.form === "mATX" ? 300 : 390;
    const bx = x+48, by = y+88;
    const accent = "#65e6c4", blue="#56c8ff", gold="#ffc857", red="#ff6b7a";
    const coolantColor = coolant?.fluid ? coolant.color : blue;

    let svg = `<g class="part active-part">
      <rect x="${x}" y="${y}" width="${caseW}" height="${h}" rx="18" fill="url(#caseMetal)" stroke="#58708a" stroke-width="4"/>
      <rect x="${x+16}" y="${y+16}" width="${caseW-32}" height="${h-32}" rx="11" fill="#07111d" fill-opacity=".62" stroke="#263d56" stroke-width="2"/>
      <rect x="${x+22}" y="${y+4}" width="${caseW-44}" height="18" rx="6" fill="url(#mesh)"/>
      <rect x="${x+18}" y="${y+h-132}" width="${caseW-36}" height="112" rx="8" fill="#0b1827" stroke="#283c52"/>
      <path d="M ${x+20} ${y+h-132} H ${x+caseW-20}" stroke="#496078" stroke-width="2"/>
      <rect x="${x+42}" y="${y+h}" width="70" height="12" rx="4" fill="#263a4d"/><rect x="${x+caseW-112}" y="${y+h}" width="70" height="12" rx="4" fill="#263a4d"/>
      ${[[x+28,y+28],[x+caseW-28,y+28],[x+28,y+h-28],[x+caseW-28,y+h-28]].map(([sx,sy])=>`<circle cx="${sx}" cy="${sy}" r="5" fill="#101d2b" stroke="#7490ab"/>`).join("")}
      ${fan(x+caseW-48,y+145,34)}
      ${fan(x+caseW-48,y+225,34)}
    </g>
    ${svgText(x+caseW/2,y+37,c?.name || "GEHÄUSE",12,c?accent:"#607590","middle")}`;

    if (board) {
      const holes = [[12,12],[boardW-12,12],[12,boardH-12],[boardW-12,boardH-12],[boardW/2,12],[boardW/2,boardH-12]];
      svg += `<g class="part active-part">
        <rect x="${bx}" y="${by}" width="${boardW}" height="${boardH}" rx="7" fill="url(#pcb)" stroke="${accent}" stroke-width="2"/>
        ${holes.map(([hx,hy])=>`<circle cx="${bx+hx}" cy="${by+hy}" r="5" fill="#061119" stroke="${standoffs?gold:"#3b566b"}" stroke-width="2"/>`).join("")}
        <path d="M${bx+30} ${by+55} H${bx+boardW-24} M${bx+35} ${by+90} H${bx+boardW-70} M${bx+25} ${by+boardH-55} H${bx+boardW-35}" stroke="#2c6f69" stroke-width="2" stroke-dasharray="7 6"/>
        <rect x="${bx+8}" y="${by+24}" width="35" height="92" rx="4" fill="#587086"/><rect x="${bx+52}" y="${by+18}" width="112" height="24" rx="4" fill="#29495a"/>
        <rect x="${bx+boardW-72}" y="${by+boardH-66}" width="50" height="46" rx="7" fill="#264959" stroke="#52758b"/>
        <rect x="${bx+38}" y="${by+boardH-44}" width="${Math.max(90,boardW-80)}" height="10" rx="3" fill="#d7bf65" opacity=".75"/>
        ${svgText(bx+12,by+boardH-15,board.form+" · "+board.socket,10,"#8ed8c9")}
      </g>`;
    } else {
      svg += `<g class="part empty-part"><rect x="${bx}" y="${by}" width="330" height="380" rx="7" fill="none" stroke="#53708c" stroke-width="2" stroke-dasharray="9 8"/>${svgText(bx+165,by+190,"MAINBOARD",14,"#6c829a","middle")}</g>`;
    }

    const cpuX=bx+82, cpuY=by+66;
    if (cpu && board) {
      svg += `<g class="part active-part"><rect x="${cpuX}" y="${cpuY}" width="76" height="76" rx="8" fill="#b7bec6" stroke="#e5edf5" stroke-width="3"/>
        <rect x="${cpuX+9}" y="${cpuY+9}" width="58" height="58" rx="5" fill="#243a48"/>${svgText(cpuX+38,cpuY+43,cpu.label,17,"#ffffff","middle")}</g>`;
    }

    if (ram && board) {
      svg += `<g class="part active-part">${[0,1,2,3].map((i)=>`<rect x="${bx+boardW-61+i*12}" y="${by+45}" width="8" height="${Math.min(145,boardH*.42)}" rx="3" fill="${i%2===0?accent:"#254955"}" stroke="#7aa4a0"/>`).join("")}
        ${svgText(bx+boardW-39,by+205,ram.capacity+" GB",9,accent,"middle")}</g>`;
    }

    if (cooler && cpu && board) {
      if (cooler.kind === "air") {
        svg += `<g class="part active-part"><rect x="${cpuX-18}" y="${cpuY-18}" width="112" height="112" rx="8" fill="#546b7e" stroke="#adc0cf" stroke-width="3"/>
          ${Array.from({length:8},(_,i)=>`<line x1="${cpuX-10}" y1="${cpuY-8+i*13}" x2="${cpuX+86}" y2="${cpuY-8+i*13}" stroke="#b5c3cf" opacity=".65"/>`).join("")}
          ${fan(cpuX+38,cpuY+38,40,"#2d90a2")}</g>`;
      } else {
        const radW = Math.min(caseW-90, cooler.radiator === 360 ? 330 : 225);
        const radX=x+48, radY=y+34;
        svg += `<g class="part active-part"><rect x="${radX}" y="${radY}" width="${radW}" height="52" rx="7" fill="#111e2b" stroke="#668097" stroke-width="3"/>
          ${Array.from({length:cooler.radiator===360?3:2},(_,i)=>fan(radX+45+i*105,radY+26,21,"#326c80")).join("")}
          <circle cx="${cpuX+38}" cy="${cpuY+38}" r="38" fill="#142938" stroke="${cooler.kind==="custom"?coolantColor:blue}" stroke-width="5"/>
          ${svgText(cpuX+38,cpuY+42,cooler.kind==="custom"?"LOOP":"AIO",11,"#dcebf5","middle")}
          <path d="M${cpuX+18} ${cpuY+8} C${cpuX-5} ${cpuY-28}, ${radX+40} ${radY+72}, ${radX+60} ${radY+50}" fill="none" stroke="${cooler.kind==="custom"?coolantColor:"#55758a"}" stroke-width="6"/>
          <path d="M${cpuX+58} ${cpuY+8} C${cpuX+78} ${cpuY-35}, ${radX+radW-60} ${radY+75}, ${radX+radW-45} ${radY+50}" fill="none" stroke="${cooler.kind==="custom"?coolantColor:"#55758a"}" stroke-width="6"/>
          ${cooler.kind==="custom"?`<rect x="${x+caseW-105}" y="${y+300}" width="44" height="150" rx="18" fill="${coolantColor}" fill-opacity=".45" stroke="${coolantColor}" stroke-width="4"/><circle cx="${x+caseW-83}" cy="${y+425}" r="14" fill="#182c3b" stroke="${coolantColor}"/>`:""}
        </g>`;
      }
    }

    if (gpu && board) {
      const gpuW=Math.min(gpu.length*1.08,caseW-92), gx=bx+18, gy=by+Math.min(boardH-105,245);
      svg += `<g class="part active-part"><rect x="${gx}" y="${gy}" width="${gpuW}" height="92" rx="8" fill="#172738" stroke="${gpu.maker==="AMD"?red:accent}" stroke-width="3"/>
        <rect x="${gx-14}" y="${gy+7}" width="15" height="78" rx="3" fill="#7b8790"/>
        ${fan(gx+75,gy+46,31,gpu.maker==="AMD"?"#8e3342":"#256b61")}
        ${gpuW>250?fan(gx+gpuW-72,gy+46,31,gpu.maker==="AMD"?"#8e3342":"#256b61"):""}
        ${svgText(gx+gpuW/2,gy+51,gpu.label,12,"#eaf6ff","middle")}
        <rect x="${gx+gpuW-70}" y="${gy-6}" width="43" height="8" rx="2" fill="${gpu.connector==="12V-2x6"?gold:"#7189a0"}"/>
      </g>`;
    } else {
      svg += `<g class="part empty-part"><rect x="${bx+18}" y="${by+245}" width="${Math.min(320,caseW-92)}" height="88" rx="8" fill="none" stroke="#53708c" stroke-width="2" stroke-dasharray="9 8"/>${svgText(bx+165,by+294,"GRAFIKKARTE",12,"#6c829a","middle")}</g>`;
    }

    if (psu) {
      svg += `<g class="part active-part"><rect x="${x+42}" y="${y+h-118}" width="${psu.form==="SFX"?145:190}" height="88" rx="7" fill="#111e2c" stroke="${gold}" stroke-width="2"/>
        ${fan(x+(psu.form==="SFX"?112:137),y+h-74,31,"#4a5967")}
        ${svgText(x+54,y+h-100,psu.watts+" W",11,gold)}</g>`;
    } else {
      svg += `<g class="part empty-part"><rect x="${x+42}" y="${y+h-118}" width="190" height="88" rx="7" fill="none" stroke="#53708c" stroke-width="2" stroke-dasharray="9 8"/>${svgText(x+137,y+h-70,"NETZTEIL",12,"#6c829a","middle")}</g>`;
    }

    if (storage && board) {
      if (storage.mount === "M.2") {
        svg += `<g class="part active-part"><rect x="${bx+70}" y="${by+boardH-74}" width="${Math.min(135,boardW-95)}" height="23" rx="4" fill="#c49f4d" stroke="#ffe09b"/>
          <rect x="${bx+77}" y="${by+boardH-69}" width="56" height="13" rx="2" fill="#233745"/>${svgText(bx+145,by+boardH-57,"M.2",9,"#fff","middle")}</g>`;
      } else {
        svg += `<g class="part active-part"><rect x="${x+caseW-150}" y="${y+h-112}" width="92" height="70" rx="6" fill="#394b59" stroke="${blue}" stroke-width="2"/>
          <circle cx="${x+caseW-128}" cy="${y+h-90}" r="12" fill="#162734" stroke="#7890a2"/>${svgText(x+caseW-104,y+h-63,storage.mount+'"',10,"#dcebf5","middle")}</g>`;
      }
    }

    if (cables && (psu || gpu || storage)) {
      svg += `<g class="part active-part" fill="none" stroke-linecap="round">
        <path d="M${x+210} ${y+h-72} C${x+310} ${y+h-165}, ${bx+boardW+30} ${by+boardH}, ${bx+boardW-15} ${by+boardH-20}" stroke="#d3bc64" stroke-width="5" stroke-dasharray="8 5"/>
        ${gpu?`<path d="M${x+220} ${y+h-85} C${x+340} ${y+h-170}, ${x+caseW-120} ${by+270}, ${x+caseW-150} ${by+250}" stroke="#b24759" stroke-width="5"/>`:""}
        ${storage?.interface==="SATA"?`<path d="M${x+caseW-105} ${y+h-90} C${x+caseW-210} ${y+h-170}, ${bx+boardW-20} ${by+boardH-30}, ${bx+boardW-45} ${by+boardH-25}" stroke="${blue}" stroke-width="4"/>`:""}
      </g>`;
    }

    if (screws && board) {
      svg += `<g class="part active-part" filter="url(#glow)">${[[bx+12,by+12],[bx+boardW-12,by+12],[bx+12,by+boardH-12],[bx+boardW-12,by+boardH-12]].map(([sx,sy])=>`<path d="M${sx-4} ${sy}h8M${sx} ${sy-4}v8" stroke="#f1f5f8" stroke-width="1.7"/>`).join("")}</g>`;
    }

    svg += `<g opacity=".75"><path d="M${x} 690 H${x+caseW}" stroke="#5a7189" stroke-width="1"/><path d="M${x} 683 V697 M${x+caseW} 683 V697" stroke="#5a7189"/>${svgText(x+caseW/2,706,c?.size||"PC-GEHÄUSE",10,"#71879d","middle")}</g>`;
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
