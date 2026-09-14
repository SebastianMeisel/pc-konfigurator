"use strict";

const questionBank=[
  {
    "category": "Arbeitsschutz & Montage",
    "definition": "gleicht elektrische Potenziale kontrolliert aus und schützt empfindliche Bauteile vor elektrostatischer Entladung",
    "hint": "Potentialausgleich statt Isolation",
    "id": "q001",
    "term": "ESD-Armband"
  },
  {
    "category": "Arbeitsschutz & Montage",
    "definition": "erfordert Herunterfahren, Ausschalten des Netzteils und Ziehen des Netzkabels vor internen Arbeiten",
    "hint": "Verbindung zum Stromnetz beachten",
    "id": "q002",
    "term": "Spannungsfreiheit"
  },
  {
    "category": "Arbeitsschutz & Montage",
    "definition": "vermeidet direkten Kontakt mit Kontakten, Leiterbahnen und empfindlichen Bauteilen",
    "hint": "leitende Flächen nicht berühren",
    "id": "q003",
    "term": "Anfassen an Platinenkanten"
  },
  {
    "category": "Arbeitsschutz & Montage",
    "definition": "halten die Platine vom Gehäuseblech fern und dürfen nur unter vorgesehenen Schraublöchern sitzen",
    "hint": "Metall unter einer Platine",
    "id": "q004",
    "term": "Mainboard-Abstandhalter"
  },
  {
    "category": "Arbeitsschutz & Montage",
    "definition": "verhindert durch Kerben und Formen falsches Einsetzen; ein Stecker darf nicht mit Gewalt montiert werden",
    "hint": "Form und Ausrichtung prüfen",
    "id": "q005",
    "term": "Steckercodierung"
  },
  {
    "category": "Arbeitsschutz & Montage",
    "definition": "muss vor der Montage entfernt werden, damit Wärme zuverlässig an den Kühler übertragen wird",
    "hint": "keine Transportschicht im Wärmeweg",
    "id": "q006",
    "term": "Kühler-Schutzfolie"
  },
  {
    "category": "Arbeitsschutz & Montage",
    "definition": "soll stabil, sauber, gut beleuchtet und möglichst nicht statisch aufladend sein",
    "hint": "mechanische und elektrische Sicherheit",
    "id": "q007",
    "term": "Montagearbeitsplatz"
  },
  {
    "category": "Arbeitsschutz & Montage",
    "definition": "darf nicht weiterverwendet, geöffnet oder gequetscht werden und gehört in eine geeignete Rücknahme",
    "hint": "Verformung ist ein Sicherheitsproblem",
    "id": "q008",
    "term": "Beschädigte Lithium-Batterie"
  },
  {
    "category": "Arbeitsschutz & Montage",
    "definition": "findet lose Stecker, Werkzeuge und Kabel in Lüftern vor dem ersten Einschalten",
    "hint": "alles Bewegliche und Angeschlossene kontrollieren",
    "id": "q009",
    "term": "Abschließende Sichtprüfung"
  },
  {
    "category": "Arbeitsschutz & Montage",
    "definition": "liefert verbindliche Angaben zu Anschlüssen, Bestückungsreihenfolge, Schrauben und Montageverfahren",
    "hint": "modellspezifische Vorgaben statt Vermutungen",
    "id": "q010",
    "term": "Herstellerhandbuch"
  },
  {
    "category": "Mainboard & CPU",
    "definition": "stellt die mechanische und elektrische Verbindung zwischen Prozessor und Mainboard her",
    "hint": "Prozessor und Platine verbinden",
    "id": "q011",
    "term": "CPU-Sockel"
  },
  {
    "category": "Mainboard & CPU",
    "definition": "ergänzt die CPU um Ein-/Ausgabe- und Erweiterungsfunktionen wie USB, SATA oder zusätzliche PCIe-Lanes",
    "hint": "Anschlüsse außerhalb der CPU",
    "id": "q012",
    "term": "Chipsatz"
  },
  {
    "category": "Mainboard & CPU",
    "definition": "initialisiert die Hardware, stellt Firmware-Einstellungen bereit und startet den Bootloader",
    "hint": "arbeitet vor dem Betriebssystem",
    "id": "q013",
    "term": "UEFI"
  },
  {
    "category": "Mainboard & CPU",
    "definition": "wandelt die Netzteilspannung in niedrige, stabile Betriebsspannungen für CPU und weitere Baugruppen",
    "hint": "Spannungswandlung nahe der CPU",
    "id": "q014",
    "term": "VRM"
  },
  {
    "category": "Mainboard & CPU",
    "definition": "legt Abmessungen, Befestigungspunkte und grundlegende Slotanordnung der Platine fest",
    "hint": "ATX, microATX und Mini-ITX",
    "id": "q015",
    "term": "Mainboard-Formfaktor"
  },
  {
    "category": "Mainboard & CPU",
    "definition": "erzeugt ohne dedizierte Grafikkarte ein Bildsignal für die Mainboard-Bildausgänge",
    "hint": "Bildausgang braucht einen Grafikerzeuger",
    "id": "q016",
    "term": "Integrierte Grafikeinheit"
  },
  {
    "category": "Mainboard & CPU",
    "definition": "kann bei unterstützten Mainboards die Firmware über einen festgelegten USB-Port aktualisieren, teilweise ohne installierte CPU",
    "hint": "Firmwareaktualisierung mit Spezialport",
    "id": "q017",
    "term": "BIOS Flashback"
  },
  {
    "category": "Mainboard & CPU",
    "definition": "nennt unterstützte Prozessormodelle und häufig die dafür mindestens nötige Firmware-Version",
    "hint": "Sockelgleichheit allein genügt nicht",
    "id": "q018",
    "term": "CPU-Supportliste"
  },
  {
    "category": "Mainboard & CPU",
    "definition": "zeigt mit Dreieck oder Kerbe die korrekte Ausrichtung der CPU beim kraftlosen Einsetzen",
    "hint": "optische Einbauorientierung",
    "id": "q019",
    "term": "Sockelmarkierung"
  },
  {
    "category": "Mainboard & CPU",
    "definition": "schließt den Bereich um die rückseitigen Mainboardanschlüsse am Gehäuse ab",
    "hint": "Rahmen der rückseitigen Buchsen",
    "id": "q020",
    "term": "I/O-Blende"
  },
  {
    "category": "Arbeitsspeicher",
    "definition": "ist die übliche Bauform für austauschbaren Arbeitsspeicher in Desktop-PCs",
    "hint": "langes Speichermodul im Desktop",
    "id": "q021",
    "term": "DIMM"
  },
  {
    "category": "Arbeitsspeicher",
    "definition": "ist eine kompakte Arbeitsspeicherbauform für Notebooks und viele Mini-PCs",
    "hint": "kurzes Speichermodul",
    "id": "q022",
    "term": "SO-DIMM"
  },
  {
    "category": "Arbeitsspeicher",
    "definition": "nutzt zwei Speicherkanäle parallel und erhöht dadurch die verfügbare Speicherbandbreite",
    "hint": "parallele Datenwege zum RAM",
    "id": "q023",
    "term": "Dual Channel"
  },
  {
    "category": "Arbeitsspeicher",
    "definition": "bestimmt elektrische und mechanische Eigenschaften; DDR4 und DDR5 sind nicht steckkompatibel",
    "hint": "Kerbe und Spannung unterscheiden sich",
    "id": "q024",
    "term": "DDR-Generation"
  },
  {
    "category": "Arbeitsspeicher",
    "definition": "lädt hinterlegte Speicherprofile mit Takt, Spannung und Timings, wenn Plattform und Module sie unterstützen",
    "hint": "Leistungsprofil im UEFI",
    "id": "q025",
    "term": "XMP oder EXPO"
  },
  {
    "category": "Arbeitsspeicher",
    "definition": "kann bestimmte Bitfehler erkennen und Ein-Bit-Fehler korrigieren, sofern die Plattform ECC unterstützt",
    "hint": "Fehlerkorrektur im RAM",
    "id": "q026",
    "term": "ECC-Speicher"
  },
  {
    "category": "Arbeitsspeicher",
    "definition": "beschreiben Wartezyklen verschiedener Speicheroperationen und wirken zusammen mit dem Speichertakt",
    "hint": "Latenzen in Taktzyklen",
    "id": "q027",
    "term": "RAM-Timings"
  },
  {
    "category": "Arbeitsspeicher",
    "definition": "ermittelt beim Start stabile Signal- und Timingparameter und kann den ersten Start verlängern",
    "hint": "Firmware testet Speicherparameter",
    "id": "q028",
    "term": "Memory Training"
  },
  {
    "category": "Arbeitsspeicher",
    "definition": "bestimmt, wie viele aktive Daten ohne langsames Auslagern auf ein Laufwerk gehalten werden können",
    "hint": "Platz für laufende Programme",
    "id": "q029",
    "term": "RAM-Kapazität"
  },
  {
    "category": "Arbeitsspeicher",
    "definition": "werden im Mainboard-Handbuch genannt; bei zwei Modulen sind häufig A2 und B2 vorgesehen",
    "hint": "Bestückungsreihenfolge nach Handbuch",
    "id": "q030",
    "term": "Bevorzugte DIMM-Slots"
  },
  {
    "category": "Grafik & PCIe",
    "definition": "nimmt typischerweise eine dedizierte Grafikkarte auf und bietet mechanisch Platz für x16-Karten",
    "hint": "langer Erweiterungssteckplatz",
    "id": "q031",
    "term": "PCIe-x16-Steckplatz"
  },
  {
    "category": "Grafik & PCIe",
    "definition": "sind serielle Datenwege; mehr Lanes ermöglichen bei gleicher Generation mehr theoretische Bandbreite",
    "hint": "x4, x8 und x16",
    "id": "q032",
    "term": "PCIe-Lanes"
  },
  {
    "category": "Grafik & PCIe",
    "definition": "hält Texturen, Bilddaten, CAD-Szenen und lokale KI-Modelldaten nahe an der GPU",
    "hint": "schneller lokaler Speicher der GPU",
    "id": "q033",
    "term": "Grafikspeicher VRAM"
  },
  {
    "category": "Grafik & PCIe",
    "definition": "liefert einer leistungsstarken Grafikkarte zusätzliche Energie über passende PCIe- oder 12V-2x6-Kabel",
    "hint": "zusätzliche Versorgung neben dem Slot",
    "id": "q034",
    "term": "GPU-Stromanschluss"
  },
  {
    "category": "Grafik & PCIe",
    "definition": "muss mit dem freien Innenraum einschließlich Frontlüftern und Radiator verglichen werden",
    "hint": "Platz in Längsrichtung",
    "id": "q035",
    "term": "Grafikkartenlänge"
  },
  {
    "category": "Grafik & PCIe",
    "definition": "beschreibt, wie viele rückseitige Erweiterungsplätze Kühler und Karte belegen",
    "hint": "Dicke der Erweiterungskarte",
    "id": "q036",
    "term": "Grafikkarten-Slotbreite"
  },
  {
    "category": "Grafik & PCIe",
    "definition": "ist bei dedizierter Grafik der normale Anschlussort für den Monitor",
    "hint": "Bild dort abgreifen, wo es berechnet wird",
    "id": "q037",
    "term": "Grafikkarten-Bildausgang"
  },
  {
    "category": "Grafik & PCIe",
    "definition": "reduziert bei schweren Grafikkarten Durchhängen und mechanische Belastung des Steckplatzes",
    "hint": "Gewicht einer langen Karte abfangen",
    "id": "q038",
    "term": "GPU-Stütze"
  },
  {
    "category": "Grafik & PCIe",
    "definition": "ermöglicht der CPU, auf größere Bereiche des Grafikspeichers zusammenhängend zuzugreifen",
    "hint": "Zugriffsfenster auf VRAM",
    "id": "q039",
    "term": "Resizable BAR"
  },
  {
    "category": "Grafik & PCIe",
    "definition": "lässt Geräte verschiedener PCIe-Generationen meist mit der höchsten gemeinsam unterstützten Geschwindigkeit arbeiten",
    "hint": "Abwärtskompatibilität mit Grenzen",
    "id": "q040",
    "term": "PCIe-Aushandlung"
  },
  {
    "category": "Massenspeicher",
    "definition": "ist ein für nichtflüchtigen Speicher entwickeltes Protokoll, das meistens PCIe nutzt",
    "hint": "Protokoll statt Bauform",
    "id": "q041",
    "term": "NVMe"
  },
  {
    "category": "Massenspeicher",
    "definition": "bezeichnet eine kompakte Modulbauform, die je nach Steckplatz SATA oder PCIe/NVMe verwenden kann",
    "hint": "Formfaktor mit mehreren Protokollen",
    "id": "q042",
    "term": "M.2"
  },
  {
    "category": "Massenspeicher",
    "definition": "verbindet ein klassisches SATA-Laufwerk zur Datenübertragung mit dem Mainboard",
    "hint": "schmale Signalverbindung",
    "id": "q043",
    "term": "SATA-Datenkabel"
  },
  {
    "category": "Massenspeicher",
    "definition": "versorgt SATA-Laufwerke über ein Kabel des Netzteils mit elektrischer Energie",
    "hint": "breitere Energieverbindung",
    "id": "q044",
    "term": "SATA-Stromstecker"
  },
  {
    "category": "Massenspeicher",
    "definition": "ist ein stoßunempfindlicher SATA-Massenspeicher ohne bewegliche Schreib-/Leseköpfe",
    "hint": "kompaktes SATA-Laufwerk ohne Mechanik",
    "id": "q045",
    "term": "2,5-Zoll-SSD"
  },
  {
    "category": "Massenspeicher",
    "definition": "speichert Daten magnetisch auf rotierenden Scheiben und ist im Betrieb stoßempfindlich",
    "hint": "mechanischer Massenspeicher",
    "id": "q046",
    "term": "Festplatte HDD"
  },
  {
    "category": "Massenspeicher",
    "definition": "ist eine moderne Partitionstabelle für UEFI-Systeme, große Datenträger und zahlreiche Partitionen",
    "hint": "Partitionierung statt Dateisystem",
    "id": "q047",
    "term": "GPT"
  },
  {
    "category": "Massenspeicher",
    "definition": "stellt vom Laufwerk gemeldete Zustands-, Temperatur- und Fehlerindikatoren bereit",
    "hint": "Selbstüberwachungswerte des Laufwerks",
    "id": "q048",
    "term": "SMART"
  },
  {
    "category": "Massenspeicher",
    "definition": "kann je nach Level Verfügbarkeit oder Leistung erhöhen, ersetzt aber kein getrenntes Backup",
    "hint": "Redundanz ist keine Sicherungskopie",
    "id": "q049",
    "term": "RAID"
  },
  {
    "category": "Massenspeicher",
    "definition": "kann bei schneller NVMe-Dauerlast thermische Drosselung des Controllers verringern",
    "hint": "Wärme bei anhaltender Laufwerkslast",
    "id": "q050",
    "term": "M.2-Kühlkörper"
  },
  {
    "category": "Strom & Kühlung",
    "definition": "schafft Spielraum für Lastspitzen, effizienten Betrieb und sinnvolle spätere Erweiterungen",
    "hint": "nicht dauerhaft an der Leistungsgrenze",
    "id": "q051",
    "term": "Netzteilreserve"
  },
  {
    "category": "Strom & Kühlung",
    "definition": "bewertet hauptsächlich den Wirkungsgrad eines Netzteils bei definierten Lastpunkten",
    "hint": "Effizienz, nicht Gesamtqualität",
    "id": "q052",
    "term": "80-PLUS-Zertifizierung"
  },
  {
    "category": "Strom & Kühlung",
    "definition": "stellt die Hauptstromversorgung des Mainboards bereit",
    "hint": "großer Mainboard-Stromstecker",
    "id": "q053",
    "term": "24-poliger ATX-Stecker"
  },
  {
    "category": "Strom & Kühlung",
    "definition": "versorgt die Spannungswandler der CPU und sitzt meist nahe am Prozessorsockel",
    "hint": "CPU-Strom statt GPU-Strom",
    "id": "q054",
    "term": "EPS12V-Stecker"
  },
  {
    "category": "Strom & Kühlung",
    "definition": "versorgt und überwacht den Lüfter des Prozessorkühlers",
    "hint": "Firmware erwartet ein Drehzahlsignal",
    "id": "q055",
    "term": "CPU_FAN-Header"
  },
  {
    "category": "Strom & Kühlung",
    "definition": "bewegt das Kühlmittel durch Kühler, Schläuche und Radiator einer geschlossenen Wasserkühlung",
    "hint": "bewegliches Teil im Kühlkreislauf",
    "id": "q056",
    "term": "AIO-Pumpe"
  },
  {
    "category": "Strom & Kühlung",
    "definition": "überträgt Wärme aus dem Kühlmittel an die durchströmende Luft",
    "hint": "Wärmetauscher mit Lüftern",
    "id": "q057",
    "term": "Radiator"
  },
  {
    "category": "Strom & Kühlung",
    "definition": "führt typischerweise vorne oder unten kühle Luft zu und hinten oder oben warme Luft ab",
    "hint": "Einlass und Auslass planen",
    "id": "q058",
    "term": "Gerichteter Luftstrom"
  },
  {
    "category": "Strom & Kühlung",
    "definition": "ist eine herstellerspezifische thermische Auslegungsgröße und nicht zwingend die maximale elektrische Leistungsaufnahme",
    "hint": "Kühlerauslegung statt exakter Verbrauch",
    "id": "q059",
    "term": "TDP"
  },
  {
    "category": "Strom & Kühlung",
    "definition": "füllt mikroskopische Unebenheiten zwischen Chipoberfläche und Kühler, ohne eine dicke Schicht zu bilden",
    "hint": "Luftspalten im Kontakt verringern",
    "id": "q060",
    "term": "Wärmeleitpaste"
  },
  {
    "category": "Gehäuse & Verkabelung",
    "definition": "verbindet den Einschaltknopf des Gehäuses mit den vorgesehenen Front-Panel-Pins des Mainboards",
    "hint": "Taster an der Gehäusefront",
    "id": "q061",
    "term": "PWR_SW-Stecker"
  },
  {
    "category": "Gehäuse & Verkabelung",
    "definition": "muss wegen der Leuchtdioden-Polung korrekt mit Plus und Minus verbunden werden",
    "hint": "leuchtet bei vertauschter Richtung nicht",
    "id": "q062",
    "term": "Front-Panel-LED"
  },
  {
    "category": "Gehäuse & Verkabelung",
    "definition": "bindet Front-USB-Buchsen oder interne USB-Geräte an das Mainboard an",
    "hint": "USB-Verbindung innerhalb des Gehäuses",
    "id": "q063",
    "term": "Interner USB-Header"
  },
  {
    "category": "Gehäuse & Verkabelung",
    "definition": "verbindet Kopfhörer- und Mikrofonbuchsen an der Gehäusefront mit dem Mainboard-Audio",
    "hint": "Audio an der Front",
    "id": "q064",
    "term": "HD_AUDIO-Header"
  },
  {
    "category": "Gehäuse & Verkabelung",
    "definition": "hält Leitungen aus Lüftern und Luftwegen fern und erleichtert Wartung sowie Fehlersuche",
    "hint": "Ordnung mit technischem Nutzen",
    "id": "q065",
    "term": "Kabelmanagement"
  },
  {
    "category": "Gehäuse & Verkabelung",
    "definition": "verringert Staubeintrag an Ansaugöffnungen, erhöht aber etwas den Strömungswiderstand",
    "hint": "Filter vor einströmender Luft",
    "id": "q066",
    "term": "Staubfilter"
  },
  {
    "category": "Gehäuse & Verkabelung",
    "definition": "entsteht bei etwas mehr gefilterter Zuluft als Abluft und kann Staubeintrag durch Spalten mindern",
    "hint": "Zuluft geringfügig größer",
    "id": "q067",
    "term": "Positiver Gehäusedruck"
  },
  {
    "category": "Gehäuse & Verkabelung",
    "definition": "muss zu Gewinde und Abstandhalter passen; falsche oder zu lange Schrauben können Schäden verursachen",
    "hint": "Gewinde und Länge beachten",
    "id": "q068",
    "term": "Mainboard-Schraube"
  },
  {
    "category": "Gehäuse & Verkabelung",
    "definition": "ermöglicht Leitungswege hinter dem Mainboardtray und hält den Innenraum frei",
    "hint": "Kabel hinter der Montageplatte",
    "id": "q069",
    "term": "Kabeldurchführung"
  },
  {
    "category": "Gehäuse & Verkabelung",
    "definition": "nimmt 2,5- oder 3,5-Zoll-Laufwerke auf, kann aber den Platz für lange Grafikkarten begrenzen",
    "hint": "Speicherhalterung braucht Innenraum",
    "id": "q070",
    "term": "Laufwerkskäfig"
  },
  {
    "category": "Peripherieanschlüsse",
    "definition": "bezeichnet eine rechteckige Steckerform, aus der allein die unterstützte USB-Geschwindigkeit nicht sicher hervorgeht",
    "hint": "Form ist nicht gleich Datenrate",
    "id": "q071",
    "term": "USB-A"
  },
  {
    "category": "Peripherieanschlüsse",
    "definition": "bezeichnet eine symmetrische Steckerform; Datenrate, Laden und Bildausgabe hängen von der Implementierung ab",
    "hint": "gleiche Buchse, verschiedene Funktionen",
    "id": "q072",
    "term": "USB-C"
  },
  {
    "category": "Peripherieanschlüsse",
    "definition": "überträgt digitale Bild- und Audiodaten und wird häufig für Monitore und Fernseher verwendet",
    "hint": "Bild und Ton zum Display",
    "id": "q073",
    "term": "HDMI"
  },
  {
    "category": "Peripherieanschlüsse",
    "definition": "ist eine digitale Displayschnittstelle, die häufig hohe Auflösungen, Bildraten und Verkettung unterstützt",
    "hint": "PC-orientierter digitaler Bildanschluss",
    "id": "q074",
    "term": "DisplayPort"
  },
  {
    "category": "Peripherieanschlüsse",
    "definition": "kennzeichnet bei klassischer Farbcodierung häufig Line-out beziehungsweise Frontlautsprecher",
    "hint": "analoger Ton aus dem PC",
    "id": "q075",
    "term": "Grüne Audiobuchse"
  },
  {
    "category": "Peripherieanschlüsse",
    "definition": "ist der übliche Anschluss für Twisted-Pair-Ethernet am PC",
    "hint": "modularer Netzwerkanschluss",
    "id": "q076",
    "term": "RJ45-Buchse"
  },
  {
    "category": "Peripherieanschlüsse",
    "definition": "ist eine ältere, früh von der Firmware unterstützte Schnittstelle für Tastatur oder Maus",
    "hint": "runder Anschluss vor USB",
    "id": "q077",
    "term": "PS/2"
  },
  {
    "category": "Peripherieanschlüsse",
    "definition": "kombiniert je nach Version hohe Datenrate mit DisplayPort und PCIe-Tunnelung, häufig über USB-C",
    "hint": "mehr als die USB-C-Steckerform",
    "id": "q078",
    "term": "Thunderbolt"
  },
  {
    "category": "Peripherieanschlüsse",
    "definition": "koppelt externe Antennen an das Funkmodul und verbessert Reichweite sowie Signalqualität",
    "hint": "Funk braucht eine geeignete Antenne",
    "id": "q079",
    "term": "WLAN-Antennenanschluss"
  },
  {
    "category": "Peripherieanschlüsse",
    "definition": "handelt über geeignete USB-C-Verbindungen erhöhte Ladeleistungen und Spannungen zwischen Geräten aus",
    "hint": "Stromprofil wird ausgehandelt",
    "id": "q080",
    "term": "USB Power Delivery"
  },
  {
    "category": "Ethernet & WLAN",
    "definition": "handelt zwischen Ethernet-Linkpartnern gemeinsame Geschwindigkeit und Duplexmodus aus",
    "hint": "höchste gemeinsame Betriebsart",
    "id": "q081",
    "term": "Autonegotiation"
  },
  {
    "category": "Ethernet & WLAN",
    "definition": "benötigt passende Netzwerkkarten und Switch-Ports sowie eine geeignete Verkabelung",
    "hint": "beide Endpunkte begrenzen den Link",
    "id": "q082",
    "term": "2,5-Gigabit-Ethernet"
  },
  {
    "category": "Ethernet & WLAN",
    "definition": "ist für Gigabit-Ethernet bis 100 Meter spezifiziert, sofern Installation und Komponenten normgerecht sind",
    "hint": "klassische Büro-Gigabitverkabelung",
    "id": "q083",
    "term": "Cat-5e-Kabel"
  },
  {
    "category": "Ethernet & WLAN",
    "definition": "basiert auf IEEE 802.11ax und verbessert unter anderem Effizienz bei vielen Funkteilnehmern",
    "hint": "ax-Generation im 2,4- und 5-GHz-Band",
    "id": "q084",
    "term": "Wi-Fi 6"
  },
  {
    "category": "Ethernet & WLAN",
    "definition": "erweitert Wi-Fi 6 um die Nutzung des 6-GHz-Bandes bei geeigneten Geräten und regionaler Freigabe",
    "hint": "zusätzliches Funkband",
    "id": "q085",
    "term": "Wi-Fi 6E"
  },
  {
    "category": "Ethernet & WLAN",
    "definition": "ist eine häufige mechanische Codierung für interne WLAN-/Bluetooth-Module",
    "hint": "Kerbe für Funkmodule",
    "id": "q086",
    "term": "M.2 Key E"
  },
  {
    "category": "Ethernet & WLAN",
    "definition": "bindet bei vielen PCIe-WLAN-Kombikarten den Bluetooth-Teil intern über USB an",
    "hint": "zweiter Bus einer Funkkombikarte",
    "id": "q087",
    "term": "Bluetooth-USB-Header"
  },
  {
    "category": "Ethernet & WLAN",
    "definition": "identifiziert eine Netzwerkschnittstelle auf der Sicherungsschicht innerhalb lokaler Netze",
    "hint": "Kennung in Ethernet-Frames",
    "id": "q088",
    "term": "MAC-Adresse"
  },
  {
    "category": "Ethernet & WLAN",
    "definition": "ist ein aktuelles Verfahren für WLAN-Authentisierung und -Verschlüsselung",
    "hint": "Nachfolger unsicherer Altverfahren",
    "id": "q089",
    "term": "WPA3"
  },
  {
    "category": "Ethernet & WLAN",
    "definition": "verbindet WLAN-Teilnehmer mit einem kabelgebundenen Netzwerk und koordiniert das Funknetz",
    "hint": "Brücke zwischen Funk und LAN",
    "id": "q090",
    "term": "Access Point"
  },
  {
    "category": "Fehlersuche & Kompatibilität",
    "definition": "initialisiert und prüft beim Einschalten grundlegende Hardware, bevor das Betriebssystem startet",
    "hint": "Power-On Self-Test",
    "id": "q091",
    "term": "POST"
  },
  {
    "category": "Fehlersuche & Kompatibilität",
    "definition": "grenzt nach herstellerspezifischer Dokumentation Fehlerbereiche wie CPU, RAM oder Grafik ein",
    "hint": "Mainboard meldet Baugruppenfehler",
    "id": "q092",
    "term": "Debug-LED oder Beep-Code"
  },
  {
    "category": "Fehlersuche & Kompatibilität",
    "definition": "weist auf ein Problem bei Erkennung oder Initialisierung des Arbeitsspeichers hin",
    "hint": "Fehleranzeige nennt die Speichergruppe",
    "id": "q093",
    "term": "Dauerhafte DRAM-LED"
  },
  {
    "category": "Fehlersuche & Kompatibilität",
    "definition": "kann bei dedizierter GPU zu einem schwarzen Bild führen, wenn der Monitor am inaktiven Mainboard-Ausgang steckt",
    "hint": "Signalweg zur aktiven Grafik prüfen",
    "id": "q094",
    "term": "Falscher Monitoranschluss"
  },
  {
    "category": "Fehlersuche & Kompatibilität",
    "definition": "muss zusammen mit Netzkabel und Stromanschlüssen geprüft werden, wenn der PC überhaupt nicht reagiert",
    "hint": "Stromkette vom Netz bis zum Mainboard",
    "id": "q095",
    "term": "Netzteilschalter"
  },
  {
    "category": "Fehlersuche & Kompatibilität",
    "definition": "behebt mögliche Kontaktprobleme, wenn ein Modul nicht vollständig und gleichmäßig eingerastet ist",
    "hint": "mechanischer Sitz trotz fast richtiger Position",
    "id": "q096",
    "term": "RAM neu einsetzen"
  },
  {
    "category": "Fehlersuche & Kompatibilität",
    "definition": "reduziert das System auf notwendige Komponenten und grenzt Fehler durch schrittweises Ergänzen ein",
    "hint": "Komplexität für die Diagnose verringern",
    "id": "q097",
    "term": "Minimalaufbau"
  },
  {
    "category": "Fehlersuche & Kompatibilität",
    "definition": "muss mit exakt passender Firmware und ohne Stromunterbrechung nach Herstelleranleitung erfolgen",
    "hint": "Modell, Revision und sicherer Ablauf",
    "id": "q098",
    "term": "UEFI-Update"
  },
  {
    "category": "Fehlersuche & Kompatibilität",
    "definition": "senkt automatisch den Takt, wenn eine Komponente ihre Temperaturgrenze erreicht",
    "hint": "Schutz durch Leistungsreduzierung",
    "id": "q099",
    "term": "Thermal Throttling"
  },
  {
    "category": "Fehlersuche & Kompatibilität",
    "definition": "verändert pro Diagnoseschritt nur einen Faktor, damit Ursache und Wirkung nachvollziehbar bleiben",
    "hint": "kontrollierter und dokumentierter Test",
    "id": "q100",
    "term": "Ein-Änderungs-Prinzip"
  }
];

const TEST_SIZE=20;
const letters=["A","B","C","D"];
const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let activeQuestions=[],answers=[],currentIndex=0;
const $=selector=>document.querySelector(selector);
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

function randomValue(){
  if(globalThis.crypto&&typeof globalThis.crypto.getRandomValues==="function"){
    const value=new Uint32Array(1);globalThis.crypto.getRandomValues(value);return value[0]/4294967296;
  }
  return Math.random();
}
function shuffle(values){
  const result=[...values];
  for(let index=result.length-1;index>0;index-=1){
    const swapIndex=Math.floor(randomValue()*(index+1));
    [result[index],result[swapIndex]]=[result[swapIndex],result[index]];
  }
  return result;
}
function prepareQuestion(concept){
  const distractors=shuffle(questionBank.filter(item=>item.category===concept.category&&item.id!==concept.id)).slice(0,3);
  const options=shuffle([
    {text:concept.definition,isCorrect:true,feedback:concept.term+": "+concept.definition+"."},
    ...distractors.map(item=>({text:item.definition,isCorrect:false,feedback:"Diese Funktion gehört zu „"+item.term+"“. „"+concept.term+"“ bedeutet: "+concept.definition+"."}))
  ]);
  const templates=[
    "Welche Aussage beschreibt „"+concept.term+"“ korrekt?",
    "Welche Funktion gehört zu „"+concept.term+"“?",
    "Welche Definition passt zu „"+concept.term+"“?"
  ];
  return {...concept,question:templates[Number(concept.id.slice(1))%templates.length],options,correctIndex:options.findIndex(option=>option.isCorrect)};
}
function updateProgress(){
  const answered=answers.length,position=Math.min(currentIndex+1,TEST_SIZE);
  $("#progress-text").textContent="Frage "+position+" von "+TEST_SIZE;
  $("#score-text").textContent=answers.filter(answer=>answer.isCorrect).length+" richtig";
  $("#progress-fill").style.width=answered/TEST_SIZE*100+"%";
  $("#progress-track").setAttribute("aria-valuenow",String(answered));
  $("#progress-track").setAttribute("aria-valuetext",answered+" von "+TEST_SIZE+" Fragen beantwortet");
}
function renderQuestion(focusQuestion=true){
  const question=activeQuestions[currentIndex];
  $("#question-number").textContent=String(currentIndex+1).padStart(2,"0");
  $("#question-category").textContent=question.category;
  $("#question-heading").textContent=question.question;
  $("#hint-text").textContent=question.hint;
  $("#question-hint").open=false;
  $("#answer-list").innerHTML=question.options.map((option,index)=>
    '<label class="answer-option" data-option="'+index+'"><input type="radio" name="answer" value="'+index+'"><span class="answer-letter" aria-hidden="true">'+letters[index]+'</span><span class="answer-text">'+escapeHtml(option.text)+'</span></label>'
  ).join("");
  $("#feedback").hidden=true;$("#feedback").className="feedback";$("#feedback").textContent="";
  $("#submit-answer").hidden=false;$("#submit-answer").disabled=true;$("#next-question").hidden=true;
  $("#next-question").textContent=currentIndex===TEST_SIZE-1?"Test auswerten":"Nächste Frage";
  updateProgress();
  if(focusQuestion){
    $("#question-heading").focus({preventScroll:true});
    $("#quiz-panel").scrollIntoView({behavior:reducedMotion?"auto":"smooth",block:"start"});
  }
}
function submitAnswer(event){
  event.preventDefault();
  const selectedInput=document.querySelector('input[name="answer"]:checked');
  if(!selectedInput)return;
  const question=activeQuestions[currentIndex],selectedIndex=Number(selectedInput.value);
  const selectedOption=question.options[selectedIndex],correctOption=question.options[question.correctIndex];
  answers.push({question,selectedText:selectedOption.text,correctText:correctOption.text,isCorrect:selectedOption.isCorrect});
  document.querySelectorAll('input[name="answer"]').forEach(input=>{
    input.disabled=true;
    const label=input.closest(".answer-option"),optionIndex=Number(input.value);
    if(optionIndex===question.correctIndex)label.classList.add("correct");
    if(input.checked&&!selectedOption.isCorrect)label.classList.add("wrong");
  });
  const feedback=$("#feedback");
  feedback.classList.toggle("wrong",!selectedOption.isCorrect);
  feedback.innerHTML="<strong>"+(selectedOption.isCorrect?"Richtig.":"Noch nicht richtig.")+"</strong> "+(!selectedOption.isCorrect?"Die richtige Antwort lautet: "+escapeHtml(correctOption.text)+". ":"")+escapeHtml(selectedOption.feedback);
  feedback.hidden=false;$("#submit-answer").hidden=true;$("#next-question").hidden=false;updateProgress();$("#next-question").focus();
}
function resultGrade(score){
  if(score>=17)return{label:"sehr sicher",color:"var(--accent)",text:"Du beherrschst die Grundlagen sehr sicher und kannst die meisten Begriffe korrekt einordnen."};
  if(score>=14)return{label:"sicher",color:"#77a8ff",text:"Du verfügst über eine gute Grundlage. Wiederhole einzelne Themen anhand der Nachbesprechung."};
  if(score>=10)return{label:"teilweise sicher",color:"var(--warning)",text:"Viele Grundlagen sitzen bereits. Nutze Hinweise und Begründungen, um Lücken gezielt zu schließen."};
  return{label:"noch ausbaufähig",color:"var(--danger)",text:"Arbeite die schwächeren Themen im Konfigurator und in den Lernkarten noch einmal durch."};
}
function renderResults(){
  const score=answers.filter(answer=>answer.isCorrect).length,percent=Math.round(score/TEST_SIZE*100),grade=resultGrade(score),categoryMap=new Map();
  answers.forEach(answer=>{
    const entry=categoryMap.get(answer.question.category)||{total:0,correct:0};
    entry.total+=1;if(answer.isCorrect)entry.correct+=1;categoryMap.set(answer.question.category,entry);
  });
  const categories=[...categoryMap.entries()].sort((a,b)=>(a[1].correct/a[1].total)-(b[1].correct/b[1].total)||a[0].localeCompare(b[0],"de"));
  const weakest=categories[0];
  $("#quiz-panel").hidden=true;$("#result-panel").hidden=false;$("#result-score").textContent=score;
  $("#result-summary").textContent=score+" von "+TEST_SIZE+" Fragen richtig ("+percent+" %): "+grade.text;
  $("#result-ring").style.setProperty("--result-percent",String(percent));$("#result-ring").style.setProperty("--ring-color",grade.color);
  $("#result-ring").setAttribute("aria-label",score+" von "+TEST_SIZE+" Fragen richtig; Kenntnisstand "+grade.label+".");
  $("#category-results").innerHTML=categories.map(([category,result])=>{
    const value=Math.round(result.correct/result.total*100);
    return '<div class="category-result"><span>'+escapeHtml(category)+'</span><span class="mini-track" aria-hidden="true"><span style="width:'+value+'%"></span></span><strong>'+result.correct+" / "+result.total+"</strong></div>";
  }).join("");
  const weakText=weakest&&weakest[1].correct<weakest[1].total?"Beginne mit <strong>"+escapeHtml(weakest[0])+"</strong>. Dort wurden "+weakest[1].correct+" von "+weakest[1].total+" Fragen richtig beantwortet.":"In allen vorkommenden Themen wurden sämtliche Fragen richtig beantwortet.";
  $("#recommendation").innerHTML=weakText+" Begründe anschließend jede richtige Lösung noch einmal mit eigenen Worten.";
  $("#review-list").innerHTML=answers.map((answer,index)=>
    '<details class="review-item"><summary><span class="review-state'+(answer.isCorrect?"":" wrong")+'">'+(answer.isCorrect?"RICHTIG":"FALSCH")+'</span><span>'+(index+1)+". "+escapeHtml(answer.question.question)+'</span></summary><div class="review-content"><p><strong>Deine Antwort:</strong> '+escapeHtml(answer.selectedText)+'</p>'+(!answer.isCorrect?'<p><strong>Richtige Antwort:</strong> '+escapeHtml(answer.correctText)+'</p>':"")+'<p><strong>Begründung:</strong> '+escapeHtml(answer.question.term)+": "+escapeHtml(answer.question.definition)+'.</p></div></details>'
  ).join("");
  $("#result-title").focus({preventScroll:true});$("#result-panel").scrollIntoView({behavior:reducedMotion?"auto":"smooth",block:"start"});
}
function startQuiz(focusQuestion=true){
  activeQuestions=shuffle(questionBank).slice(0,TEST_SIZE).map(prepareQuestion);answers=[];currentIndex=0;
  $("#result-panel").hidden=true;$("#quiz-panel").hidden=false;renderQuestion(focusQuestion);
}
$("#answer-list").addEventListener("change",()=>{$("#submit-answer").disabled=false});
$("#quiz-form").addEventListener("submit",submitAnswer);
$("#next-question").addEventListener("click",()=>{if(currentIndex===TEST_SIZE-1){renderResults();return}currentIndex+=1;renderQuestion()});
$("#restart-quiz").addEventListener("click",()=>startQuiz(true));
startQuiz(false);