import React, { createContext, useContext, useState, useEffect } from "react";
import { APBSItem, Transaction, TransactionStatus, WarningLevel, IncomeRecord } from "../types/apbs";
import { INITIAL_APBS_ITEMS, INITIAL_TRANSACTIONS } from "../data/initialApbsData";

const INITIAL_INCOME_RECORDS: IncomeRecord[] = [
  {
    id: "inc-1",
    incomeNo: "INC-202607-101",
    date: "2026-07-10",
    sourceCategory: "Pendapatan Daftar Ulang",
    amount: 3443033000,
    description: "Penerimaan Daftar Ulang Siswa TA 2026-2027",
    receivedBy: "Bendahara Yayasan",
    month: 7,
  },
  {
    id: "inc-2",
    incomeNo: "INC-202607-102",
    date: "2026-07-15",
    sourceCategory: "Uang Pangkal",
    amount: 1830000000,
    description: "Penerimaan Uang Pangkal Siswa Baru SD Kelas 1",
    receivedBy: "Admin Keuangan SD",
    month: 7,
  },
  {
    id: "inc-3",
    incomeNo: "INC-202608-103",
    date: "2026-08-01",
    sourceCategory: "SPP Sekolah",
    amount: 1395000250,
    description: "Penerimaan SPP Bulan Agustus 2026",
    receivedBy: "Admin Keuangan SD",
    month: 8,
  },
];

interface ApbsContextType {
  items: APBSItem[];
  transactions: Transaction[];
  incomeRecords: IncomeRecord[];
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  addTransaction: (newTx: Omit<Transaction, "id" | "transactionNo" | "initialBudget" | "usedBefore" | "remainingBefore" | "remainingAfter" | "warningLevel">) => { success: boolean; message: string; transaction?: Transaction };
  updateTransactionStatus: (id: string, status: TransactionStatus, adminNotes?: string) => void;
  deleteTransaction: (id: string) => void;
  addIncomeRecord: (record: Omit<IncomeRecord, "id" | "incomeNo">) => void;
  deleteIncomeRecord: (id: string) => void;
  updateSekdirCode: (code: string, newSekdirCode: string) => void;
  addApbsItem: (item: APBSItem) => void;
  updateApbsItem: (code: string, updated: Partial<APBSItem>) => void;
  deleteApbsItem: (code: string) => void;
  batchImportApbsItems: (newItems: APBSItem[]) => void;
  resetToInitialData: () => void;
  clearAllData: () => void;
  getItemByCode: (code: string) => APBSItem | undefined;
  getSummaryStats: () => {
    totalIncome: number;
    totalBudgetExpense: number;
    totalRealizedExpense: number;
    totalRemainingExpense: number;
    netCashRemaining: number;
    lowBudgetCount: number;
    depletedCount: number;
    pendingTxCount: number;
  };
}

const ApbsContext = createContext<ApbsContextType | undefined>(undefined);

const LOCAL_STORAGE_ITEMS_KEY = "lazuardi_apbs_items_v1";
const LOCAL_STORAGE_TX_KEY = "lazuardi_apbs_tx_v1";
const LOCAL_STORAGE_INCOME_KEY = "lazuardi_apbs_income_v1";

export const ApbsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
      if (saved !== null) {
        const parsed: Transaction[] = JSON.parse(saved);
        // Filter out old default sample transactions if present
        return parsed.filter((t) => !["tx-001", "tx-002", "tx-003", "tx-004"].includes(t.id));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [items, setItems] = useState<APBSItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
      let loadedItems: APBSItem[] = saved !== null ? JSON.parse(saved) : INITIAL_APBS_ITEMS;
      if (!Array.isArray(loadedItems) || loadedItems.length === 0) {
        loadedItems = INITIAL_APBS_ITEMS;
      }

      // Check active transactions
      const savedTx = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
      const activeTx: Transaction[] = savedTx
        ? JSON.parse(savedTx).filter((t: Transaction) => !["tx-001", "tx-002", "tx-003", "tx-004"].includes(t.id))
        : [];

      const txMap = new Map<string, number>();
      activeTx.forEach((tx) => {
        if (tx.status === "APPROVED") {
          txMap.set(tx.apbsCode, (txMap.get(tx.apbsCode) || 0) + tx.requestedAmount);
        }
      });

      return loadedItems.map((item: APBSItem) => {
        if (item.type === "EXPENSE") {
          const used = txMap.get(item.code) || 0;
          return {
            ...item,
            usedBudget: used,
            remainingBudget: item.totalBudget - used,
          };
        }
        return item;
      });
    } catch {
      return INITIAL_APBS_ITEMS.map((item) => ({
        ...item,
        usedBudget: item.type === "EXPENSE" ? 0 : item.usedBudget,
        remainingBudget: item.type === "EXPENSE" ? item.totalBudget : item.remainingBudget,
      }));
    }
  });

  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_INCOME_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(8); // Default Agustus

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save items to LocalStorage", e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error("Failed to save transactions to LocalStorage", e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_INCOME_KEY, JSON.stringify(incomeRecords));
    } catch (e) {
      console.error("Failed to save income records to LocalStorage", e);
    }
  }, [incomeRecords]);

  const getItemByCode = (code: string): APBSItem | undefined => {
    const cleanCode = code.trim().toLowerCase();
    return items.find((i) => i.code.trim().toLowerCase() === cleanCode || (i.sekdirCode && i.sekdirCode.trim().toLowerCase() === cleanCode));
  };

  const addTransaction = (
    txInput: Omit<Transaction, "id" | "transactionNo" | "initialBudget" | "usedBefore" | "remainingBefore" | "remainingAfter" | "warningLevel">
  ) => {
    const apbsItem = getItemByCode(txInput.apbsCode);

    if (!apbsItem) {
      return {
        success: false,
        message: `Kode APBS "${txInput.apbsCode}" tidak ditemukan dalam master data APBS SD Lazuardi. Mohon periksa kembali kodenya.`,
      };
    }

    const initialBudget = apbsItem.totalBudget;
    const usedBefore = apbsItem.usedBudget;
    const remainingBefore = apbsItem.remainingBudget;
    const requestedAmount = Number(txInput.requestedAmount) || 0;
    const remainingAfter = remainingBefore - requestedAmount;

    let warningLevel: WarningLevel = "OK";
    if (remainingAfter < 0) {
      warningLevel = "OVERBUDGET";
    } else if (remainingAfter === 0) {
      warningLevel = "EXHAUSTED";
    } else if (remainingAfter / initialBudget <= 0.2) {
      warningLevel = "LOW_BUDGET";
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const transactionNo = `TX-${dateStr}-${randomSeq}`;

    const newTx: Transaction = {
      ...txInput,
      id: `tx-${Date.now()}`,
      transactionNo,
      apbsCode: apbsItem.code,
      sekdirCode: apbsItem.sekdirCode || `SKD-${apbsItem.code}`,
      apbsItemName: txInput.apbsItemName || apbsItem.description,
      initialBudget,
      usedBefore,
      remainingBefore,
      requestedAmount,
      remainingAfter,
      warningLevel,
      sekdirSyncStatus: apbsItem.isSekdirSynced ? "MATCHED" : "MISMATCH_CORRECTED",
      isNonApbs: txInput.isNonApbs || apbsItem.isNonApbs || false,
    };

    // Update APBS Item budget state
    const newUsed = usedBefore + requestedAmount;
    const newRemaining = initialBudget - newUsed;

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.code === apbsItem.code) {
          return {
            ...item,
            usedBudget: newUsed,
            remainingBudget: newRemaining,
          };
        }
        return item;
      })
    );

    setTransactions((prev) => [newTx, ...prev]);

    let msg = `Pengajuan dana Rp ${requestedAmount.toLocaleString("id-ID")} untuk Kode APBS ${apbsItem.code} (${apbsItem.description}) berhasil dicatat.`;
    if (warningLevel === "OVERBUDGET") {
      msg += ` PERINGATAN: Pengajuan ini melebihi sisa anggaran sebesar Rp ${Math.abs(remainingAfter).toLocaleString("id-ID")}. Memerlukan persetujuan khusus atau penggantian kode.`;
    } else if (warningLevel === "LOW_BUDGET") {
      msg += ` CATATAN: Sisa anggaran APBS tinggal ${((remainingAfter / initialBudget) * 100).toFixed(1)}% (Rp ${remainingAfter.toLocaleString("id-ID")}).`;
    }

    return {
      success: true,
      message: msg,
      transaction: newTx,
    };
  };

  const updateTransactionStatus = (id: string, status: TransactionStatus, adminNotes?: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          return {
            ...tx,
            status,
            adminNotes: adminNotes || tx.adminNotes,
          };
        }
        return tx;
      })
    );
  };

  const deleteTransaction = (id: string) => {
    const targetTx = transactions.find((t) => t.id === id);
    if (targetTx) {
      // Revert budget usage
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.code === targetTx.apbsCode) {
            const newUsed = Math.max(0, item.usedBudget - targetTx.requestedAmount);
            return {
              ...item,
              usedBudget: newUsed,
              remainingBudget: item.totalBudget - newUsed,
            };
          }
          return item;
        })
      );
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addIncomeRecord = (record: Omit<IncomeRecord, "id" | "incomeNo">) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const incomeNo = `INC-${dateStr}-${randomSeq}`;

    const newRecord: IncomeRecord = {
      ...record,
      id: `inc-${Date.now()}`,
      incomeNo,
    };

    setIncomeRecords((prev) => [newRecord, ...prev]);

    // Also update matching INCOME item if applicable
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (
          item.type === "INCOME" &&
          (item.description.toLowerCase().includes(record.sourceCategory.toLowerCase()) ||
            item.category.toLowerCase().includes(record.sourceCategory.toLowerCase()))
        ) {
          const newUsed = item.usedBudget + record.amount;
          return {
            ...item,
            usedBudget: newUsed,
            remainingBudget: item.totalBudget - newUsed,
          };
        }
        return item;
      })
    );
  };

  const deleteIncomeRecord = (id: string) => {
    setIncomeRecords((prev) => prev.filter((rec) => rec.id !== id));
  };

  const updateSekdirCode = (code: string, newSekdirCode: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.code === code) {
          return {
            ...item,
            sekdirCode: newSekdirCode,
            isSekdirSynced: true,
          };
        }
        return item;
      })
    );
  };

  const addApbsItem = (newItem: APBSItem) => {
    setItems((prev) => {
      // Check if code exists, if so replace or append
      const exists = prev.some((i) => i.code === newItem.code);
      if (exists) {
        return prev.map((i) => (i.code === newItem.code ? newItem : i));
      }
      return [...prev, newItem];
    });
  };

  const updateApbsItem = (code: string, updated: Partial<APBSItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.code === code) {
          const merged = { ...item, ...updated };
          merged.remainingBudget = merged.totalBudget - merged.usedBudget;
          return merged;
        }
        return item;
      })
    );
  };

  const deleteApbsItem = (code: string) => {
    setItems((prev) => prev.filter((i) => i.code !== code));
  };

  const batchImportApbsItems = (newItems: APBSItem[]) => {
    setItems((prev) => {
      const map = new Map<string, APBSItem>();
      // Preserve existing state or overwrite with new
      prev.forEach((i) => map.set(i.code, i));
      newItems.forEach((i) => map.set(i.code, i));
      return Array.from(map.values());
    });
  };

  const resetToInitialData = () => {
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(INITIAL_APBS_ITEMS));
    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem(LOCAL_STORAGE_INCOME_KEY, JSON.stringify(INITIAL_INCOME_RECORDS));
    setItems(INITIAL_APBS_ITEMS);
    setTransactions(INITIAL_TRANSACTIONS);
    setIncomeRecords(INITIAL_INCOME_RECORDS);
  };

  const clearAllData = () => {
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_INCOME_KEY, JSON.stringify([]));
    setItems([]);
    setTransactions([]);
    setIncomeRecords([]);
  };

  const getSummaryStats = () => {
    const expenseItems = items.filter((i) => i.type === "EXPENSE");
    const incomeItems = items.filter((i) => i.type === "INCOME");

    const totalIncomeEntered = incomeRecords.reduce((acc, rec) => acc + Number(rec.amount || 0), 0);
    const totalIncomeBudget = incomeItems.reduce((acc, i) => acc + i.totalBudget, 0);
    const totalIncome = totalIncomeEntered > 0 ? totalIncomeEntered : totalIncomeBudget;

    const totalBudgetExpense = expenseItems.reduce((acc, i) => acc + i.totalBudget, 0);
    const totalRealizedExpense = expenseItems.reduce((acc, i) => acc + i.usedBudget, 0);
    const totalRemainingExpense = totalBudgetExpense - totalRealizedExpense;
    
    // Net cash remaining = total dana masuk received - total expenses paid
    const netCashRemaining = totalIncomeEntered - totalRealizedExpense;

    const lowBudgetCount = expenseItems.filter(
      (i) => i.remainingBudget > 0 && i.totalBudget > 0 && i.remainingBudget / i.totalBudget <= 0.2
    ).length;

    const depletedCount = expenseItems.filter((i) => i.remainingBudget <= 0 && i.totalBudget > 0).length;

    const pendingTxCount = transactions.filter((t) => t.status === "PENDING").length;

    return {
      totalIncome,
      totalIncomeEntered,
      totalBudgetExpense,
      totalRealizedExpense,
      totalRemainingExpense,
      netCashRemaining,
      lowBudgetCount,
      depletedCount,
      pendingTxCount,
    };
  };

  return (
    <ApbsContext.Provider
      value={{
        items,
        transactions,
        incomeRecords,
        selectedMonth,
        setSelectedMonth,
        addTransaction,
        updateTransactionStatus,
        deleteTransaction,
        addIncomeRecord,
        deleteIncomeRecord,
        updateSekdirCode,
        addApbsItem,
        updateApbsItem,
        deleteApbsItem,
        batchImportApbsItems,
        resetToInitialData,
        clearAllData,
        getItemByCode,
        getSummaryStats,
      }}
    >
      {children}
    </ApbsContext.Provider>
  );
};

export const useApbs = () => {
  const context = useContext(ApbsContext);
  if (!context) {
    throw new Error("useApbs must be used within an ApbsProvider");
  }
  return context;
};
