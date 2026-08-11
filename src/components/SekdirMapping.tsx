import React, { useState } from "react";
import { useApbs } from "../context/ApbsContext";
import {
  CheckCheck,
  Search,
  Edit2,
  Save,
  X,
  AlertCircle,
  Building,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export const SekdirMapping: React.FC = () => {
  const { items, updateSekdirCode } = useApbs();

  const [searchTerm, setSearchTerm] = useState("");
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [newSekdirVal, setNewSekdirVal] = useState("");

  const filtered = items.filter(
    (i) =>
      i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.sekdirCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEdit = (code: string, currentSekdir: string) => {
    setEditingCode(code);
    setNewSekdirVal(currentSekdir);
  };

  const handleSave = (code: string) => {
    if (newSekdirVal.trim()) {
      updateSekdirCode(code, newSekdirVal.trim());
    }
    setEditingCode(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-600/30 border border-emerald-500/40 rounded-xl text-emerald-400">
            <CheckCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Pemetaan &amp; Sinkronisasi Kode APBS Sekdir vs Internal SD</h2>
            <p className="text-xs text-slate-300 mt-1">
              Solusi Mencegah Kekeliruan Kode APBS antara Sekolah dan Sekretariat Direksi (Sekdir). Peta kode ini digunakan otomatis pada semua pengajuan dana.
            </p>
          </div>
        </div>
      </div>

      {/* Table & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari Kode APBS, Sekdir, atau Nama Barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="text-xs text-slate-500">
            Total {items.length} Kode APBS Terdaftar
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-900 text-white font-semibold">
              <tr>
                <th className="py-3 px-4">Kode APBS Internal SD</th>
                <th className="py-3 px-4">Kode APBS Sekdir</th>
                <th className="py-3 px-4">Deskripsi Barang / Kegiatan</th>
                <th className="py-3 px-4">Kategori APBS</th>
                <th className="py-3 px-4 text-center">Status Sinkron</th>
                <th className="py-3 px-4 text-center">Aksi Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    Kode {item.code}
                  </td>

                  <td className="py-3 px-4 font-mono">
                    {editingCode === item.code ? (
                      <input
                        type="text"
                        value={newSekdirVal}
                        onChange={(e) => setNewSekdirVal(e.target.value)}
                        className="px-2 py-1 bg-amber-50 border border-amber-300 rounded font-bold text-slate-900 text-xs focus:outline-none"
                      />
                    ) : (
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded font-bold">
                        {item.sekdirCode}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-900 max-w-sm">
                    {item.description}
                  </td>

                  <td className="py-3 px-4 text-slate-500">{item.category}</td>

                  <td className="py-3 px-4 text-center">
                    {item.isSekdirSynced ? (
                      <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Tersinkron</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        <span>Perlu Koreksi</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {editingCode === item.code ? (
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handleSave(item.code)}
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          title="Simpan Kode Sekdir"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCode(null)}
                          className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(item.code, item.sekdirCode)}
                        className="text-slate-400 hover:text-emerald-700 p-1 rounded hover:bg-slate-100 transition-colors"
                        title="Edit Kode Sekdir"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
