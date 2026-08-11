import React, { useState, useEffect } from "react";
import { useApbs } from "../context/ApbsContext";
import { ACADEMIC_MONTHS, APBSItem } from "../types/apbs";
import {
  FilePlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calculator,
  ArrowRight,
  ShieldAlert,
  Info,
  Building,
  User,
  Calendar,
  FileText,
  Send,
  Sparkles,
} from "lucide-react";

interface PengajuanFormProps {
  initialCode?: string;
  onSuccessNavigate?: () => void;
}

export const PengajuanForm: React.FC<PengajuanFormProps> = ({ initialCode = "", onSuccessNavigate }) => {
  const { items, addTransaction, selectedMonth, getItemByCode } = useApbs();

  const [apbsSearch, setApbsSearch] = useState(initialCode);
  const [selectedItem, setSelectedItem] = useState<APBSItem | null>(null);

  // Non-APBS State
  const [isNonApbs, setIsNonApbs] = useState(false);
  const [nonApbsItemName, setNonApbsItemName] = useState("");

  const [requestedBy, setRequestedBy] = useState("");
  const [grade, setGrade] = useState("1");
  const [month, setMonth] = useState<number>(selectedMonth);
  const [submissionDate, setSubmissionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  useEffect(() => {
    if (initialCode) {
      setApbsSearch(initialCode);
      const match = getItemByCode(initialCode);
      if (match) {
        setSelectedItem(match);
        setIsNonApbs(match.isNonApbs || match.code === "NON-APBS");
      }
    }
  }, [initialCode]);

  // Handle APBS Selection
  const handleSelectCode = (code: string) => {
    setApbsSearch(code);
    const item = getItemByCode(code);
    if (item) {
      setSelectedItem(item);
      setGrade(item.grade === "All" ? "1" : item.grade);
      if (item.code === "NON-APBS") {
        setIsNonApbs(true);
      }
    } else {
      setSelectedItem(null);
    }
  };

  const handleToggleNonApbs = (enableNonApbs: boolean) => {
    setIsNonApbs(enableNonApbs);
    setFeedback(null);
    if (enableNonApbs) {
      const nonApbsItem = getItemByCode("NON-APBS") || {
        id: "item-non-apbs",
        code: "NON-APBS",
        sekdirCode: "SKD-NON-APBS",
        description: "Pengeluaran Non-APBS",
        category: "Non-APBS / Diluar Anggaran",
        activity: "Pengeluaran Non-APBS",
        grade: "All",
        unit: "SD",
        type: "EXPENSE" as const,
        unitPrice: 0,
        totalQty: 0,
        totalBudget: 0,
        usedBudget: 0,
        remainingBudget: 0,
        monthlyBudget: {},
        isSekdirSynced: true,
        isNonApbs: true,
      };
      setSelectedItem(nonApbsItem);
    } else {
      setApbsSearch("");
      setSelectedItem(null);
    }
  };

  // Math Calculations
  const numRequested = Number(requestedAmount.replace(/\D/g, "")) || 0;
  const initialBudget = selectedItem ? selectedItem.totalBudget : 0;
  const usedBefore = selectedItem ? selectedItem.usedBudget : 0;
  const remainingBefore = selectedItem ? selectedItem.remainingBudget : 0;
  const remainingAfter = remainingBefore - numRequested;

  // Warning Level
  const isOverbudget = selectedItem && !isNonApbs ? remainingAfter < 0 : false;
  const isZero = selectedItem && !isNonApbs ? remainingBefore <= 0 : false;
  const isLow = selectedItem && !isNonApbs && !isOverbudget && remainingBefore > 0 && remainingAfter / initialBudget <= 0.2;

  const formatRupiah = (val: number) => {
    return "Rp " + Math.abs(val).toLocaleString("id-ID");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setRequestedAmount("");
      return;
    }
    const num = parseInt(rawVal, 10);
    setRequestedAmount(num.toLocaleString("id-ID"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!isNonApbs && !selectedItem) {
      setFeedback({
        type: "error",
        message: "Pilihlah Kode APBS yang valid dari daftar sebelum melanjutkan.",
      });
      return;
    }

    if (isNonApbs && !nonApbsItemName.trim()) {
      setFeedback({
        type: "error",
        message: "Nama Pengeluaran / Kegiatan Non-APBS wajib diisi.",
      });
      return;
    }

    if (!requestedBy.trim()) {
      setFeedback({
        type: "error",
        message: "Nama Pemohon (Guru/Staf Admin) wajib diisi.",
      });
      return;
    }

    if (numRequested <= 0) {
      setFeedback({
        type: "error",
        message: "Jumlah dana pengajuan harus lebih besar dari Rp 0.",
      });
      return;
    }

    if (!purpose.trim()) {
      setFeedback({
        type: "error",
        message: "Keperluan / Rincian pengajuan barang wajib diisi.",
      });
      return;
    }

    const activeItem = selectedItem || getItemByCode("NON-APBS");

    const res = addTransaction({
      apbsCode: isNonApbs ? "NON-APBS" : activeItem!.code,
      sekdirCode: isNonApbs ? "SKD-NON-APBS" : activeItem!.sekdirCode,
      apbsItemName: isNonApbs ? nonApbsItemName.trim() : activeItem!.description,
      requestedBy,
      grade,
      submissionDate: submissionDate || new Date().toISOString().slice(0, 10),
      month,
      requestedAmount: numRequested,
      purpose,
      status: isNonApbs ? "PENDING" : (isOverbudget ? "PENDING" : "APPROVED"),
      purposeNotes: adminNotes,
      isNonApbs: isNonApbs,
    });

    if (res.success) {
      setFeedback({
        type: isNonApbs ? "warning" : (isOverbudget ? "warning" : "success"),
        message: isNonApbs
          ? `Pengajuan Non-APBS "Rp ${numRequested.toLocaleString("id-ID")}" berhasil dicatat dan masuk ke antrean persetujuan (PENDING).`
          : res.message,
      });
      // Reset form fields
      setRequestedAmount("");
      setPurpose("");
      setAdminNotes("");
      if (isNonApbs) setNonApbsItemName("");

      if (onSuccessNavigate) {
        setTimeout(() => {
          onSuccessNavigate();
        }, 1500);
      }
    } else {
      setFeedback({
        type: "error",
        message: res.message,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-xs">
            <FilePlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Form Pengajuan Dana &amp; Validasi Real-time APBS</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem Otomatis Menghitung Dana Awal, Dana Terpakai, Sisa Dana, dan Mencegah Kesalahan Kode / Overbudget.
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border flex items-start space-x-3 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : feedback.type === "warning"
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : feedback.type === "warning" ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">{feedback.type === "success" ? "Berhasil!" : "Pemberitahuan Validasi"}</p>
            <p className="text-xs mt-0.5">{feedback.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        {/* Toggle Mode: APBS vs Non-APBS */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Tipe Pengajuan Dana:
              </span>
              <span className="text-xs text-slate-500">
                Pilih apakah pengajuan sesuai anggaran terencana APBS atau pengeluaran khusus Non-APBS.
              </span>
            </div>
            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => handleToggleNonApbs(false)}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  !isNonApbs
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                📋 Sesuai Kode APBS
              </button>
              <button
                type="button"
                onClick={() => handleToggleNonApbs(true)}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isNonApbs
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                ⚠️ Non-APBS (Diluar Anggaran)
              </button>
            </div>
          </div>
        </div>

        {/* Step 1: Pilih Kode APBS ATAU Isi Detail Non-APBS */}
        {!isNonApbs ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Cari &amp; Pilih Kode APBS (Atau Nama Barang/Kegiatan) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Ketik Kode APBS e.g. 1077, 70, 334, atau nama barang (misal: Kertas, Konsumsi, Bus)..."
                value={apbsSearch}
                onChange={(e) => handleSelectCode(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* APBS Item Dropdown Suggestions if searching */}
            {apbsSearch && !selectedItem && (
              <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                {items
                  .filter(
                    (i) =>
                      i.type === "EXPENSE" &&
                      (i.code.toLowerCase().includes(apbsSearch.toLowerCase()) ||
                        i.description.toLowerCase().includes(apbsSearch.toLowerCase()) ||
                        i.sekdirCode.toLowerCase().includes(apbsSearch.toLowerCase()))
                  )
                  .slice(0, 8)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectCode(item.code)}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            Kode {item.code}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">(Sekdir: {item.sekdirCode})</span>
                        </div>
                        <p className="font-medium text-slate-900 mt-1">{item.description}</p>
                        <p className="text-[11px] text-slate-500">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">Sisa APBS:</p>
                        <p
                          className={`font-bold ${
                            item.remainingBudget <= 0 ? "text-red-600" : "text-emerald-700"
                          }`}
                        >
                          {formatRupiah(item.remainingBudget)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          /* Non-APBS Input Details */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                1. Nama Barang / Kegiatan Pengeluaran Non-APBS <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Kebutuhan Perbaikan Mendadak / Acara Tambahan Diluar APBS..."
                value={nonApbsItemName}
                onChange={(e) => setNonApbsItemName(e.target.value)}
                className="w-full px-4 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                required={isNonApbs}
              />
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center space-x-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Pengajuan Khusus Non-APBS (Diluar Rencana Anggaran)</span>
              </div>
              <p>
                Pengajuan ini ditandai sebagai <strong>Non-APBS</strong> (Kode: <code>NON-APBS</code>). Transaksi tidak akan memotong saldo anggaran terencana APBS master, tetapi tercatat khusus untuk diverifikasi oleh Bendahara &amp; Kepala Sekolah.
              </p>
            </div>
          </div>
        )}

        {/* Selected APBS Real-Time Validation Box */}
        {selectedItem && !isNonApbs ? (
          <div
            className={`p-5 rounded-2xl border transition-all ${
              isOverbudget
                ? "bg-red-50/80 border-red-300 text-red-950"
                : isZero
                ? "bg-red-50/50 border-red-200 text-red-900"
                : isLow
                ? "bg-amber-50/80 border-amber-300 text-amber-950"
                : "bg-emerald-50/60 border-emerald-200 text-emerald-950"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-slate-900 text-white font-mono font-bold text-xs px-2.5 py-1 rounded-lg">
                    Kode APBS: {selectedItem.code}
                  </span>
                  <span className="bg-slate-200 text-slate-700 font-mono text-xs px-2.5 py-1 rounded-lg">
                    Kode Sekdir: {selectedItem.sekdirCode}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200">
                    Kategori: {selectedItem.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{selectedItem.description}</h3>
              </div>

              {/* Status Badge */}
              <div>
                {isOverbudget ? (
                  <span className="inline-flex items-center space-x-1.5 bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm">
                    <ShieldAlert className="w-4 h-4" />
                    <span>PERINGATAN: OVERBUDGET!</span>
                  </span>
                ) : isZero ? (
                  <span className="inline-flex items-center space-x-1.5 bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm">
                    <XCircle className="w-4 h-4" />
                    <span>ANGGARAN HABIS (0)</span>
                  </span>
                ) : isLow ? (
                  <span className="inline-flex items-center space-x-1.5 bg-amber-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>ANGGARAN MENIPIS (&lt;20%)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ANGGARAN AMAN</span>
                  </span>
                )}
              </div>
            </div>

            {/* LIVE BUDGET CALCULATOR DISPLAY */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">1. Dana Awal</span>
                <span className="text-xs sm:text-sm font-bold text-slate-800">{formatRupiah(initialBudget)}</span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">2. Terpakai Lalu</span>
                <span className="text-xs sm:text-sm font-bold text-blue-700">{formatRupiah(usedBefore)}</span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">3. Sisa Saat Ini</span>
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    remainingBefore <= 0 ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {formatRupiah(remainingBefore)}
                </span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-emerald-300 shadow-sm">
                <span className="text-[10px] uppercase font-semibold text-emerald-800 block">4. Diajukan</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-900">{formatRupiah(numRequested)}</span>
              </div>

              <div
                className={`p-3 rounded-xl border col-span-2 sm:col-span-1 shadow-sm ${
                  isOverbudget
                    ? "bg-red-600 text-white border-red-700"
                    : isLow
                    ? "bg-amber-500 text-slate-950 border-amber-600"
                    : "bg-emerald-700 text-white border-emerald-800"
                }`}
              >
                <span className="text-[10px] uppercase font-bold block opacity-90">5. Proyeksi Sisa Akhir</span>
                <span className="text-xs sm:text-sm font-black">
                  {isOverbudget ? `-${formatRupiah(Math.abs(remainingAfter))}` : formatRupiah(remainingAfter)}
                </span>
              </div>
            </div>

            {/* Overbudget Specific Warning Text */}
            {isOverbudget && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-xl text-xs text-red-900 space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-4 h-4 text-red-700" />
                  <span>Pengajuan ini melebihi sisa dana sebesar {formatRupiah(Math.abs(remainingAfter))}!</span>
                </p>
                <p className="text-[11px] text-red-800">
                  Untuk menghindari teguran atasan, tuliskan alasan pengajuan overbudget atau permohonan reokasi kode APBS pada kolom Catatan Tambahan di bawah.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 text-center">
            Pilihlah salah satu Kode APBS di atas untuk melihat kalkulator saldo dana awal, terpakai, dan sisa.
          </div>
        )}

        {/* Step 2: Form Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {/* Tanggal Pengajuan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tanggal Pengajuan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
          </div>

          {/* Pemohon */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Pemohon (Guru/Staf) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="misal: Bu Rahma (Staf TU) / Pak Budi"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
          </div>

          {/* Bulan Pengajuan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Bulan Pengajuan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {ACADEMIC_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nominal Pengajuan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Jumlah Dana Diajukan (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="text-xs font-bold text-slate-500 absolute left-3 top-2.5">Rp</span>
              <input
                type="text"
                placeholder="0"
                value={requestedAmount}
                onChange={handleAmountChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
            </div>
          </div>
        </div>

        {/* Keperluan & Catatan */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Keperluan &amp; Rincian Barang / Kegiatan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Tuliskan rincian barang, kuantitas, harga satuan, atau tujuan kegiatan secara lengkap agar konsisten dan bebas kesalahan..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          {isOverbudget && (
            <div>
              <label className="block text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                Catatan Alasan Overbudget / Usulan Reokasi Kode APBS
              </label>
              <input
                type="text"
                placeholder="Tuliskan alasan mengapa dana ini melebihi alokasi dan usulan kode pengganti..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={!selectedItem}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all ${
              !selectedItem
                ? "bg-slate-300 cursor-not-allowed"
                : isOverbudget
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isOverbudget ? "Kirim Pengajuan (Perlu Persetujuan Special)" : "Simpan &amp; Catat Pengajuan"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
