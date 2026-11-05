# Arsitektur Tech Stack & Canvas UI/UX System: Web Relay Simulator

Dokumen arsitektur teknis komprehensif untuk subsistem Canvas UI/UX, Engine Render, Interaksi Geometris, Sistem Kabel Ortogonal (Manhattan Router), serta Strategi State Management pada **Web Relay Simulator**.

---

## 1. Executive Summary & Prinsip Desain Canvas

Simulator rangkaian relay dan otomasi industri berbasis web memiliki karakteristik grafis dan interaksi yang berbeda secara fundamental dari *general-purpose flowcharts* (seperti Draw.io atau Miro) maupun *node-graph editors* (seperti Blender Shader Nodes atau Unreal Blueprints):

1. **Rigid Orthogonal Schematic Standard**: Kabel kelistrikan industri (IEC 60617 / NEMA ICS 19) tidak menggunakan kurva Bézier melengkung; kabel wajib mengikuti rute Manhattan (ortogonal 90°) dengan jalur bus paralel teratur tanpa tumpang tindih (*anti-overlapping bus margins*).
2. **Zero-Coordinate Connector Graph**: Kabel tidak didefinisikan oleh koordinat piksel `(x1, y1) -> (x2, y2)`, melainkan hubungan topologis murni antar terminal `(ElementA.pinX -> ElementB.pinY)`. Ketika komponen digeser atau diputar, seluruh kawat terhubung wajib meregang/menyesuaikan secara deterministik tanpa terlepas (*zero disconnection*).
3. **High-Fidelity SVG Symbols with Multi-Frame States**: Koleksi 120 simbol kelistrikan Simurelay dibuat dengan Inkscape dan memuat metadata pin (`nodes`), kontak logika (`contacts`), dan variasi visual jalur (`frames`/`pathFrame`). Rendering engine harus mampu memanipulasi sub-path internal SVG secara realtime saat status simulasi berganti (misal: armatur kontaktor membuka/menutup atau indikator menyala).
4. **Deterministic 30px Grid & Pin Magnetism**: Seluruh komponen, jarak terminal, dan lekukan kabel mengunci secara mutlak pada kisi kelipatan 30px dengan deteksi magnetis pin berbasis radius.

---

## 2. Evaluasi & Pemilihan Canvas Rendering Engine

Tiga pendekatan arsitektur dievaluasi untuk memenuhi kebutuhan 120 simbol SVG multi-frame, kabel ortogonal dinamis, dan manipulasi diagram kelistrikan:

| Kriteria Evaluasi | Opsi A: Pure SVG Canvas (React + `<svg>`) | Opsi B: HTML5 Canvas 2D / WebGL (Konva.js / Pixi.js) | Opsi C: React Flow (@xyflow/react) |
| :--- | :--- | :--- | :--- |
| **Fidelitas Vektor & 120 Simbol SVG** | **Sempurna (Native)**: Me-render langsung elemen `<path>`, `<circle>`, `<g>` tanpa rasterisasi. Resolusi tajam di semua tingkat zoom. | **Rendah - Sedang**: SVG harus di-render ke offscreen HTMLImageElement / canvas bitmap atau di-tessellate ke WebGL. Tepi kabur saat zoom-in ekstrem atau konsumsi memori tinggi. | **Baik**: Mendukung custom node berbasis React, namun wrapper div/SVG campuran membebani DOM. |
| **Multi-Frame State Switching (`pathFrame`)** | **Sangat Mudah & Deklaratif**: Cukup me-toggle atribut `display: none` / `stroke` pada sub-elemen SVG ID tertentu atau via CSS class. | **Kompleks**: Harus menyimpan sprite terpisah per frame atau melakukan re-parsing SVG string dan re-render ke context 2D setiap kali state berubah. | **Sedang**: Membutuhkan custom node wrapper kompleks untuk setiap varian simbol. |
| **Orthogonal Routing & Bus Margins** | **Presisi Tinggi**: Jalur kabel didefinisikan via string atribut `d="M ... L ..."` pada elemen `<path>` SVG dengan styling native (stroke-dash, glow, marker sambungan dot). | **Tinggi namun Manual**: Perlu menggambar manual via path drawing commands (`ctx.beginPath()`, `ctx.lineTo()`). | **Kaku**: Layout engine default React Flow dioptimalkan untuk edge graph generik; Manhattan router dengan `margins.center` dan multi-pin complex collision sangat sulit di-override. |
| **Interaksi Drag, Snapping & Event Handling** | **Alami (DOM Events)**: Event pointer (`pointerdown`, `pointerenter`, `pointerleave`) langsung melekat pada node terminal `<circle>`. | **Perlu Hit-Testing**: Konva memiliki event hit-detection sendiri via color-key buffer; Pixi memerlukan setup hit area manual. | **Built-in**: Fitur drag bawaan kuat, namun snapping kaku dan sulit disesuaikan ke rotasi 90° modular custom. |
| **Performa pada 100–300 Komponen Simbolis** | **Sangat Baik** jika menerapkan optimasi: Virtual rendering untuk viewport besar, `transform: translate3d` pada group elemen, dan transient drag bypass. | **Sangat Cepat pada Objek Masif (>2000)**: Namun skema kelistrikan tipikal industri terdiri dari 20–150 komponen aktif. Kecepatan 10.000 partikel Pixi berlebih (*overkill*). | **Cepat untuk graph standar**, tetapi drop performa jika banyak custom SVG dinamis di dalam node. |
| **Export Vektor (PDF / SVG)** | **Nol Konversi**: Langsung men-serialize DOM SVG ke file SVG atau vector PDF tanpa kehilangan kualitas. | **Harus Re-export**: Harus mengekspor ke PNG bitmap atau menulis generator export SVG terpisah. | **Perlu Plugin Tambahan**: Ekspor SVG tidak native. |

### Keputusan Final: Pure SVG Canvas (React 19 + Native SVG Viewport)

**Alasan Utama:**
1. File sumber Simurelay berupa SVG murni dengan ID internal `<path id="mainPath1">` dan `<path id="mainPath2">`. Menggunakan Pure SVG memungkinkan kita menyuntikkan atau merender path tersebut secara langsung ke dalam DOM tree tanpa konversi raster.
2. Styling kabel interaktif (efek arus mengalir dengan animasi `stroke-dashoffset`, highlight tegangan dengan filter drop-shadow/glow, dan terminal dot) diimplementasikan secara native melalui CSS dan atribut SVG.
3. Arsitektur Pure SVG bebas dependensi canvas pihak ketiga yang berat dan kompatibel penuh dengan SSR/Next.js 15.

---

## 3. Spesifikasi Tech Stack & Library Pendukung

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 15 (React 19, TS)                       │
├────────────────────────────────────────────────────────────────────────┤
│ UI & Design System      : Tailwind CSS v4 + Radix UI / shadcn/ui       │
│ Icons & Visuals         : Lucide React                                 │
│ State Management        : Zustand v5 (Vanilla store + React hooks)     │
│ Canvas Pan/Zoom Engine  : Custom Matrix Transformer via PointerEvents  │
│ Asset Pipeline          : Fast-XML-Parser (Node build script)          │
│ Electrical Solver       : Pure TypeScript BFS Graph Potential Engine   │
│ Unit & Geometry Testing : Vitest                                       │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1. Mengapa Custom Pan/Zoom Transformer?
Daripada mengandalkan library eksternal berukuran besar yang membungkus komponen dalam banyak lapisan `<div>`, Canvas menggunakan **Custom Pan/Zoom Controller** berbasis native SVG `matrix(a, b, c, d, e, f)`:
- Manipulasi langsung atribut `transform="matrix(...)"` pada root group `<g id="viewport-root">`.
- Perhitungan transformasi koordinat Screen $\leftrightarrow$ World murni matematis (bebas desinkronisasi).
- Dukungan *pinch-to-zoom* pada trackpad macOS/touchscreen serta `Ctrl + Wheel`.
- Performa 120 FPS tanpa overhead React render cycle.

---

## 4. Interaction Architecture & Geometri Kanvas

### 4.1. Transformasi Koordinat (Screen Space ke Canvas Space)
Setiap event mouse/pointer menghasilkan koordinat relatif terhadap layar viewport. Untuk interaksi presisi, koordinat dikonversi ke sistem koordinat kanvas global:

$$\begin{bmatrix} x_{\text{world}} \\ y_{\text{world}} \end{bmatrix} = \begin{bmatrix} 1/s & 0 \\ 0 & 1/s \end{bmatrix} \begin{bmatrix} x_{\text{screen}} - t_x \\ y_{\text{screen}} - t_y \end{bmatrix}$$

- $s$: Skala zoom canvas (`scale`, rentang: `0.2` hingga `4.0`).
- $(t_x, t_y)$: Translasi pan kanvas (`panX`, `panY`).

```typescript
export interface CanvasTransform {
  x: number;      // pan offset X
  y: number;      // pan offset Y
  scale: number;  // zoom level (1.0 = 100%)
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  canvasRect: DOMRect,
  transform: CanvasTransform
): { x: number; y: number } {
  return {
    x: (screenX - canvasRect.left - transform.x) / transform.scale,
    y: (screenY - canvasRect.top - transform.y) / transform.scale,
  };
}
```

### 4.2. Strict 30px Grid Snapping
Diagram kelistrikan Simurelay menggunakan grid dasar **30 piksel**. 
- Komponen ditempatkan pada titik grid 30px:
  $$x_{\text{snapped}} = \text{round}\left(\frac{x}{30}\right) \times 30$$
  $$y_{\text{snapped}} = \text{round}\left(\frac{y}{30}\right) \times 30$$
- Visualisasi grid menggunakan pola `<pattern>` SVG dengan sub-grid garis 15px (warna redup: `#262626`) dan titik/garis mayor 30px (warna kontras: `#404040`).

### 4.3. Discrete 90° Rotations & Transformasi Pin Terminal
Setiap simbol dapat diputar dalam 4 orientasi diskret:
- `0`: 0° (Normal)
- `1`: 90° searah jarum jam (CW)
- `2`: 180°
- `3`: 270° (90° CCW)

Pusat rotasi selalu berada tepat di titik tengah elemen: $(x_c, y_c) = (x + w/2, y + h/2)$.

#### Transformasi Koordinat Terminal Pin:
Metadata Simurelay menyimpan offset terminal `(dx, dy)` relatif terhadap pusat komponen:
- Pada rotasi $R = 0$: $x_{\text{pin}} = x_c + dx, \quad y_{\text{pin}} = y_c + dy$
- Pada rotasi $R = 1$: $x_{\text{pin}} = x_c - dy, \quad y_{\text{pin}} = y_c + dx$
- Pada rotasi $R = 2$: $x_{\text{pin}} = x_c - dx, \quad y_{\text{pin}} = y_c - dy$
- Pada rotasi $R = 3$: $x_{\text{pin}} = x_c + dy, \quad y_{\text{pin}} = y_c - dx$

#### Transformasi Vektor Arah Terminal (`direction`):
Simurelay mendefinisikan 4 arah normal keluarnya kabel dari pin:
- `0`: Top ($\uparrow$, $-Y$)
- `1`: Right ($\rightarrow$, $+X$)
- `2`: Bottom ($\downarrow$, $+Y$)
- `3`: Left ($\leftarrow$, $-X$)

Arah efektif setelah rotasi adalah modulo penjumlahan:
$$\text{effectiveDirection} = (\text{initialDirection} + \text{rotation}) \pmod 4$$

```typescript
export type Direction = 0 | 1 | 2 | 3; // 0: Top, 1: Right, 2: Bottom, 3: Left
export type Rotation = 0 | 1 | 2 | 3;  // 0: 0°, 1: 90°, 2: 180°, 3: 270°

export function getRotatedPinPosition(
  elementCenterX: number,
  elementCenterY: number,
  dx: number,
  dy: number,
  rotation: Rotation
): { x: number; y: number } {
  switch (rotation) {
    case 0: return { x: elementCenterX + dx, y: elementCenterY + dy };
    case 1: return { x: elementCenterX - dy, y: elementCenterY + dx };
    case 2: return { x: elementCenterX - dx, y: elementCenterY - dy };
    case 3: return { x: elementCenterX + dy, y: elementCenterY - dx };
  }
}

export function getEffectiveDirection(initialDir: Direction, rotation: Rotation): Direction {
  return ((initialDir + rotation) % 4) as Direction;
}
```

### 4.4. Magnetic Pin Snapping & Interactive Wire Creation
Saat pengguna berada dalam mode **Wire Drawing** (atau saat menyeret ujung kawat):
1. **Deteksi Bubble Magnetik**: Sistem menghitung jarak Euclidean dari pointer mouse $(x_w, y_w)$ ke seluruh terminal aktif di kanvas:
   $$d = \sqrt{(x_w - x_{\text{pin}})^2 + (y_w - y_{\text{pin}})^2}$$
2. **Snap Threshold**:
   - Jika $d \le 18\text{px}$ (radius magnetis), kursor secara otomatis mengunci (*locks*) ke $(x_{\text{pin}}, y_{\text{pin}})$.
   - Terminal target menampilkan lingkaran highlight hijau bercahaya (`r=7`, `stroke="#22c55e"`, `filter="drop-shadow(0 0 6px #22c55e)"`).
   - Indikator teks menampilkan nama terminal (misal: `"A1"`, `"13 NO"`, `"95 NC"`).
3. **Pencegahan Hubungan Ilegal**:
   - Sistem menolak koneksi ke pin pada elemen yang sama (`elementId1 === elementId2 && pinId1 === pinId2`).
   - Sistem mencegah duplikasi kawat yang sudah terhubung pada dua pin yang sama.

---

## 5. Wire System Architecture (Zero-Coordinate & Manhattan Router)

### 5.1. Struktur Data Zero-Coordinate Connector
Kabel dalam skema kelistrikan tidak pernah menyimpan koordinat absolut di dalam dokumen tersimpan (`.smrl`). Kawat adalah representasi edge relasional:

```typescript
export interface WireMargins {
  start: number;   // Offset stub tambahan dari pin awal (px, default: 0)
  center: number;  // Offset geser sumbu tengah (px, kelipatan 30: ... -60, -30, 0, 30, 60 ...)
  end: number;     // Offset stub tambahan ke pin tujuan (px, default: 0)
}

export interface WireConnection {
  id: string;
  sourceElementId: string;
  sourcePinId: string;
  targetElementId: string;
  targetPinId: string;
  margins: WireMargins;
  color?: string; // e.g., 'red' for Phase, 'blue' for Neutral, 'green' for PE
}
```

Ketika komponen digeser, koordinat pin dihitung ulang secara dinamis, dan router langsung meregenerasi path ortogonal.

### 5.2. Manhattan Router dengan Margins
Router bertugas menghubungkan dua titik $(P_1, D_1)$ dan $(P_2, D_2)$ dengan segmen garis siku-siku (ortogonal) serta mengakomodasi parameter `margins`.

```
        P1 (dx, dy) [Dir: Bottom = 2]
         │
         │  (stub1 = defaultStub + margins.start)
         ▼
         A ───────────────┐ (centerOffset = margins.center)
                          │
                          │
                          └───────────────► B
                                           │  (stub2 = defaultStub + margins.end)
                                           ▼
                                          P2 [Dir: Top = 0]
```

#### Aturan Perutean Manhattan (Segment Generation Pipeline):
1. **Stub Exit & Entry**:
   - Dari $P_1$, kawat harus keluar searah $D_1$ sejauh:
     $$L_1 = 30 + \text{margins.start}$$
     Menghasilkan titik keluar $E_1 = P_1 + L_1 \cdot \vec{u}(D_1)$.
   - Menuju $P_2$, kawat harus masuk berlawanan arah dengan $D_2$ sejauh:
     $$L_2 = 30 + \text{margins.end}$$
     Menghasilkan titik masuk $E_2 = P_2 + L_2 \cdot \vec{u}(D_2)$.
2. **Evaluasi Relasi Orientasi ($E_1$ ke $E_2$)**:
   - **Kasus Vertikal Murni / Horizontal Murni (Collinear)**:
     Jika $E_1$ dan $E_2$ sejajar pada satu sumbu dan memiliki arah yang saling berhadapan, jalur menghubungkan langsung dengan 1 segmen garis lurus, dimodulasi oleh `margins.center` jika diatur pengguna.
   - **Kasus Ortagnal (Siku L-Shape)**:
     Dihubungkan dengan 1 titik belok (3 segmen total).
   - **Kasus Berhadapan / Membelakangi (U-Shape / Z-Shape)**:
     Titik tengah $(M_x, M_y)$ ditentukan di antara $E_1$ dan $E_2$, kemudian digeser sebesar `margins.center`:
     - Jika arah dominan vertikal:
       $$Y_{\text{center}} = \frac{E_{1.y} + E_{2.y}}{2} + \text{margins.center}$$
       Jalur membentuk titik belok: $E_1 \rightarrow (E_{1.x}, Y_{\text{center}}) \rightarrow (E_{2.x}, Y_{\text{center}}) \rightarrow E_2$.
     - Jika arah dominan horizontal:
       $$X_{\text{center}} = \frac{E_{1.x} + E_{2.x}}{2} + \text{margins.center}$$
       Jalur membentuk titik belok: $E_1 \rightarrow (X_{\text{center}}, E_{1.y}) \rightarrow (X_{\text{center}}, E_{2.y}) \rightarrow E_2$.
3. **Pencegahan Overlapping Jalur Paralel (Bus Cable Alignment)**:
   - Beberapa kabel yang berjalan paralel di jalur yang sama (misal 3 kabel fasa L1, L2, L3) akan saling menimpa jika `centerOffset` bernilai sama.
   - Dengan memberikan nilai `margins.center` berjarak 30px (misal: `-30, 0, +30`), kabel otomatis berjejer rapi sejajar (*parallel bus trunking*).

#### Interaktivitas Visual Margins Drag Handle:
Pada setiap segmen tengah kabel ortogonal, kanvas menampilkan **titik pegangan transparan** (Drag Handle):
- Hover handle memunculkan kursor resize (`col-resize` untuk garis vertikal, `row-resize` untuk garis horizontal).
- Menyeret handle akan menggeser nilai `margins.center` dalam kelipatan 30px secara langsung.

```typescript
// Output rute siap render ke atribut d SVG
export function generateSvgPathData(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.reduce((path, pt, index) => {
    return index === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
  }, '');
}
```

---

## 6. State Management & Component Hierarchy (Render Optimization)

### 6.1. Masalah Utama: "Render Storm" pada Diagram Skema
Dalam diagram skematik, dua skenario dapat merusak performa frame rate (60–120 FPS):
1. **Drag Event Storm**: Ketika pengguna menyeret komponen yang terhubung ke 8 kabel, memperbarui state React utama pada setiap event `pointermove` menyebabkan re-render seluruh kanvas (ratusan komponen dan kabel).
2. **Simulation Tick Storm**: Siklus simulasi listrik berjalan pada interval 50ms–100ms (atau per event perubahan kontak). Merender ulang geometri komponen saat hanya status warna/frame yang berubah adalah pemborosan besar.

### 6.2. Arsitektur Store Terpisah (Zustand Partitioning)
Kami memisahkan state menjadi 3 store independen:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Zustand Store Partitioning                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Circuit Document Store (Persisted / Undo-Redo)                       │
│    - elements: Record<string, ElementInstance>                         │
│    - wires: Record<string, WireConnection>                             │
│    - selection: string[] (ID elemen/kabel terpilih)                    │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Transient Interaction Store (High Frequency / Unsubscribed UI)      │
│    - draggingElementId: string | null                                  │
│    - dragOffset: { x: number, y: number }                              │
│    - draftWire: { source: PinRef, currentPos: Point } | null           │
│    - hoveredPin: PinRef | null                                         │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Simulation Runtime Store (Decoupled Solver State)                   │
│    - isRunning: boolean                                                │
│    - netPotentials: Map<string, PotentialValue>                        │
│    - componentStates: Map<string, { frame: number, energized: boolean}>│
│    - activeShortCircuit: ShortCircuitFault | null                      │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.3. Layering Hierarchy pada SVG Canvas
Hierarki SVG DOM disusun ke dalam lapisan `<g>` dengan urutan z-index yang terdefinisi rapi:

```xml
<svg id="schematic-canvas" className="w-full h-full select-none overflow-hidden">
  <!-- 1. Background Pattern Definitions -->
  <defs>
    <pattern id="grid-pattern-30" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="1" fill="#333333" />
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#222222" strokeWidth="0.5" />
    </pattern>
    <filter id="glow-energized">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- 2. Root Transformation Matrix (Pan & Zoom) -->
  <g id="viewport-matrix" transform="matrix(s 0 0 s tx ty)">
    
    <!-- Lapisan 0: Background Grid -->
    <rect x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid-pattern-30)" />

    <!-- Lapisan 1: Permanent Wires (Kabel Utama) -->
    <g id="layer-wires">
      {/* Dimemoize per kawat, update warna jika net berubah */}
      <WireLayer />
    </g>

    <!-- Lapisan 2: Components (Simbol Komponen IEC) -->
    <g id="layer-components">
      {/* Setiap komponen di-wrap React.memo(ComponentView) */}
      <ComponentLayer />
    </g>

    <!-- Lapisan 3: Terminal Pins (Interaksi Sambungan Magnetik) -->
    <g id="layer-terminals">
      {/* Pin hanya aktif / terlihat saat mode edit atau kabel mendekat */}
      <TerminalPinLayer />
    </g>

    <!-- Lapisan 4: Interaction Overlays (Transient Graphics) -->
    <g id="layer-interaction-overlay">
      {/* Kabel draf sementara saat ditarik dari pin */}
      <DraftWireRenderer />
      {/* Kotak seleksi multi-pilih (Rubberband Selection) */}
      <SelectionMarquee />
      {/* Indikator snap & hover bubble */}
      <MagneticSnapIndicator />
    </g>

  </g>
</svg>
```

### 6.4. Teknik Optimasi "Zero-Re-Render Dragging"
Ketika komponen di-drag pada kanvas:
1. `useTransientStore` mencatat perubahan posisi secara imperatif.
2. Komponen yang di-drag langsung diperbarui posisinya via atribut SVG `transform="translate(x, y)"` menggunakan direct DOM reference (`ref.current.setAttribute`), melewati siklus rekonsiliasi React.
3. Hanya kabel-kabel yang terikat langsung ke komponen tersebut (`connectedWires`) yang mendengarkan event drag via subscription selektif:
   ```typescript
   // Di dalam WireRenderer.tsx
   useEffect(() => {
     return useCircuitStore.subscribe(
       (state) => [state.elements[sourceId], state.elements[targetId]],
       ([source, target]) => {
         // Hanya kalkulasi ulang path jika elemen terkait bergeser
         recomputePath(source, target);
       }
     );
   }, [sourceId, targetId]);
   ```
4. Saat pointer dilepas (`pointerup`), posisi final yang telah di-snap ke 30px di-commit satu kali ke `useCircuitStore` utama, memicu update riwayat *Undo/Redo*.

---

## 7. Model Asset & Manipulasi Frame SVG Simurelay

### 7.1. Struktur Data Katalog Komponen (`ComponentDefinition`)
Setiap simbol dari 120 SVG Simurelay diurai menjadi format TypeScript terstruktur:

```typescript
export interface ComponentPinDefinition {
  id: string;              // e.g., "0", "1", "2"
  tag: string;             // Label terminal: "A1", "A2", "13", "14", "95"
  direction: Direction;    // 0: Top, 1: Right, 2: Bottom, 3: Left
  type: 'contact' | 'coil' | 'source' | 'passive';
  dx: number;              // Offset X dari pusat simbol (multiples of 30)
  dy: number;              // Offset Y dari pusat simbol (multiples of 30)
}

export interface ComponentFrameDefinition {
  id: number;              // 0: De-energized / OFF, 1: Energized / ON, 2: Tripped, etc.
  visiblePaths: string[];  // Array ID path yang aktif pada frame ini: ["mainPath1"]
}

export interface ComponentDefinition {
  typeId: string;          // e.g., "motorBreaker3p", "relayCoil", "pushbuttonNO"
  category: 'protections' | 'coils' | 'contacts' | 'sources' | 'loads' | 'switches';
  name: string;
  description: string;
  width: number;           // Standard: 60, 120, 180, 240
  height: number;          // Standard: 60, 120, 180, 240
  pins: ComponentPinDefinition[];
  frames: ComponentFrameDefinition[];
  svgContent: string;      // Raw inner SVG markup yang telah dibersihkan dari metadata
}
```

### 7.2. Mekanisme Switching Frame Visual (`ComponentView.tsx`)
Di dalam komponen React yang merender SVG simbol:
```tsx
export const ComponentView = React.memo(({ instance, definition }: ComponentViewProps) => {
  // Ambil frame aktif dari Simulation Runtime Store
  const currentFrame = useSimulationStore(
    (s) => s.componentStates[instance.id]?.frame ?? 0
  );
  
  const activeFrameDef = definition.frames.find((f) => f.id === currentFrame);
  const visiblePathIds = new Set(activeFrameDef?.visiblePaths ?? ['mainPath1']);

  return (
    <g
      id={`elem-${instance.id}`}
      transform={`translate(${instance.x}, ${instance.y}) rotate(${instance.rotation * 90}, ${definition.width / 2}, ${definition.height / 2})`}
      className="cursor-move"
    >
      {/* Inject SVG Body */}
      <g
        dangerouslySetInnerHTML={{ __html: definition.svgContent }}
        ref={(node) => {
          if (!node) return;
          // Toggle visibility pathFrame sesuai frame aktif
          node.querySelectorAll('[id^="mainPath"]').forEach((el) => {
            const pathId = el.getAttribute('id');
            const isVisible = pathId && visiblePathIds.has(pathId);
            (el as SVGElement).style.display = isVisible ? 'inline' : 'none';
          });
        }}
      />
      {/* Label Text & Terminal Overlays */}
      <text
        x={definition.width / 2}
        y={-8}
        textAnchor="middle"
        className="text-[12px] font-mono font-bold fill-white pointer-events-none select-none"
      >
        {instance.tag || definition.name}
      </text>
    </g>
  );
});
```

---

## 8. TypeScript Core Specifications

Berikut adalah kontrak tipe data TypeScript utama untuk implementasi Canvas UI/UX:

```typescript
// types/canvas.ts

export type Direction = 0 | 1 | 2 | 3;
export type Rotation = 0 | 1 | 2 | 3;

export interface Point {
  x: number;
  y: number;
}

export interface PinRef {
  elementId: string;
  pinId: string;
}

export interface WireMargins {
  start: number;
  center: number;
  end: number;
}

export interface WireConnection {
  id: string;
  source: PinRef;
  target: PinRef;
  margins: WireMargins;
  color?: string;
}

export interface ElementInstance {
  id: string;
  typeId: string;        // ID referensi ke katalog simbol
  x: number;             // Posisi X di grid (multiples of 30)
  y: number;             // Posisi Y di grid (multiples of 30)
  rotation: Rotation;    // 0: 0°, 1: 90°, 2: 180°, 3: 270°
  tag: string;           // Penandaan teknis: "-KM1", "-Q1", "-F1", "-S1"
  customSettings?: Record<string, any>; // e.g. delayTime untuk timer coil
}

export interface CanvasInteractionState {
  mode: 'SELECT' | 'WIRE' | 'PAN' | 'DELETE';
  selectedElementIds: string[];
  selectedWireIds: string[];
  isDragging: boolean;
  wireDraft: {
    source: PinRef;
    currentPoint: Point;
    snappedPin: PinRef | null;
  } | null;
}
```

---

## 9. Rencana Implementasi Bertahap Subsistem Canvas

### Tahap 1: Setup Asset Pipeline & Catalog Generator (`scripts/extract-assets.ts`)
- Membaca 120 SVG Simurelay dari bundle lokal macOS.
- Mengurai blok XML `<metadata>` menggunakan `fast-xml-parser`.
- Menghasilkan file JSON katalog `src/constants/components-catalog.json` serta file SVG bersih di `public/symbols/`.

### Tahap 2: Transform Engine & Canvas Viewport
- Mengembangkan hook `useCanvasTransform` untuk pan dan zoom tak terbatas dengan SVG matrix transform.
- Mengembangkan renderer grid latar belakang 30px (dengan sub-grid 15px) berbasis SVG pattern.
- Mengembangkan fungsi utilitas konversi koordinat (`screenToCanvas`, `snapToGrid30`).

### Tahap 3: Symbol Renderer & Rotasi Diskret
- Mengembangkan `ComponentView.tsx` dengan rotasi 90° dinamis dan frame-switching imperatif.
- Mengembangkan `TerminalPin.tsx` dengan deteksi radius magnetis (18px) dan visual highlight.

### Tahap 4: Manhattan Orthogonal Router & Margin Handles
- Mengembangkan unit murni `ManhattanRouter.ts` untuk menghitung array `Point[]` berdasarkan arah pin dan margins.
- Mengembangkan `WireRenderer.tsx` dengan SVG path builder dan drag handle pada segmen tengah untuk penyesuaian `margins.center`.

### Tahap 5: Integrasi Simulation Store
- Menghubungkan Canvas dengan `SimulationEngine.ts`.
- Efek visual kabel aktif (kabel bertegangan berubah warna merah terang/biru, animasi elektron mengalir jika ada beban).
- Efek visual kontak relay bergerak secara mekanis saat koil aktif.

---

Dokumen ini menjadi rujukan baku bagi implementor antarmuka grafis dalam membangun subsistem Canvas Web Relay Simulator.
