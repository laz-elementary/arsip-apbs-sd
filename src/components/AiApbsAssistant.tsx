import React, { useState } from "react";
import { useApbs } from "../context/ApbsContext";
import { Bot, Sparkles, Send, ArrowRight, CheckCircle2, Search, HelpCircle, Loader2 } from "lucide-react";

interface AiApbsAssistantProps {
  onSelectCodeForForm: (code: string) => void;
}

export const AiApbsAssistant: React.FC<AiApbsAssistantProps> = ({ onSelectCodeForForm }) => {
  const { items } = useApbs();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQueries = [
    "Saya mau beli 10 rim Kertas HVS untuk Rapot, kodenya berapa dan berapa sisa saldonya?",
    "Untuk Lomba Guru dan Kepsek Berprestasi, apakah anggrannya masih ada?",
    "Pengajuan konsumsi juri Bulan Bahasa overbudget, ada saran reokasi ke kode mana?",
    "Cari kode APBS untuk Pembelian Toner / Refill Cartridge Printer kelas 6.",
  ];

  const handleAskAi = async (textToAsk?: string) => {
    const query = textToAsk || prompt;
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      // Send items context to server API
      const apbsContext = items.map((i) => ({
        code: i.code,
        sekdirCode: i.sekdirCode,
        description: i.description,
        category: i.category,
        totalBudget: i.totalBudget,
        usedBudget: i.usedBudget,
        remainingBudget: i.remainingBudget,
      }));

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          apbsItemsContext: apbsContext,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghubungi Asisten AI.");
      }

      setResponse(data.result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat memproses permintaan AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-purple-800">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-500/20 border border-purple-400/30 rounded-xl text-purple-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Asisten AI APBS SD Lazuardi GCS</h2>
            <p className="text-xs text-purple-200 mt-1">
              Tanyakan kecocokan Kode APBS, ketersediaan saldo, atau rekomendasi reokasi anggaran menggunakan Gemini AI.
            </p>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Tanyakan Sesuatu Kepada Asisten APBS
        </label>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="misal: Berapa sisa budget Kertas HVS? Atau cari kode APBS untuk konsumsi juri..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskAi()}
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          <button
            onClick={() => handleAskAi()}
            disabled={loading || !prompt.trim()}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Analisis AI</span>
          </button>
        </div>

        {/* Sample Queries */}
        <div className="pt-2">
          <p className="text-[11px] font-semibold text-slate-500 mb-2">Contoh Pertanyaan Cepat:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(q);
                  handleAskAi(q);
                }}
                className="text-left text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-900 px-3 py-1.5 rounded-lg border border-purple-200 transition-colors"
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Response Box */}
      {loading && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700">Gemini AI sedang menganalisis Master Data APBS SD Lazuardi...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs text-red-900 font-medium">
          {error}
        </div>
      )}

      {response && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-purple-200 p-6 space-y-4">
          <div className="flex items-center space-x-2 text-purple-900 font-bold text-sm border-b pb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Rekomendasi &amp; Analisis Asisten AI APBS</span>
          </div>

          <div className="text-xs text-slate-800 space-y-2 whitespace-pre-wrap leading-relaxed">
            {response}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              Analisis ini dihitung berdasarkan saldo live APBS SD Lazuardi TA 2026-2027.
            </p>
            <button
              onClick={() => {
                // Find if a code is mentioned in response
                const codeMatch = response.match(/Kode\s+(\d+)/i) || response.match(/APBS\s+(\d+)/i);
                if (codeMatch && codeMatch[1]) {
                  onSelectCodeForForm(codeMatch[1]);
                }
              }}
              className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1"
            >
              <span>Isi Ke Form Pengajuan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
