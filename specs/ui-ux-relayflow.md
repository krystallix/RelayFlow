# Spesifikasi Sistem Desain dan Komponen UI/UX RelayFlow

Dokumen spesifikasi komprehensif untuk antarmuka pengguna (UI) dan pengalaman pengguna (UX) Web Relay Simulator berbasis sistem otomasi visual RelayFlow. Dokumen ini mendefinisikan token desain, arsitektur komponen visual, hierarki antarmuka, serta status interaksi interaktif dalam kanvas diagram otomasi berbasis web.

---

## 1. Visi Desain & Prinsip Antarmuka

Antarmuka RelayFlow menggabungkan presisi rekayasa otomasi industri kelistrikan dengan keanggunan estetika *dark-mode* modern (berorientasi pada arsitektur node-graph kontemporer). Desain ini mengutamakan keterbacaan skema yang kompleks, visibilitas aliran arus/sinyal data secara seketika, dan kenyamanan visual selama sesi manipulasi sirkuit intensif.

### Prinsip Utama
1. **Ketajaman Visual & Hirarki Gelap Bertingkat (Deep Layered Dark Slate)**: Menggunakan latar belakang kanvas gelap pekat (`#0a0d14` hingga `#0f1117`) untuk mengurangi kelelahan mata, sementara node dan komponen fungsional diangkat menggunakan kontras permukaan, batas halus (*subtle border*), dan pendaran aksen warna fungsional.
2. **Keterbacaan Aliran & Polaritas**: Aksen warna tidak digunakan semata untuk dekorasi, melainkan membawa muatan semantik ketat untuk mengidentifikasi tipe node (sumber, pemroses logika, relay/aktuator, dan instrumen ukur).
3. **Ergonomi Magnetis & Presisi Grid**: Setiap kartu komponen, terminal pin, dan garis kawat terpasang secara presisi dengan sistem snapping modular yang meminimalkan disorientasi visual saat diagram membesar.
4. **Fidelitas Interaksi Tanpa Jeda (Zero Latency Feel)**: Transisi status, perpindahan kabel dinamis, dan efek pulsasi arus simulasi dioptimalkan menggunakan akselerasi GPU dan atribut transform native.

---

## 2. Design Tokens

### 2.1. Palet Warna (Color Tokens)

#### A. Latar Belakang & Permukaan (Background & Surface)
| Token Nama | Nilai HEX / RGBA | Peruntukan Penggunaan |
| :--- | :--- | :--- |
| `color-canvas-base` | `#0a0d14` | Latar belakang dasar kanvas terluar |
| `color-canvas-surface` | `#0f1117` | Latar kanvas kerja utama (area kisi titik) |
| `color-canvas-grid-dot` | `#242b3d` | Titik matriks grid regular |
| `color-canvas-grid-dot-active` | `#3d4863` | Titik matriks grid mayor (kelipatan 5) |
| `color-surface-card` | `#131722` | Permukaan kartu FlowNode (dasar) |
| `color-surface-card-hover` | `#171c2b` | Permukaan kartu saat pointer melintas |
| `color-surface-panel` | `rgba(15, 17, 23, 0.82)` | Panel navigasi atas, laci sidebar (efek kaca) |
| `color-surface-subtle` | `#1a202e` | Kontainer parameter internal, input field, baris tag |
| `color-surface-inset` | `#0a0c10` | Cekungan slot terminal / port handle |

#### B. Garis Batas & Pembatas (Borders & Dividers)
| Token Nama | Nilai HEX / RGBA | Peruntukan Penggunaan |
| :--- | :--- | :--- |
| `color-border-card` | `rgba(255, 255, 255, 0.08)` | Batas standar kartu FlowNode dan panel |
| `color-border-card-hover` | `rgba(255, 255, 255, 0.18)` | Batas kartu saat state hover |
| `color-border-card-selected` | `#3b82f6` | Batas kartu saat aktif terseleksi (biru cerah) |
| `color-border-divider` | `rgba(255, 255, 255, 0.06)` | Garis pemisah internal header-body pada node |
| `color-border-port` | `rgba(255, 255, 255, 0.25)` | Cincin luar port dot terminal |

#### C. Aksen Semantik Tipe Node (Node Category Accents)
Warna aksen diterapkan pada lencana ikon header, pendaran status kartu, dan warna pin:

| Kategori Node | HEX Utama | HEX Permukaan Lencana | HEX Pendaran / Glow |
| :--- | :--- | :--- | :--- |
| **Power / Source (Tegangan/Fasa)** | `#ef4444` (Rose-500) | `rgba(239, 68, 68, 0.15)` | `rgba(239, 68, 68, 0.40)` |
| **Control / Trigger (Tombol, Saklar)** | `#f97316` (Orange-500) | `rgba(249, 115, 22, 0.15)` | `rgba(249, 115, 22, 0.40)` |
| **Logic / Relay (Koil, Timer, TOR)** | `#8b5cf6` (Purple-500) | `rgba(139, 92, 246, 0.15)` | `rgba(139, 92, 246, 0.40)` |
| **Actuator / Output (Motor, Lampu)** | `#10b981` (Emerald-500) | `rgba(16, 185, 129, 0.15)` | `rgba(16, 185, 129, 0.40)` |
| **Sensor / Metric (Meter, Proteksi)** | `#06b6d4` (Cyan-500) | `rgba(6, 182, 212, 0.15)` | `rgba(6, 182, 212, 0.40)` |
| **Network / Bus (Terminal Sambungan)** | `#3b82f6` (Blue-500) | `rgba(59, 130, 246, 0.15)` | `rgba(59, 130, 246, 0.40)` |

#### D. Status Simulasi & Eksekusi (Simulation States)
| Status | HEX Utama | HEX Background Subil | Makna Fungsional |
| :--- | :--- | :--- | :--- |
| `status-idle` | `#64748b` (Slate-500) | `rgba(100, 116, 139, 0.12)` | Sirkuit belum berjalan / siap |
| `status-running` | `#3b82f6` (Blue-500) | `rgba(59, 130, 246, 0.15)` | Engine aktif mengevaluasi loop logika |
| `status-energized` | `#eab308` (Yellow-500) | `rgba(234, 179, 8, 0.18)` | Konduktor/Koil bertegangan aktif |
| `status-fault` | `#ef4444` (Red-500) | `rgba(239, 68, 68, 0.20)` | Terjadi trip TOR / hubung singkat |
| `status-success` | `#10b981` (Emerald-500) | `rgba(16, 185, 129, 0.15)` | Rangkaian stabil dan seimbang |

#### E. Tipografi & Kontras Teks
| Token Teks | Nilai HEX | Kontras Ratio vs `#131722` |
| :--- | :--- | :--- |
| `text-primary` | `#f8fafc` (Slate-50) | 16.2:1 (Sangat Tinggi / AAA) |
| `text-secondary` | `#94a3b8` (Slate-400) | 7.8:1 (Tinggi / AA) |
| `text-muted` | `#64748b` (Slate-500) | 4.6:1 (Cukup / AA Large) |
| `text-accent` | `#60a5fa` (Blue-400) | 8.5:1 (Tinggi / AAA) |
| `text-inverted` | `#0a0d14` | Digunakan di atas badge solid |

---

### 2.2. Tipografi (Typography System)

Sistem tipografi menggunakan dua jenis rupa huruf:
- **Font Utama (Interface & Labels)**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
- **Font Monospace (Tags, Terminal ID, Numerik, Parameter)**: `JetBrains Mono`, `Fira Code`, `monospace`

| Tingkat Tipografi | Ukuran (px / rem) | Weight | Line Height | Tracking | Penggunaan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `text-display` | 20px / 1.25rem | 700 (Bold) | 28px | -0.02em | Judul skema proyek di TopNavbar |
| `text-title-node`| 14px / 0.875rem | 600 (SemiBold)| 20px | -0.01em | Nama komponen pada FlowNode |
| `text-body` | 13px / 0.8125rem | 400 (Regular) | 18px | 0 | Deskripsi parameter, tooltip |
| `text-sub-node` | 11px / 0.6875rem | 500 (Medium) | 14px | +0.02em | Tag ID komponen (misal `-KM1`, `95-96`) |
| `text-mono-val` | 12px / 0.75rem | 500 (Medium) | 16px | 0 | Nilai tegangan, impedansi, timer detik |
| `text-micro` | 10px / 0.625rem | 700 (Bold) | 12px | +0.05em | Label port I/O, badge status caps |

---

### 2.3. Radius Sudut (Radii Tokens)

| Token Radius | Nilai (px) | Penggunaan |
| :--- | :--- | :--- |
| `radius-xs` | 4px | Port terminal indicator, micro status tag |
| `radius-sm` | 6px | Input value box, dropdown menu item |
| `radius-md` | 10px | Lencana ikon header, tombol aksi kecil |
| `radius-lg` | 14px | Kontainer sub-panel, dialog konfigurasi |
| `radius-xl` | 16px | Sudut standar kartu FlowNode (`rounded-2xl` Tailwind) |
| `radius-2xl`| 20px | Floating TopNavbar, floating drawer sidebar |
| `radius-full`| 9999px | Port dot connection, status indicator pill, badge |

---

### 2.4. Elevasi, Bayangan & Efek Pendaran (Shadow & Glow Tokens)

```css
/* Tailwind CSS v4 / Vanilla CSS Tokens */
:root {
  --shadow-node-default: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 
                         0 4px 10px -2px rgba(0, 0, 0, 0.3),
                         inset 0 1px 0 0 rgba(255, 255, 255, 0.08);

  --shadow-node-hover: 0 16px 32px -6px rgba(0, 0, 0, 0.55),
                       0 6px 16px -3px rgba(0, 0, 0, 0.4),
                       inset 0 1px 0 0 rgba(255, 255, 255, 0.15);

  --shadow-node-selected: 0 0 0 2px #3b82f6,
                          0 16px 36px -4px rgba(59, 130, 246, 0.25),
                          0 0 20px 2px rgba(59, 130, 246, 0.2);

  --shadow-panel-floating: 0 20px 40px -10px rgba(0, 0, 0, 0.6),
                           0 1px 3px 0 rgba(0, 0, 0, 0.4),
                           inset 0 1px 0 0 rgba(255, 255, 255, 0.1);

  --glow-wire-energized: drop-shadow(0 0 6px rgba(234, 179, 8, 0.75))
                         drop-shadow(0 0 14px rgba(234, 179, 8, 0.4));

  --glow-wire-active: drop-shadow(0 0 6px rgba(59, 130, 246, 0.7))
                      drop-shadow(0 0 12px rgba(59, 130, 246, 0.35));

  --glow-port-snap: drop-shadow(0 0 8px rgba(59, 130, 246, 0.9));
}
```

---

## 3. Spesifikasi Komponen

### 3.1. FlowCanvas
Kanvas tanpa batas (*infinite canvas*) adalah ruang kerja dua dimensi tempat node diletakkan, disambungkan, dan dimanipulasi.

#### A. Struktur Visual & Background Dotted Grid
- **Warna Dasar**: `#0f1117` dengan gradien halus ke `#0a0d14` di sudut viewport.
- **Pola Titik (Dotted Matrix)**: Menggunakan pola SVG `<pattern>` dengan ukuran matriks reguler 30px dan sub-matriks visual 15px.
  - Diameter titik: `1.5px`.
  - Warna titik standar: `#242b3d` (visibilitas kontras rendah namun terdeteksi mata).
  - Warna titik mayor (setiap kelipatan 150px / 5 grid unit): `#3e4b6b`.
- **Viewport Transform**: Menerapkan transformasi affine 2D berbasis SVG `transform="matrix(s, 0, 0, s, tx, ty)"` pada root group container `<g id="relayflow-viewport">`.

#### B. Pan/Zoom Controller
- **Rentang Skala Zoom**: `0.2` (20%) hingga `3.0` (300%).
- **Langkah Zoom**:
  - Roda mouse / Trackpad pinch: responsif eksponensial halus dengan damping coefficient `0.002`.
  - Tombol pintas `+` dan `-`: penambahan bertahap $\pm 15\%$.
- **Pivot Zooming**: Zoom selalu berpusat pada koordinat kursor pointer saat interaksi zoom berlangsung (*cursor-anchored zoom*).
- **Inersia Pan**: Ruang kanvas dapat digeser menggunakan `Spacebar + Left Click Drag`, tombol tengah mouse (*scroll click*), atau drag langsung pada bidang kosong kanvas.

#### C. Multi-Selection Box (Rubberband Marquee)
- **Aktivasi**: Drag klik kiri pada area kanvas kosong saat tidak menekan Spacebar.
- **Visual Marquee**:
  - Garis batas: `1.5px dashed #3b82f6` dengan animasi offset berjalan halus (`stroke-dasharray="4 4"`).
  - Area isi: `rgba(59, 130, 246, 0.08)` dengan filter `backdrop-blur-[1px]`.
  - Radius sudut seleksi: `4px`.
- **Logika Inklusi**: Elemen dinyatakan terpilih jika koordinat bounding box elemen berpotongan (*intersect*) dengan area seleksi marquee.

```tsx
// Definisi Antarmuka Props FlowCanvas
export interface FlowCanvasProps {
  gridSize?: number; // default: 30
  minZoom?: number;  // default: 0.2
  maxZoom?: number;  // default: 3.0
  isSimulating?: boolean;
  onSelectionChange?: (selectedNodeIds: string[], selectedWireIds: string[]) => void;
  children: React.ReactNode;
}
```

---

### 3.2. FlowNode
Unit fungsional utama pada diagram skema. Merepresentasikan satu komponen otomasi/kelistrikan (seperti Breaker, Koil Kontaktor, Timer, Tombol Push Button, atau Motor).

#### A. Anatomi Kartu Node
1. **Container Luar**:
   - Dimensi standar: Lebar dasar `240px` (atau modular kelipatan grid: `180px`, `240px`, `300px`).
   - Radius sudut: `16px` (`rounded-2xl`).
   - Latar: `#131722` dilapisi `backdrop-blur-md` dan batas `1px solid rgba(255, 255, 255, 0.08)`.
   - Bayangan: `var(--shadow-node-default)`.
2. **Header Komponen**:
   - Padding: `12px 14px`.
   - Pemisah bawah: `1px solid rgba(255, 255, 255, 0.06)`.
   - Elemen Header:
     - **Lencana Ikon (Icon Badge)**: Persegi `32x32px`, `rounded-xl` (`10px`), warna background bertema aksen dengan opacity 15%, memuat ikon SVG teknis berukuran `18x18px` dengan warna aksen solid.
     - **Informasi Teks**:
       - Judul Node: `text-sm font-semibold text-slate-100 truncate`.
       - Lencana Tag / Kategori: Pill mini dengan font monospace (`text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5`).
     - **Menu Tindakan Cepat (Context Dot Trigger)**: Tombol titik tiga vertikal (`16x16px`) berpenampilan ghost untuk membuka modal inspeksi dan opsi duplikasi/hapus.
3. **Body Komponen (Parameter & Status)**:
   - Padding: `12px 14px`.
   - Berisi daftar parameter dinamis (misal: "Delay: 5.0s", "Rating: 24V DC", "Status: De-energized").
   - Menampilkan visual simbol skematik SVG di tengah jika mode tampilan adalah skematik murni (*schematic overlay*).
   - Indikator status live: Pill animasi dengan dot menyala (`bg-emerald-400 animate-pulse` saat aktif).
4. **Port Handles (Terminal Input & Output)**:
   - Posisi: Menempel pada tepi luar kiri (Input) dan kanan (Output), atau atas/bawah sesuai orientasi node.
   - Geometri Dot: Lingkaran diameter `12px` dengan pusat lubang `4px`.
   - Warna default: `#1e293b` dengan cincin luar `2px solid rgba(255, 255, 255, 0.4)`.
   - Label Terminal: Teks monospace di samping port (`1`, `2`, `A1`, `A2`, `13`, `14`, dll.) dengan ukuran `10px` warna `#94a3b8`.
   - Area Sambaran Magnetis (*Hit Area Aura*): Radius tak terlihat selebar `24px` di sekitar port untuk memudahkan koneksi kawat saat penarikan pointer.

```tsx
// Definisi Antarmuka Data FlowNode
export interface FlowNodeData {
  id: string;
  type: 'source' | 'control' | 'relay' | 'actuator' | 'protection' | 'metric';
  tag: string;           // e.g. "-KM1", "-Q1", "-S2"
  label: string;         // e.g. "Main Contactor 3P"
  icon: string;          // Lucide icon identifier
  accentColor: string;   // HEX accent
  position: { x: number; y: number };
  parameters: Array<{
    key: string;
    label: string;
    value: string | number;
    unit?: string;
  }>;
  ports: Array<{
    id: string;
    label: string;
    direction: 'input' | 'output' | 'bidirectional';
    position: 'top' | 'right' | 'bottom' | 'left';
    terminalTag: string; // e.g. "A1", "A2"
    connected: boolean;
  }>;
  state: {
    isEnergized: boolean;
    isFaulted: boolean;
    activeFrame?: number;
  };
}
```

---

### 3.3. FlowWire
Kabel konduktor yang merepresentasikan sambungan fisik dan logika kelistrikan antar port terminal.

#### A. Geometri Jalur & Routing
FlowWire mendukung dua mode visualisasi:
1. **Sleek Smooth Spline (Cubic Bezier)**:
   - Digunakan pada mode high-level node view.
   - Kurva dihitung dengan offset kontrol titik horizontal $\Delta x \times 0.5$ untuk menghasilkan transisi $S$-curve yang halus dan simetris.
2. **Industrial Orthogonal (Manhattan 90° Route)**:
   - Digunakan pada mode diagram skematik presisi kelistrikan Simurelay / RelayFlow.
   - Garis hanya bergerak secara horizontal dan vertikal dengan segmen radius belokan siku `8px` (`rx="8" ry="8"`).

#### B. Anatomi Visual Garis & Layering
Kawat dirender sebagai tiga lapis SVG bersusun untuk menghasilkan efek kedalaman dan pendaran:
1. **Lapisan Interaksi (Hitbox Path)**:
   - Stroke transparan selebar `20px` (`stroke="transparent"`).
   - Menangkap event `pointerdown`, `pointerenter`, `pointerleave`, dan double click tanpa menuntut akurasi piksel mikro dari pengguna.
2. **Lapisan Pendaran (Outer Glow Path)**:
   - Hanya aktif saat kabel dialiri tegangan simulasi (`isEnergized: true`) atau saat terseleksi (`isSelected: true`).
   - Lebar stroke: `6px`.
   - Filter: `filter="url(#glow-blur)"` dengan opacity `0.5`.
3. **Lapisan Kawat Inti (Core Wire Path)**:
   - Lebar stroke: `2.5px`.
   - Warna Default: `#475569` (Slate-600 saat mati/idle).
   - Warna Terseleksi: `#60a5fa` (Blue-400).
   - Warna Aktif Bertegangan: Gradien linear mengkilap dari `#fbbf24` (Amber-400) ke `#f59e0b` (Amber-500).

#### C. Indikator Aliran Data/Arus Aktif (Data Flow Animation)
- Saat simulasi aktif, kawat menampilkan animasi partikel elektron atau garis putus-putus (*marching ants*) yang bergerak searah aliran arus listrik:
  - `strokeDasharray: "6 6"`
  - Animasi CSS `@keyframes wireFlow`:
    ```css
    @keyframes wireFlow {
      from { stroke-dashoffset: 24; }
      to { stroke-dashoffset: 0; }
    }
    .flow-wire-animated {
      animation: wireFlow 0.8s linear infinite;
    }
    ```
- Titik persimpangan (Junction Dot): Sambungan 3 atau 4 kawat otomatis merender lingkaran simpul padat berdiameter `6px` (`fill="#f8fafc"`).

---

### 3.4. TopNavbar
Bilah navigasi mengambang (*floating navbar*) ramping yang diletakkan di bagian atas tengah kanvas. Memberikan konteks proyek serta pusat kontrol kendali simulasi RelayFlow.

#### A. Anatomi Tata Letak
- **Geometri**:
  - Posisi: Mengambang `16px` dari batas atas viewport kanvas, berada pada posisi horizontal tengah (*centered*).
  - Ketinggian: `48px`.
  - Radius: `24px` (`rounded-full` / `rounded-2xl`).
  - Latar: `rgba(15, 17, 23, 0.85)` dengan efek kaca intensif `backdrop-blur-xl`.
  - Batas: `1px solid rgba(255, 255, 255, 0.1)`.
  - Bayangan: `var(--shadow-panel-floating)`.
  - Padding: `6px 14px`.

#### B. Klaster Komponen Navigasi
1. **Identitas Proyek & Branding RelayFlow (Project Pill Badge)**:
   - Menampilkan logo RelayFlow + nama proyek skema (misal: "RelayFlow / Direct-On-Line Starter -DOL").
   - Status badge: Pill hijau mini bertuliskan "Saved" atau titik kuning "Editing".
   - Dapat diklik untuk mengganti nama skema secara langsung.
2. **Pusat Kontrol Eksekusi Simulasi (Simulation Engine Controls)**:
   - **Tombol Run / Processing**:
     - State Berhenti: Tombol dengan ikon Play warna teks hijau (`text-emerald-400`), latar transparan dengan hover `bg-emerald-500/10`.
     - State Berjalan: Tombol dengan latar gradien biru-ke-violet (`bg-gradient-to-r from-blue-600 to-indigo-600`), teks "Running...", disertai ikon spinner berputar halus.
     - State Pause / Step: Tombol alternatif untuk melangkah satu siklus logika (Single Step Debugging).
     - Tombol Reset Sirkuit: Mengembalikan posisi kontaktor dan pemutus arus ke konfigurasi awal.
3. **Klaster Utilitas Kanvas (Canvas Utilities)**:
   - **Kontrol Skala Zoom**:
     - Tombol `-` (Zoom Out)
     - Indikator Persentase: Teks monospace `100%` (klik untuk reset ke 1:1).
     - Tombol `+` (Zoom In)
   - **Tombol Fit-to-Screen (Focus Diagram)**: Mengkalkulasi seluruh bounding box node dan memposisikannya tepat di tengah layar dengan margin estetis.
   - **Tombol Auto-Layout (DAG Clean)**: Menata posisi node secara otomatis mengikuti hierarki aliran daya (kiri ke kanan atau atas ke bawah).
   - **Tombol Undo / Redo**: Tombol panah putar melengkung dengan indikator ketersediaan histori (`disabled` saat tumpukan kosong).

---

### 3.5. Sidebar / NodePalette
Panel laci mengambang (*docked collapsible drawer*) di sisi kiri layar untuk mencari dan menarik komponen ke atas kanvas RelayFlow.

#### A. Anatomi Tata Letak
- **Geometri**:
  - Posisi: Kiri kanvas, margin `16px`, tinggi `calc(100vh - 32px)`.
  - Lebar: Terbuka `280px`, ciut (*collapsed*) `56px`.
  - Radius: `20px` (`rounded-2xl`).
  - Latar: `rgba(15, 17, 23, 0.88)` dengan batas `1px solid rgba(255, 255, 255, 0.08)` dan `backdrop-blur-xl`.

#### B. Fitur & Hierarki Internal
1. **Header Sidebar & Kolom Pencarian**:
   - Kolom masukan pencarian instan dengan ikon kaca pembesar dan tombol pintas `Cmd+K`.
   - Mengeliminasi daftar komponen secara instan (*fuzzy match*) berdasarkan nama, tipe, atau tag standar.
2. **Tab Kategori Berwarna (Category Tabs)**:
   - Tab horizontal dengan ikon mini:
     - Sumber Daya (Power)
     - Proteksi (Breakers & TOR)
     - Kontrol (Push Buttons & Switches)
     - Relays & Timers
     - Beban (Motors, Lamps, Indicators)
3. **Daftar Kartu Komponen Siap Tarik (Draggable Palette Item)**:
   - Setiap kartu palet berdimensi ringkas (`height: 52px`).
   - Berisi lencana ikon mini berkode warna, nama komponen, dan kode tag bawaan.
   - **Interaksi Drag**:
     - Saat elemen ditekan dan ditarik keluar dari palet, dibuat elemen semu (*ghost drag preview*) semi-transparan dengan skala 105% dan bayangan tinggi yang mengikuti posisi kursor.
     - Kanvas secara otomatis menampilkan indikator proyeksi drop snapping ke kisi 30px terdekat.

---

## 4. Status Interaksi (Interaction States)

| Status | Elemen Terpengaruh | Indikator Visual | Efek Transisi |
| :--- | :--- | :--- | :--- |
| **Idle / Default** | Node, Wire, Port | Permukaan `#131722`, border `rgba(255,255,255,0.08)`, kawat abu-abu gelap `#475569`. | Transisi dasar `150ms ease-out` |
| **Hover** | FlowNode Card | Permukaan naik ke `#171c2b`, border `rgba(255,255,255,0.2)`, elevasi bayangan bertambah `12px`. | Durasi `180ms ease-in-out` |
| **Hover** | Port Handle | Titik membesar dari `12px` ke `16px`, lingkaran cincin menyala sesuai warna kategori node, tooltip terminal ID muncul. | Skala `transform: scale(1.33)` |
| **Hover** | FlowWire | Stroke menebal dari `2.5px` ke `4px`, kawat memancarkan glow redup, kursor berganti menjadi pointer sambungan. | Durasi `120ms ease` |
| **Selected** | FlowNode Card | Batas luar berganti menjadi cincin kontras biru `#3b82f6` (`2px solid`), glow biru lembut di sekeliling kartu. | Instan dengan fade `100ms` |
| **Selected** | FlowWire | Kawat berubah warna menjadi `#60a5fa` dengan marker panah arah aliran muncul di tengah garis. | Instan |
| **Dragging** | FlowNode Card | Opacity `0.92`, transformasi `translate3d(x, y, 0)`, elevasi bayangan maksimal (`var(--shadow-panel-floating)`), kawat terhubung otomatis meregang realtime. | Tanpa jeda render (Direct Matrix RAF) |
| **Wire-Connecting** | Sumber Port ke Kursor | Muncul kawat panduan elastis (*rubberband wire*) berwarna biru terputus-putus mengikuti pergerakan mouse dari port asal. | Perhitungan 60 FPS |
| **Magnetic Snap** | Target Port | Saat kursor berada dalam radius 24px dari port valid, kawat elastis mengunci otomatis ke titik tengah port target, port target memancarkan glow hijau/biru. | Snapping instan dengan pulse |
| **Invalid Target** | Target Port | Jika sambungan tidak diizinkan (misal output ke output sejenis), port target menyala merah redup (`#ef4444`) dan kursor berganti menjadi `not-allowed`. | Pendaran merah `200ms` |
| **Active Simulation** | Seluruh Sistem | Kawat bertegangan bersinar terang dengan animasi aliran garis putus-putus, node aktif berdenyut dengan indikator status hijau/kuning menyala. | Siklus animasi kontinu |

---

## 5. Aksesibilitas, Ergonomi Keyboard & Performa

### 5.1. Rasio Kontras & Aksesibilitas (WCAG 2.1 AA/AAA)
- Seluruh teks label dan parameter memenuhi rasio kontras minimal 4.5:1 terhadap latar belakang kartu gelap (`#131722`).
- Terminal port dan status simulasi tidak hanya mengandalkan kode warna semata, melainkan selalu disertai bentuk geometris yang berbeda, teks lencana, atau simbol penjelas.

### 5.2. Pintasan Keyboard Standar (Keyboard Shortcuts Map)
| Kombinasi Tombol | Aksi yang Dijalankan |
| :--- | :--- |
| `Spacebar + Drag` | Paning kanvas tanpa mengubah status seleksi |
| `Cmd / Ctrl + Klik` | Tambah/kurangi komponen pada daftar multiseleksi |
| `Cmd / Ctrl + A` | Pilih seluruh komponen dan kabel pada kanvas |
| `Cmd / Ctrl + C / V` | Salin dan tempel blok komponen dengan auto-increment tag |
| `Cmd / Ctrl + D` | Duplikasi cepat blok dengan offset +30px |
| `R` | Putar komponen terseleksi 90 derajat searah jarum jam |
| `Delete / Backspace`| Hapus seluruh node dan kawat yang sedang terseleksi |
| `Cmd / Ctrl + Z` | Batalkan aksi terakhir (Undo) |
| `Cmd / Ctrl + Shift + Z` atau `Cmd + Y` | Ulangi aksi yang dibatalkan (Redo) |
| `Cmd / Ctrl + 0` | Reset zoom ke 100% dan pusatkan kanvas |
| `Cmd / Ctrl + F` | Buka pencarian komponen di sidebar |
| `Enter / Spacebar` (saat simulasi siap) | Jalankan / Jeda eksekusi simulasi sirkuit |

### 5.3. Pedoman Optimasi Performa Rendering
1. **Isolasi Re-render**: State posisi translasi kanvas saat paning tidak boleh memicu rendering ulang pohon komponen React. Seluruh transformasi dilakukan langsung pada level atribut SVG DOM `<g id="viewport-root">`.
2. **Kabel Ortogonal Manhattan**: Menggunakan algoritma router berbasis grid terkuantisasi dengan margin tetap untuk menghindari kalkulasi ulang geometris yang mahal saat penarikan kawat.
3. **Hardware Acceleration**: Penggunaan properti CSS `will-change: transform` pada container seleksi grup dan node yang sedang digeser.
4. **Viewport Culling**: Node yang berada sepenuhnya di luar batas pandang layar (*viewport clipping rectangle*) di-render dengan visibilitas minimal untuk mempertahankan kecepatan 120 FPS pada proyek berskala lebih dari 100 komponen.

---

## 6. Kontrak Tipe Data Antarmuka (TypeScript Interfaces)

```typescript
// /src/types/relayflow-ui.ts

export type NodeCategory = 
  | 'source' 
  | 'control' 
  | 'relay' 
  | 'actuator' 
  | 'protection' 
  | 'metric';

export type PortDirection = 'input' | 'output' | 'bidirectional';

export type WireRouteType = 'smooth' | 'manhattan';

export interface CanvasTransformState {
  x: number;
  y: number;
  scale: number;
}

export interface PortDefinition {
  id: string;
  terminalTag: string; // Misal: "A1", "13", "NO"
  direction: PortDirection;
  position: 'top' | 'right' | 'bottom' | 'left';
  offset: { x: number; y: number };
}

export interface NodeComponentState {
  id: string;
  category: NodeCategory;
  tag: string;
  name: string;
  position: { x: number; y: number };
  rotation: 0 | 1 | 2 | 3; // 0=0deg, 1=90deg, 2=180deg, 3=270deg
  selected: boolean;
  isEnergized: boolean;
  isFaulted: boolean;
  ports: PortDefinition[];
  parameters: Record<string, string | number | boolean>;
}

export interface WireConnectionState {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  routingMode: WireRouteType;
  isSelected: boolean;
  isEnergized: boolean;
  currentMagnitude?: number; // Nilai arus (Ampere)
  voltageLevel?: number;     // Nilai tegangan (Volt)
}

export interface SelectionMarqueeState {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}
```
