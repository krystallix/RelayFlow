# Spesifikasi Kontrak Data dan Integrasi Engine RelayFlow

Dokumen spesifikasi teknis untuk sistem RelayFlow yang mengatur arsitektur data sirkuit, representasi grafik kelistrikan, kontrak serialisasi berkas `.smrl`, jembatan integrasi engine simulasi (*simulation engine bridge*), serta model mesin keadaan terbatas (*finite state machine*) untuk komponen kendali industri.

---

## 1. Node-to-Relay Data Schema

Sistem RelayFlow memisahkan representasi grafis murni pada kanvas dengan representasi topologi kelistrikan. Hubungan antar elemen diatur melalui model Node-Edge terarah dan berbobot konduksi.

### 1.1. Core Interfaces

```typescript
export type Direction = 0 | 1 | 2 | 3; // 0: Top, 1: Right, 2: Bottom, 3: Left
export type Rotation = 0 | 1 | 2 | 3;  // 0: 0 deg, 1: 90 deg, 2: 180 deg, 3: 270 deg

export type ComponentCategory =
  | 'power_supply'
  | 'protection'
  | 'switching'
  | 'relay'
  | 'timer'
  | 'load'
  | 'signaling'
  | 'junction';

export type ComponentType =
  | 'power_source_ac'
  | 'power_source_dc'
  | 'breaker_1p'
  | 'breaker_3p'
  | 'fuse'
  | 'push_button_no'
  | 'push_button_nc'
  | 'relay_coil_standard'
  | 'relay_coil_on_delay'
  | 'relay_coil_off_delay'
  | 'relay_coil_latching'
  | 'relay_coil_flasher'
  | 'aux_contact_no'
  | 'aux_contact_nc'
  | 'thermal_overload'
  | 'motor_3p'
  | 'motor_1p'
  | 'indicator_lamp'
  | 'wire_junction';

export type PortType =
  | 'terminal'       // Terminal konduksi umum
  | 'power_phase'    // L1, L2, L3
  | 'power_neutral'  // N
  | 'power_pe'       // Protective Earth
  | 'dc_positive'    // +24V, +12V
  | 'dc_negative'    // -24V, 0V, GND
  | 'coil_input'     // A1
  | 'coil_output'    // A2
  | 'contact_pole'   // Terminal saklar/kontak
  | 'junction_dot';  // Titik simpul kabel

export interface Vector2D {
  x: number;
  y: number;
}

export interface Port {
  id: string;                     // ID unik port dalam satu node (misal: 'pin_A1', 'pin_13')
  tag: string;                    // Label terminal teknis (misal: 'A1', 'A2', '13', '14', '95', '96')
  type: PortType;                 // Karakteristik fungsional terminal
  direction: Direction;           // Arah keluar kabel default saat rotasi 0
  offset: {                       // Offset relatif terhadap titik pusat (center) node dalam piksel
    dx: number;
    dy: number;
  };
  netId: string | null;           // ID net ekuipotensial hasil resolusi engine simulasi
}

export interface InternalConductionPath {
  id: string;
  portId1: string;
  portId2: string;
  isConducting: boolean;          // Evaluasi status konduksi internal (tergantung FSM atau saklar)
  resistanceOhm: number;          // Nilai resistansi nominal (misal: 0.001 Ohm untuk kontak tertutup)
}

export interface CircuitNode<TData = Record<string, unknown>> {
  id: string;                     // ID unik instansi (UUID v4)
  type: ComponentType;            // Tipe komponen standar
  category: ComponentCategory;    // Kategori fungsional
  tag: string;                    // Label skema listrik (misal: '-KM1', '-F1', '-S1', '-Q1')
  position: Vector2D;             // Koordinat pojok kiri atas pada kanvas (snapped to 30px)
  rotation: Rotation;             // Orientasi diskret rotasi (0, 1, 2, 3)
  width: number;                  // Lebar bounding box dalam piksel (kelipatan 30px)
  height: number;                 // Tinggi bounding box dalam piksel (kelipatan 30px)
  ports: Port[];                  // Daftar terminal yang tersedia
  internalPaths: InternalConductionPath[]; // Jalur konduksi internal antar-port
  activeFrame: number;            // Index frame visual SVG (0: de-energized/open, 1: energized/closed, dst.)
  data: TData;                    // Metadata spesifik komponen
}

export interface WireMargins {
  start: number;                  // Offset stub tambahan dari port sumber (px)
  center: number;                 // Offset sumbu tengah Manhattan (px, kelipatan 30)
  end: number;                    // Offset stub tambahan ke port target (px)
}

export type WireColorCode =
  | 'phase_l1'   // Cokelat / Hitam (IEC)
  | 'phase_l2'   // Hitam (IEC)
  | 'phase_l3'   // Abu-abu (IEC)
  | 'neutral'    // Biru
  | 'ground'     // Hijau-Kuning
  | 'dc_pos'     // Merah
  | 'dc_neg'     // Biru tua / Hitam
  | 'control';   // Merah / Abu-abu

export interface CircuitEdge {
  id: string;                     // ID unik kabel (UUID v4)
  sourceNodeId: string;           // ID node sumber
  sourcePortId: string;           // ID port sumber
  targetNodeId: string;           // ID node target
  targetPortId: string;           // ID port target
  margins: WireMargins;           // Konfigurasi perutean ortogonal
  color: WireColorCode;           // Standar kode warna isolasi
  isEnergized: boolean;           // Apakah kabel membawa tegangan aktif saat simulasi
  currentFlowAmps: number;        // Nilai arus kalkulasi engine
}
```

---

### 1.2. Pemetaan Elemen Kelistrikan Konkret ke Model Node-Edge

Setiap komponen industri diimplementasikan dengan memetakan port fisik dan jalur konduksi internal:

#### A. Circuit Breaker / MCB 3P (`breaker_3p`)
- Tag Default: `-Q1`
- Dimensi: 180px x 120px
- Ports:
  - Input: `1` (dx: -60, dy: -60), `3` (dx: 0, dy: -60), `5` (dx: 60, dy: -60), seluruhnya `direction: 0`
  - Output: `2` (dx: -60, dy: 60), `4` (dx: 0, dy: 60), `6` (dx: 60, dy: 60), seluruhnya `direction: 2`
- Jalur Konduksi Internal:
  - Tiga jalur paralel: `(1 -> 2)`, `(3 -> 4)`, `(5 -> 6)`
  - Status konduksi: `isConducting = (manualSwitchState === 'CLOSED' && !isTripped)`
- Data Schema:
```typescript
export interface BreakerData {
  ratedCurrentAmps: number;       // Arus nominal (misal: 16A, 32A)
  manualSwitchState: 'OPEN' | 'CLOSED';
  isTripped: boolean;
  tripCurve: 'B' | 'C' | 'D';
}
```

#### B. Relay & Contactor Coil (`relay_coil_standard`, `relay_coil_on_delay`, dst.)
- Tag Default: `-KM1` (kontaktor utama) atau `-K1` (relay kendali)
- Dimensi: 60px x 90px
- Ports:
  - Input Tegangan: `A1` (dx: 0, dy: -45, direction: 0, type: 'coil_input')
  - Referensi Balik: `A2` (dx: 0, dy: 45, direction: 2, type: 'coil_output')
- Jalur Konduksi Internal:
  - Jalur beban impedansi tinggi antara `A1` dan `A2`. Tidak bersifat *short-circuit*, melainkan mengonsumsi daya nominal dan menghasilkan fluks magnet saat terdapat beda potensial.
- Data Schema:
```typescript
export interface RelayCoilData {
  coilType: 'standard' | 'on_delay' | 'off_delay' | 'latching' | 'flasher';
  ratedVoltage: number;           // misal: 230 (VAC) atau 24 (VDC)
  impedanceOhms: number;          // misal: 450 Ohm
  timeSettingMs: number;          // Nilai preset delay untuk varian timer (ms)
  flasherOnPeriodMs?: number;     // Interval ON untuk tipe flasher
  flasherOffPeriodMs?: number;    // Interval OFF untuk tipe flasher
}
```

#### C. Auxiliary Contacts NO & NC (`aux_contact_no`, `aux_contact_nc`)
- Tag Default: Mengikuti tag koil penggerak, misal `-KM1`
- Dimensi: 60px x 60px
- Ports NO (Normally Open):
  - Terminal `13` (dx: 0, dy: -30, direction: 0) dan Terminal `14` (dx: 0, dy: 30, direction: 2)
- Ports NC (Normally Closed):
  - Terminal `11` (dx: 0, dy: -30, direction: 0) dan Terminal `12` (dx: 0, dy: 30, direction: 2)
- Jalur Konduksi Internal:
  - Jalur tunggal menghubungkan kedua terminal:
    - NO: `isConducting = masterCoilState.outputActive`
    - NC: `isConducting = !masterCoilState.outputActive`
- Data Schema:
```typescript
export interface AuxContactData {
  masterCoilTag: string;          // Tag referensi ke koil pengendali (misal: '-KM1')
  contactType: 'NO' | 'NC';
  terminalPair: '13-14' | '21-22' | '31-32' | '43-44' | 'custom';
}
```

#### D. Thermal Overload Relay (`thermal_overload`)
- Tag Default: `-F1`
- Dimensi: 180px x 150px
- Ports:
  - Jalur Utama (Daya): `1`, `3`, `5` (atas, direction: 0) dan `2`, `4`, `6` (bawah, direction: 2)
  - Kontak Bantu Proteksi: `95` (dx: -60, dy: 45, direction: 0), `96` (dx: -60, dy: 75, direction: 2) -> NC
  - Kontak Bantu Indikasi: `97` (dx: 30, dy: 45, direction: 0), `98` (dx: 30, dy: 75, direction: 2) -> NO
- Jalur Konduksi Internal:
  - Daya (1-2), (3-4), (5-6): Memiliki resistansi bimetal rendah.
  - Sinyal 95-96 (NC): `isConducting = (tripState === 'NORMAL')`
  - Sinyal 97-98 (NO): `isConducting = (tripState === 'TRIPPED')`
- Data Schema:
```typescript
export interface ThermalOverloadData {
  currentSettingAmps: number;     // Nilai setelan arus beban lebih (misal: 5.5A)
  tripClass: '10A' | '10' | '20'; // Kurva waktu trip
  resetMode: 'MANUAL' | 'AUTO';
  tripState: 'NORMAL' | 'TRIPPED';
  thermalCapacityPercent: number; // Akumulasi panas bimetal (0 - 100%)
}
```

#### E. 3-Phase Induction Motor (`motor_3p`)
- Tag Default: `-M1`
- Dimensi: 120px x 120px
- Ports:
  - `U1` (dx: -30, dy: -60, direction: 0)
  - `V1` (dx: 0, dy: -60, direction: 0)
  - `W1` (dx: 30, dy: -60, direction: 0)
  - `PE` (dx: 45, dy: 45, direction: 2)
- Jalur Konduksi Internal:
  - Belitan motor dalam konfigurasi star/delta internal. Berfungsi sebagai beban 3 fasa simetris.
- Data Schema:
```typescript
export interface MotorData {
  ratedPowerKw: number;           // Daya nominal (misal: 4.0 kW)
  ratedCurrentAmps: number;       // Arus nominal (misal: 8.2 A)
  runningStatus: 'STOPPED' | 'FORWARD' | 'REVERSE' | 'PHASE_LOSS_FAULT';
  mechanicalRpm: number;          // Kecepatan putaran aktual
}
```

#### F. Indicator Lamp (`indicator_lamp`)
- Tag Default: `-H1`
- Dimensi: 60px x 60px
- Ports:
  - Terminal `X1` (dx: 0, dy: -30, direction: 0)
  - Terminal `X2` (dx: 0, dy: 30, direction: 2)
- Jalur Konduksi Internal:
  - Elemen beban resistif optoelektronik (mengubah beda potensial menjadi visual bercahaya).
- Data Schema:
```typescript
export interface IndicatorLampData {
  color: 'red' | 'green' | 'yellow' | 'white' | 'blue';
  isIlluminated: boolean;
  nominalVoltage: number;
}
```

---

## 2. Serialization Contract (.smrl Importer/Exporter Adapter)

Berkas `.smrl` adalah format JSON yang digunakan untuk menyimpan skema sirkuit. Adapter bertanggung jawab melakukan serialisasi dan deserialisasi dua arah antara format disk `.smrl` dan model memori `RelayFlowDocument`.

### 2.1. Skema JSON `.smrl` (Legacy & Format Native)

```typescript
export interface SmrlFileHeader {
  version: string;                // Format version (misal: '1.2.0')
  generator: string;              // 'RelayFlow Engine'
  appName: 'RelayFlow';
  createdAt: string;              // ISO 8601 string
  modifiedAt: string;             // ISO 8601 string
  canvasGridSize: number;         // 30
}

export interface SmrlElementRaw {
  id: string;                     // ID elemen
  type: string;                   // Tipe elemen asli Simurelay / RelayFlow
  tag: string;                    // Label referensi komponen
  x: number;                      // Posisi X absolut
  y: number;                      // Posisi Y absolut
  rotation: number;               // 0, 1, 2, 3
  customProperties?: Record<string, unknown>;
}

export interface SmrlConnectorRaw {
  id: string;
  idElementNode1: string;         // ID node awal
  idNode1: string;                // ID atau index port awal
  idElementNode2: string;         // ID node tujuan
  idNode2: string;                // ID atau index port tujuan
  margins: {
    start: number;
    center: number;
    end: number;
  };
  color?: string;
}

export interface SmrlDocument {
  header: SmrlFileHeader;
  elements: SmrlElementRaw[];
  connectors: SmrlConnectorRaw[];
}
```

### 2.2. Model Memori Aplikasi `RelayFlowDocument`

```typescript
export interface RelayFlowDocument {
  metadata: {
    title: string;
    description: string;
    version: string;
    lastModified: number;
  };
  nodes: Record<string, CircuitNode>;
  edges: Record<string, CircuitEdge>;
}
```

### 2.3. Spesifikasi Adapter Antarmuka (Adapter Contract)

```typescript
export interface SmrlValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ISmrlAdapter {
  validate(rawJson: unknown): SmrlValidationResult;
  fromSmrl(rawJson: string | SmrlDocument): RelayFlowDocument;
  toSmrl(document: RelayFlowDocument): SmrlDocument;
}
```

### 2.4. Mapping Table Type Komponen & Resolusi Port

| Legacy Simurelay / SMRL Type | RelayFlow `ComponentType` | Mapping Atribut & Data |
| :--- | :--- | :--- |
| `power_source_3p` | `power_source_ac` | Output fasa: L1, L2, L3, N, PE |
| `power_source_dc` | `power_source_dc` | Output polaritas: +24V, 0V |
| `mcb_1p`, `mcb_3p` | `breaker_1p`, `breaker_3p` | `ratedCurrentAmps`, `manualSwitchState` |
| `coil_standard` | `relay_coil_standard` | `coilType: 'standard'` |
| `coil_on_delay` | `relay_coil_on_delay` | `timeSettingMs: props.delay ?? 5000` |
| `coil_off_delay` | `relay_coil_off_delay` | `timeSettingMs: props.delay ?? 5000` |
| `coil_pulse` | `relay_coil_latching` | `coilType: 'latching'` |
| `coil_flasher` | `relay_coil_flasher` | `flasherOnPeriodMs`, `flasherOffPeriodMs` |
| `contact_no` | `aux_contact_no` | `masterCoilTag: props.targetCoil` |
| `contact_nc` | `aux_contact_nc` | `masterCoilTag: props.targetCoil` |
| `overload_relay` | `thermal_overload` | `currentSettingAmps`, `tripState` |
| `motor_ind_3p` | `motor_3p` | `ratedPowerKw`, `runningStatus` |
| `lamp_indicator` | `indicator_lamp` | `color: props.lampColor ?? 'green'` |
| `junction_node` | `wire_junction` | Titik simpul ekuipotensial |

### 2.5. Aturan Penanganan Sanitasi dan Pemulihan (Fault Recovery)
1. **Dangling Wire Prevention**: Jika `fromSmrl` mendeteksi kawat yang merujuk pada `idElementNode` atau `idNode` yang tidak terdaftar, kawat tersebut dibuang (*pruned*) dan dicatat sebagai peringatan (*warning*), tanpa membatalkan pembacaan dokumen.
2. **Coordinate Grid Clamping**: Seluruh posisi elemen yang tidak tepat pada kisi 30px secara otomatis dibulatkan ke titik terdekat:
   $$x_{\text{clean}} = \text{Math.round}(x / 30) \times 30$$
3. **Legacy Port Index Translation**: Pada format lama yang menggunakan indeks angka berbasis urutan (`0, 1, 2`), adapter memetakan indeks tersebut ke nama tag terminal resmi (`A1`, `A2`, `13`, `14`, dst.) berdasarkan katalog komponen standar.

---

## 3. Simulation Engine Bridge (Event-Driven Lifecycle)

Jembatan simulasi mengisolasi kalkulasi fisika/grafik sirkuit dari antarmuka React UI. Engine berjalan secara deterministik dan mengirimkan payload perubahan keadaan (*state delta*) melalui arsitektur *event emitter*.

### 3.1. Engine Lifecycle Event Types

```typescript
export type SimulationStatus = 'STOPPED' | 'RUNNING' | 'PAUSED' | 'SHORT_CIRCUIT_TRIPPED';

export type PotentialValue =
  | 'NONE'
  | 'AC_L1'
  | 'AC_L2'
  | 'AC_L3'
  | 'AC_NEUTRAL'
  | 'PE'
  | 'DC_POS'
  | 'DC_NEG';

export interface EquipotentialNet {
  id: string;
  potential: PotentialValue;
  connectedPortUids: string[];    // Format: `${nodeId}:${portId}`
  wireIds: string[];
}

export interface NodeStateDelta {
  nodeId: string;
  activeFrame: number;
  isEnergized: boolean;
  statusText?: string;
  customState?: Record<string, unknown>;
}

export interface ShortCircuitFaultEvent {
  netId1: string;
  netId2: string;
  potentialConflict: [PotentialValue, PotentialValue];
  culpritNodeIds: string[];
  culpritWireIds: string[];
  timestampMs: number;
  message: string;
}

export interface TickEventPayload {
  tickNumber: number;
  deltaTimeMs: number;
  simulatedTimeMs: number;
  activeNetsCount: number;
  updatedNodes: NodeStateDelta[];
}

export interface StateChangeEventPayload {
  triggeredBy: 'USER_INPUT' | 'TIMER_EXPIRE' | 'TOR_TRIP' | 'CASCADE_CONDUCTION';
  timestampMs: number;
  changedNodes: NodeStateDelta[];
  energizedWires: string[];
}
```

### 3.2. Antarmuka Simulation Engine Bridge (`ISimulationEngineBridge`)

```typescript
export interface EngineBridgeConfig {
  tickIntervalMs: number;         // Durasi langkah per tick (default: 20ms = 50Hz)
  maxStabilizationIterations: number; // Batas iterasi loop BFS propagasi (default: 25)
  enableShortCircuitDetection: boolean;
  toleranceResistanceOhm: number;
}

export interface ISimulationEngineBridge {
  // Kontrol Siklus Hidup Engine
  loadCircuit(document: RelayFlowDocument): void;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  step(deltaTimeMs?: number): void;
  reset(): void;

  // Interaksi Pengguna Waktu Nyata
  toggleSwitch(nodeId: string): void;
  pressPushButton(nodeId: string): void;
  releasePushButton(nodeId: string): void;
  resetThermalOverload(nodeId: string): void;
  testThermalTrip(nodeId: string): void;

  // Event Subscription Hooks
  onTick(callback: (payload: TickEventPayload) => void): () => void;
  onStateChange(callback: (payload: StateChangeEventPayload) => void): () => void;
  onShortCircuit(callback: (fault: ShortCircuitFaultEvent) => void): () => void;
  onStatusChange(callback: (status: SimulationStatus) => void): () => void;
  onReset(callback: () => void): () => void;

  // Query Status
  getStatus(): SimulationStatus;
  getNetPotential(nodeId: string, portId: string): PotentialValue;
}
```

### 3.3. Pipeline Eksekusi Per Tick (Execution Step Pipeline)

```
[ Tick Trigger / Event Interaksi ]
                │
                ▼
┌──────────────────────────────────────────────┐
│ 1. Evaluasi Input Interaktif & Timer FSM     │
│    - Tambahkan akumulasi waktu timer         │
│    - Perbarui status internal FSM            │
└──────────────────────┬───────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────┐
│ 2. Rekonstruksi Net Ekuipotensial (BFS Walk) │
│    - Himpun port sumber potensial            │
│    - Telusuri edge kabel & internalPaths     │
│      yang bernilai isConducting === true     │
└──────────────────────┬───────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────┐
│ 3. Validasi Keamanan (Short Circuit Check)   │
│    - Apakah terdapat net bermuatan           │
│      bertemu net polaritas berlawanan        │
│      tanpa beban serial?                     │
└──────────────────────┬───────────────────────┘
        │                              │
     (Ya)                           (Tidak)
        ▼                              ▼
┌──────────────────────┐   ┌──────────────────────────────────────────────┐
│ Memicu Fault:        │   │ 4. Evaluasi Beban (Coil, Lamp, Motor)        │
│ onShortCircuit(...)  │   │    - Hitung beda potensial (A1 vs A2, dst.)  │
│ Hentikan Eksekusi    │   │    - Ubah status beban (energized / off)     │
└──────────────────────┘   └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                           ┌──────────────────────────────────────────────┐
                           │ 5. Tag Coupling Resolution                   │
                           │    - Sinkronkan kontak pembantu NO/NC        │
                           │      dengan koil ber-tag identik             │
                           └──────────────────────┬───────────────────────┘
                                               │
                                Apakah kontak berubah?
                                  ├─ Ya  ──> Kembali ke Langkah 2 (Maks 25x)
                                  └─ Tidak ─> Pancarkan onTick / onStateChange
```

---

## 4. State Machine Definition (FSM)

Komponen waktu dan proteksi industri mengandalkan mesin keadaan berhingga (*finite state machine*) yang deterministik untuk menjamin keandalan simulasi.

### 4.1. Timer Relay State Machines

#### A. On-Delay Timer Coil (TON)
Kontak bantu akan menunda penutupan/pembukaan selama waktu $T_{\text{delay}}$ setelah koil diberi tegangan penuh secara terus-menerus. Jika tegangan hilang sebelum waktu tercapai, timer langsung kembali ke awal (*reset*).

```
          [ DE_ENERGIZED ] ◄─────────────────────────┐
                 │                                   │
       Tegangan A1-A2 Aktif                 Tegangan A1-A2 Hilang
                 │                                   │
                 ▼                                   │
            [ TIMING ] ──────────────────────────────┤
                 │                                   │
       Waktu >= T_delay                              │
                 │                                   │
                 ▼                                   │
      [ TIMED_OUT_ENERGIZED ] ───────────────────────┘
```

- **Definisi State**:
  - `DE_ENERGIZED`: Koil tidak bertegangan. Output kontak bantu berada pada posisi default (NO tetap terbuka, NC tetap tertutup). `accumulatedTime = 0`.
  - `TIMING`: Tegangan aktif pada A1-A2. Waktu terakumulasi: $\text{accumulatedTime} += \Delta t$. Output kontak bantu belum berubah.
  - `TIMED_OUT_ENERGIZED`: Waktu $\ge T_{\text{delay}}$. Output kontak bantu aktif (NO menutup, NC membuka). Tetap bertahan selama tegangan A1-A2 ada.

```typescript
export interface OnDelayTimerFSM {
  state: 'DE_ENERGIZED' | 'TIMING' | 'TIMED_OUT_ENERGIZED';
  accumulatedTimeMs: number;
  presetTimeMs: number;
  outputActive: boolean;
}
```

---

#### B. Off-Delay Timer Coil (TOF)
Saat koil menerima tegangan, kontak langsung berpindah posisi seketika. Ketika tegangan dilepas, kontak tetap bertahan pada posisi aktif selama $T_{\text{delay}}$ sebelum kembali ke posisi normal.

```
          [ DE_ENERGIZED ] ◄─────────────────────────┐
                 │                                   │
       Tegangan A1-A2 Aktif                  Waktu >= T_delay
                 │                                   │
                 ▼                                   │
          [ ENERGIZED ]                              │
                 │                                   │
       Tegangan A1-A2 Hilang                         │
                 │                                   │
                 ▼                                   │
        [ TIMING_OFF_DELAY ] ────────────────────────┘
                 │
       Tegangan A1-A2 Kembali
                 │
                 ▼
          [ ENERGIZED ]
```

- **Definisi State**:
  - `DE_ENERGIZED`: Output kontak bantu tidak aktif (posisi normal). `accumulatedTime = 0`.
  - `ENERGIZED`: Tegangan ada pada A1-A2. Output kontak bantu seketika aktif. `accumulatedTime = 0`.
  - `TIMING_OFF_DELAY`: Tegangan A1-A2 hilang. Kontak bantu tetap aktif, $\text{accumulatedTime} += \Delta t$. Jika waktu mencapai $T_{\text{delay}}$, transisi ke `DE_ENERGIZED`. Jika tegangan A1-A2 menyala kembali saat timing, kembali ke `ENERGIZED` dan reset timer.

```typescript
export interface OffDelayTimerFSM {
  state: 'DE_ENERGIZED' | 'ENERGIZED' | 'TIMING_OFF_DELAY';
  accumulatedTimeMs: number;
  presetTimeMs: number;
  outputActive: boolean;
}
```

---

#### C. Latching / Impulse Relay (Bistable Relay)
Relay impuls mengubah status output secara permanen setiap kali mendeteksi pulsa transisi positif (*rising edge*) pada input koil.

```
                  ┌───────────────────────────────┐
                  ▼                               │
              [ STATE_0 ] ──(Rising Edge Pulse)───┤
                  │                               │
                  ▼                               │
              [ STATE_1 ] ──(Rising Edge Pulse)───┘
```

- **Definisi State**:
  - `STATE_0`: Status output koil rendah (`outputActive = false`). Kontak normal.
  - `STATE_1`: Status output koil tinggi (`outputActive = true`). Kontak aktif tertutup/terbuka.
- **Transisi**:
  - Transisi hanya terjadi jika kondisi input berubah dari `voltagePresent === false` menjadi `voltagePresent === true` (*edge detection*). Sinyal tegangan konstan tidak mengubah keadaan berulang kali.

```typescript
export interface LatchingRelayFSM {
  currentState: 0 | 1;
  previousInputVoltage: boolean;
  outputActive: boolean;
}
```

---

#### D. Flasher / Asymmetric Pulse Timer Coil
Relay berkedip periodik yang berganti keadaan terus menerus selama koil menerima tegangan.

```
          [ DE_ENERGIZED ] ◄─────────────────────────┐
                 │                                   │
       Tegangan A1-A2 Aktif                 Tegangan A1-A2 Hilang
                 │                                   │
                 ▼                                   │
          [ PULSE_ON ] ──────────────────────────────┤
                 │                                   │
       Waktu >= T_on                                 │
                 │                                   │
                 ▼                                   │
          [ PULSE_OFF ] ─────────────────────────────┘
                 │
       Waktu >= T_off
                 │
                 ▼
          [ PULSE_ON ]
```

- **Definisi State**:
  - `DE_ENERGIZED`: Koil mati, output tidak aktif, timer reset ke 0.
  - `PULSE_ON`: Output koil aktif (`outputActive = true`), timer menghitung waktu ON ($T_{\text{on}}$). Saat habis, berpindah ke `PULSE_OFF`.
  - `PULSE_OFF`: Output koil tidak aktif (`outputActive = false`), timer menghitung waktu OFF ($T_{\text{off}}$). Saat habis, berpindah kembali ke `PULSE_ON`.

```typescript
export interface FlasherTimerFSM {
  state: 'DE_ENERGIZED' | 'PULSE_ON' | 'PULSE_OFF';
  accumulatedTimeMs: number;
  tOnMs: number;
  tOffMs: number;
  outputActive: boolean;
}
```

---

### 4.2. Thermal Overload Relay (TOR) Trip & Reset Lifecycle

Thermal Overload Relay memodelkan pemanasan bimetal berdasarkan arus kuadrat yang melewatinya ($I^2 t$).

```
                ┌──────────────────────────────────────────────────┐
                │                                                  │
                ▼                                                  │
            [ NORMAL ] ──(I_load > I_setting x TripCurve)──┐       │
                ▲                                          │       │
                │                                          ▼       │
                │                                     [ TRIPPED ]  │
                │                                          │       │
    (Suhu < Batas Aman &                                   │       │
     Tombol Reset Ditekan)                                 ▼       │
                │                              [ COOLING_LOCKED ]  │
                │                                          │       │
                └──────────────────────────────────────────┴───────┘
```

#### Siklus Keadaan TOR:
1. **NORMAL**:
   - Kapasitas termal $C_{\text{thermal}} \in [0\%, 100\%)$.
   - Jalur konduksi utama (1-2, 3-4, 5-6) tertutup.
   - Kontak bantu proteksi 95-96 (NC) tertutup.
   - Kontak bantu indikasi 97-98 (NO) terbuka.
   - Jika arus beban $I_{\text{load}} > I_{\text{setting}}$, akumulasi panas bertambah:
     $$\Delta C_{\text{thermal}} = \left(\left(\frac{I_{\text{load}}}{I_{\text{setting}}}\right)^2 - 1\right) \times \frac{\Delta t}{\tau_{\text{heating}}}$$

2. **TRIPPED**:
   - Dipicu seketika saat $C_{\text{thermal}} \ge 100\%$.
   - Kontak 95-96 (NC) terbuka seketika untuk memutus sirkit kendali koil.
   - Kontak 97-98 (NO) menutup seketika untuk menyalakan lampu sinyal gangguan.
   - Status visual bimetal berubah menjadi indikasi *trip*.

3. **COOLING_LOCKED (Pendinginan Bimetal)**:
   - Panas bimetal menurun secara eksponensial menuju suhu ruang:
     $$C_{\text{thermal}}(t) = C_{\text{thermal}}(0) \cdot e^{-t / \tau_{\text{cooling}}}$$
   - Selama $C_{\text{thermal}} > 35\%$ (ambang batas aman reset), mekanisme mekanis terkunci dan menolak perintah reset.

4. **RESET TRANSITION**:
   - Jika `resetMode === 'MANUAL'`: Pengguna wajib memanggil aksi `resetThermalOverload(nodeId)` setelah kapasitas termal turun di bawah 35%. Kontak kembali ke posisi NORMAL.
   - Jika `resetMode === 'AUTO'`: Sistem otomatis mereset keadaan ke NORMAL begitu kapasitas termal turun di bawah 35%.

```typescript
export interface ThermalOverloadFSM {
  state: 'NORMAL' | 'TRIPPED' | 'COOLING_LOCKED';
  thermalCapacityPercent: number; // 0.0 sampai 100.0%
  currentSettingAmps: number;
  actualCurrentAmps: number;
  resetMode: 'MANUAL' | 'AUTO';
  canReset: boolean;              // true jika thermalCapacityPercent < 35%
  contacts: {
    nc95_96_closed: boolean;      // true saat NORMAL, false saat TRIPPED/COOLING_LOCKED
    no97_98_closed: boolean;      // false saat NORMAL, true saat TRIPPED/COOLING_LOCKED
  };
}
```

---

## 5. Ringkasan Integrasi Arsitektur

Dengan kontrak data di atas:
1. **Editor Kanvas (React / SVG)** hanya perlu memetakan koleksi `nodes` dan `edges` ke elemen visual `<g>` dan `<path>`, serta mengirimkan event interaksi (`toggleSwitch`, `pressPushButton`, `resetThermalOverload`) ke `SimulationEngineBridge`.
2. **Simulation Engine** mengevaluasi graph secara *headless*, deterministik, dan tanpa ketergantungan pada DOM/React, memperbarui net potensial, dan memancarkan delta status (`NodeStateDelta`) untuk dirender secara efisien tanpa *render storm*.
3. **Format `.smrl`** dipertahankan dengan kompatibilitas penuh melalui `SmrlAdapter`, memastikan interoperabilitas dengan data skema sirkuit yang ada.
