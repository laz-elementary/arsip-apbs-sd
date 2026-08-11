import React, { useState } from "react";
import { ApbsProvider } from "./context/ApbsContext";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { PengajuanForm } from "./components/PengajuanForm";
import { TransactionList } from "./components/TransactionList";
import { IncomeManagement } from "./components/IncomeManagement";
import { AuditReport } from "./components/AuditReport";
import { AiApbsAssistant } from "./components/AiApbsAssistant";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedApbsCodeForForm, setSelectedApbsCodeForForm] = useState("");

  const handleSelectApbsForForm = (code: string) => {
    setSelectedApbsCodeForForm(code);
    setActiveTab("pengajuan");
  };

  return (
    <ApbsProvider>
      <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === "dashboard" && <Dashboard onSelectApbsForForm={handleSelectApbsForForm} />}

          {activeTab === "income" && <IncomeManagement />}

          {activeTab === "pengajuan" && (
            <PengajuanForm
              initialCode={selectedApbsCodeForForm}
              onSuccessNavigate={() => {
                setActiveTab("transactions");
                setSelectedApbsCodeForForm("");
              }}
            />
          )}

          {activeTab === "transactions" && <TransactionList />}

          {activeTab === "report" && <AuditReport />}

          {activeTab === "ai-assistant" && (
            <AiApbsAssistant onSelectCodeForForm={handleSelectApbsForForm} />
          )}
        </main>

        <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800 text-center print:hidden">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>&copy; 2026 APBS SD Lazuardi Global Compassionate School (GCS) Cinere</span>
            <span className="text-slate-500">Sistem Realisasi Anggaran APBS SD • TA 2026-2027</span>
          </div>
        </footer>
      </div>
    </ApbsProvider>
  );
}
