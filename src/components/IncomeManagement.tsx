import React, { useState } from "react";
import { useApbs } from "../context/ApbsContext";
import { formatRupiah } from "../utils/formatters";
import { ACADEMIC_MONTHS } from "../types/apbs";
import { ArrowDownLeft, PlusCircle, Trash2, Wallet, Landmark, CheckCircle2, DollarSign, Calendar, FileText } from "lucide-react";

export const IncomeManagement: React.FC = () => {
  const { incomeRecords, addIncomeRecord, deleteIncomeRecord, getSummaryStats, selectedMonth } = useApbs();
  const stats = getSummaryStats();

  const [showForm, setShowForm] = useState(false);
  const [sourceCategory, setSourceCategory] = useState("SPP Sekolah");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receivedBy, setReceivedBy] = useState("Admin Keuangan SD");
  const [month, setMonth] = useState(selectedMonth);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [toastMsg, setToastMsg] = useState("");

  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      alert("Mohon masukkan jumlah nominal dana yang valid.");
      return;
    }

    const finalCategory = sourceCategory === "Lainnya" ? customCategory || "Lain-lain" : sourceCategory;

    addIncomeRecord({
      date,
      sourceCategory: finalCategory,
      amount: numAmount,
      description: description || `Penerimaan ${finalCategory}`,
      receivedBy: receivedBy || "Admin Keuangan SD",
      month,
    });

    setToastMsg(`Berhasil mencatat dana masuk Rp ${numAmount.toLocaleString("id-ID")} (${finalCategory})`);
    setTimeout(() => setToastMsg(""), 4000);

    // Reset form
    setAmount("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast notification */}
      {toastMsg && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg flex items-center space-x-2 text-sm animate-fade-in font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Stats Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-indigo-800/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                Dana Masuk &amp; Sisa Kas Real-time
              </span>
            </div>
            <h2 className="text-2xl font-black mt-1">Pencatatan Dana Masuk &amp; Sisa Saldo APBS SD</h2>
            <p className="text-xs text-slate-300 mt-1">
              Pantau total penerimaan dana masuk (SPP, Pangkal, Yayasan, BOS) vs realisasi pengeluaran untuk mengetahui sisa saldo kas bersih secara akurat.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-2 self-start md:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? "Tutup Form" : "+ Input Dana Masuk Baru"}</span>
          </button>
        </div>

        {/* 3 Main Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          {/* Total Dana Masuk Diterima */}
          <div className="bg-indigo-950/80 p-4 rounded-xl border border-indigo-800/80">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <span>Total Dana Masuk (Penerimaan)</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">
              {formatRupiah(stats.totalIncomeEntered)}
            </p>
            <p className="text-[11px] text-indigo-300/80 mt-1">
              Akumulasi dari {incomeRecords.length} transaksi dana masuk
            </p>
          </div>

          {/* Realisasi Pengeluaran */}
          <div className="bg-indigo-950/80 p-4 rounded-xl border border-indigo-800/80">
            <div className="flex items-center justify-between text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <span>Total Pengeluaran Realisasi</span>
              <Wallet className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-rose-300 mt-2">
              - {formatRupiah(stats.totalRealizedExpense)}
            </p>
            <p className="text-[11px] text-indigo-300/80 mt-1">
              Realisasi belanja APBS SD berjalan
            </p>
          </div>

          {/* Sisa Saldo Kas Bersih */}
          <div className="bg-emerald-950/90 p-4 rounded-xl border border-emerald-500/50 shadow-inner">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <span>Sisa Saldo Kas Bersih (Net)</span>
              <Landmark className="w-4 h-4 text-emerald-300" />
            </div>
            <p className="text-2xl font-black text-white mt-2">
              {formatRupiah(stats.netCashRemaining)}
            </p>
            <p className="text-[11px] text-emerald-300 mt-1 font-semibold">
              Sisa fisik dana kas bersih saat ini
            </p>
          </div>
        </div>
      </div>

      {/* Input Dana Form (Toggleable) */}
      {showForm && (
        <form onSubmit={handleSaveIncome} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Form Input Penerimaan Dana Masuk Baru</span>
            </h3>
            <span className="text-xs text-slate-400">Pencatatan Kas Masuk APBS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Sumber Dana */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Sumber / Kategori Dana Masuk</label>
              <select
                value={sourceCategory}
                onChange={(e) => setSourceCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
              >
                <option value="SPP Sekolah">SPP Sekolah</option>
                <option value="Uang Pangkal">Uang Pangkal Siswa Baru</option>
                <option value="Pendapatan Daftar Ulang">Pendapatan Daftar Ulang (UT)</option>
                <option value="Dana BOS / Dinas">Dana BOS / Bantuan Pemerintah</option>
                <option value="Subsisdi / Transfer Yayasan">Subsidi / Transfer Yayasan</option>
                <option value="Dana Kegiatan / Ekskul">Dana Kegiatan / Ekstrakulikuler</option>
                <option value="Sponsor / Hibah">Sponsor / Hibah Komite</option>
                <option value="Lainnya">Lainnya (Ketik Manual)</option>
              </select>
            </div>

            {sourceCategory === "Lainnya" && (
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Sumber Dana</label>
                <input
                  type="text"
                  placeholder="Contoh: Penjualan Seragam / Buku"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>
            )}

            {/* Jumlah Nominal */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Jumlah Nominal Dana Masuk (Rp)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Bulan */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Periode Bulan APBS</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                {ACADEMIC_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Tanggal Terima</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-800"
                required
              />
            </div>

            {/* Penerima */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">Dicatat oleh / Penerima</label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold"
                required
              />
            </div>

            {/* Keterangan */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-slate-700 font-bold mb-1">Keterangan / Rincian Penerimaan</label>
              <input
                type="text"
                placeholder="Contoh: Penerimaan SPP 120 siswa kelas 1-6 bulan Agustus"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-xs transition-colors flex items-center space-x-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Dana Masuk</span>
            </button>
          </div>
        </form>
      )}

      {/* History Table of Income */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Riwayat Penerimaan Dana Masuk</h3>
            <p className="text-xs text-slate-500">Daftar selengkapnya dana yang telah masuk ke kas APBS SD Lazuardi GCS.</p>
          </div>
          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">
            Total {incomeRecords.length} Transaksi
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">No. Ref</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Sumber / Kategori</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3">Penerima</th>
                <th className="py-3 px-3 text-right">Nominal Masuk</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incomeRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada catatan dana masuk. Klik tombol &quot;+ Input Dana Masuk Baru&quot; diatas untuk menambahkan.
                  </td>
                </tr>
              ) : (
                incomeRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 bg-slate-50/50">
                      {rec.incomeNo}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">{rec.date}</td>
                    <td className="py-3 px-3">
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-100">
                        {rec.sourceCategory}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">{rec.description}</td>
                    <td className="py-3 px-3 text-slate-500">{rec.receivedBy}</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-600">
                      + {formatRupiah(rec.amount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm("Apakah Anda yakin ingin menghapus catatan dana masuk ini?")) {
                            deleteIncomeRecord(rec.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
