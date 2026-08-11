import React, { useState } from "react";
import { useApbs } from "../context/ApbsContext";
import { ACADEMIC_MONTHS, Transaction, TransactionStatus } from "../types/apbs";
import {
  Table as TableIcon,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Trash2,
  FileSpreadsheet,
  Building,
  UserCheck,
  Check,
  X,
  RefreshCcw,
} from "lucide-react";

export const TransactionList: React.FC = () => {
  const { transactions, updateTransactionStatus, deleteTransaction, selectedMonth } = useApbs();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [warningFilter, setWarningFilter] = useState<string>("ALL");
  const [monthFilter, setMonthFilter] = useState<number | "ALL">("ALL");

  const formatRupiah = (val: number) => {
    return "Rp " + val.toLocaleString("id-ID");
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchSearch =
      tx.apbsCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.apbsItemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.transactionNo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === "ALL" || tx.status === statusFilter;
    const matchWarning = warningFilter === "ALL" || tx.warningLevel === warningFilter;
    const matchMonth = monthFilter === "ALL" || tx.month === monthFilter;

    return matchSearch && matchStatus && matchWarning && matchMonth;
  });

  // Export to CSV for Google Sheets / Excel
  const exportToCSV = () => {
    const headers = [
      "No Transaksi",
      "Tanggal",
      "Bulan",
      "Kode APBS",
      "Kode Sekdir",
      "Nama APBS",
      "Pemohon",
      "Dana Awal (Rp)",
      "Terpakai Sebelum (Rp)",
      "Sisa Sebelum (Rp)",
      "Jumlah Diajukan (Rp)",
      "Sisa Akhir (Rp)",
      "Keperluan",
      "Status",
      "Peringatan Anggaran",
    ];

    const rows = filteredTransactions.map((t) => [
      t.transactionNo,
      t.submissionDate,
      ACADEMIC_MONTHS.find((m) => m.value === t.month)?.label || t.month,
      t.apbsCode,
      t.sekdirCode,
      `"${t.apbsItemName.replace(/"/g, '""')}"`,
      `"${t.requestedBy.replace(/"/g, '""')}"`,
      t.initialBudget,
      t.usedBefore,
      t.remainingBefore,
      t.requestedAmount,
      t.remainingAfter,
      `"${t.purpose.replace(/"/g, '""')}"`,
      t.status,
      t.warningLevel,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Catatan_Realisasi_APBS_SD_Lazuardi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Catatan Pengeluaran &amp; Realisasi Dana APBS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengganti Google Sheets dengan histori lengkap: Dana Awal, Dana Terpakai, Dana Diajukan, dan Sisa Saldo Akhir Otomatis.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export ke CSV (Google Sheets / Excel)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kode, barang, pemohon, nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Month Filter */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="ALL">Semua Bulan</option>
            {ACADEMIC_MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="APPROVED">Disetujui (Approved)</option>
            <option value="PENDING">Menunggu (Pending)</option>
            <option value="REJECTED">Ditolak (Rejected)</option>
            <option value="REALLOCATED">Di-reokasi</option>
          </select>

          {/* Warning Level Filter */}
          <select
            value={warningFilter}
            onChange={(e) => setWarningFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
          >
            <option value="ALL">Semua Validasi Anggaran</option>
            <option value="OK">Aman</option>
            <option value="LOW_BUDGET">Menipis (&lt;20%)</option>
            <option value="EXHAUSTED">Habis (0)</option>
            <option value="OVERBUDGET">Overbudget / Melebihi</option>
          </select>
        </div>

        <div className="text-slate-500 font-medium">
          Menampilkan <span className="font-bold text-slate-900">{filteredTransactions.length}</span> transaksi
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-3">No Transaksi &amp; Tgl</th>
                <th className="py-3 px-3">Kode APBS (Sekdir)</th>
                <th className="py-3 px-3">Nama Barang / Kegiatan</th>
                <th className="py-3 px-3">Pemohon</th>
                <th className="py-3 px-3 text-right">Dana Awal</th>
                <th className="py-3 px-3 text-right">Terpakai Lalu</th>
                <th className="py-3 px-3 text-right">Diajukan</th>
                <th className="py-3 px-3 text-right">Sisa Akhir APBS</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Validasi</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Belum ada pencatatan pengajuan dana yang cocok.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isOver = tx.warningLevel === "OVERBUDGET";
                  const isExhausted = tx.warningLevel === "EXHAUSTED";
                  const isLow = tx.warningLevel === "LOW_BUDGET";

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-slate-900 text-[11px]">{tx.transactionNo}</div>
                        <div className="text-[10px] text-slate-400">{tx.submissionDate}</div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center space-x-1">
                          <span className={`font-bold px-2 py-0.5 rounded inline-block ${
                            tx.isNonApbs || tx.apbsCode === "NON-APBS"
                              ? "text-amber-900 bg-amber-100 border border-amber-300"
                              : "text-emerald-800 bg-emerald-50"
                          }`}>
                            {tx.apbsCode}
                          </span>
                          {(tx.isNonApbs || tx.apbsCode === "NON-APBS") && (
                            <span className="text-[9px] font-black bg-amber-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tight">
                              Non-APBS
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tx.sekdirCode}</div>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-900 max-w-xs">
                        <p className="line-clamp-2">{tx.apbsItemName}</p>
                        <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">{tx.purpose}</p>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-800">{tx.requestedBy}</td>

                      <td className="py-3 px-3 text-right font-medium text-slate-800">
                        {formatRupiah(tx.initialBudget)}
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-blue-700">
                        {formatRupiah(tx.usedBefore)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900 bg-emerald-50/40">
                        {formatRupiah(tx.requestedAmount)}
                      </td>

                      <td
                        className={`py-3 px-3 text-right font-bold ${
                          tx.remainingAfter < 0
                            ? "text-red-600 bg-red-50"
                            : tx.remainingAfter === 0
                            ? "text-red-600"
                            : isLow
                            ? "text-amber-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {tx.remainingAfter < 0
                          ? `-${formatRupiah(Math.abs(tx.remainingAfter))}`
                          : formatRupiah(tx.remainingAfter)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {tx.status === "APPROVED" && (
                          <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Disetujui</span>
                          </span>
                        )}
                        {tx.status === "PENDING" && (
                          <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-200 inline-flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Menunggu</span>
                          </span>
                        )}
                        {tx.status === "REJECTED" && (
                          <span className="bg-red-100 text-red-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-red-200 inline-flex items-center space-x-1">
                            <X className="w-3 h-3" />
                            <span>Ditolak</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isOver ? (
                          <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                            OVERBUDGET
                          </span>
                        ) : isExhausted ? (
                          <span className="bg-red-100 text-red-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-red-200">
                            HABIS
                          </span>
                        ) : isLow ? (
                          <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-200">
                            MENIPIS
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 font-semibold text-[10px] px-2 py-0.5 rounded-full">
                            AMAN
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {tx.status === "PENDING" && (
                            <button
                              onClick={() => updateTransactionStatus(tx.id, "APPROVED")}
                              className="p-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded text-[10px] font-bold"
                              title="Setujui"
                            >
                              Approve
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus pengajuan ${tx.transactionNo}?`)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
