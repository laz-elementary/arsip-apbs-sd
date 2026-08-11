export interface IncomeRecord {
  id: string;
  incomeNo: string;
  date: string;
  sourceCategory: string; // e.g., "SPP Sekolah", "Uang Pangkal", "Dana BOS", "Dana Yayasan", "Lain-lain"
  amount: number;
  description: string;
  receivedBy: string;
  month: number;
}

export interface APBSItem {
  id: string;
  code: string; // Kode APBS Internal (e.g., "1077")
  sekdirCode: string; // Kode APBS Sekdir (e.g., "SKD-1077" or "1077-A")
  description: string; // Nama Barang / Kegiatan
  category: string; // e.g. "Administrasi & Mgt. Pendidikan", "Kegiatan Sekolah", etc.
  activity: string; // e.g. "Iuran Diknas", "Display Kelas", "UKS/Medis"
  grade: string; // "1", "2", "3", "4", "5", "6", "All"
  unit: string; // "SD"
  type: "INCOME" | "EXPENSE";
  unitPrice: number;
  totalQty: number;
  totalBudget: number; // Dana Awal Alokasi 1 Tahun
  usedBudget: number; // Total Dana Terpakai saat ini
  remainingBudget: number; // Sisa Dana APBS saat ini
  monthlyBudget: Record<number, number>; // Month 7 (Juli) to 6 (Juni)
  notes?: string;
  isSekdirSynced: boolean;
  isNonApbs?: boolean;
}

export type TransactionStatus = "APPROVED" | "PENDING" | "REJECTED" | "REALLOCATED";

export type WarningLevel = "OK" | "LOW_BUDGET" | "EXHAUSTED" | "OVERBUDGET";

export interface Transaction {
  id: string;
  transactionNo: string; // e.g., "TX-2026-08-001"
  apbsCode: string;
  sekdirCode: string;
  apbsItemName: string;
  requestedBy: string; // Nama Guru / Staf Admin
  grade: string; // Kelas
  submissionDate: string; // YYYY-MM-DD
  month: number; // 7 = Juli, 8 = Ags, ... 12 = Des, 1 = Jan, ..., 6 = Juni
  initialBudget: number; // Dana Awal APBS
  usedBefore: number; // Dana Terpakai Sebelumnya
  remainingBefore: number; // Sisa Dana Sebelum Pengajuan ini
  requestedAmount: number; // Jumlah Dana yang Diajukan
  remainingAfter: number; // Proyeksi Sisa Dana Akhir
  purpose: string; // Keperluan / Keterangan rincian barang
  status: TransactionStatus;
  warningLevel: WarningLevel;
  sekdirSyncStatus: "MATCHED" | "MISMATCH_CORRECTED" | "PENDING_VERIFICATION";
  adminNotes?: string;
  reallocatedCode?: string; // If reallocated to another APBS code
  isNonApbs?: boolean; // Flag indicating if it's a Non-APBS transaction
}

export interface MonthOption {
  value: number; // 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6
  label: string; // "Juli 2026", "Agustus 2026", etc.
  shortLabel: string; // "Jul", "Ags", etc.
}

export const ACADEMIC_MONTHS: MonthOption[] = [
  { value: 7, label: "Juli 2026", shortLabel: "Jul" },
  { value: 8, label: "Agustus 2026", shortLabel: "Ags" },
  { value: 9, label: "September 2026", shortLabel: "Sep" },
  { value: 10, label: "Oktober 2026", shortLabel: "Okt" },
  { value: 11, label: "November 2026", shortLabel: "Nov" },
  { value: 12, label: "Desember 2026", shortLabel: "Des" },
  { value: 1, label: "Januari 2027", shortLabel: "Jan" },
  { value: 2, label: "Februari 2027", shortLabel: "Feb" },
  { value: 3, label: "Maret 2027", shortLabel: "Mar" },
  { value: 4, label: "April 2027", shortLabel: "Apr" },
  { value: 5, label: "Mei 2027", shortLabel: "Mei" },
  { value: 6, label: "Juni 2027", shortLabel: "Jun" },
];
