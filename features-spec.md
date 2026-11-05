# Spesifikasi Fitur Inti (Editor & Logic System)

> Dokumen spesifikasi fungsional untuk fitur-fitur wajib (*must-have features*) pada Web Relay Simulator: seleksi blok, sistem undo/redo, duplikasi cerdas, percabangan kawat, relasi tag, dan validasi sirkuit.

---

## 1. Sistem Seleksi Blok & Manipulasi Grup (Block Operations)

Kemudahan manipulasi banyak komponen sekaligus adalah standar utama diagram editor modern.

### 1.1. Mekanisme Seleksi
- **Single Click**: Memilih satu komponen atau satu kawat (menjadi active target).
- **Shift + Click**: Menambah atau mengurangi elemen dari daftar seleksi aktif (`selectedIds: Set<string>`).
- **Marquee Selection (Box Drag)**:
  - Drag mouse pada area kosong kanvas membentuk bounding box persegi transparan (biru lembut).
  - Elemen yang berada di dalam atau berpotongan dengan area box otomatis masuk ke daftar seleksi.
  - Menghitung koordinat minimal ($x_{\min}, y_{\min}$) dan maksimal ($x_{\max}, y_{\max}$) untuk membentuk grup *bounding box*.

### 1.2. Manipulasi Blok
- **Group Move (Drag Bersama)**:
  - Menggeser salah satu elemen yang terseleksi akan menggeser seluruh elemen lain dalam grup dengan delta jarak yang sama ($\Delta x, \Delta y$).
  - Tetap patuh pada grid snapping 30px.
  - **Kabel Internal vs Eksternal**:
    - Kabel yang menghubungkan sesama elemen dalam blok akan bergeser utuh tanpa mengubah bentuk relatif.
    - Kabel yang menghubungkan elemen blok ke elemen di luar blok akan meregang secara dinamis mengikuti pergeseran.
- **Block Delete (Hapus Massal)**:
  - Menghapus semua elemen terpilih beserta seluruh kabel yang menempel pada elemen-elemen tersebut (tidak menyisakan kabel mengambang / *dangling wires*).
- **Block Rotate**:
  - Memutar seluruh blok 90° terhadap titik pusat massa (*bounding box center*) grup seleksi.

---

## 2. Arsitektur Undo / Redo (History Stack)

Simulator tidak boleh menggunakan mutasi state langsung yang merusak histori. Dibutuhkan sistem histori yang andal.

### 2.1. Pola Implementasi (Command Pattern / Patch-based)
Gunakan pendekatan **Command History Stack** dengan batasan ukuran (misal: 50 langkah terakhir):

```typescript
interface HistoryAction {
  id: string;
  type: 
    | 'ADD_ELEMENT' 
    | 'DELETE_ELEMENTS' 
    | 'MOVE_ELEMENTS' 
    | 'ROTATE_ELEMENT' 
    | 'ADD_WIRE' 
    | 'DELETE_WIRES' 
    | 'MODIFY_WIRE_MARGIN'
    | 'CHANGE_TAG'
    | 'PASTE_BLOCK';
  timestamp: number;
  undo: () => void; // Mengembalikan state ke sebelum aksi
  redo: () => void; // Menjalankan ulang aksi
}
```

### 2.2. Transaction Batching (Atomic Action)
- Aksi seperti **Drag Move** atau **Paste Blok** melibatkan puluhan elemen dan kabel sekaligus.
- Seluruh perubahan tersebut dibungkus dalam satu transaksi atomik (`beginBatch() -> execute -> commitBatch()`).
- Saat pengguna menekan `Ctrl+Z`, satu grup langkah tersebut di-undo sekaligus, bukan per elemen satu per satu.

---

## 3. Duplikasi Cerdas & Auto-Increment Tag (Smart Duplicate)

Ketika sebuah blok komponen diduplikasi (via `Ctrl+C` $\rightarrow$ `Ctrl+V` atau `Ctrl+D`):

### 3.1. Re-mapping ID & Kawat
1. Buat mapping ID lama ke ID baru: `Map<oldId, newId>`.
2. Offset posisi hasil paste sebesar `+30px, +30px` dari posisi aslinya agar tidak menumpuk.
3. Kawat yang menghubungkan antar komponen **di dalam blok yang disalin** akan ikut diduplikasi dengan referensi ID yang baru (`idElementNode1 = idMap[old1]`). Kawat eksternal tidak disalin.

### 3.2. Smart Tag Increment (Pencegah Tabrakan Logika)
- Jika koil `-KM1` disalin, tag otomatis berubah menjadi `-KM2` (mencari indeks angka tertinggi berikutnya).
- Kontak-kontak bantu yang ikut disalin bersama koil tersebut **otomatis diselaraskan tag-nya ke `-KM2`** sehingga relasi internal rangkaian tetap utuh.
- Jika pengguna hanya menyalin kontak tanpa koil, sistem mempertahankan tag aslinya untuk memungkinkan penambahan kontak bantu baru pada koil yang sudah ada.

---

## 4. Percabangan Kawat (Wire Junction & Crossing)

Di dalam skema kelistrikan industri, wajib membedakan antara kawat yang **bersilangan (tanpa kontak)** dan kawat yang **tersambung (junction)**:

### 4.1. Titik Sambungan (Junction Dot)
- Menggunakan komponen sambungan: `junction2p`, `junction3p`, `junction4p`, `junctionPE`.
- Simbol visual berupa titik bulat hitam/pekat di pertemuan kawat.
- Menjadi simpul ekuipotensial bagi seluruh kawat yang bermuara di titik tersebut.

### 4.2. Wire Bridge / Crossing (Garis Bersilangan)
- Jika dua kawat berpotongan di kanvas tanpa adanya komponen `junction`, kawat tersebut dianggap **terisolasi satu sama lain**.
- Visual: Kawat vertikal melompat (bridge arc) atau melintas lurus tanpa titik simpul untuk mempertegas bahwa tidak ada arus yang berpindah.

---

## 5. Tag Renaming & Auto-Linking

Relasi antar simbol diatur secara deklaratif lewat `tag`:

- **Sinkronisasi Otomatis**: Jika pengguna mengubah tag koil dari `-K1` menjadi `-KA1`, seluruh kontak NO/NC bertag `-K1` dapat ditawarkan opsi dialog:  
  *"Ubah seluruh 4 kontak bantu terkait ke -KA1?"*
- **Cross-Reference Indicator**: Di samping simbol koil ditampilkan daftar kontak bantu yang sedang aktif di kanvas (misal: `-KM1 [NO: 13-14, 23-24 | NC: 11-12]`), memudahkan pembacaan skema besar.

---

## 6. Live Diagnostics & Error Validation

Saat simulasi berjalan, engine wajib mengevaluasi kondisi bahaya dan peringatan:

| Kondisi Error / Warning | Tingkat Keparahan | Respons Sistem |
| :--- | :--- | :--- |
| **Short Circuit (Hubung Singkat)** | FATAL | Simulasi dihentikan seketika. Kawat penyebab di-highlight merah berkedip. Dialog: *"Short circuit detected! Simulation stopped."* |
| **Series Connection of Coils** | WARNING / REJECT | Dua koil terpasang seri di jalur beban ditolak/diberi peringatan: *"Series connection of coils and general loads is not simulated."* |
| **Coil Under-voltage / Floating** | INFO | Koil hanya tersambung satu kutub (misal A1 ada tegangan tapi A2 mengambang) $\rightarrow$ Koil tetap mati (*de-energized*). |
| **Thermal Overload Tripped** | STATE | Status trip aktif: kontak NC 95-96 membuka, NO 97-98 menutup. Membutuhkan interaksi klik reset manual. |

---

## 7. Pemetaan Tombol Pintas (Keyboard Shortcuts Map)

| Shortcut | Aksi |
| :--- | :--- |
| `Space + Drag` | Pan kanvas secara bebas |
| `Scroll Wheel` | Zoom in / Zoom out berpusat di kursor |
| `Ctrl / Cmd + Z` | Undo aksi terakhir |
| `Ctrl / Cmd + Shift + Z` / `Ctrl + Y` | Redo aksi |
| `Ctrl / Cmd + C` | Salin elemen terpilih ke clipboard |
| `Ctrl / Cmd + V` | Tempel elemen dari clipboard |
| `Ctrl / Cmd + D` | Duplikasi langsung elemen terpilih |
| `Delete` / `Backspace` | Hapus elemen / kawat terpilih |
| `R` | Putar elemen terpilih 90° searah jarum jam |
| `Ctrl / Cmd + A` | Pilih semua elemen di kanvas |
| `Escape` | Batalkan penarikan kawat aktif / Deselect all |
| `F5` / `Space` (di luar drag) | Toggle Start / Stop simulasi |
