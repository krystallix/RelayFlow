# RelayFlow — Plan 2: Cloud Storage, Authentication, Sharing & Viewer Mode

Dokumen rencana komprehensif implementasi fitur Autentikasi (Supabase / Self-hosted), Penyimpanan Proyek Cloud, Share Link publik, Dialog/Modal terpadu di dalam kanvas (tanpa pindah halaman), serta Mode Viewer interaktif (Simulasi aktif, edit terproteksi).

---

## 1. Ikhtisar & Prinsip Kerja

1. **Guest / Local-First Experience:**
   - Pengunjung baru dapat langsung mendesain rangkaian dan menjalankan simulasi tanpa registrasi.
   - Perubahan disimpan otomatis ke `localStorage`.
   - Ekspor/impor file `.rflow` dan `.smrl` tetap tersedia.
2. **Seamless In-Canvas Modals:**
   - Semua alur otentikasi, pengelolaan proyek (*My Projects*), dan pembagian tautan (*Share*) menggunakan dialog modal di atas kanvas editor. Tidak ada pengalihan halaman (*page redirection*) yang memutus konteks kerja pengguna.
3. **Aturan Akses Rangkaian Publik (Share Link `/c/[id]`):**
   - **Pengunjung Belum Login (Unauthenticated):**
     - Membuka tautan sebagai **Viewer**.
     - **Simulasi 100% Aktif:** Pengunjung bebas menjalankan simulasi (Play/Stop), menekan saklar NO/NC, tombol tekan (push-button), emergency stop, reset overload, dan voltmeter/probe HUD.
     - **Edit Terkunci:** Komponen tidak bisa digeser/dihapus, kabel tidak bisa diubah/diputus, dan sidebar palette disembunyikan.
     - **Mau Mengedit?** Pengunjung menekan tombol **"Fork to Edit"** $\rightarrow$ Muncul dialog Login/Register $\rightarrow$ Rangkaian diduplikasi ke akun mereka sebagai proyek baru yang bebas diedit.
   - **Pengguna Terautentikasi (Authenticated Owner):**
     - Memiliki hak akses penuh untuk menyimpan pembaruan ke Cloud, mengganti judul, menghapus, atau membagikan link rangkaian.

---

## 2. Diagram Alur Pengguna (User Flow)

```
[ Pengunjung Masuk ]
        │
        ├── 1. Mode Lokal (Guest / Belum Login)
        │      ├── Bebas menggambar rangkaian & simulasi di kanvas
        │      ├── Tersimpan otomatis di localStorage
        │      └── Ingin "Save to Cloud" atau "Share Link":
        │             └──> Buka AuthModal (Login/Register)
        │                     └──> Sukses Login ──> Upload rangkaian ke Cloud ──> Buka ShareModal
        │
        ├── 2. Mode Cloud (Sudah Login / Owner)
        │      ├── Indikator status: "● Cloud Synced"
        │      ├── Tombol "Share" ──> Buka ShareModal dengan link publik unik (/c/[id])
        │      └── Tombol "My Projects" ──> Buka ProjectsModal (buka/hapus/duplikasi proyek tersimpan)
        │
        └── 3. Mengakses Link Share (/c/[id]) ──> Mode Viewer
               ├── Data rangkaian diambil langsung dari Database
               ├── Sidebar Palette disembunyikan
               ├── Komponen & kabel terkunci (tidak bisa dipindah / dihapus)
               ├── SIMULASI AKTIF 100% (Play, Stop, klik saklar, push-button, multimeter probe)
               └── Ingin Mengedit?
                      └── Klik "Fork to Edit"
                             ├── Belum Login ──> Buka AuthModal
                             └── Sudah Login ──> Duplikasi rangkaian ke akun pengguna & buka Editor
```

---

## 3. TodoList Bertahap Berdasarkan Fungsi

### **Fase 1: Antarmuka Pengguna (UI & Modals)**
*Membangun komponen dialog modal bergaya CAD industri monokrom (dark & light mode) serta pembaruan bilah navigasi.*

- [x] **1.1. Komponen `AuthModal` (`src/components/modals/AuthModal.tsx`)**
  - Tab beralih cepat: **Sign In** $\longleftrightarrow$ **Sign Up** tanpa reload halaman.
  - Login sosial: **Google** dan **GitHub** dengan ikon SVG bersih.
  - Form input: Email & Password dengan penanganan pesan error yang informatif.
  - Indikator status loading saat autentikasi berlangsung.
  - Callback penyelesaian: otomatis menutup modal dan melanjutkan aksi tertunda (misal: auto-save atau generate share link).
  - Tema monokrom industri yang serasi dengan kanvas dark/light.

- [x] **1.2. Komponen `ProjectsModal` (`src/components/modals/ProjectsModal.tsx`)**
  - Dialog daftar kartu proyek cloud milik pengguna yang sedang login.
  - Informasi kartu: Nama rangkaian, tanggal pembaruan terakhir, total komponen & kabel.
  - Aksi per kartu:
    - Tombol **Open**: Memuat proyek langsung ke kanvas kerja.
    - Tombol **Share**: Membuka dialog tautan publik untuk proyek tersebut.
    - Tombol **Delete**: Menghapus proyek dari database (dengan konfirmasi).
  - Tombol **"+ New Blank Project"** untuk membuat kanvas baru.
  - Tampilan kondisi kosong (*empty state*) yang rapi jika belum ada proyek tersimpan.

- [x] **1.3. Komponen `ShareModal` (`src/components/modals/ShareModal.tsx`)**
  - Input teks read-only berisi URL publik: `https://[domain]/c/[id]`.
  - Tombol **"Copy Link"** dengan transisi feedback visual (*"Copied!"*).
  - Teks instruksi hak akses: *"Viewer: Anyone with this link can view and run interactive simulations."*

- [x] **1.4. Pembaruan `TopNavbar` (`src/components/layout/TopNavbar.tsx`)**
  - **Badge Status Penyimpanan:**
    - `● Local Storage` (saat bekerja lokal / belum login).
    - `● Cloud Synced` (saat rangkaian tersinkron ke cloud).
    - `● Viewer Mode` (saat membuka link share rangkaian).
  - **Tombol Aksi Utama:**
    - Tombol **"Share"** (ikon tautan / bagikan).
    - Jika *Guest*: Tombol **"Login / Sign Up"**.
    - Jika *Logged In*: Tombol **"My Projects"** + Menu Profil Pengguna (Avatar/Email & opsi Logout).
  - **Khusus Viewer Mode:**
    - Tombol **"Fork to Edit"** (jika belum login $\rightarrow$ buka `AuthModal`; jika sudah login $\rightarrow$ buat salinan ke akun pengguna).

---

### **Fase 2: State Management & Integrasi Klien Supabase**
*Menghubungkan antarmuka dengan state global Zustand dan pustaka klien Supabase.*

- [x] **2.1. Inisialisasi Klien Supabase (`src/lib/supabase.ts`)**
  - Integrasi `@supabase/supabase-js` dengan pembacaan dari environment variable:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Fallback aman: jika env belum diisi, aplikasi tetap beroperasi normal pada mode lokal tanpa crash/error runtime.

- [x] **2.2. Store Autentikasi (`src/store/useAuthStore.ts`)**
  - State: `user`, `session`, `isLoading`.
  - Action: `signInWithEmail`, `signUpWithEmail`, `signInWithOAuth` (Google & GitHub), `signOut`, `initAuth`.

- [x] **2.3. Ekstensi Store Rangkaian (`src/store/useCircuitStore.ts`)**
  - State tambahan:
    - `currentProjectId: string | null`
    - `isCloudSynced: boolean`
    - `isReadOnlyViewer: boolean`
  - Action tambahan:
    - `setCloudProjectId`
    - `setIsCloudSynced`
    - `setIsReadOnlyViewer`
    - `ProjectsService.saveProject(...)` & `ProjectsService.getProjectById(...)`

---

### **Fase 3: Skema Database & Row Level Security (RLS)**
*Konfigurasi skema PostgreSQL dan hak akses data pada Supabase / Self-Hosted.*

- [x] **3.1. Struktur Tabel `projects`**
  ```sql
  create table public.projects (
    id text primary key,             -- ID unik pendek (contoh: nanoid 'c_8k2m9x')
    owner_id uuid references auth.users(id) on delete set null,
    title text not null default 'Untitled Circuit',
    data jsonb not null,             -- Berisi { nodes, wires, settings }
    is_public boolean default true,  -- true agar dapat diakses oleh publik via link
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
  ```

- [x] **3.2. Konfigurasi Kebijakan RLS (Row Level Security)**
  ```sql
  alter table public.projects enable row level security;

  -- 1. Publik diizinkan membaca jika is_public = true (Kunci untuk Viewer Mode)
  create policy "Public viewable" on public.projects
    for select using (is_public = true or auth.uid() = owner_id);

  -- 2. Pengguna login dapat membuat proyek baru
  create policy "User insert" on public.projects
    for insert with check (auth.uid() = owner_id);

  -- 3. Hanya pemilik proyek yang dapat mengupdate atau menghapus
  create policy "Owner update" on public.projects
    for update using (auth.uid() = owner_id);

  create policy "Owner delete" on public.projects
    for delete using (auth.uid() = owner_id);
  ```

---

### **Fase 4: Rute Viewer (`/c/[id]`) & Proteksi Interaksi Kanvas**
*Mengatur kanvas agar aman dari manipulasi posisi namun tetap interaktif penuh untuk simulasi kelistrikan.*

- [x] **4.1. Halaman Rute Next.js Dinamis (`src/app/c/[id]/page.tsx`)**
  - Mengambil data proyek dari database Supabase berdasarkan parameter URL `id`.
  - Penanganan kondisi jika ID tidak ditemukan (*Circuit Not Found*).
  - Mengeset flag `isReadOnlyViewer = true` pada state editor.

- [x] **4.2. Penguncian Hak Edit pada Viewer Mode**
  - Menyembunyikan bilah komponen samping (*Sidebar NodePalette*).
  - Menonaktifkan drag pemindahan posisi komponen (`onNodeMouseDown` dinonaktifkan untuk perpindahan posisi).
  - Menonaktifkan pembuatan kabel baru dan penggeseran segmen kabel.
  - Memblokir tombol keyboard `Delete` dan `Backspace` agar simbol/kabel tidak terhapus.
  - Membatasi menu klik kanan (context menu) agar tidak memunculkan opsi manipulasi.

- [x] **4.3. Menjamin Interaktivitas Simulasi 100% pada Viewer Mode**
  - Tombol Run/Stop simulasi pada `SubToolbar` tetap aktif dan dapat diklik.
  - Elemen interaktif tetap responsif saat simulasi berjalan:
    - Saklar toggle NO/NC dan pemutus arus (breaker).
    - Tombol tekan (*push-button* dan *emergency stop*).
    - Reset rele beban lebih termal (*thermal overload*).
    - Multimeter / Voltage Probe HUD tetap dapat diarahkan ke terminal komponen dan kabel.
  - Navigasi kanvas (Pan, Zoom, Minimap Navigator) berfungsi mulus tanpa batasan.

---

## 4. Keamanan & Stabilitas
- Sanitasi input dan proteksi data JSONB rangkaian dari payload berbahaya.
- Penanganan status offline / koneksi lambat saat memuat proyek cloud.
- Konfirmasi sebelum menghapus proyek dari daftar *My Projects*.
