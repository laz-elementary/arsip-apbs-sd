import React from "react";
import { useApbs } from "../context/ApbsContext";
import { ACADEMIC_MONTHS } from "../types/apbs";
import {
  LayoutDashboard,
  FilePlus,
  Table,
  ArrowDownLeft,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { selectedMonth, setSelectedMonth, getSummaryStats, resetToInitialData, clearAllData } = useApbs();
  const stats = getSummaryStats();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xs">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">APBS SD</h1>
                <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider">
                  TA 2026-2027
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sistem Realisasi Anggaran, Input Dana Masuk &amp; Sisa Saldo APBS SD
              </p>
            </div>
          </div>

          {/* Controls: Month Selector + Alert Indicators + Reset + Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-200">
              <span className="text-xs text-slate-500 mr-2 font-medium">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-indigo-700 focus:outline-none cursor-pointer"
              >
                {ACADEMIC_MONTHS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-white text-slate-900">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Alert Status Badge */}
            {(stats.lowBudgetCount > 0 || stats.depletedCount > 0) && (
              <div
                onClick={() => setActiveTab("dashboard")}
                className="cursor-pointer flex items-center space-x-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-all shadow-2xs"
                title="Klik untuk lihat anggaran menipis/habis"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                <span>
                  {stats.depletedCount > 0 && `${stats.depletedCount} Habis `}
                  {stats.lowBudgetCount > 0 && `(${stats.lowBudgetCount} Menipis)`}
                </span>
              </div>
            )}

            <button
              onClick={() => setActiveTab("income")}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Input Dana Masuk</span>
            </button>

            <button
              onClick={() => setActiveTab("pengajuan")}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>+ Input Pengajuan</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm("Apakah Anda yakin ingin MENGHAPUS SEMUA DATA (Kode APBS, Transaksi, & Dana Masuk)?")) {
                  clearAllData();
                }
              }}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-all cursor-pointer"
              title="Kosongkan / Hapus Semua Data APBS"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (window.confirm("Apakah Anda yakin ingin memuat kembali data contoh/demo APBS SD?")) {
                  resetToInitialData();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
              title="Muat Ulang Demo Data Master APBS"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-50/80 border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex space-x-1.5 overflow-x-auto scrollbar-none py-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard &amp; Sisa Saldo</span>
          </button>

          <button
            onClick={() => setActiveTab("income")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "income"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Input Dana Masuk &amp; Rincian Kas</span>
          </button>

          <button
            onClick={() => setActiveTab("pengajuan")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "pengajuan"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <FilePlus className="w-4 h-4" />
            <span>Form Pengajuan Dana</span>
          </button>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "transactions"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Catatan Pengeluaran</span>
            {stats.pendingTxCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {stats.pendingTxCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("report")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "report"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Laporan Keuangan Audit</span>
          </button>

          <button
            onClick={() => setActiveTab("ai-assistant")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "ai-assistant"
                ? "bg-purple-700 text-white shadow-xs"
                : "text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Asisten AI APBS</span>
          </button>
        </div>
      </div>
    </header>
  );
};


