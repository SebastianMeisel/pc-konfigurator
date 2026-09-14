(() => {
  "use strict";

  const lessons = {
    "Grundregeln": {
      title: "Sicher arbeiten am PC",
      role: "Professionelle Montage beginnt mit einem sicheren, dokumentierten Arbeitsplatz. Die folgenden Regeln gelten bei jedem Arbeitsschritt.",
      install: [
        "Arbeitsplatz freiräumen, gut beleuchten und Schrauben sortiert ablegen.",
        "PC vollständig herunterfahren, Netzschalter ausschalten und Netzkabel abziehen.",
        "Vor dem Berühren von Bauteilen Restladung durch kurzes Drücken des Einschalters abbauen.",
        "Herstellerhandbücher und Anschlusspläne bereitlegen; Arbeitsschritte dokumentieren."
      ],
      safety: [
        "ESD-Schutz verwenden: Potentialausgleich herstellen oder regelmäßig geerdetes Metall berühren. Bauteile nur an den Kanten halten.",
        "Nie im Netzteil arbeiten: Auch getrennte Netzteile können gefährliche Spannungen speichern.",
        "Keine Gewalt anwenden. Sockel, Stecker und Speichermodule sind kodiert und passen nur in der vorgesehenen Orientierung.",
        "Bei Flüssigkeitskühlung zuerst eine Dichtheitsprüfung ohne bestromte PC-Komponenten durchführen."
      ],
      check: [
        "Vor dem Einschalten Werkzeug, lose Schrauben und Schutzfolien entfernen.",
        "24-Pin-ATX, CPU-EPS, GPU-Strom, Lüfter und Frontpanel-Anschlüsse kontrollieren.",
        "Erststart mit geöffnetem Gehäuse beobachten; bei Geruch, Rauch oder ungewöhnlichen Geräuschen sofort spannungsfrei schalten.",
        "UEFI prüfen, Temperaturen beobachten und anschließend Speicher-, CPU- und GPU-Tests durchführen."
      ]
    },
    "Gehäuse": {
      title: "Gehäuse",
      role: "Das Gehäuse schützt die Hardware, führt den Luftstrom und legt Platz, Formfaktoren, Laufwerksschächte sowie Frontanschlüsse fest.",
      install: [
        "Seitenwände entfernen und Zubehör, Staubfilter sowie vorinstallierte Abstandhalter prüfen.",
        "Luftstrom planen: vorn/unten ansaugen, hinten/oben ausblasen; Pfeile auf Lüfterrahmen beachten.",
        "Scharfe Kanten, Kabelwege und Freiraum für GPU, Kühler und Radiator vor der Montage prüfen."
      ],
      safety: [
        "Gehäuse standsicher ablegen und Glasflächen nicht auf harte Kanten stellen.",
        "Nur die zum Mainboard passenden Abstandhalter montieren; zusätzliche Abstandhalter können Kurzschlüsse verursachen."
      ],
      check: ["Front-I/O-Kabel zuordnen.", "Staubfilter frei halten.", "Nach Montage kontrollieren, dass kein Kabel in einen Lüfter ragt."]
    },
    "Mainboard": {
      title: "Mainboard",
      role: "Das Mainboard verbindet CPU, RAM, Massenspeicher, Erweiterungskarten und externe Schnittstellen. Chipsatz, Sockel und Formfaktor bestimmen die Erweiterbarkeit.",
      install: [
        "I/O-Blende einsetzen, falls sie nicht integriert ist.",
        "CPU, M.2-SSD und RAM möglichst außerhalb des Gehäuses montieren.",
        "Board auf korrekt gesetzte Abstandhalter legen und Schrauben über Kreuz handfest anziehen.",
        "24-Pin-ATX, CPU-EPS, Frontpanel, USB, Audio und Lüfter nach Handbuch verbinden."
      ],
      safety: [
        "Leiterbahnen und Kontakte nicht berühren; Board nur an den Kanten halten.",
        "Kein Abstandhalter darf unter einer Stelle ohne Montagebohrung sitzen."
      ],
      check: ["UEFI-Version zur CPU-Kompatibilität prüfen.", "Debug-LEDs oder POST-Code auswerten.", "Alle Geräte im UEFI inventarisieren."]
    },
    "CPU": {
      title: "Prozessor (CPU)",
      role: "Die CPU führt Maschinenbefehle aus und koordiniert Rechen-, Speicher- und Ein-/Ausgabeoperationen. Sockel und Firmware müssen zum Mainboard passen.",
      install: [
        "Sockelhebel öffnen und Markierungsdreieck von CPU und Sockel ausrichten.",
        "CPU ohne Druck einlegen; Verriegelung gemäß Mainboard-Handbuch schließen.",
        "Eine kleine, passende Menge Wärmeleitpaste verwenden, sofern der Kühler keine aufgetragen hat."
      ],
      safety: [
        "Kontakte und Sockel-Pins niemals berühren oder mit Werkzeug richten.",
        "CPU nicht in den Sockel drücken. Widerstand bedeutet meist falsche Ausrichtung."
      ],
      check: ["CPU-Bezeichnung im UEFI prüfen.", "Leerlauf- und Lasttemperaturen kontrollieren.", "Stabilitätstest mit Temperaturgrenzen durchführen."]
    },
    "Grafikkarte": {
      title: "Grafikkarte (GPU)",
      role: "Die GPU verarbeitet parallel Bild-, Video- und Compute-Daten. Sie benötigt einen passenden PCIe-Steckplatz, mechanischen Freiraum und ausreichende Stromversorgung.",
      install: [
        "Obersten elektrisch angebundenen PCIe-x16-Steckplatz verwenden und Slotverriegelung öffnen.",
        "Passende Slotblenden entfernen, Karte gerade einsetzen und am Gehäuse befestigen.",
        "Vorgesehenes GPU-Stromkabel vollständig einstecken; schwere Karten abstützen."
      ],
      safety: [
        "12V-2x6-Stecker bis zum Anschlag einstecken und das Kabel direkt am Stecker nicht stark knicken.",
        "Keine laufenden Lüfter berühren; Karte nicht am Kühler oder an Lüftern tragen."
      ],
      check: ["Monitor für Nutzung der dedizierten GPU an deren Ausgänge anschließen.", "Treiber installieren.", "Temperatur, Leistung und Bildfehler unter Last prüfen."]
    },
    "Arbeitsspeicher": {
      title: "Arbeitsspeicher (RAM)",
      role: "RAM hält aktuell benötigte Daten mit geringer Latenz bereit. Typ, Kapazität, Modulanzahl und Speicherprofil beeinflussen Kompatibilität und Leistung.",
      install: [
        "Empfohlene Steckplätze aus dem Handbuch verwenden, meist A2 und B2 für zwei Module.",
        "Kerbe ausrichten, Modul senkrecht einsetzen und gleichmäßig drücken, bis die Halter einrasten.",
        "EXPO oder XMP erst nach einem stabilen Start aktivieren."
      ],
      safety: ["Kontakte nicht berühren.", "DDR-Generationen sind mechanisch unterschiedlich; ein Modul niemals erzwingen."],
      check: ["Gesamtkapazität und Kanalmodus im UEFI prüfen.", "Speichertest durchführen.", "Bei Fehlern Standardtakt laden und Module einzeln testen."]
    },
    "Netzteil": {
      title: "Netzteil (PSU)",
      role: "Das Netzteil wandelt Netzspannung in geregelte Gleichspannungen. Nennleistung, Schutzschaltungen, Effizienz und Anschlüsse müssen zur Last passen.",
      install: [
        "Lüfter zur vorgesehenen belüfteten Öffnung ausrichten und Netzteil verschrauben.",
        "Nur benötigte modulare Kabel anschließen und Leitungen spannungsfrei verlegen.",
        "CPU-EPS- und PCIe/GPU-Stecker unterscheiden; sie sind nicht austauschbar."
      ],
      safety: [
        "Netzteil niemals öffnen.",
        "Modulare Kabel verschiedener Netzteilmodelle nicht mischen: Die Pinbelegung auf Netzteilseite ist nicht standardisiert.",
        "Arbeiten nur bei gezogenem Netzkabel durchführen."
      ],
      check: ["Leistungsreserve und GPU-Spitzenlast berücksichtigen.", "Schutzleiter und Steckdosenumgebung müssen intakt sein.", "Bei Klickgeräuschen oder Abschaltungen Verkabelung und Last prüfen."]
    },
    "CPU-Kühler": {
      title: "CPU-Kühler",
      role: "Der Kühler transportiert Wärme vom Heatspreader zur Umgebungsluft oder zu einem Flüssigkeitskreislauf. Montagekraft und Wärmeübergang sind entscheidend.",
      install: [
        "Passendes Sockel-Montagekit und Backplate verwenden.",
        "Wärmeleitflächen reinigen, Paste dosieren und Schrauben abwechselnd anziehen.",
        "Lüfter an CPU_FAN anschließen; Pumpenanschluss nach Herstellerangabe wählen.",
        "Radiator so montieren, dass Luft nicht dauerhaft in der Pumpe gesammelt wird."
      ],
      safety: ["Schutzfolie am Kühlboden entfernen.", "Kühler nicht übermäßig festziehen.", "Lüfterkabel aus Rotoren heraushalten."],
      check: ["CPU_FAN- bzw. Pumpendrehzahl im UEFI prüfen.", "Temperaturen sofort nach Erststart beobachten.", "Bei schneller Überhitzung abschalten und Kontaktfläche prüfen."]
    },
    "Festplatte": {
      title: "Massenspeicher",
      role: "SSD und HDD speichern Betriebssystem, Programme und Nutzdaten dauerhaft. NVMe nutzt PCIe; SATA verwendet getrennte Daten- und Stromverbindungen.",
      install: [
        "M.2-Modul schräg einsetzen, absenken und mit Halter oder Schraube fixieren; Kühlkörperfolie entfernen.",
        "SATA-Laufwerk vibrationsarm montieren und SATA-Datenkabel sowie SATA-Strom anschließen.",
        "Ports und Bootreihenfolge dokumentieren."
      ],
      safety: ["M.2-Schraube nicht überdrehen.", "Laufwerke niemals bei Schreibzugriff abziehen.", "Vor Arbeiten wichtige Daten sichern."],
      check: ["Datenträger im UEFI und Betriebssystem erkennen.", "SMART-Werte prüfen.", "Dateisystem und Backup-Wiederherstellung testen."]
    },
    "Abstandhalter": {
      title: "Abstandhalter",
      role: "Abstandhalter halten das Mainboard auf definierter Höhe und verhindern Kontakt zwischen Lötstellen und leitendem Gehäuse.",
      install: ["Positionen mit den Mainboard-Bohrungen vergleichen.", "Nur benötigte Abstandhalter mit passendem Gewinde einsetzen.", "Board ohne Verspannung auflegen."],
      safety: ["Ein überzähliger Abstandhalter kann einen Kurzschluss verursachen.", "Gewinde nur handfest anziehen und nicht verkanten."],
      check: ["Jede Boardbohrung muss über einem passenden Abstandhalter liegen.", "Unter dem Board dürfen keine losen Metallteile liegen."]
    },
    "Schrauben": {
      title: "Schrauben",
      role: "Schrauben sichern Baugruppen mechanisch. Gewinde, Länge und Kopf müssen zum Bauteil passen.",
      install: ["Schrauben nach Typ sortieren.", "Zunächst locker ansetzen, dann über Kreuz handfest anziehen.", "Für M.2, Mainboard, Netzteil und Laufwerke die jeweils vorgesehenen Schrauben verwenden."],
      safety: ["Zu lange Schrauben können Bauteile beschädigen.", "Nicht überdrehen; Metallspäne und heruntergefallene Schrauben vollständig entfernen."],
      check: ["Alle Bauteile sitzen fest, aber spannungsfrei.", "Keine Schraube fehlt oder liegt lose im Gehäuse."]
    },
    "Kabel": {
      title: "Kabel und Leitungsführung",
      role: "Kabel übertragen Energie, Daten und Steuersignale. Korrekte Stecker, Biegeradien und Zugentlastung verhindern Ausfälle.",
      install: ["Leitungswege vor dem Einbau großer Komponenten planen.", "Stecker an Form, Beschriftung und Handbuch zuordnen.", "Kabel bündeln, ohne Stecker unter Zug zu setzen oder Luftwege zu blockieren."],
      safety: ["Stecker nie am Kabel herausziehen.", "Modulare Netzteilkabel nicht zwischen Modellen tauschen.", "Beschädigte oder gequetschte Leitungen ersetzen."],
      check: ["Alle Verriegelungen sind eingerastet.", "12V-2x6 sitzt bündig.", "SATA-Daten- und Stromkabel sind an beiden Enden verbunden."]
    },
    "Kühlmittel": {
      title: "Kühlmittel",
      role: "Kühlmittel transportiert Wärme in einem offenen Wasserkreislauf und schützt geeignete Werkstoffe vor Korrosion und biologischem Wachstum.",
      install: ["Nur kompatibles, gebrauchsfertiges Mittel verwenden.", "Kreislauf langsam befüllen und Pumpe niemals trocken laufen lassen.", "Luft aus dem System entfernen und Füllstand dokumentieren."],
      safety: ["Dichtheitsprüfung mit überbrücktem Netzteil und sonst stromlosen PC-Komponenten durchführen.", "Verschüttetes Mittel vollständig aufnehmen; Herstellerhinweise zu Hautkontakt und Entsorgung beachten.", "Unterschiedliche Kühlmittel nicht mischen."],
      check: ["Alle Anschlüsse mit trockenem Tuch auf Feuchtigkeit prüfen.", "Mehrstündigen Lecktest durchführen.", "Füllstand, Verfärbung und Ablagerungen regelmäßig kontrollieren."]
    },
    "Ethernet": {
      title: "Ethernet-Schnittstelle",
      role: "Ethernet überträgt Frames leitungsgebunden. Die niedrigste gemeinsame Geschwindigkeit von Karte, Switch und Gegenstelle sowie Kabelqualität bestimmt den Link.",
      install: ["PCIe-Karte in einen ausreichend angebundenen freien Steckplatz einsetzen und verschrauben.", "Passendes Twisted-Pair-Kabel verwenden: für 10 Gbit/s sind kurze, hochwertige Cat-6A-Strecken sinnvoll.", "Treiber, Linkmodus, VLANs und gegebenenfalls Wake-on-LAN konfigurieren."],
      safety: ["Nicht an Netzwerkleitungen arbeiten, die unbekannte PoE-Spannung führen.", "RJ45-Stecker an der Lasche lösen und nicht am Kabel ziehen."],
      check: ["Link-LED und ausgehandelte Geschwindigkeit prüfen.", "IP-Konfiguration, Gateway und DNS testen.", "Durchsatz mit iperf3 und Fehlerzähler mit Betriebssystemwerkzeugen prüfen."]
    },
    "WLAN": {
      title: "WLAN-Schnittstelle",
      role: "WLAN verbindet den PC per Funk. Standard, Frequenzband, Kanalbreite, Antennenposition und Access Point begrenzen die erreichbare Datenrate.",
      install: ["PCIe-x1-Karte einsetzen und Antennen außen anschrauben.", "Für Bluetooth das interne USB-2.0-Kabel der Karte mit einem freien Header verbinden.", "Antennen frei und möglichst unterschiedlich ausrichten; aktuelle Treiber installieren."],
      safety: ["Antennenstecker nur handfest anziehen.", "Interne USB-Header korrekt ausrichten; ein versetzter Stecker kann Kurzschlüsse verursachen."],
      check: ["2,4-, 5- und gegebenenfalls 6-GHz-Verbindung testen.", "Signalstärke, ausgehandelten Standard und Kanal prüfen.", "Bluetooth separat koppeln und unter Last testen."]
    },
    "Anschlüsse": {
      title: "Peripherieanschlüsse",
      role: "Die Rückansicht unterscheidet Mainboard-I/O, Grafikausgänge und Erweiterungskarten. Form und Symbol sind wichtiger als die Farbe eines Anschlusses.",
      install: ["Monitor bei dedizierter GPU an die Grafikkarte anschließen.", "Tastatur und Maus an USB; schnelle Datenträger an passend gekennzeichnete schnelle USB-Ports anschließen.", "Netzwerk, Audio und Antennen vor dem Start zugentlastet verbinden."],
      safety: ["Stecker nur in passender Orientierung einsetzen.", "USB-C ist eine Steckerform; Datenrate, DisplayPort-Alt-Mode und Ladeleistung sind optionale Eigenschaften."],
      check: ["Ports im Betriebssystem inventarisieren.", "USB-Datenrate und Displayausgabe mit geeigneten Geräten testen.", "Audio-Ein- und Ausgänge korrekt zuordnen."]
    }
  };

  const catalog = {
    ethernet: [
      {id:"onboard", name:"Onboard-LAN verwenden", price:0, slot:0, speed:"boardabhängig", specs:"integriert · RJ45"},
      {id:"i210", name:"Intel I210-T1", price:25, slot:1, speed:"1 Gbit/s", specs:"PCIe x1 · RJ45"},
      {id:"i225", name:"Intel I225-T1", price:39, slot:1, speed:"2,5 Gbit/s", specs:"PCIe x1 · RJ45"},
      {id:"xg100", name:"ASUS XG-C100C", price:99, slot:4, speed:"10 Gbit/s", specs:"PCIe x4 · Cat 6A"},
      {id:"x550", name:"Intel X550-T2 Refurbished", price:89, slot:4, speed:"2× 10 Gbit/s", generation:2, specs:"PCIe x4 · ältere Server-NIC"}
    ],
    wifi: [
      {id:"onboard", name:"Onboard-WLAN verwenden", price:0, slot:0, speed:"Wi-Fi 6E/7", specs:"integriert · Bluetooth"},
      {id:"ax210", name:"Intel AX210 Kit", price:35, slot:1, speed:"Wi-Fi 6E", specs:"PCIe x1 · Bluetooth 5.3"},
      {id:"ax200", name:"Intel AX200 Kit", price:25, slot:1, speed:"Wi-Fi 6", generation:1, specs:"PCIe x1 · Bluetooth 5.2"},
      {id:"txe75e", name:"TP-Link Archer TXE75E", price:49, slot:1, speed:"Wi-Fi 6E", specs:"PCIe x1 · externe Antenne"},
      {id:"be92", name:"ASUS PCE-BE92BT", price:89, slot:1, speed:"Wi-Fi 7", specs:"PCIe x1 · Bluetooth 5.4"}
    ]
  };

  const boards = {
    x870:{name:"MSI MAG X870 Tomahawk WiFi", form:"ATX", lan:"5 Gbit/s", wifi:"Wi-Fi 7"},
    b850m:{name:"ASRock B850M Pro RS WiFi", form:"mATX", lan:"2,5 Gbit/s", wifi:"Wi-Fi 6E"},
    z890:{name:"Gigabyte Z890 AORUS Elite WiFi7", form:"ATX", lan:"2,5 Gbit/s", wifi:"Wi-Fi 7"},
    b860i:{name:"ASUS ROG Strix B860-I Gaming WiFi", form:"ITX", lan:"2,5 Gbit/s", wifi:"Wi-Fi 7"},
    b650:{name:"MSI B650 Gaming Plus WiFi", form:"ATX", lan:"2,5 Gbit/s", wifi:"Wi-Fi 6E"},
    z790d4:{name:"MSI PRO Z790-P WiFi DDR4", form:"ATX", lan:"2,5 Gbit/s", wifi:"Wi-Fi 6E"},
    b550m:{name:"MSI B550M PRO-VDH WiFi", form:"mATX", lan:"1 Gbit/s", wifi:"Wi-Fi 5"}
  };

  const networkState = {ethernet:"onboard", wifi:"onboard"};
  let activeView = "inside";
  let basePrice = 0;
  let renderedPrice = null;

  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const euro = value => value === 0 ? "enthalten" : new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(value);

  function baseSelections() {
    try { return JSON.parse(localStorage.getItem("buildbench-config-v1")) || {}; }
    catch (_) { return {}; }
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
    if (!dialog.open) dialog.showModal();
  }

  function currentLessonKey() {
    return $(".category-button.active .category-label")?.textContent.trim() || "Grundregeln";
  }

  function renderNetwork() {
    const root = $("#network-options");
    if (!root) return;
    root.innerHTML = ["ethernet","wifi"].map(type => {
      const title = type === "ethernet" ? "Ethernet-Karte" : "WLAN-Karte";
      return `<section class="network-group">
        <h3 class="network-group-title">${title}<span>eine Option</span></h3>
        <div class="network-card-grid">${catalog[type].map(item => {
          const reason = blockReason(type,item);
          const selected = networkState[type] === item.id;
          return `<article class="network-card ${selected ? "selected" : ""} ${reason ? "blocked" : ""}">
            <button class="network-select" type="button" data-network-type="${type}" data-network-id="${item.id}" ${reason ? "aria-disabled=\"true\"" : ""}>
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
      saveNetwork();
      renderNetwork();
      renderPorts();
      applyPrice(false);
    }));
    root.querySelectorAll(".network-info").forEach(button => button.addEventListener("click", () => {
      const type = button.dataset.networkInfo;
      const item = catalog[type].find(entry => entry.id === button.dataset.networkId);
      openLesson(type === "ethernet" ? "Ethernet" : "WLAN", item);
    }));

    const extra = chosen("ethernet").price + chosen("wifi").price;
    $("#network-total").textContent = extra ? `${euro(extra)} zusätzlich` : "0 € zusätzlich";
    renderNetworkDiagnostics();
  }

  function renderNetworkDiagnostics() {
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

  function parsePrice(text) {
    const digits = text.replace(/[^0-9]/g,"");
    return digits ? Number(digits) : 0;
  }

  function applyPrice(captureBase = true) {
    const label = $("#price-label");
    if (!label) return;
    const current = label.textContent;
    if (captureBase && current !== renderedPrice) basePrice = parsePrice(current);
    const extra = chosen("ethernet").price + chosen("wifi").price;
    const next = new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(basePrice + extra);
    renderedPrice = next;
    if (label.textContent !== next) label.textContent = next;
  }

  function svgText(x,y,text,size=12,fill="#9bb0c8",anchor="start") {
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}">${escapeHtml(text)}</text>`;
  }

  function usbPair(x,y,color="#56c8ff") {
    return `<g><rect x="${x}" y="${y}" width="54" height="27" rx="3" fill="#101d2b" stroke="#58718a"/><rect x="${x+7}" y="${y+6}" width="16" height="15" rx="2" fill="${color}"/><rect x="${x+31}" y="${y+6}" width="16" height="15" rx="2" fill="${color}"/></g>`;
  }

  function rj45(x,y,label) {
    return `<g class="port-group"><rect x="${x}" y="${y}" width="80" height="58" rx="5" fill="#101d2b" stroke="#65e6c4" stroke-width="2"/><rect x="${x+13}" y="${y+12}" width="54" height="37" rx="3" fill="#20384a"/><path d="M${x+22} ${y+14}v10m9-10v10m9-10v10m9-10v10m9-10v10" stroke="#d7bf65" stroke-width="3"/>${svgText(x+40,y+75,label,9,"#65e6c4","middle")}</g>`;
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
    let out = `<defs><linearGradient id="rearMetal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#273b50"/><stop offset="1" stop-color="#101c2a"/></linearGradient><pattern id="rearMesh" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.5" fill="#536b80"/></pattern></defs>
      <rect x="62" y="35" width="556" height="645" rx="20" fill="url(#rearMetal)" stroke="#657d94" stroke-width="4"/>
      <rect x="82" y="55" width="516" height="605" rx="12" fill="#07111d" stroke="#263d56" stroke-width="2"/>
      ${svgText(340,87,"PC-RÜCKSEITE · PERIPHERIE",14,"#65e6c4","middle")}
      <g class="port-group"><rect x="112" y="112" width="290" height="276" rx="9" fill="#132437" stroke="#67819a" stroke-width="2"/>
      ${svgText(257,137,board ? board.name : "MAINBOARD-I/O (BEISPIEL)",10,"#cfe0ef","middle")}
      ${usbPair(134,162)}${usbPair(134,199,"#4d7fa1")}${usbPair(134,236,"#4d7fa1")}
      <rect x="218" y="162" width="42" height="27" rx="8" fill="#101d2b" stroke="#56c8ff"/><rect x="228" y="170" width="22" height="11" rx="5" fill="#56c8ff"/>
      ${svgText(239,203,"USB-C",9,"#56c8ff","middle")}
      <rect x="283" y="162" width="76" height="30" rx="4" fill="#101d2b" stroke="#8b69d4"/><path d="M297 169h47v16h-47z" fill="#293c50"/>${svgText(321,207,"HDMI/DP",9,"#b69ae9","middle")}
      ${rj45(279,226,board?.lan || ethernet.speed)}
      ${[0,1,2,3,4].map((i)=>`<circle cx="${148+i*47}" cy="335" r="14" fill="${["#7fcf74","#f4a65d","#72a9e8","#ef7a8d","#999"][i]}" stroke="#dbe8f3" stroke-width="2"/>`).join("")}
      ${svgText(242,371,"Audio 3,5 mm",9,"#a9bdd0","middle")}</g>
      <g class="port-group"><rect x="438" y="112" width="124" height="276" rx="9" fill="url(#rearMesh)" stroke="#516a82"/>
      ${[0,1,2].map(i=>`<circle cx="500" cy="${175+i*68}" r="27" fill="#0a1522" stroke="#607992" stroke-width="3"/><path d="M477 ${175+i*68}h46M500 ${152+i*68}v46" stroke="#334c63" stroke-width="4"/>`).join("")}
      ${svgText(500,367,"Gehäuselüfter",9,"#8299af","middle")}</g>`;

    if (onboardWifi || wifi.slot) {
      out += `<g class="port-group"><circle cx="383" cy="154" r="7" fill="#d7bf65"/><circle cx="383" cy="181" r="7" fill="#d7bf65"/><path d="M383 147q18-42 34-57M383 174q28-33 54-36" fill="none" stroke="#d7bf65" stroke-width="4"/>${svgText(399,216,wifi.speed,9,"#ffc857","middle")}</g>`;
    }

    out += `<g class="port-group"><rect x="112" y="425" width="450" height="90" rx="7" fill="#101d2b" stroke="${hasGpu ? "#ff6b7a" : "#50677d"}" stroke-width="2"/>
      ${svgText(130,449,hasGpu ? "GRAFIKKARTE" : "FREIE SLOTBLENDEN",10,hasGpu ? "#ff9aa5" : "#71879d")}
      ${hasGpu ? `<rect x="254" y="458" width="66" height="28" rx="3" fill="#25394a" stroke="#b69ae9"/><rect x="333" y="458" width="66" height="28" rx="3" fill="#25394a" stroke="#b69ae9"/><rect x="412" y="458" width="66" height="28" rx="3" fill="#25394a" stroke="#b69ae9"/>${svgText(365,505,"DisplayPort / HDMI",9,"#b69ae9","middle")}` : svgText(337,477,"keine dedizierte GPU gewählt",10,"#71879d","middle")}</g>`;

    let expansionY = 548;
    if (ethernet.slot) {
      out += `<g class="port-group"><rect x="112" y="${expansionY}" width="450" height="44" rx="6" fill="#112334" stroke="#65e6c4"/>${rj45(438,expansionY-7,ethernet.speed)}${svgText(130,expansionY+27,ethernet.name,10,"#d9e8f3")}</g>`;
      expansionY += 58;
    }
    if (wifi.slot) {
      out += `<g class="port-group"><rect x="112" y="${expansionY}" width="450" height="44" rx="6" fill="#112334" stroke="#ffc857"/><circle cx="501" cy="${expansionY+22}" r="7" fill="#d7bf65"/><circle cx="535" cy="${expansionY+22}" r="7" fill="#d7bf65"/>${svgText(130,expansionY+27,wifi.name+" · Antennen",10,"#ffe2a1")}</g>`;
    }
    out += svgText(340,704,"Farben kennzeichnen Funktionen, nicht verbindliche Port-Normen.",9,"#71879d","middle");
    svg.innerHTML = out;
  }

  function setView(view) {
    activeView = view;
    $("#pc-view").hidden = view !== "inside";
    $("#port-view").hidden = view !== "ports";
    document.querySelectorAll(".view-button").forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    if (view === "ports") {
      renderPorts();
      $("#view-legend").innerHTML = '<span><i style="background:#56c8ff"></i>USB</span><span><i style="background:#65e6c4"></i>Ethernet</span><span><i style="background:#ffc857"></i>WLAN</span><span><i style="background:#b69ae9"></i>Bildausgabe</span>';
    }
  }

  function refreshAfterConfiguratorRender() {
    renderNetwork();
    renderPorts();
    applyPrice(true);
    const button = $("#lesson-button");
    if (button) button.setAttribute("aria-label",`Lerninformationen: ${currentLessonKey()}`);
    if (activeView === "ports") setView("ports");
  }

  async function copyExtended(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const lines = ["BuildBench PC-Konfiguration", ""];
    document.querySelectorAll(".build-row").forEach(row => {
      const category = row.querySelector(".build-category")?.textContent.trim();
      const item = row.querySelector(".build-item")?.textContent.trim();
      const price = row.querySelector(".build-price")?.textContent.trim();
      if (category) lines.push(`${category}: ${item || "offen"}${price && price !== "–" ? " – " + price : ""}`);
    });
    lines.push(`Ethernet: ${chosen("ethernet").name} – ${euro(chosen("ethernet").price)}`);
    lines.push(`WLAN: ${chosen("wifi").name} – ${euro(chosen("wifi").price)}`);
    lines.push("", `Gesamt: ${$("#price-label")?.textContent || "–"}`, `Leistung: ${$("#power-label")?.textContent || "–"}`);
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
    applyPrice(false);
  }

  loadNetwork();
  renderNetwork();
  renderPorts();
  applyPrice(true);

  $("#copy-button")?.addEventListener("click", copyExtended, true);
  $("#reset-button")?.addEventListener("click", () => setTimeout(() => {
    const values = Object.values(baseSelections());
    if (!values.some(Boolean)) resetNetworkDefaults();
  }, 0));
  $("#example-button")?.addEventListener("click", () => setTimeout(resetNetworkDefaults, 0));
  $("#safety-button")?.addEventListener("click", () => openLesson("Grundregeln"));
  $("#lesson-button")?.addEventListener("click", () => openLesson(currentLessonKey()));
  document.querySelectorAll(".dialog-close").forEach(button => button.addEventListener("click", () => $("#lesson-dialog").close()));
  $("#lesson-dialog")?.addEventListener("click", event => {
    if (event.target === $("#lesson-dialog")) $("#lesson-dialog").close();
  });
  document.querySelectorAll(".view-button").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));

  const observer = new MutationObserver(() => {
    clearTimeout(observer.timer);
    observer.timer = setTimeout(refreshAfterConfiguratorRender, 0);
  });
  const observed = $("#build-list");
  if (observed) observer.observe(observed,{childList:true,subtree:true});

  const priceObserver = new MutationObserver(() => {
    const label = $("#price-label");
    if (label && label.textContent !== renderedPrice) applyPrice(true);
  });
  if ($("#price-label")) priceObserver.observe($("#price-label"),{childList:true,subtree:true,characterData:true});
})();
