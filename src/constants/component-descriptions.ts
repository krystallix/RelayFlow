export interface ComponentLocalizedInfo {
  name: string;
  summary: string;
  functionDesc: string;
  application: string;
}

export interface ComponentMeta {
  tagPrefix: string;
  id: ComponentLocalizedInfo;
  en: ComponentLocalizedInfo;
  name: string;
  summary: string;
  functionDesc: string;
  application: string;
}

export const COMPONENT_METADATA: Record<string, ComponentMeta> = {
  "panelButtonMomentary": {
    "tagPrefix": "-SB",
    "id": {
      "name": "Tombol Panel Bulat (Momentary)",
      "summary": "Pushbutton Panel HMI Tanpa Kabel (Spring Return)",
      "functionDesc": "Tombol panel virtual interaktif tanpa kabel. Otomatis mengendalikan tombol/kontak di rangkaian dengan Tag yang sama saat ditekan (spring return).",
      "application": "Tombol Start panel kontrol HMI, tombol inching/jogging, dan pushbutton kontrol."
    },
    "en": {
      "name": "Round Panel Pushbutton (Momentary)",
      "summary": "Wireless HMI Panel Pushbutton (Spring Return)",
      "functionDesc": "Interactive wireless panel button. Automatically activates matching switches and contacts sharing the same Tag while held down.",
      "application": "HMI start pushbuttons, jogging/inching controls, and momentary test inputs."
    },
    "name": "Round Panel Pushbutton (Momentary)",
    "summary": "Wireless HMI Panel Pushbutton (Spring Return)",
    "functionDesc": "Interactive wireless panel button. Automatically activates matching switches and contacts sharing the same Tag while held down.",
    "application": "HMI start pushbuttons, jogging/inching controls, and momentary test inputs."
  },
  "panelButtonLatching": {
    "tagPrefix": "-SA",
    "id": {
      "name": "Saklar Panel Bulat (Latching)",
      "summary": "Saklar Panel HMI Tanpa Kabel (Toggle ON-OFF)",
      "functionDesc": "Saklar panel virtual interaktif tanpa kabel. Menahan status ON/OFF (latching) dan mengendalikan saklar/kontak di rangkaian dengan Tag yang sama.",
      "application": "Saklar pemilih mode Auto/Manual, switch daya kontrol panel, dan saklar pengunci."
    },
    "en": {
      "name": "Round Panel Switch (Latching)",
      "summary": "Wireless HMI Panel Switch (Toggle ON-OFF)",
      "functionDesc": "Interactive wireless panel switch. Toggles and latches ON/OFF state, controlling matching switches/contacts sharing the same Tag.",
      "application": "Auto/Manual selector switches, panel power toggles, and latching controls."
    },
    "name": "Round Panel Switch (Latching)",
    "summary": "Wireless HMI Panel Switch (Toggle ON-OFF)",
    "functionDesc": "Interactive wireless panel switch. Toggles and latches ON/OFF state, controlling matching switches/contacts sharing the same Tag.",
    "application": "Auto/Manual selector switches, panel power toggles, and latching controls."
  },
  "panelLamp": {
    "tagPrefix": "-HL",
    "id": {
      "name": "Lampu Pilot Panel Bulat",
      "summary": "Pilot Lamp Panel HMI Tanpa Kabel (Pilihan Warna)",
      "functionDesc": "Indikator lampu panel bulat dengan pilihan warna (Merah, Hijau, Kuning, Biru, Putih). Menyala otomatis jika beban/lampu di rangkaian dengan Tag yang sama aktif.",
      "application": "Indikator status panel (Run/Stop/Fault), lampu penanda fasa, dan display HMI."
    },
    "en": {
      "name": "Round Panel Pilot Lamp",
      "summary": "Wireless HMI Pilot Lamp (Configurable Colors)",
      "functionDesc": "Round panel indicator lamp with selectable lens colors (Red, Green, Yellow, Blue, White). Lights up automatically when matching circuit lamps/loads with the same Tag are energized.",
      "application": "Panel status indicator (Run/Stop/Fault), phase monitors, and HMI visual displays."
    },
    "name": "Round Panel Pilot Lamp",
    "summary": "Wireless HMI Pilot Lamp (Configurable Colors)",
    "functionDesc": "Round panel indicator lamp with selectable lens colors (Red, Green, Yellow, Blue, White). Lights up automatically when matching circuit lamps/loads with the same Tag are energized.",
    "application": "Panel status indicator (Run/Stop/Fault), phase monitors, and HMI visual displays."
  },
  "sourceL1": {
    "tagPrefix": "L1",
    "id": {
      "name": "Phase L1 Power Source",
      "summary": "Terminal Catu Daya Fasa 1 (AC)",
      "functionDesc": "Menyediakan tegangan fasa L1 (R) untuk rangkaian daya atau kontrol industri (220VAC / 380VAC).",
      "application": "Suplai fasa pertama pada sistem tenaga listrik 3-fasa atau fasa kontrol tunggal."
    },
    "en": {
      "name": "Phase L1 Power Source",
      "summary": "Phase 1 Power Source Terminal (AC)",
      "functionDesc": "Provides phase L1 (R) AC voltage for industrial power or control circuits (220VAC / 380VAC).",
      "application": "First phase supply in 3-phase power or single-phase control circuits."
    },
    "name": "Phase L1 Power Source",
    "summary": "Terminal Catu Daya Fasa 1 (AC)",
    "functionDesc": "Menyediakan tegangan fasa L1 (R) untuk rangkaian daya atau kontrol industri (220VAC / 380VAC).",
    "application": "Suplai fasa pertama pada sistem tenaga listrik 3-fasa atau fasa kontrol tunggal."
  },
  "sourceL2": {
    "tagPrefix": "L2",
    "id": {
      "name": "Phase L2 Power Source",
      "summary": "Terminal Catu Daya Fasa 2 (AC)",
      "functionDesc": "Menyediakan tegangan fasa L2 (S) dengan pergeseran sudut 120° terhadap L1.",
      "application": "Suplai fasa kedua sistem 3-fasa untuk beban motor dan distribusi."
    },
    "en": {
      "name": "Phase L2 Power Source",
      "summary": "Phase 2 Power Source Terminal (AC)",
      "functionDesc": "Provides phase L2 (S) AC voltage with a 120° phase displacement relative to L1.",
      "application": "Second phase supply in 3-phase power distribution and motor feeders."
    },
    "name": "Phase L2 Power Source",
    "summary": "Terminal Catu Daya Fasa 2 (AC)",
    "functionDesc": "Menyediakan tegangan fasa L2 (S) dengan pergeseran sudut 120° terhadap L1.",
    "application": "Suplai fasa kedua sistem 3-fasa untuk beban motor dan distribusi."
  },
  "sourceL3": {
    "tagPrefix": "L3",
    "id": {
      "name": "Phase L3 Power Source",
      "summary": "Terminal Catu Daya Fasa 3 (AC)",
      "functionDesc": "Menyediakan tegangan fasa L3 (T) untuk melengkapi suplai tenaga seimbang 3-fasa.",
      "application": "Suplai fasa ketiga sistem 3-fasa pada motor listrik dan transformator."
    },
    "en": {
      "name": "Phase L3 Power Source",
      "summary": "Phase 3 Power Source Terminal (AC)",
      "functionDesc": "Provides phase L3 (T) AC voltage completing the 3-phase balanced supply.",
      "application": "Third phase supply for electric motors and 3-phase transformers."
    },
    "name": "Phase L3 Power Source",
    "summary": "Terminal Catu Daya Fasa 3 (AC)",
    "functionDesc": "Menyediakan tegangan fasa L3 (T) untuk melengkapi suplai tenaga seimbang 3-fasa.",
    "application": "Suplai fasa ketiga sistem 3-fasa pada motor listrik dan transformator."
  },
  "sourceN": {
    "tagPrefix": "N",
    "id": {
      "name": "Neutral Line Source",
      "summary": "Terminal Konduktor Netral (AC)",
      "functionDesc": "Jalur kembali arus untuk rangkaian beban 1-fasa (220VAC) seperti koil relay, timer, dan pilot lamp.",
      "application": "Titik referensi nol volt fasa-netral pada panel kontrol industri."
    },
    "en": {
      "name": "Neutral Line Source",
      "summary": "Neutral Conductor Terminal (AC)",
      "functionDesc": "Return path for single-phase 220VAC loads such as relay coils, timers, and pilot lights.",
      "application": "Zero-volt reference point between phase and neutral in industrial control panels."
    },
    "name": "Neutral Line Source",
    "summary": "Terminal Konduktor Netral (AC)",
    "functionDesc": "Jalur kembali arus untuk rangkaian beban 1-fasa (220VAC) seperti koil relay, timer, dan pilot lamp.",
    "application": "Titik referensi nol volt fasa-netral pada panel kontrol industri."
  },
  "sourcePE": {
    "tagPrefix": "PE",
    "id": {
      "name": "Protective Earth (Ground)",
      "summary": "Terminal Pembumian Proteksi (PE)",
      "functionDesc": "Mengalirkan arus bocor langsung ke tanah untuk mencegah tegangan sentuh berbahaya pada bodi logam.",
      "application": "Pentanahan sasis motor, panel kelistrikan, dan filter EMC/RFI."
    },
    "en": {
      "name": "Protective Earth (Ground)",
      "summary": "Protective Earth Ground Terminal (PE)",
      "functionDesc": "Diverts leakage currents safely to ground, preventing hazardous touch voltages on conductive enclosures.",
      "application": "Grounding for motor chassis, metallic enclosures, and EMC/RFI filters."
    },
    "name": "Protective Earth (Ground)",
    "summary": "Terminal Pembumian Proteksi (PE)",
    "functionDesc": "Mengalirkan arus bocor langsung ke tanah untuk mencegah tegangan sentuh berbahaya pada bodi logam.",
    "application": "Pentanahan sasis motor, panel kelistrikan, dan filter EMC/RFI."
  },
  "sourceGnd": {
    "tagPrefix": "GND",
    "id": {
      "name": "Grounding Terminal",
      "summary": "Terminal Ground Sistem",
      "functionDesc": "Titik bumi referensi kelistrikan untuk pengaman isolasi dan pembuangan arus gangguan sirkuit.",
      "application": "Pembumian umum sistem instrumen dan daya."
    },
    "en": {
      "name": "Grounding Terminal",
      "summary": "Protective Earth Ground Terminal (PE)",
      "functionDesc": "Diverts leakage currents safely to ground, preventing hazardous touch voltages on conductive enclosures.",
      "application": "Grounding for motor chassis, metallic enclosures, and EMC/RFI filters."
    },
    "name": "Grounding Terminal",
    "summary": "Terminal Ground Sistem",
    "functionDesc": "Titik bumi referensi kelistrikan untuk pengaman isolasi dan pembuangan arus gangguan sirkuit.",
    "application": "Pembumian umum sistem instrumen dan daya."
  },
  "sourceL1L2L3": {
    "tagPrefix": "L1,L2,L3",
    "id": {
      "name": "3-Phase Power Supply (L1-L2-L3)",
      "summary": "Sumber Daya 3-Fasa Terpadu",
      "functionDesc": "Menyuplai 3 fasa AC seimbang sekaligus ke busbar utama atau sirkuit daya motor listrik.",
      "application": "Rel daya motor 3-fasa (DOL, Star-Delta, Forward-Reverse)."
    },
    "en": {
      "name": "3-Phase Power Supply (L1-L2-L3)",
      "summary": "Unified 3-Phase Power Source (L1-L2-L3)",
      "functionDesc": "Supplies three balanced AC phases directly to main busbars or motor power circuits.",
      "application": "Main 3-phase power feeder for motor starters (DOL, Star-Delta, Reversing)."
    },
    "name": "3-Phase Power Supply (L1-L2-L3)",
    "summary": "Sumber Daya 3-Fasa Terpadu",
    "functionDesc": "Menyuplai 3 fasa AC seimbang sekaligus ke busbar utama atau sirkuit daya motor listrik.",
    "application": "Rel daya motor 3-fasa (DOL, Star-Delta, Forward-Reverse)."
  },
  "sourceL1L2L3N": {
    "tagPrefix": "L1,L2,L3,N",
    "id": {
      "name": "3-Phase 4-Wire Source (L1-L2-L3-N)",
      "summary": "Sumber Daya 3-Fasa 4-Kawat",
      "functionDesc": "Menyuplai 3 fasa daya motor (380V) dan netral untuk sirkuit kontrol (220V) dalam satu kelompok rapi.",
      "application": "Masukan utama panel LVMDP / MCC (Motor Control Center)."
    },
    "en": {
      "name": "3-Phase 4-Wire Source (L1-L2-L3-N)",
      "summary": "3-Phase 4-Wire Power Supply (L1-L2-L3-N)",
      "functionDesc": "Provides 3-phase power (380V) and neutral (220V) in a single integrated feeder bundle.",
      "application": "Main intake supply for LVMDP and Motor Control Center (MCC) panels."
    },
    "name": "3-Phase 4-Wire Source (L1-L2-L3-N)",
    "summary": "Sumber Daya 3-Fasa 4-Kawat",
    "functionDesc": "Menyuplai 3 fasa daya motor (380V) dan netral untuk sirkuit kontrol (220V) dalam satu kelompok rapi.",
    "application": "Masukan utama panel LVMDP / MCC (Motor Control Center)."
  },
  "sourcePlus": {
    "tagPrefix": "+",
    "id": {
      "name": "DC Positive Terminal (+24V)",
      "summary": "Terminal Kutub Positif Arus Searah (DC)",
      "functionDesc": "Menyediakan potensial positif untuk rangkaian kontrol tegangan rendah (misal +24VDC PLC/sensor).",
      "application": "Suplai daya koil DC, sensor proximity, saklar optoelektronik, dan modul PLC."
    },
    "en": {
      "name": "DC Positive Terminal (+24V)",
      "summary": "DC Positive Power Terminal (+24V)",
      "functionDesc": "Provides positive direct current potential for low-voltage control circuits (e.g. +24VDC PLC/sensors).",
      "application": "Supply rail for DC relay coils, proximity sensors, photoelectric switches, and PLC I/O."
    },
    "name": "DC Positive Terminal (+24V)",
    "summary": "Terminal Kutub Positif Arus Searah (DC)",
    "functionDesc": "Menyediakan potensial positif untuk rangkaian kontrol tegangan rendah (misal +24VDC PLC/sensor).",
    "application": "Suplai daya koil DC, sensor proximity, saklar optoelektronik, dan modul PLC."
  },
  "sourceNegative": {
    "tagPrefix": "-",
    "id": {
      "name": "DC Negative Terminal (0V / -)",
      "summary": "Terminal Kutub Negatif / Nol Arus Searah (DC)",
      "functionDesc": "Jalur kembali arus (return path / common ground) sistem kontrol DC.",
      "application": "Terminal 0V/GND rangkaian instrumen DC dan sensor industri."
    },
    "en": {
      "name": "DC Negative Terminal (0V / -)",
      "summary": "DC Negative / 0V Common Terminal",
      "functionDesc": "Return path and common 0V ground reference for DC instrumentation and control systems.",
      "application": "0V/GND terminal for industrial DC sensors and control devices."
    },
    "name": "DC Negative Terminal (0V / -)",
    "summary": "Terminal Kutub Negatif / Nol Arus Searah (DC)",
    "functionDesc": "Jalur kembali arus (return path / common ground) sistem kontrol DC.",
    "application": "Terminal 0V/GND rangkaian instrumen DC dan sensor industri."
  },
  "battery": {
    "tagPrefix": "G",
    "id": {
      "name": "DC Battery Storage",
      "summary": "Catu Daya Baterai Mandiri (DC)",
      "functionDesc": "Menghasilkan tegangan searah independen dari reaksi elektrokimia untuk operasi saat daya utama padam.",
      "application": "Sistem UPS, starter genset darurat, dan panel tripping gardu."
    },
    "en": {
      "name": "DC Battery Storage",
      "summary": "Autonomous DC Battery Power Supply",
      "functionDesc": "Provides independent direct current voltage through electrochemical storage during main power outage.",
      "application": "UPS battery banks, emergency generator cranking starters, and substation tripping supplies."
    },
    "name": "DC Battery Storage",
    "summary": "Catu Daya Baterai Mandiri (DC)",
    "functionDesc": "Menghasilkan tegangan searah independen dari reaksi elektrokimia untuk operasi saat daya utama padam.",
    "application": "Sistem UPS, starter genset darurat, dan panel tripping gardu."
  },
  "powerSupply": {
    "tagPrefix": "U",
    "id": {
      "name": "Industrial Power Supply (SMPS)",
      "summary": "Catu Daya Switching AC-DC Multi-Terminal",
      "functionDesc": "Mengonversi tegangan bolak-balik (AC) menjadi tegangan searah (DC) stabil dengan proteksi beban lebih internal.",
      "application": "Pencatu daya modul kontrol industri, PLC, dan instrumen panel."
    },
    "en": {
      "name": "Industrial Power Supply (SMPS)",
      "summary": "Regulated Industrial Switching Power Supply (SMPS)",
      "functionDesc": "Converts alternating current (AC) into regulated, ripple-free direct current (DC) with built-in overload protection.",
      "application": "DC power supply for PLC controllers, HMI touchscreens, and field sensors."
    },
    "name": "Industrial Power Supply (SMPS)",
    "summary": "Catu Daya Switching AC-DC Multi-Terminal",
    "functionDesc": "Mengonversi tegangan bolak-balik (AC) menjadi tegangan searah (DC) stabil dengan proteksi beban lebih internal.",
    "application": "Pencatu daya modul kontrol industri, PLC, dan instrumen panel."
  },
  "powerSupply2": {
    "tagPrefix": "U",
    "id": {
      "name": "Regulated DC Power Supply",
      "summary": "Catu Daya Switching AC-DC 24V",
      "functionDesc": "Menurunkan dan menyearahkan tegangan AC fasa-netral menjadi DC teregulasi untuk sirkuit kontrol.",
      "application": "Pencatu daya kontrol relay 24VDC dan sensor."
    },
    "en": {
      "name": "Regulated DC Power Supply",
      "summary": "Regulated Industrial Switching Power Supply (SMPS)",
      "functionDesc": "Converts alternating current (AC) into regulated, ripple-free direct current (DC) with built-in overload protection.",
      "application": "DC power supply for PLC controllers, HMI touchscreens, and field sensors."
    },
    "name": "Regulated DC Power Supply",
    "summary": "Catu Daya Switching AC-DC 24V",
    "functionDesc": "Menurunkan dan menyearahkan tegangan AC fasa-netral menjadi DC teregulasi untuk sirkuit kontrol.",
    "application": "Pencatu daya kontrol relay 24VDC dan sensor."
  },
  "generator3ph": {
    "tagPrefix": "G",
    "id": {
      "name": "3-Phase Generator with Auto Start",
      "summary": "Genset 3-Fasa dengan Kontrol Start Otomatis",
      "functionDesc": "Menghasilkan daya AC 3-fasa cadangan saat sumber PLN padam, dilengkapi kontak C1-C2 untuk kontrol ATS.",
      "application": "Sistem suplai daya darurat (Emergency Backup / ATS-AMF)."
    },
    "en": {
      "name": "3-Phase Generator with Auto Start",
      "summary": "3-Phase Standby Generator with Auto-Start",
      "functionDesc": "Generates auxiliary 3-phase AC power during utility outages; includes C1-C2 auto-start control terminals for ATS.",
      "application": "Emergency power backup systems and Automatic Transfer Switch (ATS) panels."
    },
    "name": "3-Phase Generator with Auto Start",
    "summary": "Genset 3-Fasa dengan Kontrol Start Otomatis",
    "functionDesc": "Menghasilkan daya AC 3-fasa cadangan saat sumber PLN padam, dilengkapi kontak C1-C2 untuk kontrol ATS.",
    "application": "Sistem suplai daya darurat (Emergency Backup / ATS-AMF)."
  },
  "breaker1p": {
    "tagPrefix": "-QF",
    "id": {
      "name": "Miniature Circuit Breaker 1P",
      "summary": "Pemutus Sirkuit Otomatis (MCB) 1P",
      "functionDesc": "Memproteksi kabel dan instalasi dari bahaya beban lebih (thermal) dan korsleting hubung singkat (magnetik) pada 1 kutub.",
      "application": "Pengaman sirkuit cabang daya dan penerangan 1P pada panel distribusi."
    },
    "en": {
      "name": "Miniature Circuit Breaker 1P",
      "summary": "Automatic Miniature Circuit Breaker (MCB) 1P",
      "functionDesc": "Protects cables and equipment against overloads (thermal element) and short circuits (magnetic element) across 1 pole(s).",
      "application": "Branch circuit protection for power and control distribution panels."
    },
    "name": "Miniature Circuit Breaker 1P",
    "summary": "Pemutus Sirkuit Otomatis (MCB) 1P",
    "functionDesc": "Memproteksi kabel dan instalasi dari bahaya beban lebih (thermal) dan korsleting hubung singkat (magnetik) pada 1 kutub.",
    "application": "Pengaman sirkuit cabang daya dan penerangan 1P pada panel distribusi."
  },
  "breaker2p": {
    "tagPrefix": "-QF",
    "id": {
      "name": "Miniature Circuit Breaker 2P",
      "summary": "Pemutus Sirkuit Otomatis (MCB) 2P",
      "functionDesc": "Memproteksi kabel dan instalasi dari bahaya beban lebih (thermal) dan korsleting hubung singkat (magnetik) pada 2 kutub.",
      "application": "Pengaman sirkuit cabang daya dan penerangan 2P pada panel distribusi."
    },
    "en": {
      "name": "Miniature Circuit Breaker 2P",
      "summary": "Automatic Miniature Circuit Breaker (MCB) 2P",
      "functionDesc": "Protects cables and equipment against overloads (thermal element) and short circuits (magnetic element) across 2 pole(s).",
      "application": "Branch circuit protection for power and control distribution panels."
    },
    "name": "Miniature Circuit Breaker 2P",
    "summary": "Pemutus Sirkuit Otomatis (MCB) 2P",
    "functionDesc": "Memproteksi kabel dan instalasi dari bahaya beban lebih (thermal) dan korsleting hubung singkat (magnetik) pada 2 kutub.",
    "application": "Pengaman sirkuit cabang daya dan penerangan 2P pada panel distribusi."
  },
  "breaker3p": {
    "tagPrefix": "-QF",
    "id": {
      "name": "Miniature Circuit Breaker 3P",
      "summary": "Pemutus Sirkuit Otomatis (MCB) 3P",
      "functionDesc": "Memproteksi kabel dan instalasi dari bahaya beban lebih (thermal) dan korsleting hubung singkat (magnetik) pada 3 kutub.",
      "application": "Pengaman sirkuit cabang daya dan penerangan 3P pada panel distribusi."
    },
    "en": {
      "name": "Miniature Circuit Breaker 3P",
      "summary": "Automatic Miniature Circuit Breaker (MCB) 3P",
      "functionDesc": "Protects cables and equipment against overloads (thermal element) and short circuits (magnetic element) across 3 pole(s).",
      "application": "Branch circuit protection for power and control distribution panels."
    },
    "name": "Miniature Circuit Breaker 3P",
    "summary": "Pemutus Sirkuit Otomatis (MCB) 3P",
    "functionDesc": "Memproteksi kabel dan instalasi dari bahaya beban lebih (thermal) dan korsleting hubung singkat (magnetik) pada 3 kutub.",
    "application": "Pengaman sirkuit cabang daya dan penerangan 3P pada panel distribusi."
  },
  "breaker4p": {
    "tagPrefix": "-QF",
    "id": {
      "name": "Miniature Circuit Breaker 4P",
      "summary": "Pemutus Sirkuit Otomatis (MCB) 4P",
      "functionDesc": "Memproteksi kabel dan instalasi dari bahaya beban lebih (thermal) dan korsleting hubung singkat (magnetik) pada 4 kutub.",
      "application": "Pengaman sirkuit cabang daya dan penerangan 4P pada panel distribusi."
    },
    "en": {
      "name": "Miniature Circuit Breaker 4P",
      "summary": "Automatic Miniature Circuit Breaker (MCB) 4P",
      "functionDesc": "Protects cables and equipment against overloads (thermal element) and short circuits (magnetic element) across 4 pole(s).",
      "application": "Branch circuit protection for power and control distribution panels."
    },
    "name": "Miniature Circuit Breaker 4P",
    "summary": "Pemutus Sirkuit Otomatis (MCB) 4P",
    "functionDesc": "Memproteksi kabel dan instalasi dari bahaya beban lebih (thermal) dan korsleting hubung singkat (magnetik) pada 4 kutub.",
    "application": "Pengaman sirkuit cabang daya dan penerangan 4P pada panel distribusi."
  },
  "breaker": {
    "tagPrefix": "-QF",
    "id": {
      "name": "Circuit Breaker 3P (General)",
      "summary": "Pemutus Sirkuit Daya 3-Kutub",
      "functionDesc": "Membuka dan memutus sirkuit daya 3-fasa utama saat terjadi arus lebih atau gangguan korsleting.",
      "application": "Pengaman motor 3-fasa dan beban daya industri."
    },
    "en": {
      "name": "Circuit Breaker 3P (General)",
      "summary": "Automatic Miniature Circuit Breaker (MCB) 3P",
      "functionDesc": "Protects cables and equipment against overloads (thermal element) and short circuits (magnetic element) across 3 pole(s).",
      "application": "Branch circuit protection for power and control distribution panels."
    },
    "name": "Circuit Breaker 3P (General)",
    "summary": "Pemutus Sirkuit Daya 3-Kutub",
    "functionDesc": "Membuka dan memutus sirkuit daya 3-fasa utama saat terjadi arus lebih atau gangguan korsleting.",
    "application": "Pengaman motor 3-fasa dan beban daya industri."
  },
  "fuse1p": {
    "tagPrefix": "-F",
    "id": {
      "name": "Cartridge Fuse Link 1P",
      "summary": "Sekring Pengaman Lebur 1P",
      "functionDesc": "Memutus sirkuit seketika melalui peleburan kawat elemen saat terjadi arus gangguan hubung singkat tinggi pada 1 jalur.",
      "application": "Proteksi cepat semikonduktor, transformator instrumen, dan kabel daya 1P."
    },
    "en": {
      "name": "Cartridge Fuse Link 1P",
      "summary": "Cartridge Fuse Link 1P",
      "functionDesc": "Instantly interrupts abnormal currents through thermal wire melting during catastrophic short circuits.",
      "application": "Fast-acting protection for power semiconductors, control transformers, and distribution cables."
    },
    "name": "Cartridge Fuse Link 1P",
    "summary": "Sekring Pengaman Lebur 1P",
    "functionDesc": "Memutus sirkuit seketika melalui peleburan kawat elemen saat terjadi arus gangguan hubung singkat tinggi pada 1 jalur.",
    "application": "Proteksi cepat semikonduktor, transformator instrumen, dan kabel daya 1P."
  },
  "fuse2p": {
    "tagPrefix": "-F",
    "id": {
      "name": "Cartridge Fuse Link 2P",
      "summary": "Sekring Pengaman Lebur 2P",
      "functionDesc": "Memutus sirkuit seketika melalui peleburan kawat elemen saat terjadi arus gangguan hubung singkat tinggi pada 2 jalur.",
      "application": "Proteksi cepat semikonduktor, transformator instrumen, dan kabel daya 2P."
    },
    "en": {
      "name": "Cartridge Fuse Link 2P",
      "summary": "Cartridge Fuse Link 2P",
      "functionDesc": "Instantly interrupts abnormal currents through thermal wire melting during catastrophic short circuits.",
      "application": "Fast-acting protection for power semiconductors, control transformers, and distribution cables."
    },
    "name": "Cartridge Fuse Link 2P",
    "summary": "Sekring Pengaman Lebur 2P",
    "functionDesc": "Memutus sirkuit seketika melalui peleburan kawat elemen saat terjadi arus gangguan hubung singkat tinggi pada 2 jalur.",
    "application": "Proteksi cepat semikonduktor, transformator instrumen, dan kabel daya 2P."
  },
  "fuse3p": {
    "tagPrefix": "-F",
    "id": {
      "name": "Cartridge Fuse Link 3P",
      "summary": "Sekring Pengaman Lebur 3P",
      "functionDesc": "Memutus sirkuit seketika melalui peleburan kawat elemen saat terjadi arus gangguan hubung singkat tinggi pada 3 jalur.",
      "application": "Proteksi cepat semikonduktor, transformator instrumen, dan kabel daya 3P."
    },
    "en": {
      "name": "Cartridge Fuse Link 3P",
      "summary": "Cartridge Fuse Link 3P",
      "functionDesc": "Instantly interrupts abnormal currents through thermal wire melting during catastrophic short circuits.",
      "application": "Fast-acting protection for power semiconductors, control transformers, and distribution cables."
    },
    "name": "Cartridge Fuse Link 3P",
    "summary": "Sekring Pengaman Lebur 3P",
    "functionDesc": "Memutus sirkuit seketika melalui peleburan kawat elemen saat terjadi arus gangguan hubung singkat tinggi pada 3 jalur.",
    "application": "Proteksi cepat semikonduktor, transformator instrumen, dan kabel daya 3P."
  },
  "fuse4p": {
    "tagPrefix": "-F",
    "id": {
      "name": "Cartridge Fuse Link 4P",
      "summary": "Sekring Pengaman Lebur 4P",
      "functionDesc": "Memutus sirkuit seketika melalui peleburan kawat elemen saat terjadi arus gangguan hubung singkat tinggi pada 4 jalur.",
      "application": "Proteksi cepat semikonduktor, transformator instrumen, dan kabel daya 4P."
    },
    "en": {
      "name": "Cartridge Fuse Link 4P",
      "summary": "Cartridge Fuse Link 4P",
      "functionDesc": "Instantly interrupts abnormal currents through thermal wire melting during catastrophic short circuits.",
      "application": "Fast-acting protection for power semiconductors, control transformers, and distribution cables."
    },
    "name": "Cartridge Fuse Link 4P",
    "summary": "Sekring Pengaman Lebur 4P",
    "functionDesc": "Memutus sirkuit seketika melalui peleburan kawat elemen saat terjadi arus gangguan hubung singkat tinggi pada 4 jalur.",
    "application": "Proteksi cepat semikonduktor, transformator instrumen, dan kabel daya 4P."
  },
  "fuseSwitch1p": {
    "tagPrefix": "-Q",
    "id": {
      "name": "Fuse Switch Disconnector 1P",
      "summary": "Saklar Pemisah Bersekring 1P",
      "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 1P.",
      "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
    },
    "en": {
      "name": "Fuse Switch Disconnector 1P",
      "summary": "Switch Disconnector with Fuse 1P",
      "functionDesc": "Combines manual load-break isolation with high-rupturing-capacity fuse links for comprehensive circuit protection.",
      "application": "Main incomer switch for distribution boards and heavy motor feeder protection."
    },
    "name": "Fuse Switch Disconnector 1P",
    "summary": "Saklar Pemisah Bersekring 1P",
    "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 1P.",
    "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
  },
  "fuseSwitch1pn": {
    "tagPrefix": "-Q",
    "id": {
      "name": "Fuse Switch Disconnector 1PN",
      "summary": "Saklar Pemisah Bersekring 1PN",
      "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 1PN.",
      "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
    },
    "en": {
      "name": "Fuse Switch Disconnector 1PN",
      "summary": "Switch Disconnector with Fuse 1PN",
      "functionDesc": "Combines manual load-break isolation with high-rupturing-capacity fuse links for comprehensive circuit protection.",
      "application": "Main incomer switch for distribution boards and heavy motor feeder protection."
    },
    "name": "Fuse Switch Disconnector 1PN",
    "summary": "Saklar Pemisah Bersekring 1PN",
    "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 1PN.",
    "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
  },
  "fuseSwitch2p": {
    "tagPrefix": "-Q",
    "id": {
      "name": "Fuse Switch Disconnector 2P",
      "summary": "Saklar Pemisah Bersekring 2P",
      "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 2P.",
      "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
    },
    "en": {
      "name": "Fuse Switch Disconnector 2P",
      "summary": "Switch Disconnector with Fuse 2P",
      "functionDesc": "Combines manual load-break isolation with high-rupturing-capacity fuse links for comprehensive circuit protection.",
      "application": "Main incomer switch for distribution boards and heavy motor feeder protection."
    },
    "name": "Fuse Switch Disconnector 2P",
    "summary": "Saklar Pemisah Bersekring 2P",
    "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 2P.",
    "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
  },
  "fuseSwitch3p": {
    "tagPrefix": "-Q",
    "id": {
      "name": "Fuse Switch Disconnector 3P",
      "summary": "Saklar Pemisah Bersekring 3P",
      "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 3P.",
      "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
    },
    "en": {
      "name": "Fuse Switch Disconnector 3P",
      "summary": "Switch Disconnector with Fuse 3P",
      "functionDesc": "Combines manual load-break isolation with high-rupturing-capacity fuse links for comprehensive circuit protection.",
      "application": "Main incomer switch for distribution boards and heavy motor feeder protection."
    },
    "name": "Fuse Switch Disconnector 3P",
    "summary": "Saklar Pemisah Bersekring 3P",
    "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 3P.",
    "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
  },
  "fuseSwitch3pn": {
    "tagPrefix": "-Q",
    "id": {
      "name": "Fuse Switch Disconnector 3PN",
      "summary": "Saklar Pemisah Bersekring 3PN",
      "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 3PN.",
      "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
    },
    "en": {
      "name": "Fuse Switch Disconnector 3PN",
      "summary": "Switch Disconnector with Fuse 3PN",
      "functionDesc": "Combines manual load-break isolation with high-rupturing-capacity fuse links for comprehensive circuit protection.",
      "application": "Main incomer switch for distribution boards and heavy motor feeder protection."
    },
    "name": "Fuse Switch Disconnector 3PN",
    "summary": "Saklar Pemisah Bersekring 3PN",
    "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 3PN.",
    "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
  },
  "fuseSwitch4p": {
    "tagPrefix": "-Q",
    "id": {
      "name": "Fuse Switch Disconnector 4P",
      "summary": "Saklar Pemisah Bersekring 4P",
      "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 4P.",
      "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
    },
    "en": {
      "name": "Fuse Switch Disconnector 4P",
      "summary": "Switch Disconnector with Fuse 4P",
      "functionDesc": "Combines manual load-break isolation with high-rupturing-capacity fuse links for comprehensive circuit protection.",
      "application": "Main incomer switch for distribution boards and heavy motor feeder protection."
    },
    "name": "Fuse Switch Disconnector 4P",
    "summary": "Saklar Pemisah Bersekring 4P",
    "functionDesc": "Menggabungkan saklar pemutus beban manual dan rumah sekring lebur untuk proteksi dan isolasi instalasi 4P.",
    "application": "Saklar masuk utama pada panel distribusi dan pengaman beban motorik."
  },
  "isolator1p": {
    "tagPrefix": "-QS",
    "id": {
      "name": "Switch Disconnector / Isolator 1P",
      "summary": "Saklar Pemisah Beban 1P",
      "functionDesc": "Menyediakan pemisahan kontak fisik yang terlihat (visible break) untuk memastikan sirkuit aman bebas tegangan saat perawatan.",
      "application": "Isolator keselamatan motor di dekat mesin dan saklar pemutus utama panel."
    },
    "en": {
      "name": "Switch Disconnector / Isolator 1P",
      "summary": "Non-Fused Load Disconnector / Isolator 1P",
      "functionDesc": "Provides positive visible contact separation to guarantee safety during electrical maintenance and lock-out/tag-out.",
      "application": "Local motor safety disconnect switch and panel main isolator."
    },
    "name": "Switch Disconnector / Isolator 1P",
    "summary": "Saklar Pemisah Beban 1P",
    "functionDesc": "Menyediakan pemisahan kontak fisik yang terlihat (visible break) untuk memastikan sirkuit aman bebas tegangan saat perawatan.",
    "application": "Isolator keselamatan motor di dekat mesin dan saklar pemutus utama panel."
  },
  "isolator2p": {
    "tagPrefix": "-QS",
    "id": {
      "name": "Switch Disconnector / Isolator 2P",
      "summary": "Saklar Pemisah Beban 2P",
      "functionDesc": "Menyediakan pemisahan kontak fisik yang terlihat (visible break) untuk memastikan sirkuit aman bebas tegangan saat perawatan.",
      "application": "Isolator keselamatan motor di dekat mesin dan saklar pemutus utama panel."
    },
    "en": {
      "name": "Switch Disconnector / Isolator 2P",
      "summary": "Non-Fused Load Disconnector / Isolator 2P",
      "functionDesc": "Provides positive visible contact separation to guarantee safety during electrical maintenance and lock-out/tag-out.",
      "application": "Local motor safety disconnect switch and panel main isolator."
    },
    "name": "Switch Disconnector / Isolator 2P",
    "summary": "Saklar Pemisah Beban 2P",
    "functionDesc": "Menyediakan pemisahan kontak fisik yang terlihat (visible break) untuk memastikan sirkuit aman bebas tegangan saat perawatan.",
    "application": "Isolator keselamatan motor di dekat mesin dan saklar pemutus utama panel."
  },
  "isolator3p": {
    "tagPrefix": "-QS",
    "id": {
      "name": "Switch Disconnector / Isolator 3P",
      "summary": "Saklar Pemisah Beban 3P",
      "functionDesc": "Menyediakan pemisahan kontak fisik yang terlihat (visible break) untuk memastikan sirkuit aman bebas tegangan saat perawatan.",
      "application": "Isolator keselamatan motor di dekat mesin dan saklar pemutus utama panel."
    },
    "en": {
      "name": "Switch Disconnector / Isolator 3P",
      "summary": "Non-Fused Load Disconnector / Isolator 3P",
      "functionDesc": "Provides positive visible contact separation to guarantee safety during electrical maintenance and lock-out/tag-out.",
      "application": "Local motor safety disconnect switch and panel main isolator."
    },
    "name": "Switch Disconnector / Isolator 3P",
    "summary": "Saklar Pemisah Beban 3P",
    "functionDesc": "Menyediakan pemisahan kontak fisik yang terlihat (visible break) untuk memastikan sirkuit aman bebas tegangan saat perawatan.",
    "application": "Isolator keselamatan motor di dekat mesin dan saklar pemutus utama panel."
  },
  "isolator4p": {
    "tagPrefix": "-QS",
    "id": {
      "name": "Switch Disconnector / Isolator 4P",
      "summary": "Saklar Pemisah Beban 4P",
      "functionDesc": "Menyediakan pemisahan kontak fisik yang terlihat (visible break) untuk memastikan sirkuit aman bebas tegangan saat perawatan.",
      "application": "Isolator keselamatan motor di dekat mesin dan saklar pemutus utama panel."
    },
    "en": {
      "name": "Switch Disconnector / Isolator 4P",
      "summary": "Non-Fused Load Disconnector / Isolator 4P",
      "functionDesc": "Provides positive visible contact separation to guarantee safety during electrical maintenance and lock-out/tag-out.",
      "application": "Local motor safety disconnect switch and panel main isolator."
    },
    "name": "Switch Disconnector / Isolator 4P",
    "summary": "Saklar Pemisah Beban 4P",
    "functionDesc": "Menyediakan pemisahan kontak fisik yang terlihat (visible break) untuk memastikan sirkuit aman bebas tegangan saat perawatan.",
    "application": "Isolator keselamatan motor di dekat mesin dan saklar pemutus utama panel."
  },
  "motorBreaker1p": {
    "tagPrefix": "-QM",
    "id": {
      "name": "Manual Motor Starter / MPCB 1P",
      "summary": "Pemutus Sirkuit Motor (MPCB) 1P",
      "functionDesc": "Proteksi khusus motor listrik dengan setelan arus termal presisi untuk beban lebih, magnetik instan korsleting, dan proteksi hilang fasa.",
      "application": "Starter langsung motor manual dan proteksi sirkuit cabang motor 1P."
    },
    "en": {
      "name": "Manual Motor Starter / MPCB 1P",
      "summary": "Manual Motor Starter / Protector (MPCB) 1P",
      "functionDesc": "Dedicated motor circuit breaker with adjustable bimetal overload, instantaneous magnetic short-circuit, and phase-loss trip.",
      "application": "Direct-on-line motor manual starter and branch motor feeder protector."
    },
    "name": "Manual Motor Starter / MPCB 1P",
    "summary": "Pemutus Sirkuit Motor (MPCB) 1P",
    "functionDesc": "Proteksi khusus motor listrik dengan setelan arus termal presisi untuk beban lebih, magnetik instan korsleting, dan proteksi hilang fasa.",
    "application": "Starter langsung motor manual dan proteksi sirkuit cabang motor 1P."
  },
  "motorBreaker2p": {
    "tagPrefix": "-QM",
    "id": {
      "name": "Manual Motor Starter / MPCB 2P",
      "summary": "Pemutus Sirkuit Motor (MPCB) 2P",
      "functionDesc": "Proteksi khusus motor listrik dengan setelan arus termal presisi untuk beban lebih, magnetik instan korsleting, dan proteksi hilang fasa.",
      "application": "Starter langsung motor manual dan proteksi sirkuit cabang motor 2P."
    },
    "en": {
      "name": "Manual Motor Starter / MPCB 2P",
      "summary": "Manual Motor Starter / Protector (MPCB) 2P",
      "functionDesc": "Dedicated motor circuit breaker with adjustable bimetal overload, instantaneous magnetic short-circuit, and phase-loss trip.",
      "application": "Direct-on-line motor manual starter and branch motor feeder protector."
    },
    "name": "Manual Motor Starter / MPCB 2P",
    "summary": "Pemutus Sirkuit Motor (MPCB) 2P",
    "functionDesc": "Proteksi khusus motor listrik dengan setelan arus termal presisi untuk beban lebih, magnetik instan korsleting, dan proteksi hilang fasa.",
    "application": "Starter langsung motor manual dan proteksi sirkuit cabang motor 2P."
  },
  "motorBreaker3p": {
    "tagPrefix": "-QM",
    "id": {
      "name": "Manual Motor Starter / MPCB 3P",
      "summary": "Pemutus Sirkuit Motor (MPCB) 3P",
      "functionDesc": "Proteksi khusus motor listrik dengan setelan arus termal presisi untuk beban lebih, magnetik instan korsleting, dan proteksi hilang fasa.",
      "application": "Starter langsung motor manual dan proteksi sirkuit cabang motor 3P."
    },
    "en": {
      "name": "Manual Motor Starter / MPCB 3P",
      "summary": "Manual Motor Starter / Protector (MPCB) 3P",
      "functionDesc": "Dedicated motor circuit breaker with adjustable bimetal overload, instantaneous magnetic short-circuit, and phase-loss trip.",
      "application": "Direct-on-line motor manual starter and branch motor feeder protector."
    },
    "name": "Manual Motor Starter / MPCB 3P",
    "summary": "Pemutus Sirkuit Motor (MPCB) 3P",
    "functionDesc": "Proteksi khusus motor listrik dengan setelan arus termal presisi untuk beban lebih, magnetik instan korsleting, dan proteksi hilang fasa.",
    "application": "Starter langsung motor manual dan proteksi sirkuit cabang motor 3P."
  },
  "motorBreaker4p": {
    "tagPrefix": "-QM",
    "id": {
      "name": "Manual Motor Starter / MPCB 4P",
      "summary": "Pemutus Sirkuit Motor (MPCB) 4P",
      "functionDesc": "Proteksi khusus motor listrik dengan setelan arus termal presisi untuk beban lebih, magnetik instan korsleting, dan proteksi hilang fasa.",
      "application": "Starter langsung motor manual dan proteksi sirkuit cabang motor 4P."
    },
    "en": {
      "name": "Manual Motor Starter / MPCB 4P",
      "summary": "Manual Motor Starter / Protector (MPCB) 4P",
      "functionDesc": "Dedicated motor circuit breaker with adjustable bimetal overload, instantaneous magnetic short-circuit, and phase-loss trip.",
      "application": "Direct-on-line motor manual starter and branch motor feeder protector."
    },
    "name": "Manual Motor Starter / MPCB 4P",
    "summary": "Pemutus Sirkuit Motor (MPCB) 4P",
    "functionDesc": "Proteksi khusus motor listrik dengan setelan arus termal presisi untuk beban lebih, magnetik instan korsleting, dan proteksi hilang fasa.",
    "application": "Starter langsung motor manual dan proteksi sirkuit cabang motor 4P."
  },
  "overload1p": {
    "tagPrefix": "-FR",
    "id": {
      "name": "Thermal Overload Relay (TOR) 1P",
      "summary": "Relai Beban Lebih Termal (TOR) 1P",
      "functionDesc": "Mendeteksi arus motor berlebih melalui pemanasan bimetal internal. Memicu kontak bantu trip (95-96 NC membuka, 97-98 NO menutup).",
      "application": "Proteksi motor listrik dari panas berlebih akibat beban mekanik macet atau kelebihan beban."
    },
    "en": {
      "name": "Thermal Overload Relay (TOR) 1P",
      "summary": "Thermal Overload Relay (TOR) 1P",
      "functionDesc": "Detects continuous motor overcurrent via thermal bimetal deflection, tripping auxiliary contacts (95-96 NC opens, 97-98 NO closes).",
      "application": "Protects electric motors against burn-out due to mechanical stalling, overloads, or phase unbalance."
    },
    "name": "Thermal Overload Relay (TOR) 1P",
    "summary": "Relai Beban Lebih Termal (TOR) 1P",
    "functionDesc": "Mendeteksi arus motor berlebih melalui pemanasan bimetal internal. Memicu kontak bantu trip (95-96 NC membuka, 97-98 NO menutup).",
    "application": "Proteksi motor listrik dari panas berlebih akibat beban mekanik macet atau kelebihan beban."
  },
  "overload2p": {
    "tagPrefix": "-FR",
    "id": {
      "name": "Thermal Overload Relay (TOR) 2P",
      "summary": "Relai Beban Lebih Termal (TOR) 2P",
      "functionDesc": "Mendeteksi arus motor berlebih melalui pemanasan bimetal internal. Memicu kontak bantu trip (95-96 NC membuka, 97-98 NO menutup).",
      "application": "Proteksi motor listrik dari panas berlebih akibat beban mekanik macet atau kelebihan beban."
    },
    "en": {
      "name": "Thermal Overload Relay (TOR) 2P",
      "summary": "Thermal Overload Relay (TOR) 2P",
      "functionDesc": "Detects continuous motor overcurrent via thermal bimetal deflection, tripping auxiliary contacts (95-96 NC opens, 97-98 NO closes).",
      "application": "Protects electric motors against burn-out due to mechanical stalling, overloads, or phase unbalance."
    },
    "name": "Thermal Overload Relay (TOR) 2P",
    "summary": "Relai Beban Lebih Termal (TOR) 2P",
    "functionDesc": "Mendeteksi arus motor berlebih melalui pemanasan bimetal internal. Memicu kontak bantu trip (95-96 NC membuka, 97-98 NO menutup).",
    "application": "Proteksi motor listrik dari panas berlebih akibat beban mekanik macet atau kelebihan beban."
  },
  "overload3p": {
    "tagPrefix": "-FR",
    "id": {
      "name": "Thermal Overload Relay (TOR) 3P",
      "summary": "Relai Beban Lebih Termal (TOR) 3P",
      "functionDesc": "Mendeteksi arus motor berlebih melalui pemanasan bimetal internal. Memicu kontak bantu trip (95-96 NC membuka, 97-98 NO menutup).",
      "application": "Proteksi motor listrik dari panas berlebih akibat beban mekanik macet atau kelebihan beban."
    },
    "en": {
      "name": "Thermal Overload Relay (TOR) 3P",
      "summary": "Thermal Overload Relay (TOR) 3P",
      "functionDesc": "Detects continuous motor overcurrent via thermal bimetal deflection, tripping auxiliary contacts (95-96 NC opens, 97-98 NO closes).",
      "application": "Protects electric motors against burn-out due to mechanical stalling, overloads, or phase unbalance."
    },
    "name": "Thermal Overload Relay (TOR) 3P",
    "summary": "Relai Beban Lebih Termal (TOR) 3P",
    "functionDesc": "Mendeteksi arus motor berlebih melalui pemanasan bimetal internal. Memicu kontak bantu trip (95-96 NC membuka, 97-98 NO menutup).",
    "application": "Proteksi motor listrik dari panas berlebih akibat beban mekanik macet atau kelebihan beban."
  },
  "tmBreaker1p": {
    "tagPrefix": "-QF",
    "id": {
      "name": "Thermal-Magnetic Circuit Breaker (MCCB) 1P",
      "summary": "Pemutus Tenaga Termal-Magnetik 1P",
      "functionDesc": "MCCB industri dengan kapasitas pemutusan tinggi (kA). Bimetal merespon beban lebih kontinyu dan solenoid merespon lonjakan hubung singkat.",
      "application": "Pemutus daya utama dan cabang feeder berarus menengah-tinggi."
    },
    "en": {
      "name": "Thermal-Magnetic Circuit Breaker (MCCB) 1P",
      "summary": "Automatic Miniature Circuit Breaker (MCB) 1P",
      "functionDesc": "Protects cables and equipment against overloads (thermal element) and short circuits (magnetic element) across 1 pole(s).",
      "application": "Branch circuit protection for power and control distribution panels."
    },
    "name": "Thermal-Magnetic Circuit Breaker (MCCB) 1P",
    "summary": "Pemutus Tenaga Termal-Magnetik 1P",
    "functionDesc": "MCCB industri dengan kapasitas pemutusan tinggi (kA). Bimetal merespon beban lebih kontinyu dan solenoid merespon lonjakan hubung singkat.",
    "application": "Pemutus daya utama dan cabang feeder berarus menengah-tinggi."
  },
  "tmBreaker2p": {
    "tagPrefix": "-QF",
    "id": {
      "name": "Thermal-Magnetic Circuit Breaker (MCCB) 2P",
      "summary": "Pemutus Tenaga Termal-Magnetik 2P",
      "functionDesc": "MCCB industri dengan kapasitas pemutusan tinggi (kA). Bimetal merespon beban lebih kontinyu dan solenoid merespon lonjakan hubung singkat.",
      "application": "Pemutus daya utama dan cabang feeder berarus menengah-tinggi."
    },
    "en": {
      "name": "Thermal-Magnetic Circuit Breaker (MCCB) 2P",
      "summary": "Automatic Miniature Circuit Breaker (MCB) 2P",
      "functionDesc": "Protects cables and equipment against overloads (thermal element) and short circuits (magnetic element) across 2 pole(s).",
      "application": "Branch circuit protection for power and control distribution panels."
    },
    "name": "Thermal-Magnetic Circuit Breaker (MCCB) 2P",
    "summary": "Pemutus Tenaga Termal-Magnetik 2P",
    "functionDesc": "MCCB industri dengan kapasitas pemutusan tinggi (kA). Bimetal merespon beban lebih kontinyu dan solenoid merespon lonjakan hubung singkat.",
    "application": "Pemutus daya utama dan cabang feeder berarus menengah-tinggi."
  },
  "tmBreaker3p": {
    "tagPrefix": "-QF",
    "id": {
      "name": "Thermal-Magnetic Circuit Breaker (MCCB) 3P",
      "summary": "Pemutus Tenaga Termal-Magnetik 3P",
      "functionDesc": "MCCB industri dengan kapasitas pemutusan tinggi (kA). Bimetal merespon beban lebih kontinyu dan solenoid merespon lonjakan hubung singkat.",
      "application": "Pemutus daya utama dan cabang feeder berarus menengah-tinggi."
    },
    "en": {
      "name": "Thermal-Magnetic Circuit Breaker (MCCB) 3P",
      "summary": "Automatic Miniature Circuit Breaker (MCB) 3P",
      "functionDesc": "Protects cables and equipment against overloads (thermal element) and short circuits (magnetic element) across 3 pole(s).",
      "application": "Branch circuit protection for power and control distribution panels."
    },
    "name": "Thermal-Magnetic Circuit Breaker (MCCB) 3P",
    "summary": "Pemutus Tenaga Termal-Magnetik 3P",
    "functionDesc": "MCCB industri dengan kapasitas pemutusan tinggi (kA). Bimetal merespon beban lebih kontinyu dan solenoid merespon lonjakan hubung singkat.",
    "application": "Pemutus daya utama dan cabang feeder berarus menengah-tinggi."
  },
  "tmBreaker4p": {
    "tagPrefix": "-QF",
    "id": {
      "name": "Thermal-Magnetic Circuit Breaker (MCCB) 4P",
      "summary": "Pemutus Tenaga Termal-Magnetik 4P",
      "functionDesc": "MCCB industri dengan kapasitas pemutusan tinggi (kA). Bimetal merespon beban lebih kontinyu dan solenoid merespon lonjakan hubung singkat.",
      "application": "Pemutus daya utama dan cabang feeder berarus menengah-tinggi."
    },
    "en": {
      "name": "Thermal-Magnetic Circuit Breaker (MCCB) 4P",
      "summary": "Automatic Miniature Circuit Breaker (MCB) 4P",
      "functionDesc": "Protects cables and equipment against overloads (thermal element) and short circuits (magnetic element) across 4 pole(s).",
      "application": "Branch circuit protection for power and control distribution panels."
    },
    "name": "Thermal-Magnetic Circuit Breaker (MCCB) 4P",
    "summary": "Pemutus Tenaga Termal-Magnetik 4P",
    "functionDesc": "MCCB industri dengan kapasitas pemutusan tinggi (kA). Bimetal merespon beban lebih kontinyu dan solenoid merespon lonjakan hubung singkat.",
    "application": "Pemutus daya utama dan cabang feeder berarus menengah-tinggi."
  },
  "rccbBreaker2p": {
    "tagPrefix": "-Q",
    "id": {
      "name": "Residual Current Circuit Breaker (RCCB/ELCB) 2P",
      "summary": "Pemutus Arus Bocor Tanah (RCCB) 2P",
      "functionDesc": "Mendeteksi ketidakseimbangan arus fasa dan netral akibat kebocoran arus ke bumi (>30mA/300mA) untuk mencegah sengatan listrik fatal.",
      "application": "Proteksi keselamatan manusia dan pencegah bahaya kebakaran akibat isolasi kabel rusak."
    },
    "en": {
      "name": "Residual Current Circuit Breaker (RCCB/ELCB) 2P",
      "summary": "Residual Current Circuit Breaker (RCCB/ELCB) 2P",
      "functionDesc": "Detects phase-to-ground current leakage (>30mA) via toroidal core, tripping the circuit to prevent fatal electric shocks.",
      "application": "Personnel electrocution protection and electrical fire prevention."
    },
    "name": "Residual Current Circuit Breaker (RCCB/ELCB) 2P",
    "summary": "Pemutus Arus Bocor Tanah (RCCB) 2P",
    "functionDesc": "Mendeteksi ketidakseimbangan arus fasa dan netral akibat kebocoran arus ke bumi (>30mA/300mA) untuk mencegah sengatan listrik fatal.",
    "application": "Proteksi keselamatan manusia dan pencegah bahaya kebakaran akibat isolasi kabel rusak."
  },
  "rccbBreaker4p": {
    "tagPrefix": "-Q",
    "id": {
      "name": "Residual Current Circuit Breaker (RCCB/ELCB) 4P",
      "summary": "Pemutus Arus Bocor Tanah (RCCB) 4P",
      "functionDesc": "Mendeteksi ketidakseimbangan arus fasa dan netral akibat kebocoran arus ke bumi (>30mA/300mA) untuk mencegah sengatan listrik fatal.",
      "application": "Proteksi keselamatan manusia dan pencegah bahaya kebakaran akibat isolasi kabel rusak."
    },
    "en": {
      "name": "Residual Current Circuit Breaker (RCCB/ELCB) 4P",
      "summary": "Residual Current Circuit Breaker (RCCB/ELCB) 4P",
      "functionDesc": "Detects phase-to-ground current leakage (>30mA) via toroidal core, tripping the circuit to prevent fatal electric shocks.",
      "application": "Personnel electrocution protection and electrical fire prevention."
    },
    "name": "Residual Current Circuit Breaker (RCCB/ELCB) 4P",
    "summary": "Pemutus Arus Bocor Tanah (RCCB) 4P",
    "functionDesc": "Mendeteksi ketidakseimbangan arus fasa dan netral akibat kebocoran arus ke bumi (>30mA/300mA) untuk mencegah sengatan listrik fatal.",
    "application": "Proteksi keselamatan manusia dan pencegah bahaya kebakaran akibat isolasi kabel rusak."
  },
  "rcboBreaker2p": {
    "tagPrefix": "-QF",
    "id": {
      "name": "Residual Current Breaker with Overcurrent (RCBO) 2P",
      "summary": "Pemutus Kombinasi RCBO 2P",
      "functionDesc": "Kombinasi all-in-one yang menyatukan fungsi MCB (beban lebih & korsleting) serta RCCB (arus bocor tanah) dalam satu perangkat ringkas.",
      "application": "Proteksi keselamatan lengkap dan penghemat ruang pada panel daya."
    },
    "en": {
      "name": "Residual Current Breaker with Overcurrent (RCBO) 2P",
      "summary": "Residual Current Breaker with Overcurrent (RCBO) 2P",
      "functionDesc": "All-in-one safety device combining Earth Leakage (RCCB) and Overcurrent/Short-Circuit (MCB) protection in a single compact module.",
      "application": "Space-saving comprehensive protection for sensitive equipment and industrial outlets."
    },
    "name": "Residual Current Breaker with Overcurrent (RCBO) 2P",
    "summary": "Pemutus Kombinasi RCBO 2P",
    "functionDesc": "Kombinasi all-in-one yang menyatukan fungsi MCB (beban lebih & korsleting) serta RCCB (arus bocor tanah) dalam satu perangkat ringkas.",
    "application": "Proteksi keselamatan lengkap dan penghemat ruang pada panel daya."
  },
  "rcboBreaker4p": {
    "tagPrefix": "-QF",
    "id": {
      "name": "Residual Current Breaker with Overcurrent (RCBO) 4P",
      "summary": "Pemutus Kombinasi RCBO 4P",
      "functionDesc": "Kombinasi all-in-one yang menyatukan fungsi MCB (beban lebih & korsleting) serta RCCB (arus bocor tanah) dalam satu perangkat ringkas.",
      "application": "Proteksi keselamatan lengkap dan penghemat ruang pada panel daya."
    },
    "en": {
      "name": "Residual Current Breaker with Overcurrent (RCBO) 4P",
      "summary": "Residual Current Breaker with Overcurrent (RCBO) 4P",
      "functionDesc": "All-in-one safety device combining Earth Leakage (RCCB) and Overcurrent/Short-Circuit (MCB) protection in a single compact module.",
      "application": "Space-saving comprehensive protection for sensitive equipment and industrial outlets."
    },
    "name": "Residual Current Breaker with Overcurrent (RCBO) 4P",
    "summary": "Pemutus Kombinasi RCBO 4P",
    "functionDesc": "Kombinasi all-in-one yang menyatukan fungsi MCB (beban lebih & korsleting) serta RCCB (arus bocor tanah) dalam satu perangkat ringkas.",
    "application": "Proteksi keselamatan lengkap dan penghemat ruang pada panel daya."
  },
  "phaseFailure": {
    "tagPrefix": "-KF",
    "id": {
      "name": "Phase Failure & Sequence Relay",
      "summary": "Relai Monitor Fasa (Phase Failure / Asymmetry)",
      "functionDesc": "Memantau kelengkapan 3 fasa (L1, L2, L3), urutan putaran fasa, dan ketidakseimbangan tegangan. Memutus kontrol jika ada fasa hilang.",
      "application": "Mencegah motor 3-fasa beroperasi saat fasa putus (single-phasing) yang dapat membakar lilitan."
    },
    "en": {
      "name": "Phase Failure & Sequence Relay",
      "summary": "Phase Failure & Sequence Monitoring Relay",
      "functionDesc": "Monitors 3-phase presence, phase sequence (L1-L2-L3), and voltage asymmetry, opening the control circuit upon single-phasing.",
      "application": "Prevents motors from operating under single-phasing conditions which causes destructive overheating."
    },
    "name": "Phase Failure & Sequence Relay",
    "summary": "Relai Monitor Fasa (Phase Failure / Asymmetry)",
    "functionDesc": "Memantau kelengkapan 3 fasa (L1, L2, L3), urutan putaran fasa, dan ketidakseimbangan tegangan. Memutus kontrol jika ada fasa hilang.",
    "application": "Mencegah motor 3-fasa beroperasi saat fasa putus (single-phasing) yang dapat membakar lilitan."
  },
  "buttonNO": {
    "tagPrefix": "-S",
    "id": {
      "name": "Push Button Normally Open (START)",
      "summary": "Tombol Tekan Normally Open (13-14)",
      "functionDesc": "Kontak menutup hanya selama tombol ditekan secara mekanik (spring-return), dan kembali membuka saat dilepas.",
      "application": "Tombol START pengaktifan koil kontaktor, reset alarm, dan tombol jogging mesin."
    },
    "en": {
      "name": "Push Button Normally Open (START)",
      "summary": "Normally Open Push Button (START, 13-14)",
      "functionDesc": "Spring-return push button that closes its contact only while pressed, reverting to open when released.",
      "application": "START push button for contactor coils, manual jogging, and system reset."
    },
    "name": "Push Button Normally Open (START)",
    "summary": "Tombol Tekan Normally Open (13-14)",
    "functionDesc": "Kontak menutup hanya selama tombol ditekan secara mekanik (spring-return), dan kembali membuka saat dilepas.",
    "application": "Tombol START pengaktifan koil kontaktor, reset alarm, dan tombol jogging mesin."
  },
  "buttonNC": {
    "tagPrefix": "-S",
    "id": {
      "name": "Push Button Normally Closed (STOP)",
      "summary": "Tombol Tekan Normally Closed (11-12)",
      "functionDesc": "Kontak tertutup pada kondisi normal, dan membuka saat tombol ditekan untuk memutus aliran arus ke koil.",
      "application": "Tombol STOP operasional utama untuk mematikan motor atau membatalkan operasi mesin."
    },
    "en": {
      "name": "Push Button Normally Closed (STOP)",
      "summary": "Normally Closed Push Button (STOP, 11-12)",
      "functionDesc": "Spring-return push button that opens its contact while pressed, interrupting current to de-energize the circuit.",
      "application": "Primary operational STOP push button for motors and automated machinery."
    },
    "name": "Push Button Normally Closed (STOP)",
    "summary": "Tombol Tekan Normally Closed (11-12)",
    "functionDesc": "Kontak tertutup pada kondisi normal, dan membuka saat tombol ditekan untuk memutus aliran arus ke koil.",
    "application": "Tombol STOP operasional utama untuk mematikan motor atau membatalkan operasi mesin."
  },
  "buttonCON": {
    "tagPrefix": "-S",
    "id": {
      "name": "Changeover Push Button (SPDT)",
      "summary": "Tombol Tekan Pengalih SPDT (11-12/14)",
      "functionDesc": "Memiliki terminal Common (11), NC (12), dan NO (14). Mengalihkan arus dari jalur NC ke jalur NO saat ditekan.",
      "application": "Pengalihan sirkuit kontrol satu aksi (misal menghentikan sirkuit A sekaligus menyalakan sirkuit B)."
    },
    "en": {
      "name": "Changeover Push Button (SPDT)",
      "summary": "Changeover Push Button (SPDT, 11-12/14)",
      "functionDesc": "Transfers current from Common (11) to NO (14) while breaking NC (12) upon being pressed.",
      "application": "Single-action circuit transfer (e.g. stopping circuit A while simultaneously initiating circuit B)."
    },
    "name": "Changeover Push Button (SPDT)",
    "summary": "Tombol Tekan Pengalih SPDT (11-12/14)",
    "functionDesc": "Memiliki terminal Common (11), NC (12), dan NO (14). Mengalihkan arus dari jalur NC ke jalur NO saat ditekan.",
    "application": "Pengalihan sirkuit kontrol satu aksi (misal menghentikan sirkuit A sekaligus menyalakan sirkuit B)."
  },
  "buttonNONC": {
    "tagPrefix": "-S",
    "id": {
      "name": "Double Push Button (NO + NC Simultaneous)",
      "summary": "Tombol Tekan Ganda NO+NC",
      "functionDesc": "Memiliki sepasang kontak NO dan NC yang bergerak bersamaan dalam satu mekanik tombol tekan.",
      "application": "Tombol interlock Forward/Reverse untuk mencegah kedua kontaktor aktif bersamaan secara mekanik."
    },
    "en": {
      "name": "Double Push Button (NO + NC Simultaneous)",
      "summary": "Dual Push Button (Simultaneous NO + NC)",
      "functionDesc": "Features mechanically coupled NO and NC contact blocks operating together from a single pushbutton.",
      "application": "Mechanical interlock for Forward-Reverse motor control pushbuttons."
    },
    "name": "Double Push Button (NO + NC Simultaneous)",
    "summary": "Tombol Tekan Ganda NO+NC",
    "functionDesc": "Memiliki sepasang kontak NO dan NC yang bergerak bersamaan dalam satu mekanik tombol tekan.",
    "application": "Tombol interlock Forward/Reverse untuk mencegah kedua kontaktor aktif bersamaan secara mekanik."
  },
  "buttonCrossover": {
    "tagPrefix": "-S",
    "id": {
      "name": "Polarity Crossover Push Button (DPDT)",
      "summary": "Tombol Pembalik Polaritas",
      "functionDesc": "Membalik sambungan dua jalur kabel secara silang saat ditekan.",
      "application": "Pembalik putaran motor DC sederhana atau penguji polaritas sinyal kontrol."
    },
    "en": {
      "name": "Polarity Crossover Push Button (DPDT)",
      "summary": "Polarity Crossover Push Button (DPDT)",
      "functionDesc": "Reverses the polarity between two wire lines when pressed.",
      "application": "DC motor simple polarity reversing and signal test switching."
    },
    "name": "Polarity Crossover Push Button (DPDT)",
    "summary": "Tombol Pembalik Polaritas",
    "functionDesc": "Membalik sambungan dua jalur kabel secara silang saat ditekan.",
    "application": "Pembalik putaran motor DC sederhana atau penguji polaritas sinyal kontrol."
  },
  "emergencyNO": {
    "tagPrefix": "-SB",
    "id": {
      "name": "Emergency Stop Push Button (NO)",
      "summary": "Tombol Jamur Darurat (E-Stop) NO",
      "functionDesc": "Tombol darurat kepala jamur merah dengan mekanisme pengunci mekanis (twist-to-reset / pull-to-reset) untuk keamanan keselamatan mutlak.",
      "application": "Pemberhentian darurat mesin seketika saat terjadi bahaya bagi keselamatan operator."
    },
    "en": {
      "name": "Emergency Stop Push Button (NO)",
      "summary": "Emergency Stop Mushroom Push Button (NO)",
      "functionDesc": "Latching red mushroom-head push button with twist-to-reset safety locking mechanism for critical emergency shutdowns.",
      "application": "Immediate machine emergency shutdown in compliance with machine safety regulations (ISO 13850)."
    },
    "name": "Emergency Stop Push Button (NO)",
    "summary": "Tombol Jamur Darurat (E-Stop) NO",
    "functionDesc": "Tombol darurat kepala jamur merah dengan mekanisme pengunci mekanis (twist-to-reset / pull-to-reset) untuk keamanan keselamatan mutlak.",
    "application": "Pemberhentian darurat mesin seketika saat terjadi bahaya bagi keselamatan operator."
  },
  "emergencyNC": {
    "tagPrefix": "-SB",
    "id": {
      "name": "Emergency Stop Push Button (NC)",
      "summary": "Tombol Jamur Darurat (E-Stop) NC",
      "functionDesc": "Tombol darurat kepala jamur merah dengan mekanisme pengunci mekanis (twist-to-reset / pull-to-reset) untuk keamanan keselamatan mutlak.",
      "application": "Pemberhentian darurat mesin seketika saat terjadi bahaya bagi keselamatan operator."
    },
    "en": {
      "name": "Emergency Stop Push Button (NC)",
      "summary": "Emergency Stop Mushroom Push Button (NC)",
      "functionDesc": "Latching red mushroom-head push button with twist-to-reset safety locking mechanism for critical emergency shutdowns.",
      "application": "Immediate machine emergency shutdown in compliance with machine safety regulations (ISO 13850)."
    },
    "name": "Emergency Stop Push Button (NC)",
    "summary": "Tombol Jamur Darurat (E-Stop) NC",
    "functionDesc": "Tombol darurat kepala jamur merah dengan mekanisme pengunci mekanis (twist-to-reset / pull-to-reset) untuk keamanan keselamatan mutlak.",
    "application": "Pemberhentian darurat mesin seketika saat terjadi bahaya bagi keselamatan operator."
  },
  "emergencyCON": {
    "tagPrefix": "-SB",
    "id": {
      "name": "Emergency Stop Push Button (CON)",
      "summary": "Tombol Jamur Darurat (E-Stop) CON",
      "functionDesc": "Tombol darurat kepala jamur merah dengan mekanisme pengunci mekanis (twist-to-reset / pull-to-reset) untuk keamanan keselamatan mutlak.",
      "application": "Pemberhentian darurat mesin seketika saat terjadi bahaya bagi keselamatan operator."
    },
    "en": {
      "name": "Emergency Stop Push Button (CON)",
      "summary": "Emergency Stop Mushroom Push Button (CON)",
      "functionDesc": "Latching red mushroom-head push button with twist-to-reset safety locking mechanism for critical emergency shutdowns.",
      "application": "Immediate machine emergency shutdown in compliance with machine safety regulations (ISO 13850)."
    },
    "name": "Emergency Stop Push Button (CON)",
    "summary": "Tombol Jamur Darurat (E-Stop) CON",
    "functionDesc": "Tombol darurat kepala jamur merah dengan mekanisme pengunci mekanis (twist-to-reset / pull-to-reset) untuk keamanan keselamatan mutlak.",
    "application": "Pemberhentian darurat mesin seketika saat terjadi bahaya bagi keselamatan operator."
  },
  "emergencyNONC": {
    "tagPrefix": "-SB",
    "id": {
      "name": "Emergency Stop Push Button (NONC)",
      "summary": "Tombol Jamur Darurat (E-Stop) NONC",
      "functionDesc": "Tombol darurat kepala jamur merah dengan mekanisme pengunci mekanis (twist-to-reset / pull-to-reset) untuk keamanan keselamatan mutlak.",
      "application": "Pemberhentian darurat mesin seketika saat terjadi bahaya bagi keselamatan operator."
    },
    "en": {
      "name": "Emergency Stop Push Button (NONC)",
      "summary": "Emergency Stop Mushroom Push Button (NONC)",
      "functionDesc": "Latching red mushroom-head push button with twist-to-reset safety locking mechanism for critical emergency shutdowns.",
      "application": "Immediate machine emergency shutdown in compliance with machine safety regulations (ISO 13850)."
    },
    "name": "Emergency Stop Push Button (NONC)",
    "summary": "Tombol Jamur Darurat (E-Stop) NONC",
    "functionDesc": "Tombol darurat kepala jamur merah dengan mekanisme pengunci mekanis (twist-to-reset / pull-to-reset) untuk keamanan keselamatan mutlak.",
    "application": "Pemberhentian darurat mesin seketika saat terjadi bahaya bagi keselamatan operator."
  },
  "switchNO": {
    "tagPrefix": "-SA",
    "id": {
      "name": "Maintained Selector Switch (NO)",
      "summary": "Saklar Selektor Terkunci NO",
      "functionDesc": "Saklar putar yang mempertahankan posisinya (latching/maintained) tanpa perlu ditahan oleh operator.",
      "application": "Saklar daya utama kontrol, saklar pemilihan lampu, atau pengaktifan fungsi pemanas."
    },
    "en": {
      "name": "Maintained Selector Switch (NO)",
      "summary": "Maintained Rotary Selector Switch (NO)",
      "functionDesc": "Rotary switch that holds its position (maintained) without requiring continuous operator holding.",
      "application": "Control power master switch, illumination mode selection, or heater activation."
    },
    "name": "Maintained Selector Switch (NO)",
    "summary": "Saklar Selektor Terkunci NO",
    "functionDesc": "Saklar putar yang mempertahankan posisinya (latching/maintained) tanpa perlu ditahan oleh operator.",
    "application": "Saklar daya utama kontrol, saklar pemilihan lampu, atau pengaktifan fungsi pemanas."
  },
  "switchNC": {
    "tagPrefix": "-SA",
    "id": {
      "name": "Maintained Selector Switch (NC)",
      "summary": "Saklar Selektor Terkunci NC",
      "functionDesc": "Saklar putar yang mempertahankan posisinya (latching/maintained) tanpa perlu ditahan oleh operator.",
      "application": "Saklar daya utama kontrol, saklar pemilihan lampu, atau pengaktifan fungsi pemanas."
    },
    "en": {
      "name": "Maintained Selector Switch (NC)",
      "summary": "Maintained Rotary Selector Switch (NC)",
      "functionDesc": "Rotary switch that holds its position (maintained) without requiring continuous operator holding.",
      "application": "Control power master switch, illumination mode selection, or heater activation."
    },
    "name": "Maintained Selector Switch (NC)",
    "summary": "Saklar Selektor Terkunci NC",
    "functionDesc": "Saklar putar yang mempertahankan posisinya (latching/maintained) tanpa perlu ditahan oleh operator.",
    "application": "Saklar daya utama kontrol, saklar pemilihan lampu, atau pengaktifan fungsi pemanas."
  },
  "switchCON": {
    "tagPrefix": "-SA",
    "id": {
      "name": "Maintained Selector Switch (CON)",
      "summary": "Saklar Selektor Terkunci CON",
      "functionDesc": "Saklar putar yang mempertahankan posisinya (latching/maintained) tanpa perlu ditahan oleh operator.",
      "application": "Saklar daya utama kontrol, saklar pemilihan lampu, atau pengaktifan fungsi pemanas."
    },
    "en": {
      "name": "Maintained Selector Switch (CON)",
      "summary": "Maintained Rotary Selector Switch (CON)",
      "functionDesc": "Rotary switch that holds its position (maintained) without requiring continuous operator holding.",
      "application": "Control power master switch, illumination mode selection, or heater activation."
    },
    "name": "Maintained Selector Switch (CON)",
    "summary": "Saklar Selektor Terkunci CON",
    "functionDesc": "Saklar putar yang mempertahankan posisinya (latching/maintained) tanpa perlu ditahan oleh operator.",
    "application": "Saklar daya utama kontrol, saklar pemilihan lampu, atau pengaktifan fungsi pemanas."
  },
  "switchNONC": {
    "tagPrefix": "-SA",
    "id": {
      "name": "Maintained Selector Switch (NONC)",
      "summary": "Saklar Selektor Terkunci NONC",
      "functionDesc": "Saklar putar yang mempertahankan posisinya (latching/maintained) tanpa perlu ditahan oleh operator.",
      "application": "Saklar daya utama kontrol, saklar pemilihan lampu, atau pengaktifan fungsi pemanas."
    },
    "en": {
      "name": "Maintained Selector Switch (NONC)",
      "summary": "Maintained Rotary Selector Switch (NONC)",
      "functionDesc": "Rotary switch that holds its position (maintained) without requiring continuous operator holding.",
      "application": "Control power master switch, illumination mode selection, or heater activation."
    },
    "name": "Maintained Selector Switch (NONC)",
    "summary": "Saklar Selektor Terkunci NONC",
    "functionDesc": "Saklar putar yang mempertahankan posisinya (latching/maintained) tanpa perlu ditahan oleh operator.",
    "application": "Saklar daya utama kontrol, saklar pemilihan lampu, atau pengaktifan fungsi pemanas."
  },
  "switchCrossover": {
    "tagPrefix": "-SA",
    "id": {
      "name": "Maintained Selector Switch (Crossover)",
      "summary": "Saklar Selektor Terkunci Crossover",
      "functionDesc": "Saklar putar yang mempertahankan posisinya (latching/maintained) tanpa perlu ditahan oleh operator.",
      "application": "Saklar daya utama kontrol, saklar pemilihan lampu, atau pengaktifan fungsi pemanas."
    },
    "en": {
      "name": "Maintained Selector Switch (Crossover)",
      "summary": "Maintained Rotary Selector Switch (Crossover)",
      "functionDesc": "Rotary switch that holds its position (maintained) without requiring continuous operator holding.",
      "application": "Control power master switch, illumination mode selection, or heater activation."
    },
    "name": "Maintained Selector Switch (Crossover)",
    "summary": "Saklar Selektor Terkunci Crossover",
    "functionDesc": "Saklar putar yang mempertahankan posisinya (latching/maintained) tanpa perlu ditahan oleh operator.",
    "application": "Saklar daya utama kontrol, saklar pemilihan lampu, atau pengaktifan fungsi pemanas."
  },
  "switch3p0": {
    "tagPrefix": "-SA",
    "id": {
      "name": "3-Position Selector Switch (I-0-II)",
      "summary": "Saklar Selektor 3 Posisi (Hand-Off-Auto)",
      "functionDesc": "Saklar putar 3 posisi dengan posisi tengah nol terputus. Posisi I menghubungkan terminal 1-2, Posisi II menghubungkan 1-3.",
      "application": "Pemilihan mode operasi Manual - OFF - Otomatis pada sistem pompa dan konveyor."
    },
    "en": {
      "name": "3-Position Selector Switch (I-0-II)",
      "summary": "3-Position Rotary Switch (Hand-Off-Auto, I-0-II)",
      "functionDesc": "Maintained 3-position selector with center OFF. Position I connects 1-2, Position II connects 1-3.",
      "application": "Hand - OFF - Auto control mode selection for pumps, fans, and conveyor systems."
    },
    "name": "3-Position Selector Switch (I-0-II)",
    "summary": "Saklar Selektor 3 Posisi (Hand-Off-Auto)",
    "functionDesc": "Saklar putar 3 posisi dengan posisi tengah nol terputus. Posisi I menghubungkan terminal 1-2, Posisi II menghubungkan 1-3.",
    "application": "Pemilihan mode operasi Manual - OFF - Otomatis pada sistem pompa dan konveyor."
  },
  "switch3p": {
    "tagPrefix": "-SA",
    "id": {
      "name": "3-Position Stepped Switch (I-II-III)",
      "summary": "Saklar Selektor 3 Langkah Kontinu",
      "functionDesc": "Saklar selektor bertingkat untuk memilih tiga saluran berbeda secara berurutan.",
      "application": "Pemilihan tingkat kecepatan motor listrik atau tingkatan daya pemanas bertahap."
    },
    "en": {
      "name": "3-Position Stepped Switch (I-II-III)",
      "summary": "3-Position Stepped Selector Switch (I-II-III)",
      "functionDesc": "Sequential stepped selector switch routing power across three selectable control channels.",
      "application": "Multi-speed motor step selection or multi-stage industrial heating control."
    },
    "name": "3-Position Stepped Switch (I-II-III)",
    "summary": "Saklar Selektor 3 Langkah Kontinu",
    "functionDesc": "Saklar selektor bertingkat untuk memilih tiga saluran berbeda secara berurutan.",
    "application": "Pemilihan tingkat kecepatan motor listrik atau tingkatan daya pemanas bertahap."
  },
  "rollerNO": {
    "tagPrefix": "-SQ",
    "id": {
      "name": "Roller Limit Switch (NO)",
      "summary": "Saklar Batas Mekanik Beroda (Limit Switch) NO",
      "functionDesc": "Saklar pembatas posisi yang diaktifkan secara fisik oleh sentuhan lengan mesin, tuas konveyor, atau pintu pengaman.",
      "application": "Sensor posisi akhir gerak silinder, pembatas batas atas-bawah crane/lift, dan gerbang otomatis."
    },
    "en": {
      "name": "Roller Limit Switch (NO)",
      "summary": "Mechanical Roller Limit Switch (NO)",
      "functionDesc": "Position limit switch mechanically actuated by moving machine arms, conveyor cams, or guard doors.",
      "application": "Cylinder end-stroke sensing, crane travel limit safety, and automated conveyor routing."
    },
    "name": "Roller Limit Switch (NO)",
    "summary": "Saklar Batas Mekanik Beroda (Limit Switch) NO",
    "functionDesc": "Saklar pembatas posisi yang diaktifkan secara fisik oleh sentuhan lengan mesin, tuas konveyor, atau pintu pengaman.",
    "application": "Sensor posisi akhir gerak silinder, pembatas batas atas-bawah crane/lift, dan gerbang otomatis."
  },
  "rollerNC": {
    "tagPrefix": "-SQ",
    "id": {
      "name": "Roller Limit Switch (NC)",
      "summary": "Saklar Batas Mekanik Beroda (Limit Switch) NC",
      "functionDesc": "Saklar pembatas posisi yang diaktifkan secara fisik oleh sentuhan lengan mesin, tuas konveyor, atau pintu pengaman.",
      "application": "Sensor posisi akhir gerak silinder, pembatas batas atas-bawah crane/lift, dan gerbang otomatis."
    },
    "en": {
      "name": "Roller Limit Switch (NC)",
      "summary": "Mechanical Roller Limit Switch (NC)",
      "functionDesc": "Position limit switch mechanically actuated by moving machine arms, conveyor cams, or guard doors.",
      "application": "Cylinder end-stroke sensing, crane travel limit safety, and automated conveyor routing."
    },
    "name": "Roller Limit Switch (NC)",
    "summary": "Saklar Batas Mekanik Beroda (Limit Switch) NC",
    "functionDesc": "Saklar pembatas posisi yang diaktifkan secara fisik oleh sentuhan lengan mesin, tuas konveyor, atau pintu pengaman.",
    "application": "Sensor posisi akhir gerak silinder, pembatas batas atas-bawah crane/lift, dan gerbang otomatis."
  },
  "rollerCON": {
    "tagPrefix": "-SQ",
    "id": {
      "name": "Roller Limit Switch (CON)",
      "summary": "Saklar Batas Mekanik Beroda (Limit Switch) CON",
      "functionDesc": "Saklar pembatas posisi yang diaktifkan secara fisik oleh sentuhan lengan mesin, tuas konveyor, atau pintu pengaman.",
      "application": "Sensor posisi akhir gerak silinder, pembatas batas atas-bawah crane/lift, dan gerbang otomatis."
    },
    "en": {
      "name": "Roller Limit Switch (CON)",
      "summary": "Mechanical Roller Limit Switch (CON)",
      "functionDesc": "Position limit switch mechanically actuated by moving machine arms, conveyor cams, or guard doors.",
      "application": "Cylinder end-stroke sensing, crane travel limit safety, and automated conveyor routing."
    },
    "name": "Roller Limit Switch (CON)",
    "summary": "Saklar Batas Mekanik Beroda (Limit Switch) CON",
    "functionDesc": "Saklar pembatas posisi yang diaktifkan secara fisik oleh sentuhan lengan mesin, tuas konveyor, atau pintu pengaman.",
    "application": "Sensor posisi akhir gerak silinder, pembatas batas atas-bawah crane/lift, dan gerbang otomatis."
  },
  "rollerNONC": {
    "tagPrefix": "-SQ",
    "id": {
      "name": "Roller Limit Switch (NONC)",
      "summary": "Saklar Batas Mekanik Beroda (Limit Switch) NONC",
      "functionDesc": "Saklar pembatas posisi yang diaktifkan secara fisik oleh sentuhan lengan mesin, tuas konveyor, atau pintu pengaman.",
      "application": "Sensor posisi akhir gerak silinder, pembatas batas atas-bawah crane/lift, dan gerbang otomatis."
    },
    "en": {
      "name": "Roller Limit Switch (NONC)",
      "summary": "Mechanical Roller Limit Switch (NONC)",
      "functionDesc": "Position limit switch mechanically actuated by moving machine arms, conveyor cams, or guard doors.",
      "application": "Cylinder end-stroke sensing, crane travel limit safety, and automated conveyor routing."
    },
    "name": "Roller Limit Switch (NONC)",
    "summary": "Saklar Batas Mekanik Beroda (Limit Switch) NONC",
    "functionDesc": "Saklar pembatas posisi yang diaktifkan secara fisik oleh sentuhan lengan mesin, tuas konveyor, atau pintu pengaman.",
    "application": "Sensor posisi akhir gerak silinder, pembatas batas atas-bawah crane/lift, dan gerbang otomatis."
  },
  "coil": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Contactor / Relay Coil",
      "summary": "Koil Elektromagnetik Kontaktor / Relay (A1-A2)",
      "functionDesc": "Menciptakan medan magnet saat dialiri arus listrik (A1-A2), menarik armature untuk menggerakkan seluruh kontak utama dan bantu terkait.",
      "application": "Aktuator inti pengendali motor, pemutus daya jarak jauh, dan relai logika kontrol."
    },
    "en": {
      "name": "Contactor / Relay Coil",
      "summary": "Electromagnetic Contactor / Relay Coil (A1-A2)",
      "functionDesc": "Generates a magnetic field when energized (A1-A2), pulling the armature to actuate all associated power and auxiliary contacts.",
      "application": "Core actuator for motor starters, remote power switching, and relay logic interlocks."
    },
    "name": "Contactor / Relay Coil",
    "summary": "Koil Elektromagnetik Kontaktor / Relay (A1-A2)",
    "functionDesc": "Menciptakan medan magnet saat dialiri arus listrik (A1-A2), menarik armature untuk menggerakkan seluruh kontak utama dan bantu terkait.",
    "application": "Aktuator inti pengendali motor, pemutus daya jarak jauh, dan relai logika kontrol."
  },
  "coilDelayOn": {
    "tagPrefix": "-KT",
    "id": {
      "name": "On-Delay Timer Relay Coil",
      "summary": "Koil Timer Penundaan Waktu ON (Timer Tunda ON)",
      "functionDesc": "Saat koil diberi tegangan konstan, timer mulai menghitung; kontak baru berubah posisi setelah waktu tunda (T) selesai.",
      "application": "Pengasutan motor Star-Delta (waktu transisi Y ke Delta) dan pengurutan start motor bertahap."
    },
    "en": {
      "name": "On-Delay Timer Relay Coil",
      "summary": "On-Delay Timer Relay Coil (TON)",
      "functionDesc": "Begins countdown when energized; timed contacts change state only after the preset delay time (T) has elapsed.",
      "application": "Star-to-Delta motor starter transition timing and staggered sequential motor starting."
    },
    "name": "On-Delay Timer Relay Coil",
    "summary": "Koil Timer Penundaan Waktu ON (Timer Tunda ON)",
    "functionDesc": "Saat koil diberi tegangan konstan, timer mulai menghitung; kontak baru berubah posisi setelah waktu tunda (T) selesai.",
    "application": "Pengasutan motor Star-Delta (waktu transisi Y ke Delta) dan pengurutan start motor bertahap."
  },
  "coilDelayOff": {
    "tagPrefix": "-KT",
    "id": {
      "name": "Off-Delay Timer Relay Coil",
      "summary": "Koil Timer Penundaan Waktu OFF (Timer Tunda OFF)",
      "functionDesc": "Kontak langsung berubah saat koil berenergi; saat daya koil diputus, kontak tetap aktif dan baru kembali setelah waktu tunda (T) habis.",
      "application": "Kipas pendingin motor yang tetap menyala beberapa menit setelah mesin utama dimatikan."
    },
    "en": {
      "name": "Off-Delay Timer Relay Coil",
      "summary": "Off-Delay Timer Relay Coil (TOF)",
      "functionDesc": "Contacts actuate immediately upon energization, and remain held for the preset duration (T) after coil de-energization.",
      "application": "Post-cooling ventilation fans that stay active for several minutes after motor shutdown."
    },
    "name": "Off-Delay Timer Relay Coil",
    "summary": "Koil Timer Penundaan Waktu OFF (Timer Tunda OFF)",
    "functionDesc": "Kontak langsung berubah saat koil berenergi; saat daya koil diputus, kontak tetap aktif dan baru kembali setelah waktu tunda (T) habis.",
    "application": "Kipas pendingin motor yang tetap menyala beberapa menit setelah mesin utama dimatikan."
  },
  "coilDelayOnOff": {
    "tagPrefix": "-KT",
    "id": {
      "name": "On-Off-Delay Combination Timer Coil",
      "summary": "Koil Timer Kombinasi Tunda ON & OFF",
      "functionDesc": "Memberikan jeda waktu tunda baik saat koil diaktifkan maupun saat koil dimatikan.",
      "application": "Kontrol ventilasi otomatis dan sistem pembersihan filter periodik."
    },
    "en": {
      "name": "On-Off-Delay Combination Timer Coil",
      "summary": "Combination On-Off-Delay Timer Relay Coil",
      "functionDesc": "Provides programmed time delays on both coil energization and coil de-energization.",
      "application": "Automated ventilation cycles and periodic filter cleaning purge systems."
    },
    "name": "On-Off-Delay Combination Timer Coil",
    "summary": "Koil Timer Kombinasi Tunda ON & OFF",
    "functionDesc": "Memberikan jeda waktu tunda baik saat koil diaktifkan maupun saat koil dimatikan.",
    "application": "Kontrol ventilasi otomatis dan sistem pembersihan filter periodik."
  },
  "coilFlasher": {
    "tagPrefix": "-KF",
    "id": {
      "name": "Flasher / Pulse Generator Relay Coil",
      "summary": "Koil Relay Kedip / Pembangkit Pulsa",
      "functionDesc": "Secara otomatis menyalakan dan mematikan kontak secara berulang dengan interval waktu simetris selama koil diberi tegangan.",
      "application": "Mengedipkan lampu sinyal bahaya dan membunyikan sirine peringatan berkala."
    },
    "en": {
      "name": "Flasher / Pulse Generator Relay Coil",
      "summary": "Flasher / Symmetrical Pulse Generator Relay",
      "functionDesc": "Continuously cycles its contacts ON and OFF with equal time intervals as long as power is applied.",
      "application": "Flashing warning beacons and intermittent audio alarm buzzers."
    },
    "name": "Flasher / Pulse Generator Relay Coil",
    "summary": "Koil Relay Kedip / Pembangkit Pulsa",
    "functionDesc": "Secara otomatis menyalakan dan mematikan kontak secara berulang dengan interval waktu simetris selama koil diberi tegangan.",
    "application": "Mengedipkan lampu sinyal bahaya dan membunyikan sirine peringatan berkala."
  },
  "coilLatch": {
    "tagPrefix": "-KL",
    "id": {
      "name": "Impulse / Latching (Step) Relay Coil",
      "summary": "Koil Relay Impuls / Bistabil",
      "functionDesc": "Setiap menerima satu pulsa listrik sesaat, kontak akan berpindah posisi dan terkunci mekanis (toggle ON/OFF bergantian).",
      "application": "Kontrol penerangan dari banyak saklar tombol tekan (saklar tangga / lorong gedung)."
    },
    "en": {
      "name": "Impulse / Latching (Step) Relay Coil",
      "summary": "Impulse / Latching (Step / Bistable) Relay Coil",
      "functionDesc": "Each brief electrical pulse toggles contact position and mechanically latches it (flip-flop state).",
      "application": "Multi-station pushbutton lighting control in long corridors and industrial halls."
    },
    "name": "Impulse / Latching (Step) Relay Coil",
    "summary": "Koil Relay Impuls / Bistabil",
    "functionDesc": "Setiap menerima satu pulsa listrik sesaat, kontak akan berpindah posisi dan terkunci mekanis (toggle ON/OFF bergantian).",
    "application": "Kontrol penerangan dari banyak saklar tombol tekan (saklar tangga / lorong gedung)."
  },
  "coilSolenoid": {
    "tagPrefix": "-Y",
    "id": {
      "name": "Linear Solenoid Actuator Coil",
      "summary": "Koil Solenoid Elektro-Pneumatik",
      "functionDesc": "Mengubah energi listrik menjadi gerakan mekanis linier untuk membuka atau menutup katup fluida/angin pneumatik.",
      "application": "Penggerak katup directional valve pneumatik/hidrolik dan pengunci pintu magnetik."
    },
    "en": {
      "name": "Linear Solenoid Actuator Coil",
      "summary": "Linear Solenoid Actuator Coil",
      "functionDesc": "Converts electrical energy into linear mechanical motion to open/close pneumatic or hydraulic fluid valves.",
      "application": "Directional pneumatic/hydraulic spool valve actuation and magnetic safety door locks."
    },
    "name": "Linear Solenoid Actuator Coil",
    "summary": "Koil Solenoid Elektro-Pneumatik",
    "functionDesc": "Mengubah energi listrik menjadi gerakan mekanis linier untuk membuka atau menutup katup fluida/angin pneumatik.",
    "application": "Penggerak katup directional valve pneumatik/hidrolik dan pengunci pintu magnetik."
  },
  "contactNO": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Auxiliary Contact Normally Open",
      "summary": "Kontak Bantu Normally Open (13-14)",
      "functionDesc": "Kontak terbuka pada kondisi relai mati; menutup saat koil berpasangan (tag sama) diberi daya.",
      "application": "Rangkaian pengunci sendiri (self-holding / latching contact) pada rangkaian kontrol motor."
    },
    "en": {
      "name": "Auxiliary Contact Normally Open",
      "summary": "Normally Open Auxiliary Contact (13-14)",
      "functionDesc": "Open when unpowered; closes when its paired coil (same tag) is energized.",
      "application": "Self-holding (latching) seal-in contact in classic motor starter circuits."
    },
    "name": "Auxiliary Contact Normally Open",
    "summary": "Kontak Bantu Normally Open (13-14)",
    "functionDesc": "Kontak terbuka pada kondisi relai mati; menutup saat koil berpasangan (tag sama) diberi daya.",
    "application": "Rangkaian pengunci sendiri (self-holding / latching contact) pada rangkaian kontrol motor."
  },
  "contactNC": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Auxiliary Contact Normally Closed",
      "summary": "Kontak Bantu Normally Closed (11-12)",
      "functionDesc": "Kontak tertutup pada kondisi relai mati; membuka saat koil berpasangan diberi daya.",
      "application": "Rangkaian interlock kelistrikan antara arah maju (Forward) dan mundur (Reverse) agar tidak bentrok."
    },
    "en": {
      "name": "Auxiliary Contact Normally Closed",
      "summary": "Normally Closed Auxiliary Contact (11-12)",
      "functionDesc": "Closed when unpowered; opens when its paired coil is energized.",
      "application": "Electrical interlock preventing simultaneous activation of opposing Forward and Reverse contactors."
    },
    "name": "Auxiliary Contact Normally Closed",
    "summary": "Kontak Bantu Normally Closed (11-12)",
    "functionDesc": "Kontak tertutup pada kondisi relai mati; membuka saat koil berpasangan diberi daya.",
    "application": "Rangkaian interlock kelistrikan antara arah maju (Forward) dan mundur (Reverse) agar tidak bentrok."
  },
  "contactCON": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Changeover Auxiliary Contact (SPDT)",
      "summary": "Kontak Bantu Pengalih SPDT (11-12/14)",
      "functionDesc": "Terminal 11 (Common) terhubung ke 12 (NC) saat koil mati, dan berpindah ke 14 (NO) saat koil aktif.",
      "application": "Pengalihan status operasional lampu indikator Run (NO) dan Standby (NC)."
    },
    "en": {
      "name": "Changeover Auxiliary Contact (SPDT)",
      "summary": "Changeover Auxiliary Contact (SPDT, 11-12/14)",
      "functionDesc": "Switches from Common-NC (11-12) to Common-NO (11-14) upon coil energization.",
      "application": "Simultaneous status indication (Standby vs Run pilot lamps)."
    },
    "name": "Changeover Auxiliary Contact (SPDT)",
    "summary": "Kontak Bantu Pengalih SPDT (11-12/14)",
    "functionDesc": "Terminal 11 (Common) terhubung ke 12 (NC) saat koil mati, dan berpindah ke 14 (NO) saat koil aktif.",
    "application": "Pengalihan status operasional lampu indikator Run (NO) dan Standby (NC)."
  },
  "contactNONC": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Dual Auxiliary Contacts (NO + NC)",
      "summary": "Blok Kontak Bantu Ganda NO + NC",
      "functionDesc": "Menyediakan sepasang kontak bantu 1 NO (13-14) dan 1 NC (11-12) yang digerakkan oleh koil yang sama.",
      "application": "Kontak bantu tambahan kontaktor untuk indikasi status dan interlock sekaligus."
    },
    "en": {
      "name": "Dual Auxiliary Contacts (NO + NC)",
      "summary": "Dual Auxiliary Contact Block (1 NO + 1 NC)",
      "functionDesc": "Provides mechanically synchronized NO (13-14) and NC (11-12) auxiliary contacts driven by the same coil.",
      "application": "Contactor add-on block providing both holding contact and interlock contact."
    },
    "name": "Dual Auxiliary Contacts (NO + NC)",
    "summary": "Blok Kontak Bantu Ganda NO + NC",
    "functionDesc": "Menyediakan sepasang kontak bantu 1 NO (13-14) dan 1 NC (11-12) yang digerakkan oleh koil yang sama.",
    "application": "Kontak bantu tambahan kontaktor untuk indikasi status dan interlock sekaligus."
  },
  "contactNODelayOn": {
    "tagPrefix": "-KT",
    "id": {
      "name": "On-Delay Timed Contact (NO)",
      "summary": "Kontak Bantu Timer Tunda ON (NO)",
      "functionDesc": "Berpindah posisi hanya setelah koil On-Delay berpasangan menyelesaikan waktu hitung mundur penundaan.",
      "application": "Memindahkan rangkaian dari kontaktor Bintang ke Segitiga pada starter Star-Delta."
    },
    "en": {
      "name": "On-Delay Timed Contact (NO)",
      "summary": "On-Delay Timed Auxiliary Contact (NO)",
      "functionDesc": "Changes state only after its paired On-Delay timer coil completes its timing delay countdown.",
      "application": "Star-to-Delta transition contact switching the starter from Star to Delta contactor."
    },
    "name": "On-Delay Timed Contact (NO)",
    "summary": "Kontak Bantu Timer Tunda ON (NO)",
    "functionDesc": "Berpindah posisi hanya setelah koil On-Delay berpasangan menyelesaikan waktu hitung mundur penundaan.",
    "application": "Memindahkan rangkaian dari kontaktor Bintang ke Segitiga pada starter Star-Delta."
  },
  "contactNCDelayOn": {
    "tagPrefix": "-KT",
    "id": {
      "name": "On-Delay Timed Contact (NC)",
      "summary": "Kontak Bantu Timer Tunda ON (NC)",
      "functionDesc": "Berpindah posisi hanya setelah koil On-Delay berpasangan menyelesaikan waktu hitung mundur penundaan.",
      "application": "Memindahkan rangkaian dari kontaktor Bintang ke Segitiga pada starter Star-Delta."
    },
    "en": {
      "name": "On-Delay Timed Contact (NC)",
      "summary": "On-Delay Timed Auxiliary Contact (NC)",
      "functionDesc": "Changes state only after its paired On-Delay timer coil completes its timing delay countdown.",
      "application": "Star-to-Delta transition contact switching the starter from Star to Delta contactor."
    },
    "name": "On-Delay Timed Contact (NC)",
    "summary": "Kontak Bantu Timer Tunda ON (NC)",
    "functionDesc": "Berpindah posisi hanya setelah koil On-Delay berpasangan menyelesaikan waktu hitung mundur penundaan.",
    "application": "Memindahkan rangkaian dari kontaktor Bintang ke Segitiga pada starter Star-Delta."
  },
  "contactCONDelayOn": {
    "tagPrefix": "-KT",
    "id": {
      "name": "On-Delay Timed Contact (CON)",
      "summary": "Kontak Bantu Timer Tunda ON (CON)",
      "functionDesc": "Berpindah posisi hanya setelah koil On-Delay berpasangan menyelesaikan waktu hitung mundur penundaan.",
      "application": "Memindahkan rangkaian dari kontaktor Bintang ke Segitiga pada starter Star-Delta."
    },
    "en": {
      "name": "On-Delay Timed Contact (CON)",
      "summary": "On-Delay Timed Auxiliary Contact (CON)",
      "functionDesc": "Changes state only after its paired On-Delay timer coil completes its timing delay countdown.",
      "application": "Star-to-Delta transition contact switching the starter from Star to Delta contactor."
    },
    "name": "On-Delay Timed Contact (CON)",
    "summary": "Kontak Bantu Timer Tunda ON (CON)",
    "functionDesc": "Berpindah posisi hanya setelah koil On-Delay berpasangan menyelesaikan waktu hitung mundur penundaan.",
    "application": "Memindahkan rangkaian dari kontaktor Bintang ke Segitiga pada starter Star-Delta."
  },
  "contactNONCDelayOn": {
    "tagPrefix": "-KT",
    "id": {
      "name": "On-Delay Timed Contact (NONC)",
      "summary": "Kontak Bantu Timer Tunda ON (NONC)",
      "functionDesc": "Berpindah posisi hanya setelah koil On-Delay berpasangan menyelesaikan waktu hitung mundur penundaan.",
      "application": "Memindahkan rangkaian dari kontaktor Bintang ke Segitiga pada starter Star-Delta."
    },
    "en": {
      "name": "On-Delay Timed Contact (NONC)",
      "summary": "On-Delay Timed Auxiliary Contact (NONC)",
      "functionDesc": "Changes state only after its paired On-Delay timer coil completes its timing delay countdown.",
      "application": "Star-to-Delta transition contact switching the starter from Star to Delta contactor."
    },
    "name": "On-Delay Timed Contact (NONC)",
    "summary": "Kontak Bantu Timer Tunda ON (NONC)",
    "functionDesc": "Berpindah posisi hanya setelah koil On-Delay berpasangan menyelesaikan waktu hitung mundur penundaan.",
    "application": "Memindahkan rangkaian dari kontaktor Bintang ke Segitiga pada starter Star-Delta."
  },
  "contactNODelayOff": {
    "tagPrefix": "-KT",
    "id": {
      "name": "Off-Delay Timed Contact (NO)",
      "summary": "Kontak Bantu Timer Tunda OFF (NO)",
      "functionDesc": "Langsung berpindah saat koil aktif, dan mempertahankan posisinya selama waktu tunda setelah koil dimatikan.",
      "application": "Mempertahankan putaran pompa pelumasan setelah motor utama berhenti."
    },
    "en": {
      "name": "Off-Delay Timed Contact (NO)",
      "summary": "Off-Delay Timed Auxiliary Contact (NO)",
      "functionDesc": "Actuates instantly on coil power, and maintains its actuated state for the preset duration after coil de-energization.",
      "application": "Auxiliary lubrication pump delayed shutoff circuit."
    },
    "name": "Off-Delay Timed Contact (NO)",
    "summary": "Kontak Bantu Timer Tunda OFF (NO)",
    "functionDesc": "Langsung berpindah saat koil aktif, dan mempertahankan posisinya selama waktu tunda setelah koil dimatikan.",
    "application": "Mempertahankan putaran pompa pelumasan setelah motor utama berhenti."
  },
  "contactNCDelayOff": {
    "tagPrefix": "-KT",
    "id": {
      "name": "Off-Delay Timed Contact (NC)",
      "summary": "Kontak Bantu Timer Tunda OFF (NC)",
      "functionDesc": "Langsung berpindah saat koil aktif, dan mempertahankan posisinya selama waktu tunda setelah koil dimatikan.",
      "application": "Mempertahankan putaran pompa pelumasan setelah motor utama berhenti."
    },
    "en": {
      "name": "Off-Delay Timed Contact (NC)",
      "summary": "Off-Delay Timed Auxiliary Contact (NC)",
      "functionDesc": "Actuates instantly on coil power, and maintains its actuated state for the preset duration after coil de-energization.",
      "application": "Auxiliary lubrication pump delayed shutoff circuit."
    },
    "name": "Off-Delay Timed Contact (NC)",
    "summary": "Kontak Bantu Timer Tunda OFF (NC)",
    "functionDesc": "Langsung berpindah saat koil aktif, dan mempertahankan posisinya selama waktu tunda setelah koil dimatikan.",
    "application": "Mempertahankan putaran pompa pelumasan setelah motor utama berhenti."
  },
  "contactCONDelayOff": {
    "tagPrefix": "-KT",
    "id": {
      "name": "Off-Delay Timed Contact (CON)",
      "summary": "Kontak Bantu Timer Tunda OFF (CON)",
      "functionDesc": "Langsung berpindah saat koil aktif, dan mempertahankan posisinya selama waktu tunda setelah koil dimatikan.",
      "application": "Mempertahankan putaran pompa pelumasan setelah motor utama berhenti."
    },
    "en": {
      "name": "Off-Delay Timed Contact (CON)",
      "summary": "Off-Delay Timed Auxiliary Contact (CON)",
      "functionDesc": "Actuates instantly on coil power, and maintains its actuated state for the preset duration after coil de-energization.",
      "application": "Auxiliary lubrication pump delayed shutoff circuit."
    },
    "name": "Off-Delay Timed Contact (CON)",
    "summary": "Kontak Bantu Timer Tunda OFF (CON)",
    "functionDesc": "Langsung berpindah saat koil aktif, dan mempertahankan posisinya selama waktu tunda setelah koil dimatikan.",
    "application": "Mempertahankan putaran pompa pelumasan setelah motor utama berhenti."
  },
  "contactNONCDelayOff": {
    "tagPrefix": "-KT",
    "id": {
      "name": "Off-Delay Timed Contact (NONC)",
      "summary": "Kontak Bantu Timer Tunda OFF (NONC)",
      "functionDesc": "Langsung berpindah saat koil aktif, dan mempertahankan posisinya selama waktu tunda setelah koil dimatikan.",
      "application": "Mempertahankan putaran pompa pelumasan setelah motor utama berhenti."
    },
    "en": {
      "name": "Off-Delay Timed Contact (NONC)",
      "summary": "Off-Delay Timed Auxiliary Contact (NONC)",
      "functionDesc": "Actuates instantly on coil power, and maintains its actuated state for the preset duration after coil de-energization.",
      "application": "Auxiliary lubrication pump delayed shutoff circuit."
    },
    "name": "Off-Delay Timed Contact (NONC)",
    "summary": "Kontak Bantu Timer Tunda OFF (NONC)",
    "functionDesc": "Langsung berpindah saat koil aktif, dan mempertahankan posisinya selama waktu tunda setelah koil dimatikan.",
    "application": "Mempertahankan putaran pompa pelumasan setelah motor utama berhenti."
  },
  "contactor1p": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Power Contactor NO Main Contacts 1P",
      "summary": "Kontak Utama Daya Kontaktor NO 1P",
      "functionDesc": "Kontak saklar daya arus tinggi berkemampuan memutus busur api (arc chutes). Menghubungkan daya ke motor saat koil aktif.",
      "application": "Penyambung daya utama sirkuit motor listrik 1P dan pemanas daya besar."
    },
    "en": {
      "name": "Power Contactor NO Main Contacts 1P",
      "summary": "Power Contactor NO Main Contacts 1P",
      "functionDesc": "Heavy-duty arc-quenched power contacts capable of switching high inductive motor loads upon coil energization.",
      "application": "Primary power switching for electric motors 1P and industrial heating banks."
    },
    "name": "Power Contactor NO Main Contacts 1P",
    "summary": "Kontak Utama Daya Kontaktor NO 1P",
    "functionDesc": "Kontak saklar daya arus tinggi berkemampuan memutus busur api (arc chutes). Menghubungkan daya ke motor saat koil aktif.",
    "application": "Penyambung daya utama sirkuit motor listrik 1P dan pemanas daya besar."
  },
  "contactor2p": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Power Contactor NO Main Contacts 2P",
      "summary": "Kontak Utama Daya Kontaktor NO 2P",
      "functionDesc": "Kontak saklar daya arus tinggi berkemampuan memutus busur api (arc chutes). Menghubungkan daya ke motor saat koil aktif.",
      "application": "Penyambung daya utama sirkuit motor listrik 2P dan pemanas daya besar."
    },
    "en": {
      "name": "Power Contactor NO Main Contacts 2P",
      "summary": "Power Contactor NO Main Contacts 2P",
      "functionDesc": "Heavy-duty arc-quenched power contacts capable of switching high inductive motor loads upon coil energization.",
      "application": "Primary power switching for electric motors 2P and industrial heating banks."
    },
    "name": "Power Contactor NO Main Contacts 2P",
    "summary": "Kontak Utama Daya Kontaktor NO 2P",
    "functionDesc": "Kontak saklar daya arus tinggi berkemampuan memutus busur api (arc chutes). Menghubungkan daya ke motor saat koil aktif.",
    "application": "Penyambung daya utama sirkuit motor listrik 2P dan pemanas daya besar."
  },
  "contactor3p": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Power Contactor NO Main Contacts 3P",
      "summary": "Kontak Utama Daya Kontaktor NO 3P",
      "functionDesc": "Kontak saklar daya arus tinggi berkemampuan memutus busur api (arc chutes). Menghubungkan daya ke motor saat koil aktif.",
      "application": "Penyambung daya utama sirkuit motor listrik 3P dan pemanas daya besar."
    },
    "en": {
      "name": "Power Contactor NO Main Contacts 3P",
      "summary": "Power Contactor NO Main Contacts 3P",
      "functionDesc": "Heavy-duty arc-quenched power contacts capable of switching high inductive motor loads upon coil energization.",
      "application": "Primary power switching for electric motors 3P and industrial heating banks."
    },
    "name": "Power Contactor NO Main Contacts 3P",
    "summary": "Kontak Utama Daya Kontaktor NO 3P",
    "functionDesc": "Kontak saklar daya arus tinggi berkemampuan memutus busur api (arc chutes). Menghubungkan daya ke motor saat koil aktif.",
    "application": "Penyambung daya utama sirkuit motor listrik 3P dan pemanas daya besar."
  },
  "contactor4p": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Power Contactor NO Main Contacts 4P",
      "summary": "Kontak Utama Daya Kontaktor NO 4P",
      "functionDesc": "Kontak saklar daya arus tinggi berkemampuan memutus busur api (arc chutes). Menghubungkan daya ke motor saat koil aktif.",
      "application": "Penyambung daya utama sirkuit motor listrik 4P dan pemanas daya besar."
    },
    "en": {
      "name": "Power Contactor NO Main Contacts 4P",
      "summary": "Power Contactor NO Main Contacts 4P",
      "functionDesc": "Heavy-duty arc-quenched power contacts capable of switching high inductive motor loads upon coil energization.",
      "application": "Primary power switching for electric motors 4P and industrial heating banks."
    },
    "name": "Power Contactor NO Main Contacts 4P",
    "summary": "Kontak Utama Daya Kontaktor NO 4P",
    "functionDesc": "Kontak saklar daya arus tinggi berkemampuan memutus busur api (arc chutes). Menghubungkan daya ke motor saat koil aktif.",
    "application": "Penyambung daya utama sirkuit motor listrik 4P dan pemanas daya besar."
  },
  "contactorNC1p": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Power Contactor NC Main Contacts 1P",
      "summary": "Kontak Utama Daya Kontaktor NC 1P",
      "functionDesc": "Kontak daya utama yang tertutup saat koil mati dan membuka saat koil aktif.",
      "application": "Sistem pengereman dinamis resistor (Dynamic Braking) dan pemindah sumber transfer otomatis."
    },
    "en": {
      "name": "Power Contactor NC Main Contacts 1P",
      "summary": "Power Contactor NC Main Contacts 1P",
      "functionDesc": "High-current power contacts that are closed at rest and open when the contactor coil is energized.",
      "application": "Dynamic resistor braking circuits and automatic emergency power changeover systems."
    },
    "name": "Power Contactor NC Main Contacts 1P",
    "summary": "Kontak Utama Daya Kontaktor NC 1P",
    "functionDesc": "Kontak daya utama yang tertutup saat koil mati dan membuka saat koil aktif.",
    "application": "Sistem pengereman dinamis resistor (Dynamic Braking) dan pemindah sumber transfer otomatis."
  },
  "contactorNC2p": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Power Contactor NC Main Contacts 2P",
      "summary": "Kontak Utama Daya Kontaktor NC 2P",
      "functionDesc": "Kontak daya utama yang tertutup saat koil mati dan membuka saat koil aktif.",
      "application": "Sistem pengereman dinamis resistor (Dynamic Braking) dan pemindah sumber transfer otomatis."
    },
    "en": {
      "name": "Power Contactor NC Main Contacts 2P",
      "summary": "Power Contactor NC Main Contacts 2P",
      "functionDesc": "High-current power contacts that are closed at rest and open when the contactor coil is energized.",
      "application": "Dynamic resistor braking circuits and automatic emergency power changeover systems."
    },
    "name": "Power Contactor NC Main Contacts 2P",
    "summary": "Kontak Utama Daya Kontaktor NC 2P",
    "functionDesc": "Kontak daya utama yang tertutup saat koil mati dan membuka saat koil aktif.",
    "application": "Sistem pengereman dinamis resistor (Dynamic Braking) dan pemindah sumber transfer otomatis."
  },
  "contactorNC3p": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Power Contactor NC Main Contacts 3P",
      "summary": "Kontak Utama Daya Kontaktor NC 3P",
      "functionDesc": "Kontak daya utama yang tertutup saat koil mati dan membuka saat koil aktif.",
      "application": "Sistem pengereman dinamis resistor (Dynamic Braking) dan pemindah sumber transfer otomatis."
    },
    "en": {
      "name": "Power Contactor NC Main Contacts 3P",
      "summary": "Power Contactor NC Main Contacts 3P",
      "functionDesc": "High-current power contacts that are closed at rest and open when the contactor coil is energized.",
      "application": "Dynamic resistor braking circuits and automatic emergency power changeover systems."
    },
    "name": "Power Contactor NC Main Contacts 3P",
    "summary": "Kontak Utama Daya Kontaktor NC 3P",
    "functionDesc": "Kontak daya utama yang tertutup saat koil mati dan membuka saat koil aktif.",
    "application": "Sistem pengereman dinamis resistor (Dynamic Braking) dan pemindah sumber transfer otomatis."
  },
  "contactorNC4p": {
    "tagPrefix": "-KM",
    "id": {
      "name": "Power Contactor NC Main Contacts 4P",
      "summary": "Kontak Utama Daya Kontaktor NC 4P",
      "functionDesc": "Kontak daya utama yang tertutup saat koil mati dan membuka saat koil aktif.",
      "application": "Sistem pengereman dinamis resistor (Dynamic Braking) dan pemindah sumber transfer otomatis."
    },
    "en": {
      "name": "Power Contactor NC Main Contacts 4P",
      "summary": "Power Contactor NC Main Contacts 4P",
      "functionDesc": "High-current power contacts that are closed at rest and open when the contactor coil is energized.",
      "application": "Dynamic resistor braking circuits and automatic emergency power changeover systems."
    },
    "name": "Power Contactor NC Main Contacts 4P",
    "summary": "Kontak Utama Daya Kontaktor NC 4P",
    "functionDesc": "Kontak daya utama yang tertutup saat koil mati dan membuka saat koil aktif.",
    "application": "Sistem pengereman dinamis resistor (Dynamic Braking) dan pemindah sumber transfer otomatis."
  },
  "motor1ph": {
    "tagPrefix": "-M",
    "id": {
      "name": "Single-Phase AC Induction Motor",
      "summary": "Motor Induksi 1-Fasa (220VAC)",
      "functionDesc": "Mengubah energi listrik bolak-balik 1-fasa menjadi energi mekanik putar melalui kumparan utama dan bantu berkapsitor.",
      "application": "Penggerak pompa air rumah tangga, blower kecil, dan kompresor udara portabel."
    },
    "en": {
      "name": "Single-Phase AC Induction Motor",
      "summary": "Single-Phase AC Induction Motor (220VAC)",
      "functionDesc": "Converts single-phase alternating current into rotating mechanical torque via main and capacitor-assisted windings.",
      "application": "Domestic water pumps, small air compressors, and workshop blowers."
    },
    "name": "Single-Phase AC Induction Motor",
    "summary": "Motor Induksi 1-Fasa (220VAC)",
    "functionDesc": "Mengubah energi listrik bolak-balik 1-fasa menjadi energi mekanik putar melalui kumparan utama dan bantu berkapsitor.",
    "application": "Penggerak pompa air rumah tangga, blower kecil, dan kompresor udara portabel."
  },
  "motor3ph": {
    "tagPrefix": "-M",
    "id": {
      "name": "Three-Phase Squirrel Cage Induction Motor",
      "summary": "Motor Induksi 3-Fasa Sangkar Tupai (U-V-W)",
      "functionDesc": "Motor industri paling handal dengan medan magnet putar 3-fasa. Menghasilkan torsi putar efisiensi tinggi tanpa sikat karbon.",
      "application": "Penggerak konveyor industri, pompa sentrifugal, kipas ventilasi besar, dan mesin bubut/milling."
    },
    "en": {
      "name": "Three-Phase Squirrel Cage Induction Motor",
      "summary": "Three-Phase Squirrel Cage Induction Motor",
      "functionDesc": "Workhorse industrial motor utilizing rotating 3-phase magnetic fields for high efficiency and brushless durability.",
      "application": "Conveyors, centrifugal pumps, heavy industrial ventilation fans, and CNC machines."
    },
    "name": "Three-Phase Squirrel Cage Induction Motor",
    "summary": "Motor Induksi 3-Fasa Sangkar Tupai (U-V-W)",
    "functionDesc": "Motor industri paling handal dengan medan magnet putar 3-fasa. Menghasilkan torsi putar efisiensi tinggi tanpa sikat karbon.",
    "application": "Penggerak konveyor industri, pompa sentrifugal, kipas ventilasi besar, dan mesin bubut/milling."
  },
  "motorDC": {
    "tagPrefix": "-M",
    "id": {
      "name": "Direct Current (DC) Motor",
      "summary": "Motor Listrik Arus Searah (DC)",
      "functionDesc": "Motor dengan kecepatan yang dapat diatur secara presisi sebanding dengan tegangan armature DC yang diberikan.",
      "application": "Penggerak kereta gantung, robotik, aktuator presisi, dan kendaraan bertenaga baterai."
    },
    "en": {
      "name": "Direct Current (DC) Motor",
      "summary": "Direct Current (DC) Electric Motor",
      "functionDesc": "Electric motor whose rotational speed is linearly controllable by adjusting the supplied DC armature voltage.",
      "application": "Precision actuators, robotics, battery-powered vehicles, and cable lifts."
    },
    "name": "Direct Current (DC) Motor",
    "summary": "Motor Listrik Arus Searah (DC)",
    "functionDesc": "Motor dengan kecepatan yang dapat diatur secara presisi sebanding dengan tegangan armature DC yang diberikan.",
    "application": "Penggerak kereta gantung, robotik, aktuator presisi, dan kendaraan bertenaga baterai."
  },
  "motorStarDelta": {
    "tagPrefix": "-M",
    "id": {
      "name": "3-Phase Star/Delta Dual-Connection Motor",
      "summary": "Motor 3-Fasa dengan 6 Terminal (U1-V1-W1 & W2-U2-V2)",
      "functionDesc": "Memiliki 6 ujung lilitan yang dapat dihubungkan Bintang (Star) saat start untuk menurunkan arus mula hingga 1/3, lalu Segitiga (Delta) saat normal.",
      "application": "Starter motor motor daya besar (>5.5 kW / 7.5 HP) untuk mencegah lonjakan arus drop tegangan PLN."
    },
    "en": {
      "name": "3-Phase Star/Delta Dual-Connection Motor",
      "summary": "3-Phase Motor with 6 Open Winding Terminals (Star/Delta)",
      "functionDesc": "Features 6 accessible winding leads allowing initial Star (Y) starting to reduce inrush current by 67%, switching to Delta (Δ) at speed.",
      "application": "High-power motor starters (>5.5 kW / 7.5 HP) to prevent severe power line voltage sags."
    },
    "name": "3-Phase Star/Delta Dual-Connection Motor",
    "summary": "Motor 3-Fasa dengan 6 Terminal (U1-V1-W1 & W2-U2-V2)",
    "functionDesc": "Memiliki 6 ujung lilitan yang dapat dihubungkan Bintang (Star) saat start untuk menurunkan arus mula hingga 1/3, lalu Segitiga (Delta) saat normal.",
    "application": "Starter motor motor daya besar (>5.5 kW / 7.5 HP) untuk mencegah lonjakan arus drop tegangan PLN."
  },
  "motorDhalander": {
    "tagPrefix": "-M",
    "id": {
      "name": "Dahlander Dual-Speed 3-Phase Motor",
      "summary": "Motor 3-Fasa Dua Kecepatan Dahlander",
      "functionDesc": "Menggunakan kumparan bertingkat (tapped winding) yang dapat dikonfigurasi kutubnya untuk menghasilkan rasio kecepatan 1:2 (misal 1500 / 3000 RPM).",
      "application": "Penggerak derek/crane (kecepatan angkat presisi vs cepat) dan blower ventilasi dua kecepatan."
    },
    "en": {
      "name": "Dahlander Dual-Speed 3-Phase Motor",
      "summary": "Dahlander Two-Speed 3-Phase Motor",
      "functionDesc": "Uses pole-changing tapped windings to achieve a 1:2 speed ratio (e.g. 1500 / 3000 RPM) through external contactor switching.",
      "application": "Cranes and hoists (inching crawl vs fast hoist) and dual-speed ventilation blowers."
    },
    "name": "Dahlander Dual-Speed 3-Phase Motor",
    "summary": "Motor 3-Fasa Dua Kecepatan Dahlander",
    "functionDesc": "Menggunakan kumparan bertingkat (tapped winding) yang dapat dikonfigurasi kutubnya untuk menghasilkan rasio kecepatan 1:2 (misal 1500 / 3000 RPM).",
    "application": "Penggerak derek/crane (kecepatan angkat presisi vs cepat) dan blower ventilasi dua kecepatan."
  },
  "motorTwoSpeeds": {
    "tagPrefix": "-M",
    "id": {
      "name": "Dual-Winding Two-Speed 3-Phase Motor",
      "summary": "Motor Dua Kecepatan Kumparan Terpisah",
      "functionDesc": "Memiliki dua set gulungan stator independen di dalam satu rumah motor untuk memilih dua kecepatan operasi yang berbeda.",
      "application": "Sistem pendingin HVAC gedung dan konveyor multi-tahap."
    },
    "en": {
      "name": "Dual-Winding Two-Speed 3-Phase Motor",
      "summary": "Two-Speed Motor with Separate Stator Windings",
      "functionDesc": "Houses two independent stator windings providing two distinctly rated operating speeds without complex tapped connections.",
      "application": "Building HVAC multi-stage chillers and dual-speed heavy material handling."
    },
    "name": "Dual-Winding Two-Speed 3-Phase Motor",
    "summary": "Motor Dua Kecepatan Kumparan Terpisah",
    "functionDesc": "Memiliki dua set gulungan stator independen di dalam satu rumah motor untuk memilih dua kecepatan operasi yang berbeda.",
    "application": "Sistem pendingin HVAC gedung dan konveyor multi-tahap."
  },
  "lamp": {
    "tagPrefix": "-H",
    "id": {
      "name": "Panel Pilot Indicator Light",
      "summary": "Lampu Indikator Panel (Pilot Lamp X1-X2)",
      "functionDesc": "Menyala terang saat diberi tegangan untuk memberikan indikasi visual status sistem (Merah=Stop, Hijau=Run, Kuning=Trip/Fault).",
      "application": "Indikator status operasional di pintu panel kontrol kelistrikan."
    },
    "en": {
      "name": "Panel Pilot Indicator Light",
      "summary": "Panel Pilot Indicator Light (X1-X2)",
      "functionDesc": "Illuminates continuously to indicate system status (Red=Stop/Alarm, Green=Run, Amber=Tripped/Fault, White=Power Ready).",
      "application": "Operator panel door visual feedback indicators."
    },
    "name": "Panel Pilot Indicator Light",
    "summary": "Lampu Indikator Panel (Pilot Lamp X1-X2)",
    "functionDesc": "Menyala terang saat diberi tegangan untuk memberikan indikasi visual status sistem (Merah=Stop, Hijau=Run, Kuning=Trip/Fault).",
    "application": "Indikator status operasional di pintu panel kontrol kelistrikan."
  },
  "lampBlink": {
    "tagPrefix": "-H",
    "id": {
      "name": "Flashing Pilot Warning Light",
      "summary": "Lampu Indikator Kedip Peringatan",
      "functionDesc": "Lampu sinyal dengan unit flasher internal yang berkedip untuk menarik perhatian operator saat terjadi kondisi siaga atau bahaya.",
      "application": "Indikasi pintu mesin terbuka, fase pemanasan, atau peringatan awal sebelum mesin bergerak otomatis."
    },
    "en": {
      "name": "Flashing Pilot Warning Light",
      "summary": "Flashing Warning Pilot Light",
      "functionDesc": "Features an internal solid-state flasher to draw operator attention during caution or transition states.",
      "application": "Safety gate open indication, heating warm-up cycle, and pre-start conveyor alarms."
    },
    "name": "Flashing Pilot Warning Light",
    "summary": "Lampu Indikator Kedip Peringatan",
    "functionDesc": "Lampu sinyal dengan unit flasher internal yang berkedip untuk menarik perhatian operator saat terjadi kondisi siaga atau bahaya.",
    "application": "Indikasi pintu mesin terbuka, fase pemanasan, atau peringatan awal sebelum mesin bergerak otomatis."
  },
  "buzzer": {
    "tagPrefix": "-HA",
    "id": {
      "name": "Electronic Warning Buzzer",
      "summary": "Buzzer Peringatan Audio Panel",
      "functionDesc": "Menghasilkan nada suara audio frekuensi tinggi untuk memberi sinyal suara kepada operator di ruang panel.",
      "application": "Peringatan tombol darurat ditekan, alarm selesai siklus mesin, atau konfirmasi input."
    },
    "en": {
      "name": "Electronic Warning Buzzer",
      "summary": "Electronic Audible Alert Buzzer",
      "functionDesc": "Emits a high-frequency acoustic tone to alert operators in the immediate panel area.",
      "application": "E-stop trip acoustic confirmation, cycle completion beep, and keypad entry feedback."
    },
    "name": "Electronic Warning Buzzer",
    "summary": "Buzzer Peringatan Audio Panel",
    "functionDesc": "Menghasilkan nada suara audio frekuensi tinggi untuk memberi sinyal suara kepada operator di ruang panel.",
    "application": "Peringatan tombol darurat ditekan, alarm selesai siklus mesin, atau konfirmasi input."
  },
  "siren": {
    "tagPrefix": "-HA",
    "id": {
      "name": "Industrial Emergency Siren",
      "summary": "Sirine Peringatan Bahaya (Decibel Tinggi)",
      "functionDesc": "Menghasilkan suara keras berintensitas tinggi yang dapat terdengar di seluruh area pabrik/bengkel.",
      "application": "Peringatan evakuasi pabrik, bahaya gas bocor, atau start awal derek overhead crane."
    },
    "en": {
      "name": "Industrial Emergency Siren",
      "summary": "High-Decibel Industrial Alarm Siren",
      "functionDesc": "Produces a powerful sound output audible across noisy plant floors and factory workshops.",
      "application": "Factory evacuation alarm, crane travel warning horn, and toxic gas leak alert."
    },
    "name": "Industrial Emergency Siren",
    "summary": "Sirine Peringatan Bahaya (Decibel Tinggi)",
    "functionDesc": "Menghasilkan suara keras berintensitas tinggi yang dapat terdengar di seluruh area pabrik/bengkel.",
    "application": "Peringatan evakuasi pabrik, bahaya gas bocor, atau start awal derek overhead crane."
  },
  "ring": {
    "tagPrefix": "-HA",
    "id": {
      "name": "Electric Signal Bell",
      "summary": "Lonceng / Bel Sinyal Listrik",
      "functionDesc": "Menghasilkan bunyi dering bel mekanis elektro-magnetik yang khas.",
      "application": "Penanda waktu pergantian shift kerja pabrik dan bel interkom panel kontrol."
    },
    "en": {
      "name": "Electric Signal Bell",
      "summary": "Electromechanical Signal Bell",
      "functionDesc": "Produces a resonant mechanical chime using an electromagnetic clapper.",
      "application": "Shift change notification chime and panel intercom alert bell."
    },
    "name": "Electric Signal Bell",
    "summary": "Lonceng / Bel Sinyal Listrik",
    "functionDesc": "Menghasilkan bunyi dering bel mekanis elektro-magnetik yang khas.",
    "application": "Penanda waktu pergantian shift kerja pabrik dan bel interkom panel kontrol."
  },
  "diode": {
    "tagPrefix": "-V",
    "id": {
      "name": "Semiconductor Rectifier Diode",
      "summary": "Dioda Penyearah Semikonduktor",
      "functionDesc": "Mengalirkan arus listrik hanya ke satu arah (anoda ke katoda) dan memblokir arah sebaliknya.",
      "application": "Dioda freewheeling pembuang lonjakan tegangan balik (back-EMF) koil DC dan penyearah sinyal."
    },
    "en": {
      "name": "Semiconductor Rectifier Diode",
      "summary": "Semiconductor Rectifier Diode",
      "functionDesc": "Allows current flow in one direction (anode to cathode) while blocking reverse flow.",
      "application": "Flyback / freewheeling clamp diode for DC coils and reverse polarity protection."
    },
    "name": "Semiconductor Rectifier Diode",
    "summary": "Dioda Penyearah Semikonduktor",
    "functionDesc": "Mengalirkan arus listrik hanya ke satu arah (anoda ke katoda) dan memblokir arah sebaliknya.",
    "application": "Dioda freewheeling pembuang lonjakan tegangan balik (back-EMF) koil DC dan penyearah sinyal."
  },
  "junction2p": {
    "tagPrefix": "-X",
    "id": {
      "name": "2-Way Terminal Block",
      "summary": "Blok Terminal Distribusi 2 Jalur",
      "functionDesc": "Terminal penghubung untuk menyambungkan dua kabel rangkaian secara aman dan terstandar.",
      "application": "Titik terminasi kabel kontrol antar-panel."
    },
    "en": {
      "name": "2-Way Terminal Block",
      "summary": "DIN Rail Distribution Terminal Block",
      "functionDesc": "Secure modular terminal block connecting and distributing wiring across panel sections.",
      "application": "Field wiring marshaling and power distribution jumpering."
    },
    "name": "2-Way Terminal Block",
    "summary": "Blok Terminal Distribusi 2 Jalur",
    "functionDesc": "Terminal penghubung untuk menyambungkan dua kabel rangkaian secara aman dan terstandar.",
    "application": "Titik terminasi kabel kontrol antar-panel."
  },
  "junction2p90": {
    "tagPrefix": "-X",
    "id": {
      "name": "2-Way 90° Angle Terminal Block",
      "summary": "Blok Terminal Distribusi Sudut 90°",
      "functionDesc": "Terminal penghubung siku 90 derajat untuk perutean kabel yang rapi di sudut saluran duct kabel.",
      "application": "Manajemen tata letak kabel sudut panel."
    },
    "en": {
      "name": "2-Way 90° Angle Terminal Block",
      "summary": "DIN Rail Distribution Terminal Block",
      "functionDesc": "Secure modular terminal block connecting and distributing wiring across panel sections.",
      "application": "Field wiring marshaling and power distribution jumpering."
    },
    "name": "2-Way 90° Angle Terminal Block",
    "summary": "Blok Terminal Distribusi Sudut 90°",
    "functionDesc": "Terminal penghubung siku 90 derajat untuk perutean kabel yang rapi di sudut saluran duct kabel.",
    "application": "Manajemen tata letak kabel sudut panel."
  },
  "junction3p": {
    "tagPrefix": "-X",
    "id": {
      "name": "3-Way Distribution Junction Block",
      "summary": "Blok Terminal Percabangan 3 Titik",
      "functionDesc": "Menghubungkan dan mendistribusikan satu konduktor input ke dua konduktor cabang tanpa memotong kabel.",
      "application": "Percabangan suplai daya dan jalur paralel sinyal kontrol."
    },
    "en": {
      "name": "3-Way Distribution Junction Block",
      "summary": "DIN Rail Distribution Terminal Block",
      "functionDesc": "Secure modular terminal block connecting and distributing wiring across panel sections.",
      "application": "Field wiring marshaling and power distribution jumpering."
    },
    "name": "3-Way Distribution Junction Block",
    "summary": "Blok Terminal Percabangan 3 Titik",
    "functionDesc": "Menghubungkan dan mendistribusikan satu konduktor input ke dua konduktor cabang tanpa memotong kabel.",
    "application": "Percabangan suplai daya dan jalur paralel sinyal kontrol."
  },
  "junction4p": {
    "tagPrefix": "-X",
    "id": {
      "name": "4-Way Cross Distribution Block",
      "summary": "Blok Terminal Percabangan 4 Titik",
      "functionDesc": "Titik persimpangan empat konduktor untuk mendistribusikan daya netral atau suplai kontrol secara bersamaan.",
      "application": "Busbar mini pembagi tegangan kontrol dalam panel."
    },
    "en": {
      "name": "4-Way Cross Distribution Block",
      "summary": "DIN Rail Distribution Terminal Block",
      "functionDesc": "Secure modular terminal block connecting and distributing wiring across panel sections.",
      "application": "Field wiring marshaling and power distribution jumpering."
    },
    "name": "4-Way Cross Distribution Block",
    "summary": "Blok Terminal Percabangan 4 Titik",
    "functionDesc": "Titik persimpangan empat konduktor untuk mendistribusikan daya netral atau suplai kontrol secara bersamaan.",
    "application": "Busbar mini pembagi tegangan kontrol dalam panel."
  },
  "junctionPE": {
    "tagPrefix": "-XPE",
    "id": {
      "name": "Grounding Terminal Block (PE)",
      "summary": "Blok Terminal Pembumian Kuning-Hijau (PE)",
      "functionDesc": "Terminal rel DIN khusus konduktor proteksi bumi (PE) yang terhubung langsung ke sasis logam panel.",
      "application": "Pusat terminasi kabel pembumian seluruh motor dan instrumen lapangan."
    },
    "en": {
      "name": "Grounding Terminal Block (PE)",
      "summary": "DIN Rail Distribution Terminal Block",
      "functionDesc": "Secure modular terminal block connecting and distributing wiring across panel sections.",
      "application": "Field wiring marshaling and power distribution jumpering."
    },
    "name": "Grounding Terminal Block (PE)",
    "summary": "Blok Terminal Pembumian Kuning-Hijau (PE)",
    "functionDesc": "Terminal rel DIN khusus konduktor proteksi bumi (PE) yang terhubung langsung ke sasis logam panel.",
    "application": "Pusat terminasi kabel pembumian seluruh motor dan instrumen lapangan."
  },
  "arrowSource": {
    "tagPrefix": "Ref",
    "id": {
      "name": "Sheet Cross-Reference Source Arrow",
      "summary": "Panah Sumber Referensi Silang Diagram",
      "functionDesc": "Menandakan kawat sinyal berasal dari halaman/lembar kerja diagram lain dalam satu proyek skematik.",
      "application": "Dokumentasi gambar skematik multi-lembar (Multi-sheet CAD drawings)."
    },
    "en": {
      "name": "Sheet Cross-Reference Source Arrow",
      "summary": "Schematic Sheet Cross-Reference Link",
      "functionDesc": "Represents a wire conductor connecting to or originating from another schematic drawing sheet.",
      "application": "Multi-sheet CAD schematic documentation."
    },
    "name": "Sheet Cross-Reference Source Arrow",
    "summary": "Panah Sumber Referensi Silang Diagram",
    "functionDesc": "Menandakan kawat sinyal berasal dari halaman/lembar kerja diagram lain dalam satu proyek skematik.",
    "application": "Dokumentasi gambar skematik multi-lembar (Multi-sheet CAD drawings)."
  },
  "arrowDestination": {
    "tagPrefix": "Ref",
    "id": {
      "name": "Sheet Cross-Reference Destination Arrow",
      "summary": "Panah Tujuan Referensi Silang Diagram",
      "functionDesc": "Menandakan kawat sinyal berlanjut menuju lembar kerja diagram berikutnya.",
      "application": "Penghubung sirkuit antar halaman diagram pengkabelan."
    },
    "en": {
      "name": "Sheet Cross-Reference Destination Arrow",
      "summary": "Schematic Sheet Cross-Reference Link",
      "functionDesc": "Represents a wire conductor connecting to or originating from another schematic drawing sheet.",
      "application": "Multi-sheet CAD schematic documentation."
    },
    "name": "Sheet Cross-Reference Destination Arrow",
    "summary": "Panah Tujuan Referensi Silang Diagram",
    "functionDesc": "Menandakan kawat sinyal berlanjut menuju lembar kerja diagram berikutnya.",
    "application": "Penghubung sirkuit antar halaman diagram pengkabelan."
  },
  "text": {
    "tagPrefix": "TXT",
    "id": {
      "name": "Schematic Annotation Text Block",
      "summary": "Blok Teks Anotasi Skematik Bebas",
      "functionDesc": "Menambahkan catatan teks bebas, spesifikasi komponen, atau instruksi kerja langsung di atas lembar kanvas CAD.",
      "application": "Keterangan instruksi instalasi, judul lembar kerja, dan nomor kabel."
    },
    "en": {
      "name": "Schematic Annotation Text Block",
      "summary": "Free Schematic Annotation Text Block",
      "functionDesc": "Places custom text notes, wire identifiers, or component specifications directly on the CAD drawing.",
      "application": "Diagram labeling, revision history notes, and panel wiring instructions."
    },
    "name": "Schematic Annotation Text Block",
    "summary": "Blok Teks Anotasi Skematik Bebas",
    "functionDesc": "Menambahkan catatan teks bebas, spesifikasi komponen, atau instruksi kerja langsung di atas lembar kanvas CAD.",
    "application": "Keterangan instruksi instalasi, judul lembar kerja, dan nomor kabel."
  },
  "junctionDot": {
    "tagPrefix": "J",
    "id": {
      "name": "Wire Junction Dot",
      "summary": "Titik Percabangan Kawat Otomatis",
      "functionDesc": "Titik koneksi sambungan galvanis antar-kawat listrik yang bersilangan pada diagram ladder/skematik.",
      "application": "Percabangan kawat otomatis."
    },
    "en": {
      "name": "Wire Junction Dot",
      "summary": "DIN Rail Distribution Terminal Block",
      "functionDesc": "Secure modular terminal block connecting and distributing wiring across panel sections.",
      "application": "Field wiring marshaling and power distribution jumpering."
    },
    "name": "Wire Junction Dot",
    "summary": "Titik Percabangan Kawat Otomatis",
    "functionDesc": "Titik koneksi sambungan galvanis antar-kawat listrik yang bersilangan pada diagram ladder/skematik.",
    "application": "Percabangan kawat otomatis."
  }
};
