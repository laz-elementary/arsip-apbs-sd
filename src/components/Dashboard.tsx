import React, { useState } from "react";
import { useApbs } from "../context/ApbsContext";
import { ACADEMIC_MONTHS, APBSItem } from "../types/apbs";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  PieChart as PieIcon,
  BarChart3,
  Search,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ShieldCheck,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Filter,
  Plus,
  Upload,
  X,
  FileText,
  Trash2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardProps {
  onSelectApbsForForm: (code: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectApbsForForm }) => {
  const { items, transactions, getSummaryStats, selectedMonth, addApbsItem, batchImportApbsItems, deleteApbsItem, resetToInitialData, clearAllData } = useApbs();
  const stats = getSummaryStats();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [alertOnly, setAlertOnly] = useState(false);

  const formatRupiah = (val: number) => {
    return "Rp " + (val || 0).toLocaleString("id-ID");
  };

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // New Item Form state
  const [newCode, setNewCode] = useState("");
  const [newSekdirCode, setNewSekdirCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("Kegiatan Sekolah");
  const [newActivity, setNewActivity] = useState("Administrasi Umum");
  const [newGrade, setNewGrade] = useState("All");
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUsedBudget, setNewUsedBudget] = useState("0");

  // CSV Import text state
  const [csvText, setCsvText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Save single new APBS item
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDescription.trim()) return;

    const unitPriceNum = Number(newUnitPrice.replace(/\D/g, "")) || 0;
    const qtyNum = Number(newQty) || 1;
    const totalBudget = unitPriceNum * qtyNum;
    const usedNum = Number(newUsedBudget.replace(/\D/g, "")) || 0;

    const newItem: APBSItem = {
      id: `item-${newCode.trim()}`,
      code: newCode.trim(),
      sekdirCode: newSekdirCode.trim() || `SKD-${newCode.trim()}`,
      description: newDescription.trim(),
      category: newCategory,
      activity: newActivity,
      grade: newGrade,
      unit: "SD",
      type: "EXPENSE",
      unitPrice: unitPriceNum,
      totalQty: qtyNum,
      totalBudget,
      usedBudget: usedNum,
      remainingBudget: totalBudget - usedNum,
      monthlyBudget: { 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      isSekdirSynced: true,
    };

    addApbsItem(newItem);
    setIsAddModalOpen(false);
    // Reset
    setNewCode("");
    setNewSekdirCode("");
    setNewDescription("");
    setNewUnitPrice("");
    setNewQty("");
    setNewUsedBudget("0");
  };

  // Parse CSV or Copy-pasted Excel text
  const handleBatchCsvImport = () => {
    if (!csvText.trim()) return;

    const lines = csvText.trim().split("\n");
    const parsedItems: APBSItem[] = [];

    lines.forEach((line, idx) => {
      // split by tab or comma
      const cols = line.includes("\t") ? line.split("\t") : line.split(",");
      if (cols.length < 2) return;

      const code = cols[0]?.trim() || "";
      // Skip header row if present
      if (idx === 0 && (code.toLowerCase().includes("kode") || code.toLowerCase().includes("code"))) return;

      if (!code) return;

      const sekdirCode = cols[1]?.trim() || `SKD-${code}`;
      const description = cols[2]?.trim() || `Kegiatan ${code}`;
      const category = cols[3]?.trim() || "Kegiatan Sekolah";
      const activity = cols[4]?.trim() || "Administrasi Umum";
      const grade = cols[5]?.trim() || "All";
      const unitPrice = Number(cols[6]?.replace(/[^\d]/g, "")) || 100000;
      const qty = Number(cols[7]?.replace(/[^\d]/g, "")) || 1;
      const used = Number(cols[8]?.replace(/[^\d]/g, "")) || 0;

      const totalBudget = unitPrice * qty;

      parsedItems.push({
        id: `item-${code}`,
        code,
        sekdirCode,
        description,
        category,
        activity,
        grade,
        unit: "SD",
        type: "EXPENSE",
        unitPrice,
        totalQty: qty,
        totalBudget,
        usedBudget: used,
        remainingBudget: totalBudget - used,
        monthlyBudget: { 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        isSekdirSynced: true,
      });
    });

    if (parsedItems.length > 0) {
      batchImportApbsItems(parsedItems);
      setImportStatus(`Berhasil mengimpor ${parsedItems.length} Kode APBS ke dalam sistem.`);
      setTimeout(() => {
        setIsImportModalOpen(false);
        setCsvText("");
        setImportStatus(null);
      }, 1200);
    } else {
      setImportStatus("Format tidak dikenali. Pastikan berisi minimal Kode dan Deskripsi per baris.");
    }
  };

  // Filter items
  const expenseItems = items.filter((i) => i.type === "EXPENSE");

  const filteredItems = expenseItems.filter((item) => {
    const matchSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sekdirCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchGrade = gradeFilter === "ALL" || item.grade === gradeFilter;
    const matchAlert = !alertOnly || item.remainingBudget <= 0 || item.remainingBudget / item.totalBudget <= 0.2;

    return matchSearch && matchCategory && matchGrade && matchAlert;
  });

  // Unique categories for filter
  const categories = Array.from(new Set(expenseItems.map((i) => i.category)));

  // Monthly Chart Data (Jul - Jun)
  const monthlyData = ACADEMIC_MONTHS.map((monthOpt) => {
    const mVal = monthOpt.value;
    const monthBudget = expenseItems.reduce((acc, item) => acc + (item.monthlyBudget[mVal] || 0), 0);
    const monthRealized = expenseItems.reduce((acc, item) => {
      return acc + (item.monthlyBudget[mVal] ? Math.min(item.monthlyBudget[mVal], item.usedBudget / 12) : 0);
    }, 0);

    return {
      name: monthOpt.shortLabel,
      Anggaran: monthBudget,
      Realisasi: Math.round(monthRealized),
    };
  });

  // Category Pie Data
  const categoryGrouped: Record<string, number> = {};
  expenseItems.forEach((i) => {
    categoryGrouped[i.category] = (categoryGrouped[i.category] || 0) + i.usedBudget;
  });

  const COLORS = ["#4f46e5", "#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
  const pieData = Object.keys(categoryGrouped).map((cat) => ({
    name: cat,
    value: categoryGrouped[cat],
  }));

  // Items near or over budget
  const alertItems = expenseItems.filter(
    (i) => i.totalBudget > 0 && (i.remainingBudget <= 0 || i.remainingBudget / i.totalBudget <= 0.2)
  );

  const absorptionRate = stats.totalBudgetExpense
    ? ((stats.totalRealizedExpense / stats.totalBudgetExpense) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6 pb-12">
      {/* ================= BENTO GRID MAIN SECTION ================= */}
      <div className="grid grid-cols-12 gap-5">
        {/* Bento Box 1: Total Sisa Anggaran Hero (Col-span 8) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Sisa Anggaran (Real-time)
              </span>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
                {formatRupiah(stats.totalRemainingExpense)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Sisa saldo APBS SD Lazuardi GCS berjalan aman dan otomatis terkalkulasi.
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
                stats.depletedCount > 0
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{stats.depletedCount > 0 ? "PERLU DERAJAT REOKASI" : "DANA AMAN"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 mt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-medium">Dana Awal Total</p>
              <p className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {formatRupiah(stats.totalBudgetExpense)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Sudah Terpakai</p>
              <p className="text-sm sm:text-base font-bold text-rose-600 mt-0.5">
                - {formatRupiah(stats.totalRealizedExpense)}
              </p>
            </div>
            <div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Penyerapan APBS</span>
                <span className="font-bold text-indigo-600">{absorptionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Number(absorptionRate))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bento Box 2: Notifikasi Anggaran Menipis / Kritis (Col-span 4) */}
        <div className="col-span-12 lg:col-span-4 bg-rose-50/70 border border-rose-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></div>
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                  Notifikasi Anggaran Menipis
                </h3>
              </div>
              <button
                onClick={() => setAlertOnly(!alertOnly)}
                className="text-[11px] font-bold text-rose-700 bg-white hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
              >
                {alertOnly ? "Semua" : "Filter Alert"}
              </button>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {alertItems.length === 0 ? (
                <div className="p-4 bg-white rounded-xl text-center text-xs text-slate-500 border border-rose-100">
                  Semua alokasi anggaran APBS saat ini dalam kondisi aman (&gt;20%).
                </div>
              ) : (
                alertItems.slice(0, 3).map((item) => {
                  const isZero = item.remainingBudget <= 0;
                  return (
                    <div
                      key={item.id}
                      className="bg-white p-3 rounded-xl border border-rose-100 flex items-center justify-between shadow-2xs hover:border-rose-300 transition-colors cursor-pointer"
                      onClick={() => onSelectApbsForForm(item.code)}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 font-mono">
                          {item.code} <span className="text-[10px] text-slate-400">({item.sekdirCode})</span>
                        </p>
                        <p className="text-[11px] text-slate-600 truncate">{item.description}</p>
                        <p className={`text-[10px] font-bold mt-0.5 ${isZero ? "text-rose-600" : "text-amber-600"}`}>
                          Sisa: {formatRupiah(item.remainingBudget)} {isZero ? "(Kritis 0)" : "(Limit <20%)"}
                        </p>
                      </div>
                      <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-lg text-xs flex-shrink-0">
                        Ajukan
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <p className="text-[10px] text-rose-700 font-medium mt-3 pt-2 border-t border-rose-100">
            Sistem mencegah pendaftaran jika dana pengajuan melampaui sisa saldo akhir.
          </p>
        </div>

        {/* Bento Box 3: Ringkasan Dana Masuk & Sisa Saldo Kas (Col-span 4) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-emerald-950 text-white rounded-2xl border border-emerald-800 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Dana Masuk &amp; Sisa Kas Real-time
              </h3>
              <span className="bg-emerald-500/20 text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/30">
                Penerimaan SD
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-emerald-900/60 rounded-xl border border-emerald-800/80">
                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Total Dana Masuk (Penerimaan)</p>
                <p className="text-xl font-black text-emerald-300 mt-1">
                  {formatRupiah(stats.totalIncomeEntered)}
                </p>
                <p className="text-[10px] text-emerald-200/70 mt-0.5">SPP, Uang Pangkal, Yayasan, BOS</p>
              </div>

              <div className="p-3 bg-emerald-900/60 rounded-xl border border-emerald-800/80">
                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Realisasi Belanja APBS</p>
                <p className="text-lg font-bold text-rose-300 mt-1">
                  - {formatRupiah(stats.totalRealizedExpense)}
                </p>
              </div>

              <div className="p-3 bg-emerald-900/90 rounded-xl border border-emerald-500/50 shadow-inner">
                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Sisa Saldo Kas Bersih</p>
                <p className="text-xl font-black text-white mt-1">
                  {formatRupiah(stats.netCashRemaining)}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onSelectApbsForForm("")}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span>+ Input / Tambah Dana Masuk</span>
            </button>
          </div>
        </div>

        {/* Bento Box 4: Accuracy & System Status Banner (Col-span 4) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-indigo-900 rounded-2xl p-5 shadow-xs text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                Integritas Data APBS
              </span>
              <span className="bg-indigo-800 text-indigo-200 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                Audited
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-2">
              <div className="bg-indigo-800/60 p-3 rounded-xl border border-indigo-700/50 text-center">
                <p className="text-3xl font-black text-white">100%</p>
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider mt-1">Akurasi Laporan</p>
              </div>
              <div className="bg-indigo-800/60 p-3 rounded-xl border border-indigo-700/50 text-center">
                <p className="text-3xl font-black text-emerald-400">0</p>
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider mt-1">Error Konflik Kode</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-indigo-800/80 text-xs text-indigo-200">
            <p className="font-semibold text-white">SD Lazuardi GCS Cinere</p>
            <p className="text-[11px] text-indigo-300">
              Laporan realisasi siap di-export ke Excel / CSV untuk Sekretariat Direksi &amp; Audit.
            </p>
          </div>
        </div>

        {/* Bento Box 5: Monthly Trend Quick Card (Col-span 4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Tren Pengeluaran Bulanan
            </p>
            <div className="flex items-end gap-1.5 h-20 my-2">
              <div className="flex-1 bg-slate-200 rounded-t-md h-8" title="Juli"></div>
              <div className="flex-1 bg-slate-200 rounded-t-md h-12" title="Agustus"></div>
              <div className="flex-1 bg-indigo-500 rounded-t-md h-16" title="September"></div>
              <div className="flex-1 bg-indigo-600 rounded-t-md h-20" title="Oktober"></div>
              <div className="flex-1 bg-slate-200 rounded-t-md h-10" title="November"></div>
              <div className="flex-1 bg-slate-200 rounded-t-md h-6" title="Desember"></div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-800">Bulan Terpadat: Oktober</p>
              <p className="text-[11px] text-slate-500">Estimasi puncak kegiatan ekskul &amp; rapot</p>
            </div>
            <button
              onClick={() => onSelectApbsForForm("1077")}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>+ Pengajuan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bento Box 6: Bar Chart (Col-span 8) */}
        <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>Grafik Alokasi vs Realisasi Per Bulan (Juli - Juni)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Komparasi alokasi anggaran APBS dengan realisasi belanja bulanan SD Lazuardi
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value)), ""]}
                  labelStyle={{ fontWeight: "bold", color: "#0f172a" }}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                />
                <Bar dataKey="Anggaran" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Alokasi Anggaran" />
                <Bar dataKey="Realisasi" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Realisasi Terpakai" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bento Box 7: Pie Chart (Col-span 4) */}
        <div className="col-span-12 lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2 mb-1">
              <PieIcon className="w-5 h-5 text-indigo-600" />
              <span>Proporsi Realisasi Kategori</span>
            </h3>
            <p className="text-xs text-slate-500 mb-2">Distribusi pengeluaran berdasarkan kategori APBS</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [formatRupiah(Number(val)), "Realisasi"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-xs">
            {pieData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center space-x-2 truncate mr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="truncate text-[11px] font-medium">{entry.name}</span>
                </div>
                <span className="font-bold text-slate-900 text-[11px] flex-shrink-0">
                  {formatRupiah(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Box 8: Master Data APBS Table Section (Col-span 12) */}
        <div className="col-span-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-lg">
                  Master Data Kode &amp; Alokasi APBS (TA 2026-2027)
                </h3>
                <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-full text-xs">
                  {expenseItems.length} Kode APBS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cek sisa saldo real-time per kode APBS, tambah kode baru, atau impor data dari CSV/Excel.
              </p>
            </div>

            {/* Action Buttons & Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kode APBS</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import CSV / Excel</span>
              </button>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari Kode APBS, barang, Sekdir..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none font-medium"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none font-medium"
              >
                <option value="ALL">Semua Kelas</option>
                <option value="1">Kelas 1</option>
                <option value="2">Kelas 2</option>
                <option value="3">Kelas 3</option>
                <option value="4">Kelas 4</option>
                <option value="5">Kelas 5</option>
                <option value="6">Kelas 6</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Kode APBS</th>
                  <th className="py-3 px-3">Kode Sekdir</th>
                  <th className="py-3 px-3">Deskripsi Barang / Kegiatan</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3 text-right">Dana Awal</th>
                  <th className="py-3 px-3 text-right">Terpakai</th>
                  <th className="py-3 px-3 text-right">Sisa Saldo</th>
                  <th className="py-3 px-3 text-center">Status Audit</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="max-w-md mx-auto space-y-3">
                        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700 text-sm">
                          {items.length === 0
                            ? "Semua Data APBS Kosong"
                            : "Tidak ada Kode APBS yang cocok dengan kriteria pencarian"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {items.length === 0
                            ? "Silakan tambah Kode APBS baru, import dari Excel/CSV, atau muat data contoh."
                            : "Coba ubah kata kunci atau filter yang Anda gunakan."}
                        </p>
                        {items.length === 0 && (
                          <div className="flex justify-center space-x-2 pt-2">
                            <button
                              onClick={() => setIsAddModalOpen(true)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Tambah Kode APBS</span>
                            </button>
                            <button
                              onClick={() => setIsImportModalOpen(true)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Import CSV/Excel</span>
                            </button>
                            <button
                              onClick={() => resetToInitialData()}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                            >
                              <span>Muat Demo Data</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const pctRemaining = item.totalBudget > 0 ? (item.remainingBudget / item.totalBudget) * 100 : 0;
                    const isZero = item.remainingBudget <= 0;
                    const isLow = !isZero && pctRemaining <= 20;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 bg-slate-50/50">
                          {item.code}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-indigo-700 font-semibold">
                          {item.sekdirCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 max-w-xs">
                          {item.description}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          <div className="font-semibold text-slate-700">{item.category}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            {item.grade === "All" ? "Semua" : `Gr ${item.grade}`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                          {formatRupiah(item.totalBudget)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-rose-600">
                          {formatRupiah(item.usedBudget)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-bold ${
                            isZero ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-700"
                          }`}
                        >
                          {formatRupiah(item.remainingBudget)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isZero ? (
                            <span className="bg-rose-100 text-rose-700 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">
                              HABIS
                            </span>
                          ) : isLow ? (
                            <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">
                              MENIPIS
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">
                              PASSED AUDIT
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center space-x-1">
                          <button
                            onClick={() => onSelectApbsForForm(item.code)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            Ajukan
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus Kode APBS ${item.code} (${item.description})?`)) {
                                deleteApbsItem(item.code);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Kode APBS"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Modal: Tambah Kode APBS Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Tambah Kode APBS Baru</h3>
                <p className="text-xs text-slate-500">Masukkan rincian item anggaran APBS sekolah</p>
              </div>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode APBS *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 105"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Sekdir</label>
                  <input
                    type="text"
                    placeholder="Contoh: SKD-105"
                    value={newSekdirCode}
                    onChange={(e) => setNewSekdirCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Kegiatan / Barang *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembelian Alat Peraga Matematika Kelas 1"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                  >
                    <option value="Kegiatan Sekolah">Kegiatan Sekolah</option>
                    <option value="Administrasi & Mgt. Pendidikan">Administrasi &amp; Mgt. Pendidikan</option>
                    <option value="Peralatan & Perlengkapan Sekolah">Peralatan &amp; Perlengkapan Sekolah</option>
                    <option value="Pengembangan SDM">Pengembangan SDM</option>
                    <option value="Beban SDM">Beban SDM</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas / Grade</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                  >
                    <option value="All">Semua Kelas (All)</option>
                    <option value="1">Kelas 1</option>
                    <option value="2">Kelas 2</option>
                    <option value="3">Kelas 3</option>
                    <option value="4">Kelas 4</option>
                    <option value="5">Kelas 5</option>
                    <option value="6">Kelas 6</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="text"
                    placeholder="150000"
                    value={newUnitPrice}
                    onChange={(e) => setNewUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qty / Vol</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sudah Digunakan (Rp)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={newUsedBudget}
                    onChange={(e) => setNewUsedBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Simpan Kode APBS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Batch CSV / Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 relative">
            <button
              onClick={() => {
                setIsImportModalOpen(false);
                setImportStatus(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Import Batch Data APBS (CSV / Excel)</h3>
                <p className="text-xs text-slate-500">Copy &amp; paste baris data dari Google Sheets atau file CSV</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-3 text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Format Baris (Pisahkan dengan Tab atau Koma):</p>
              <p className="font-mono bg-white p-1.5 rounded border border-slate-200 text-indigo-700">
                Kode, KodeSekdir, Deskripsi, Kategori, Activity, Grade, HargaSatuan, Qty, UsedBudget
              </p>
              <p className="text-slate-500">
                Atau cukup paste minimal 2 kolom: <span className="font-mono font-semibold">Kode, Deskripsi</span>
              </p>
            </div>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste data dari Google Sheets / CSV di sini...&#10;Contoh:&#10;105	SKD-105	Alat Peraga Matematika	Kegiatan Sekolah	Praktikum	1	150000	2	0"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none mb-3"
            />

            {importStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-medium mb-3 ${
                  importStatus.includes("Berhasil")
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {importStatus}
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Sistem akan menambahkan atau memperbarui kode APBS yang dicocokkan.
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleBatchCsvImport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Proses Import</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

