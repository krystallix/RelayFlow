export type ChangelogItemType = "added" | "fixed" | "improved";

export interface ChangelogItem {
  type: ChangelogItemType;
  en: string;
  id: string;
}

export interface ChangelogRelease {
  version: string;
  date: string;
  title: {
    en: string;
    id: string;
  };
  items: ChangelogItem[];
}

export const CURRENT_CHANGELOG_VERSION = "1.2.0";
export const CHANGELOG_STORAGE_KEY = "relayflow_seen_changelog_version";

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: "1.2.0",
    date: "2026-11-24",
    title: {
      en: "Component Flip, Detailed BOM & Mobile Fixes",
      id: "Flip Komponen, Detail BOM & Perbaikan Mobile",
    },
    items: [
      {
        type: "added",
        en: "Horizontal & Vertical component flip with automatic port re-routing and upright symbol labels",
        id: "Fitur Flip Horizontal & Vertikal pada komponen dengan re-routing kabel otomatis dan label tetap tegak",
      },
      {
        type: "added",
        en: "Expandable BOM Summary breakdown showing Relay & Contactor contact specs (e.g. Relay 2 Contact — 1 NO 1 NC)",
        id: "Dropdown detail BOM Summary yang menampilkan jumlah kontak bantu Relay & Kontaktor (misal: Relay 2 Contact — 1 NO 1 NC)",
      },
      {
        type: "added",
        en: "Desktop Component Library sidebar toggle button and Ctrl/Cmd+B shortcut",
        id: "Tombol sembunyikan/tampilkan sidebar Library Komponen di desktop beserta shortcut Ctrl/Cmd+B",
      },
      {
        type: "added",
        en: "Strict View-Only share link mode (blocks Fork, Select/Copy/Paste, and raw .rflow/.smrl export) with owner-only Open in Editor",
        id: "Mode View-Only ketat pada link share (blokir Fork, Select/Copy/Paste, dan export raw .rflow/.smrl) serta tombol Buka di Editor khusus pemilik",
      },
      {
        type: "added",
        en: "Floating Wire Action Popover for quick wire deletion and path reset on mobile & desktop",
        id: "Floating Wire Action Popover untuk hapus kabel dan reset jalur dengan cepat di mobile & desktop",
      },
      {
        type: "improved",
        en: "Restored View Preferences trigger in navbar & mobile menu (wire width, label sizes, grid settings) and added outward port offset on motor symbols",
        id: "Mengembalikan tombol Preferensi Tampilan di navbar & menu mobile (ketebalan kabel, ukuran label, grid) serta menambahkan offset port pada simbol motor",
      },
      {
        type: "fixed",
        en: "Mobile dynamic viewport height (dvh) so bottom floating dock & sheet tabs are no longer covered by browser navbars",
        id: "Perbaikan tinggi viewport mobile (dvh) agar floating bar bawah & tab sheet tidak lagi tertutup navbar browser",
      },
      {
        type: "fixed",
        en: "Mobile wire corner dragging no longer overridden by canvas pan, and multi-select tap properly adds components without resetting",
        id: "Geser sudut kabel di mobile tidak lagi tertimpa pan kanvas, dan tap komponen di mode multi-select tidak lagi reset ke single-select",
      },
      {
        type: "fixed",
        en: "BOM classification accuracy for multi-pole power contactors vs. 1P/auxiliary contacts",
        id: "Perbaikan akurasi perhitungan BOM untuk power contactor multi-pole vs. kontak bantu / 1P",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-11-22",
    title: {
      en: "Multi-Sheet Projects & 2D Wire Waypoints",
      id: "Multi-Sheet & Jalur Kabel 2D",
    },
    items: [
      {
        type: "added",
        en: "Multi-sheet tabs bar with drag-to-reorder, rename, duplicate, and editable Text symbol",
        id: "Bar tab Multi-Sheet dengan drag-reorder, ubah nama, duplikasi, serta simbol Teks yang dapat diedit",
      },
      {
        type: "added",
        en: "Mobile Multi-Select mode, 2D wire corner waypoint dragging, and U-bend creation on straight wires",
        id: "Mode Multi-Select mobile, geser sudut kabel 2D, dan pembuatan lekukan U otomatis pada kabel lurus",
      },
      {
        type: "improved",
        en: "Per-user persisted Grid preferences (Major/Sub-Grid) and blue neutral return wire visualization",
        id: "Penyimpanan preferensi Grid per akun (Grid Utama/Sub-Grid) dan warna biru untuk kabel netral saat simulasi",
      },
      {
        type: "fixed",
        en: "Inline text & comment edits now save reliably on blur before unmounting",
        id: "Edit teks & komentar inline kini tersimpan otomatis saat kehilangan fokus (blur)",
      },
    ],
  },
];

export function hasSeenCurrentChangelog(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(CHANGELOG_STORAGE_KEY) === CURRENT_CHANGELOG_VERSION;
  } catch {
    return true;
  }
}

export function markCurrentChangelogSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHANGELOG_STORAGE_KEY, CURRENT_CHANGELOG_VERSION);
  } catch {
    // Ignore storage quota or private mode errors
  }
}
