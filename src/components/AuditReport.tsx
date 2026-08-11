import React, { useState } from "react";
import { useApbs } from "../context/ApbsContext";
import { ACADEMIC_MONTHS, Transaction } from "../types/apbs";
import {
  Printer,
  Download,
  ShieldCheck,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

export const AuditReport: React.FC = () => {
  const { items, transactions, getSummaryStats, selectedMonth } = useApbs();
  const stats = getSummaryStats();

  const [reportMonth, setReportMonth] = useState<number | "ALL">(selectedMonth);

  const formatRupiah = (val: number) => {
    return "Rp " + val.toLocaleString("id-ID");
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedMonthObj =
    reportMonth !== "ALL"
      ? ACADEMIC_MONTHS.find((m) => m.value === reportMonth)
      : null;

  const monthLabel =
    reportMonth === "ALL"
      ? "Semua Bulan (Tahun Ajaran 2026 - 2027)"
      : selectedMonthObj?.label || `Bulan ${reportMonth}`;

  // Filter transactions for report month
  const monthTransactions = transactions.filter((t) => {
    if (reportMonth === "ALL") return true;
    return t.month === reportMonth;
  });

  const approvedMonthTransactions = monthTransactions.filter(
    (t) => t.status === "APPROVED"
  );

  const expenseItems = items.filter((i) => i.type === "EXPENSE");

  // Calculate 1-Year overall budget and period realized
  const periodBudget = stats.totalBudgetExpense; // Always 1-Year Total Budget as requested
  
  let periodRealized = 0;
  if (reportMonth === "ALL") {
    periodRealized = stats.totalRealizedExpense;
  } else {
    periodRealized = approvedMonthTransactions.reduce(
      (acc, t) => acc + t.requestedAmount,
      0
    );
  }

  // Sisa saldo APBS 1 Tahun Keseluruhan
  const totalCumulativeRealized = stats.totalRealizedExpense;
  const periodRemaining = periodBudget - totalCumulativeRealized;
  const absorptionRate =
    periodBudget > 0 ? ((totalCumulativeRealized / periodBudget) * 100).toFixed(1) : "0.0";

  // Group expense items by category
  const categoriesMap: Record<string, typeof expenseItems> = {};
  expenseItems.forEach((item) => {
    if (!categoriesMap[item.category]) {
      categoriesMap[item.category] = [];
    }
    categoriesMap[item.category].push(item);
  });

  // Export CSV function for report
  const exportReportCSV = () => {
    const headers = [
      "No Transaksi",
      "Tanggal",
      "Bulan",
      "Kode APBS",
      "Kode Sekdir",
      "Nama Barang / Kegiatan",
      "Pemohon",
      "Kelas/Unit",
      "Keperluan Pengeluaran",
      "Nominal (Rp)",
      "Status Verifikasi",
    ];

    const rows = monthTransactions.map((t) => [
      t.transactionNo,
      t.submissionDate,
      ACADEMIC_MONTHS.find((m) => m.value === t.month)?.label || t.month,
      t.apbsCode,
      t.sekdirCode,
      `"${t.apbsItemName.replace(/"/g, '""')}"`,
      `"${t.requestedBy.replace(/"/g, '""')}"`,
      t.grade,
      `"${t.purpose.replace(/"/g, '""')}"`,
      t.requestedAmount,
      t.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Rekap_Laporan_Pengeluaran_APBS_${
        reportMonth === "ALL" ? "Semua_Bulan" : `Bulan_${reportMonth}`
      }_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:max-w-none print:p-0">
      {/* Top Action & Filter Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md border border-slate-800 space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-600/30 border border-emerald-500/40 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Laporan Keuangan Audit &amp; Rekap Bulanan APBS
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Rekapitulasi otomatis, transparan, dan terverifikasi untuk
                audit internal, kepala sekolah, &amp; direksi.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportReportCSV}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="Download CSV Rekapitulasi"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF Laporan</span>
            </button>
          </div>
        </div>

        {/* Month Selector Tabs */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 mr-2 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Pilih Bulan Laporan:</span>
          </span>

          <button
            onClick={() => setReportMonth("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              reportMonth === "ALL"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Semua Bulan (Tahun)
          </button>

          {ACADEMIC_MONTHS.map((m) => (
            <button
              key={m.value}
              onClick={() => setReportMonth(m.value)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                reportMonth === m.value
                  ? "bg-emerald-600 text-white font-bold shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {m.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Printable Document Sheet */}
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200 space-y-6 print:shadow-none print:border-none print:p-0">
        {/* Formal Header without logo and address */}
        <div className="text-center border-b-2 border-slate-900 pb-5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase underline decoration-2 decoration-emerald-600">
            LAPORAN REKAP KEUANGAN &amp; REALISASI PENGELUARAN APBS
          </h2>
          <p className="text-xs font-bold text-emerald-800 mt-1 uppercase tracking-wide">
            {monthLabel}
          </p>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            Tahun Ajaran 2026 - 2027 • Tanggal Cetak:{" "}
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 font-medium block">
              Total Anggaran Belanja (1 Tahun):
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {formatRupiah(periodBudget)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-medium block">
              {reportMonth === "ALL"
                ? "Total Pengeluaran Realisasi (1 Tahun):"
                : `Realisasi Belanja ${monthLabel}:`}
            </span>
            <span className="font-bold text-blue-800 text-sm">
              {formatRupiah(periodRealized)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-medium block">
              Sisa Saldo APBS (1 Tahun):
            </span>
            <span className="font-bold text-emerald-800 text-sm">
              {formatRupiah(periodRemaining)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-medium block">
              Persentase Serapan (vs 1 Tahun):
            </span>
            <span className="font-bold text-indigo-800 text-sm">
              {absorptionRate}%
            </span>
          </div>
        </div>

        {/* SECTION 1: DETIL CATATAN PENGELUARAN BULANAN (Monthly Transaction Details) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>
                1. Rincian Detail Catatan Pengeluaran ({monthLabel})
              </span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Total {monthTransactions.length} Catatan Transaksi
            </span>
          </div>

          {monthTransactions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">
                Belum Ada Catatan Pengeluaran Dicatat ({monthLabel})
              </p>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Seluruh alokasi operasional anggaran APBS pada periode ini masih
                utuh 100% sebesar{" "}
                <span className="font-bold text-emerald-700">
                  {formatRupiah(periodBudget)}
                </span>
                . Pengajuan dana baru akan otomatis tercatat dan direkap secara
                real-time di sini.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-[11px] text-slate-700 border border-slate-200">
              <thead className="bg-slate-800 text-white font-semibold">
                <tr>
                  <th className="py-2 px-2.5 w-28">No Transaksi</th>
                  <th className="py-2 px-2.5 w-24">Tanggal</th>
                  <th className="py-2 px-2.5 w-20">Kode APBS</th>
                  <th className="py-2 px-2.5 w-28">Pemohon / Kelas</th>
                  <th className="py-2 px-2.5">Keperluan &amp; Uraian Pengeluaran</th>
                  <th className="py-2 px-2.5 text-right w-28">Nominal (Rp)</th>
                  <th className="py-2 px-2.5 text-center w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2 px-2.5 font-mono font-semibold text-slate-900">
                      {t.transactionNo}
                    </td>
                    <td className="py-2 px-2.5 font-mono text-slate-600">
                      {t.submissionDate}
                    </td>
                    <td className="py-2 px-2.5 font-mono font-bold text-emerald-800">
                      {t.apbsCode}
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="font-semibold text-slate-800">{t.requestedBy}</div>
                      <div className="text-[10px] text-slate-400">Kelas: {t.grade}</div>
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="font-medium text-slate-900">{t.apbsItemName}</div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5">
                        {t.purpose}
                      </div>
                    </td>
                    <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                      {formatRupiah(t.requestedAmount)}
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {t.status === "APPROVED"
                          ? "DISETUJUI"
                          : t.status === "PENDING"
                          ? "MENUNGGU"
                          : "DITOLAK"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                <tr>
                  <td colSpan={5} className="py-2 px-2.5 text-right">
                    TOTAL PENGELUARAN TERCATAT ({monthLabel}):
                  </td>
                  <td className="py-2 px-2.5 text-right text-emerald-800 font-black text-xs">
                    {formatRupiah(
                      monthTransactions.reduce((a, b) => a + b.requestedAmount, 0)
                    )}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* SECTION 2: RINCIAN ALOKASI ANGGARAN APBS PER KATEGORI */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              2. Rekapitulasi Alokasi &amp; Serapan Anggaran Master Kode APBS
            </span>
          </h3>

          {Object.keys(categoriesMap).map((cat) => {
            const catItems = categoriesMap[cat];

            // Always 1-Year Overall Budget for category allocation
            const catBudget = catItems.reduce((acc, i) => acc + i.totalBudget, 0);

            // Filter approved transactions for category in report month
            const catItemCodes = new Set(catItems.map((i) => i.code));
            const catUsed = approvedMonthTransactions
              .filter((t) => catItemCodes.has(t.apbsCode))
              .reduce((acc, t) => acc + t.requestedAmount, 0);

            const catCumulativeUsed = catItems.reduce((acc, i) => acc + (i.usedBudget || 0), 0);
            const catRem = catBudget - catCumulativeUsed;

            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-xs text-slate-900">{cat}</span>
                  <div className="text-xs space-x-3 font-mono">
                    <span className="text-slate-600">
                      Alokasi 1 Tahun: {formatRupiah(catBudget)}
                    </span>
                    <span className="text-blue-700 font-semibold">
                      Terpakai {reportMonth === "ALL" ? "(1 Thn)" : "(Bln Ini)"}: {formatRupiah(catUsed)}
                    </span>
                    <span className="text-emerald-700 font-bold">
                      Sisa 1 Tahun: {formatRupiah(catRem)}
                    </span>
                  </div>
                </div>

                <table className="w-full text-left text-[11px] text-slate-600 border border-slate-200">
                  <thead className="bg-slate-50 text-slate-800 font-semibold border-b">
                    <tr>
                      <th className="py-2 px-2.5 w-28">Kode APBS</th>
                      <th className="py-2 px-2.5">Deskripsi Barang / Kegiatan</th>
                      <th className="py-2 px-2.5 text-right w-28">
                        Anggaran (1 Tahun)
                      </th>
                      <th className="py-2 px-2.5 text-right w-28">
                        {reportMonth === "ALL" ? "Realisasi (1 Thn)" : "Realisasi (Bln Ini)"}
                      </th>
                      <th className="py-2 px-2.5 text-right w-28">Sisa Saldo (1 Thn)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catItems.map((item) => {
                      // Always 1-Year Total Budget
                      const itemBudget = item.totalBudget;

                      const itemUsed = approvedMonthTransactions
                        .filter((t) => t.apbsCode === item.code)
                        .reduce((acc, t) => acc + t.requestedAmount, 0);

                      const itemCumulativeUsed = item.usedBudget || 0;
                      const itemRem = itemBudget - itemCumulativeUsed;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2.5 font-mono font-bold text-slate-900">
                            {item.code}
                          </td>
                          <td className="py-1.5 px-2.5 font-medium text-slate-800">
                            {item.description}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-medium">
                            {formatRupiah(itemBudget)}
                          </td>
                          <td className="py-1.5 px-2.5 text-right text-blue-700 font-medium">
                            {formatRupiah(itemUsed)}
                          </td>
                          <td
                            className={`py-1.5 px-2.5 text-right font-bold ${
                              itemRem <= 0 && itemBudget > 0
                                ? "text-red-600"
                                : "text-emerald-700"
                            }`}
                          >
                            {formatRupiah(itemRem)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Formal Signature Approval Block */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-800">
          <div>
            <p className="font-semibold text-slate-600">Dibuat oleh,</p>
            <p className="font-bold text-slate-900 mt-0.5">Admin SD</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-slate-900">( Dini Rahmadani )</p>
          </div>

          <div>
            <p className="font-semibold text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-900 mt-0.5">
              Kepala Sekolah SD Lazuardi
            </p>
            <div className="h-16"></div>
            <p className="font-bold underline text-slate-900">( Sari Kusuma Dewi )</p>
          </div>

          <div>
            <p className="font-semibold text-slate-600">Diverifikasi oleh,</p>
            <p className="font-bold text-slate-900 mt-0.5">
              Manager Keuangan Lazuardi
            </p>
            <div className="h-16"></div>
            <p className="font-bold underline text-slate-900">( Rahmi )</p>
          </div>
        </div>
      </div>
    </div>
  );
};
