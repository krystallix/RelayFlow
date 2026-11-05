# Web Relay Simulator: Full Architectural & Implementation Plan

> Dokumen spesifikasi dan panduan arsitektur untuk membangun ulang web-based electrical & relay circuit simulator berbasis studi kasus **Simurelay** (macOS/iOS).

---

## 1. Ringkasan Eksekutif & Sasaran Proyek

Tujuan dari proyek ini adalah membangun aplikasi web interaktif (*Single Page Application*) yang memungkinkan pengguna mendesain diagram skema kelistrikan industri, merangkai kabel ortogonal secara intuitif, dan menjalankan simulasi logika relay elektro-mekanik secara realtime.

### Fitur Kunci:
- **Zero-Coordinate Connector Graph**: Kabel otomatis mengunci (*locked*) ke pin terminal komponen dan meregang/mengikuti saat komponen digeser.
- **Orthogonal Wire Routing (Manhattan Routing)**: Kawat selalu berbentuk siku-siku 90° dengan kontrol offset `margins` (`start`, `center`, `end`).
- **Realtime Relay Simulation Engine**:
  - Propagasi beda potensial (AC 3-Phase & DC).
  - Mekanisme *Tag-Coupling* antara koil dan kontak pembantu (NO / NC).
  - Karakteristik varian koil: Standard, On-Delay, Off-Delay, Latching/Impulse, dan Flasher.
  - Karakteristik Thermal Overload Relay (TOR / -F1) dengan kontak proteksi 95-96 (NC) dan indikasi trip 97-98 (NO).
  - Deteksi hubungan singkat (*Short-circuit detection*).
- **Format Kompatibilitas**: Mendukung impor dan ekspor file `.smrl` (Simurelay JSON Schema).

---

## 2. Tech Stack & Library Pilihan

- **Framework Web**: Next.js 15 (React 19, App Router) + TypeScript.
- **Styling**: Tailwind CSS + Lucide Icons + Radix UI / shadcn/ui.
- **State Management**: Zustand (ringan, performa tinggi, decoupled dari render cycle).
- **Canvas Rendering**: SVG-based Interactive Canvas (dengan `react-zoom-pan-pinch` untuk navigasi zoom & pan tak terbatas).
- **XML / SVG Parsing**: `fast-xml-parser` untuk membaca metadata internal Inkscape SVG.
- **Unit Testing**: Vitest untuk pengujian murni simulation engine dan graph solver tanpa ketergantungan UI.

---

## 3. Ekstraksi Asset & Metadata Pipeline

Aplikasi memanfaatkan 120 SVG komponen standar IEC/NEMA dari Simurelay.

### 3.1. Struktur Metadata SVG (`<metadata>`)
Setiap file SVG menyimpan kontrak antarmuka di dalam tag `<metadata id="metadata1">`:

```xml
<metadata id="metadata1">
  <!-- 1. Metadata Info -->
  <info category="protections" type="switch" tagType="breakers" 
        width="180" height="120" name="Circuit Breaker 3P" description="Circuit Breaker 3P" />
  
  <!-- 2. Pin / Terminal List (Nodes) -->
  <nodes id="0">
    <!-- dx & dy relatif terhadap pusat komponen (center: width/2, height/2) -->
    <!-- direction: 0 = Top, 1 = Right, 2 = Bottom, 3 = Left -->
    <node id="0" tag="1" direction="0" type="contact" dx="-60.0" dy="-60.0" />
    <node id="1" tag="2" direction="2" type="contact" dx="-60.0" dy="60.0" />
    <node id="2" tag="3" direction="0" type="contact" dx="0.0" dy="-60.0" />
    <node id="3" tag="4" direction="2" type="contact" dx="0.0" dy="60.0" />
    <node id="4" tag="5" direction="0" type="contact" dx="60.0" dy="-60.0" />
    <node id="5" tag="6" direction="2" type="contact" dx="60.0" dy="60.0" />
  </nodes>

  <!-- 3. Hubungan Konduksi Kontak Internal -->
  <contacts>
    <contact id="0" nodeId1="0" nodeId2="1" type="no" enableFrames="0,1" />
    <contact id="1" nodeId1="2" nodeId2="3" type="no" enableFrames="0,1" />
    <contact id="2" nodeId1="4" nodeId2="5" type="no" enableFrames="0,1" />
  </contacts>

  <!-- 4. Visual States (Frames) -->
  <frames id="0">
    <frame id="0"> <!-- Posisi OFF / De-energized -->
      <pathFrame id="mainPath1" type="main" style="stroke" />
    </frame>
    <frame id="1"> <!-- Posisi ON / Energized -->
      <pathFrame id="mainPath2" type="main" style="stroke" />
    </frame>
  </frames>
</metadata>
```

### 3.2. Script Pipeline (`scripts/extract-assets.ts`)
1. Baca direktori `/Applications/Simurelay.app/.../flutter_assets/assets/icons/`.
2. Ekstrak blok `<metadata>` dan konversi ke schema TypeScript `ComponentDefinition`.
3. Bersihkan SVG dari metadata agar ringan dan simpan di `public/symbols/`.
4. Hasilkan katalog `src/constants/components-catalog.json`.

---

## 4. UI / UX & Canvas Interaction System

### 4.1. Grid & Snapping
- **Grid Size**: Kelipatan **30px** (sub-grid visual 15px).
- **Position Calculation**: Setiap komponen yang ditarik ke kanvas dibulatkan ke titik terdekat:
  $$\text{snappedX} = \text{round}(x / 30) \times 30$$
  $$\text{snappedY} = \text{round}(y / 30) \times 30$$

### 4.2. Rotasi Simbol (Discrete 90°)
Simbol dapat diputar ke 4 arah (`rotation`: `0`, `1`, `2`, `3`).
Posisi pin absolut dihitung melalui transformasi matriks 2D terhadap pusat komponen:
- Rotasi 0 (0°): $x' = x + dx, \quad y' = y + dy$
- Rotasi 1 (90°): $x' = x - dy, \quad y' = y + dx$
- Rotasi 2 (180°): $x' = x - dx, \quad y' = y - dy$
- Rotasi 3 (270°): $x' = x + dy, \quad y' = y - dx$

Arah kabel (`direction`) juga bertambah modular:
$$\text{direction}' = (\text{direction} + \text{rotation}) \pmod 4$$

### 4.3. Locking Connector System
- Objek kawat (`Connector`) **tidak menyimpan koordinat absolut**.
- Kawat hanya mereferensikan:
  - `idElementNode1` (ID elemen asal)
  - `idNode1` (Index pin asal)
  - `idElementNode2` (ID elemen tujuan)
  - `idNode2` (Index pin tujuan)
- **Hasil UX**: Ketika pengguna menggeser komponen A, semua ujung kabel yang terikat ke komponen A otomatis ikut bergerak secara realtime (*zero disconnection*).

### 4.4. Orthogonal Routing (Manhattan Routing) dengan Margins
Rute kawat terdiri dari segmen-segmen ortogonal (90°):
- **Segment 1 (Start Exit)**: Bergerak menjauh dari pin awal sepanjang `start + defaultStub` searah `direction1`.
- **Segment 2 (Center Offset)**: Menyesuaikan bus jalur kabel menggunakan nilai `margins.center` (misal: `-60`, `-30`, `0`, `30`, `60`). Ini mencegah kabel paralel saling menumpuk.
- **Segment 3 (End Entry)**: Membelok masuk tegak lurus ke pin target sepanjang `end + defaultStub` searah `direction2`.
- **Interaksi**: Pengguna dapat men-drag garis tengah kabel untuk mengubah nilai `margins.center` secara visual.

---

## 5. Simulation Engine Specification

Engine simulasi dibangun murni menggunakan TypeScript tanpa dependensi ke DOM atau React.

### 5.1. Model Data Komponen & Logika

#### A. Relay Coil (Koil Kontaktor & Timer)
- **Tag**: e.g., `-KM1`, `-K1`.
- **Terminal**: `A1` (Positif / Fasa) dan `A2` (Negatif / Netral).
- **Varian**:
  1. **Standard Coil**: Aktif instan saat `pot(A1) != pot(A2)`.
  2. **On-Delay Coil**: Begitu ada tegangan, timer bertambah. Jika `timer >= delaySetting`, kontak aktif. Jika tegangan hilang sebelum waktu habis, timer reset ke 0.
  3. **Off-Delay Coil**: Begitu ada tegangan, kontak langsung aktif. Saat tegangan hilang, kontak menahan posisi selama `delaySetting` sebelum kembali ke posisi awal.
  4. **Latching / Impulse Coil**: Setiap mendeteksi pulsa transisi (0V ke 24V), status kontak di-toggle secara permanen.
  5. **Flasher Coil**: Selama ada tegangan, status berganti ON/OFF secara periodik.

#### B. Kontak Pembantu (Auxiliary Contacts)
- **Tag Coupling**: Mengaitkan dirinya ke koil dengan tag yang sama.
- **Normally Open (NO - Terminal 13-14)**: Terbuka saat normal, Menutup saat koil terkait aktif.
- **Normally Closed (NC - Terminal 11-12)**: Tertutup saat normal, Membuka saat koil terkait aktif.

#### C. Thermal Overload Relay (TOR / -F1)
- **Jalur Daya (1-2, 3-4, 5-6)**: Konduktor bimetal tertutup.
- **Kontak NC 95-96**: Membuka saat terjadi kondisi trip, memutus loop daya seluruh koil.
- **Kontak NO 97-98**: Menutup saat trip, mengalirkan daya ke lampu indikator gangguan (`-H1`).
- **Mekanisme Reset**: Mengharuskan tombol reset manual ditekan untuk mengembalikan kondisi bimetal.

#### D. Short Circuit & Safety Checks
- Engine melacak polaritas/fasa setiap net list.
- Jika net berpotensial tinggi (`+24V`, `L1`, `L2`, `L3`) terhubung langsung ke net referensi rendah (`GND`, `N`, `-24V`) tanpa melalui beban resistif (koil, lampu, motor):
  - Engine segera menghentikan simulasi.
  - Memicu event: `Short circuit detected! Simulation stopped.`
  - Menandai kabel penyebab dengan highlight merah tebal.

### 5.2. Siklus Eksekusi Simulasi (Simulation Loop)

```
[ Tick Simulasi / Event Input ]
            │
            ▼
┌──────────────────────────────────────────────┐
│ 1. Reset Potensial Node Non-Source           │
└──────────────────────┬───────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────┐
│ 2. Propagasi Potensial (BFS Graph Walk)      │
│    - Menyalurkan tegangan dari Power Source  │
│    - Melewati kabel & saklar/kontak CLOSED   │
│    - Cek Short-Circuit                       │
└──────────────────────┬───────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────┐
│ 3. Evaluasi Status Beban & Koil              │
│    - Beda potensial A1 - A2?                 │
│    - Update timer on-delay / off-delay       │
│    - Aktifkan status motor / lampu           │
└──────────────────────┬───────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────┐
│ 4. Resolusi Tag Coupling (Update Kontak)     │
│    - Jika koil X berubah, sinkronkan kontak  │
│      NO/NC dengan tag yang sama              │
└──────────────────────┬───────────────────────┘
            │
    Apakah status berubah?
      ├─ Ya  ──> Ulangi langkah 1-4 (maks 20 iterasi stabilisasi)
      └─ Tidak ─> Render visual frame ke canvas
```

---

## 6. Struktur Direktori Proyek

```
RelayTest/
├── plan.md
├── scripts/
│   ├── extract-assets.ts        # Script konversi SVG & parser metadata
│   └── test-simulation.ts       # Script CLI runner verifikasi dol-starter
├── public/
│   ├── symbols/                 # File SVG bersih untuk render kanvas
│   └── examples/                # Preset .smrl (dol-starter, star-delta)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx             # Halaman editor utama
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── CanvasGrid.tsx   # Grid 30px visual
│   │   │   ├── ComponentView.tsx# Renderer elemen SVG + rotasi + frame
│   │   │   ├── WireRenderer.tsx # Orthogonal path SVG renderer
│   │   │   └── TerminalPin.tsx  # Titik magnetis sambungan kabel
│   │   ├── sidebar/
│   │   │   ├── ComponentLibrary.tsx
│   │   │   └── PropertyPanel.tsx
│   │   └── toolbar/
│   │       ├── PlaybackControls.tsx # Play, Pause, Step, Reset
│   │       └── FileActions.tsx      # Import / Export .smrl
│   ├── engine/
│   │   ├── SimulationEngine.ts  # Core graph solver & propagasi potensial
│   │   ├── components/          # Model RelayCoil, Timer, TOR, Switch
│   │   ├── types.ts             # Interface Circuit, Element, Wire, Net
│   │   └── router/
│   │       └── ManhattanRouter.ts # Kalkulasi jalur kabel ortogonal
│   └── store/
│       ├── useCircuitStore.ts   # State diagram sirkuit (CRUD elemen & kabel)
│       └── useSimulationStore.ts# State realtime simulasi (running, ticks)
└── tests/
    ├── engine.test.ts           # Test relay self-holding, interlock, timer
    └── router.test.ts           # Test kalkulasi rute kabel
```

---

## 7. Roadmap Implementasi Bertahap

### Fase 1: Setup Asset & Engine Core (Prioritas Utama)
- [ ] Buat project Next.js TypeScript di `/Documents/RelayTest/`.
- [ ] Buat script ekstraksi SVG dan generate `components-catalog.json`.
- [ ] Bangun `SimulationEngine.ts` lengkap dengan penanganan NO/NC, Coil, Timer, dan TOR.
- [ ] Jalankan automated test menggunakan sirkuit DOL Starter untuk memvalidasi engine sebelum membuat UI.

### Fase 2: Interactive Schematic Canvas
- [ ] Buat kanvas dengan pan & zoom tak terbatas.
- [ ] Implementasikan grid snapping 30px dan rotasi elemen (0-3).
- [ ] Implementasikan `ManhattanRouter` untuk menghasilkan jalur kabel ortogonal dengan parameter `margins`.
- [ ] Implementasikan magnetic pin detection saat menarik kabel.

### Fase 3: Mode Simulasi & Interaktivitas
- [ ] Toggle switch antara Edit Mode dan Simulation Mode.
- [ ] Dukungan klik tombol pushbutton (momentary action) dan toggle saklar/breaker.
- [ ] Visual update: kabel bertegangan menyala terang, koil berwarna merah, kontak tertutup bergerak sesuai frame SVG.
- [ ] Pop-up alert proteksi jika terjadi hubung singkat.

### Fase 4: File Management & Preset
- [ ] Fitur Import/Export file `.smrl`.
- [ ] Pustaka contoh rangkaian (DOL Starter, Forward-Reverse Interlock, Star-Delta, Automatic Timer Sequencer).
