import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  APBSItem,
  IncomeRecord,
  Transaction,
  TransactionStatus,
  WarningLevel,
} from "../types/apbs";
import {
  INITIAL_APBS_ITEMS,
  INITIAL_TRANSACTIONS,
} from "../data/initialApbsData";
import { supabase } from "../lib/supabase";

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
  addTransaction: (
    newTx: Omit<
      Transaction,
      | "id"
      | "transactionNo"
      | "initialBudget"
      | "usedBefore"
      | "remainingBefore"
      | "remainingAfter"
      | "warningLevel"
    >
  ) => {
    success: boolean;
    message: string;
    transaction?: Transaction;
  };
  updateTransactionStatus: (
    id: string,
    status: TransactionStatus,
    adminNotes?: string
  ) => void;
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
const SAMPLE_TX_IDS = new Set(["tx-001", "tx-002", "tx-003", "tx-004"]);

const safeNumber = (value: unknown) => Number(value ?? 0);

const readCache = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const toApbsRow = (item: APBSItem) => ({
  id: item.id,
  code: item.code,
  sekdir_code: item.sekdirCode || null,
  description: item.description,
  category: item.category,
  activity: item.activity,
  grade: item.grade,
  unit: item.unit,
  type: item.type,
  unit_price: item.unitPrice,
  total_qty: item.totalQty,
  total_budget: item.totalBudget,
  used_budget: item.usedBudget,
  remaining_budget: item.remainingBudget,
  monthly_budget: item.monthlyBudget ?? {},
  notes: item.notes ?? null,
  is_sekdir_synced: item.isSekdirSynced,
  is_non_apbs: item.isNonApbs ?? false,
  updated_at: new Date().toISOString(),
});

const fromApbsRow = (row: any): APBSItem => ({
  id: row.id,
  code: row.code,
  sekdirCode: row.sekdir_code ?? "",
  description: row.description ?? "",
  category: row.category ?? "",
  activity: row.activity ?? "",
  grade: row.grade ?? "All",
  unit: row.unit ?? "SD",
  type: row.type,
  unitPrice: safeNumber(row.unit_price),
  totalQty: safeNumber(row.total_qty),
  totalBudget: safeNumber(row.total_budget),
  usedBudget: safeNumber(row.used_budget),
  remainingBudget: safeNumber(row.remaining_budget),
  monthlyBudget: row.monthly_budget ?? {},
  notes: row.notes ?? undefined,
  isSekdirSynced: row.is_sekdir_synced ?? true,
  isNonApbs: row.is_non_apbs ?? false,
});

const toTransactionRow = (tx: Transaction) => ({
  id: tx.id,
  transaction_no: tx.transactionNo,
  apbs_code: tx.apbsCode,
  sekdir_code: tx.sekdirCode || null,
  apbs_item_name: tx.apbsItemName,
  requested_by: tx.requestedBy,
  grade: tx.grade,
  submission_date: tx.submissionDate,
  month: tx.month,
  initial_budget: tx.initialBudget,
  used_before: tx.usedBefore,
  remaining_before: tx.remainingBefore,
  requested_amount: tx.requestedAmount,
  remaining_after: tx.remainingAfter,
  purpose: tx.purpose,
  status: tx.status,
  warning_level: tx.warningLevel,
  sekdir_sync_status: tx.sekdirSyncStatus,
  admin_notes: tx.adminNotes ?? null,
  reallocated_code: tx.reallocatedCode ?? null,
  is_non_apbs: tx.isNonApbs ?? false,
  updated_at: new Date().toISOString(),
});

const fromTransactionRow = (row: any): Transaction => ({
  id: row.id,
  transactionNo: row.transaction_no,
  apbsCode: row.apbs_code,
  sekdirCode: row.sekdir_code ?? "",
  apbsItemName: row.apbs_item_name ?? "",
  requestedBy: row.requested_by ?? "",
  grade: row.grade ?? "",
  submissionDate: row.submission_date,
  month: safeNumber(row.month),
  initialBudget: safeNumber(row.initial_budget),
  usedBefore: safeNumber(row.used_before),
  remainingBefore: safeNumber(row.remaining_before),
  requestedAmount: safeNumber(row.requested_amount),
  remainingAfter: safeNumber(row.remaining_after),
  purpose: row.purpose ?? "",
  status: row.status,
  warningLevel: row.warning_level,
  sekdirSyncStatus: row.sekdir_sync_status,
  adminNotes: row.admin_notes ?? undefined,
  reallocatedCode: row.reallocated_code ?? undefined,
  isNonApbs: row.is_non_apbs ?? false,
});

const toIncomeRow = (record: IncomeRecord) => ({
  id: record.id,
  income_no: record.incomeNo,
  date: record.date,
  source_category: record.sourceCategory,
  amount: record.amount,
  description: record.description,
  received_by: record.receivedBy,
  month: record.month,
  updated_at: new Date().toISOString(),
});

const fromIncomeRow = (row: any): IncomeRecord => ({
  id: row.id,
  incomeNo: row.income_no,
  date: row.date,
  sourceCategory: row.source_category ?? "",
  amount: safeNumber(row.amount),
  description: row.description ?? "",
  receivedBy: row.received_by ?? "",
  month: safeNumber(row.month),
});

export const ApbsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<APBSItem[]>(INITIAL_APBS_ITEMS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(8);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const [itemsResult, txResult, incomeResult] = await Promise.all([
          supabase.from("apbs_items").select("*").order("code"),
          supabase
            .from("apbs_transactions")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("income_records")
            .select("*")
            .order("date", { ascending: false }),
        ]);

        if (itemsResult.error) throw itemsResult.error;
        if (txResult.error) throw txResult.error;
        if (incomeResult.error) throw incomeResult.error;

        let nextItems: APBSItem[];
        if (itemsResult.data && itemsResult.data.length > 0) {
          nextItems = itemsResult.data.map(fromApbsRow);
        } else {
          const cachedItems = readCache<APBSItem[]>(
            LOCAL_STORAGE_ITEMS_KEY,
            INITIAL_APBS_ITEMS
          );
          nextItems =
            Array.isArray(cachedItems) && cachedItems.length > 0
              ? cachedItems
              : INITIAL_APBS_ITEMS;

          const { error } = await supabase
            .from("apbs_items")
            .upsert(nextItems.map(toApbsRow), { onConflict: "id" });
          if (error) throw error;
        }

        let nextTransactions: Transaction[] = [];
        if (txResult.data && txResult.data.length > 0) {
          nextTransactions = txResult.data.map(fromTransactionRow);
        } else {
          const cachedTx = readCache<Transaction[]>(LOCAL_STORAGE_TX_KEY, []);
          nextTransactions = Array.isArray(cachedTx)
            ? cachedTx.filter((tx) => !SAMPLE_TX_IDS.has(tx.id))
            : [];

          if (nextTransactions.length > 0) {
            const { error } = await supabase
              .from("apbs_transactions")
              .upsert(nextTransactions.map(toTransactionRow), {
                onConflict: "id",
              });
            if (error) throw error;
          }
        }

        let nextIncome: IncomeRecord[] = [];
        if (incomeResult.data && incomeResult.data.length > 0) {
          nextIncome = incomeResult.data.map(fromIncomeRow);
        } else {
          const cachedIncome = readCache<IncomeRecord[]>(
            LOCAL_STORAGE_INCOME_KEY,
            []
          );
          nextIncome = Array.isArray(cachedIncome) ? cachedIncome : [];

          if (nextIncome.length > 0) {
            const { error } = await supabase
              .from("income_records")
              .upsert(nextIncome.map(toIncomeRow), { onConflict: "id" });
            if (error) throw error;
          }
        }

        if (!cancelled) {
          setItems(nextItems);
          setTransactions(nextTransactions);
          setIncomeRecords(nextIncome);
          setHydrated(true);
        }
      } catch (error) {
        console.error("Gagal memuat data dari Supabase:", error);

        if (!cancelled) {
          const cachedItems = readCache<APBSItem[]>(
            LOCAL_STORAGE_ITEMS_KEY,
            INITIAL_APBS_ITEMS
          );
          const cachedTx = readCache<Transaction[]>(LOCAL_STORAGE_TX_KEY, []);
          const cachedIncome = readCache<IncomeRecord[]>(
            LOCAL_STORAGE_INCOME_KEY,
            []
          );

          setItems(
            Array.isArray(cachedItems) && cachedItems.length > 0
              ? cachedItems
              : INITIAL_APBS_ITEMS
          );
          setTransactions(
            Array.isArray(cachedTx)
              ? cachedTx.filter((tx) => !SAMPLE_TX_IDS.has(tx.id))
              : []
          );
          setIncomeRecords(Array.isArray(cachedIncome) ? cachedIncome : []);
          setHydrated(true);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
    if (items.length === 0) return;

    void supabase
      .from("apbs_items")
      .upsert(items.map(toApbsRow), { onConflict: "id" })
      .then(({ error }) => {
        if (error) console.error("Gagal sinkron master APBS:", error);
      });
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(transactions));
    if (transactions.length === 0) return;

    void supabase
      .from("apbs_transactions")
      .upsert(transactions.map(toTransactionRow), { onConflict: "id" })
      .then(({ error }) => {
        if (error) console.error("Gagal sinkron transaksi:", error);
      });
  }, [transactions, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    localStorage.setItem(
      LOCAL_STORAGE_INCOME_KEY,
      JSON.stringify(incomeRecords)
    );
    if (incomeRecords.length === 0) return;

    void supabase
      .from("income_records")
      .upsert(incomeRecords.map(toIncomeRow), { onConflict: "id" })
      .then(({ error }) => {
        if (error) console.error("Gagal sinkron pemasukan:", error);
      });
  }, [incomeRecords, hydrated]);

  const getItemByCode = (code: string): APBSItem | undefined => {
    const cleanCode = code.trim().toLowerCase();
    return items.find(
      (item) =>
        item.code.trim().toLowerCase() === cleanCode ||
        item.sekdirCode?.trim().toLowerCase() === cleanCode
    );
  };

  const addTransaction: ApbsContextType["addTransaction"] = (txInput) => {
    const apbsItem = getItemByCode(txInput.apbsCode);

    if (!apbsItem) {
      return {
        success: false,
        message: `Kode APBS "${txInput.apbsCode}" tidak ditemukan dalam master data APBS SD Lazuardi. Mohon periksa kembali kodenya.`,
      };
    }

    const initialBudget = safeNumber(apbsItem.totalBudget);
    const usedBefore = safeNumber(apbsItem.usedBudget);
    const remainingBefore = safeNumber(apbsItem.remainingBudget);
    const requestedAmount = safeNumber(txInput.requestedAmount);
    const remainingAfter = remainingBefore - requestedAmount;

    let warningLevel: WarningLevel = "OK";
    if (remainingAfter < 0) {
      warningLevel = "OVERBUDGET";
    } else if (remainingAfter === 0) {
      warningLevel = "EXHAUSTED";
    } else if (
      initialBudget > 0 &&
      remainingAfter / initialBudget <= 0.2
    ) {
      warningLevel = "LOW_BUDGET";
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const transactionNo = `TX-${dateStr}-${randomSeq}`;

    const newTx: Transaction = {
      ...txInput,
      id: `tx-${Date.now()}-${randomSeq}`,
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
      sekdirSyncStatus: apbsItem.isSekdirSynced
        ? "MATCHED"
        : "MISMATCH_CORRECTED",
      isNonApbs: txInput.isNonApbs || apbsItem.isNonApbs || false,
    };

    const newUsed = usedBefore + requestedAmount;
    const newRemaining = initialBudget - newUsed;

    setItems((prev) =>
      prev.map((item) =>
        item.code === apbsItem.code
          ? {
              ...item,
              usedBudget: newUsed,
              remainingBudget: newRemaining,
            }
          : item
      )
    );
    setTransactions((prev) => [newTx, ...prev]);

    let message = `Pengajuan dana Rp ${requestedAmount.toLocaleString(
      "id-ID"
    )} untuk Kode APBS ${apbsItem.code} (${apbsItem.description}) berhasil dicatat.`;

    if (warningLevel === "OVERBUDGET") {
      message += ` PERINGATAN: Pengajuan ini melebihi sisa anggaran sebesar Rp ${Math.abs(
        remainingAfter
      ).toLocaleString("id-ID")}.`;
    } else if (warningLevel === "LOW_BUDGET" && initialBudget > 0) {
      message += ` CATATAN: Sisa anggaran APBS tinggal ${(
        (remainingAfter / initialBudget) *
        100
      ).toFixed(1)}%.`;
    }

    return {
      success: true,
      message,
      transaction: newTx,
    };
  };

  const updateTransactionStatus = (
    id: string,
    status: TransactionStatus,
    adminNotes?: string
  ) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              status,
              adminNotes: adminNotes || tx.adminNotes,
            }
          : tx
      )
    );
  };

  const deleteTransaction = (id: string) => {
    const targetTx = transactions.find((tx) => tx.id === id);

    if (targetTx) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.code !== targetTx.apbsCode) return item;

          const newUsed = Math.max(
            0,
            safeNumber(item.usedBudget) - safeNumber(targetTx.requestedAmount)
          );

          return {
            ...item,
            usedBudget: newUsed,
            remainingBudget: safeNumber(item.totalBudget) - newUsed,
          };
        })
      );
    }

    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    void supabase
      .from("apbs_transactions")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Gagal menghapus transaksi:", error);
      });
  };

  const addIncomeRecord = (record: Omit<IncomeRecord, "id" | "incomeNo">) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSeq = Math.floor(100 + Math.random() * 900);

    const newRecord: IncomeRecord = {
      ...record,
      id: `inc-${Date.now()}-${randomSeq}`,
      incomeNo: `INC-${dateStr}-${randomSeq}`,
    };

    setIncomeRecords((prev) => [newRecord, ...prev]);

    setItems((prev) =>
      prev.map((item) => {
        const source = record.sourceCategory.toLowerCase();
        const matches =
          item.type === "INCOME" &&
          (item.description.toLowerCase().includes(source) ||
            item.category.toLowerCase().includes(source));

        if (!matches) return item;

        const newUsed = safeNumber(item.usedBudget) + safeNumber(record.amount);
        return {
          ...item,
          usedBudget: newUsed,
          remainingBudget: safeNumber(item.totalBudget) - newUsed,
        };
      })
    );
  };

  const deleteIncomeRecord = (id: string) => {
    setIncomeRecords((prev) => prev.filter((record) => record.id !== id));

    void supabase
      .from("income_records")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Gagal menghapus pemasukan:", error);
      });
  };

  const updateSekdirCode = (code: string, newSekdirCode: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.code === code
          ? {
              ...item,
              sekdirCode: newSekdirCode,
              isSekdirSynced: true,
            }
          : item
      )
    );
  };

  const addApbsItem = (newItem: APBSItem) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.code === newItem.code);
      if (!existing) return [...prev, newItem];

      const replacement = {
        ...newItem,
        id: existing.id,
      };

      return prev.map((item) =>
        item.code === newItem.code ? replacement : item
      );
    });
  };

  const updateApbsItem = (code: string, updated: Partial<APBSItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.code !== code) return item;

        const merged: APBSItem = {
          ...item,
          ...updated,
        };
        merged.remainingBudget =
          safeNumber(merged.totalBudget) - safeNumber(merged.usedBudget);
        return merged;
      })
    );
  };

  const deleteApbsItem = (code: string) => {
    const target = items.find((item) => item.code === code);
    setItems((prev) => prev.filter((item) => item.code !== code));

    if (target) {
      void supabase
        .from("apbs_items")
        .delete()
        .eq("id", target.id)
        .then(({ error }) => {
          if (error) console.error("Gagal menghapus item APBS:", error);
        });
    }
  };

  const batchImportApbsItems = (newItems: APBSItem[]) => {
    setItems((prev) => {
      const byCode = new Map<string, APBSItem>();
      prev.forEach((item) => byCode.set(item.code, item));

      newItems.forEach((incoming) => {
        const existing = byCode.get(incoming.code);
        byCode.set(
          incoming.code,
          existing ? { ...incoming, id: existing.id } : incoming
        );
      });

      return Array.from(byCode.values());
    });
  };

  const resetToInitialData = () => {
    setItems(INITIAL_APBS_ITEMS);
    setTransactions(INITIAL_TRANSACTIONS);
    setIncomeRecords(INITIAL_INCOME_RECORDS);

    localStorage.setItem(
      LOCAL_STORAGE_ITEMS_KEY,
      JSON.stringify(INITIAL_APBS_ITEMS)
    );
    localStorage.setItem(
      LOCAL_STORAGE_TX_KEY,
      JSON.stringify(INITIAL_TRANSACTIONS)
    );
    localStorage.setItem(
      LOCAL_STORAGE_INCOME_KEY,
      JSON.stringify(INITIAL_INCOME_RECORDS)
    );

    void (async () => {
      const deleteTx = await supabase
        .from("apbs_transactions")
        .delete()
        .neq("id", "__never__");
      if (deleteTx.error) console.error(deleteTx.error);

      const deleteIncome = await supabase
        .from("income_records")
        .delete()
        .neq("id", "__never__");
      if (deleteIncome.error) console.error(deleteIncome.error);

      const deleteItems = await supabase
        .from("apbs_items")
        .delete()
        .neq("id", "__never__");
      if (deleteItems.error) console.error(deleteItems.error);

      const itemInsert = await supabase
        .from("apbs_items")
        .upsert(INITIAL_APBS_ITEMS.map(toApbsRow), { onConflict: "id" });
      if (itemInsert.error) console.error(itemInsert.error);

      if (INITIAL_TRANSACTIONS.length > 0) {
        const txInsert = await supabase
          .from("apbs_transactions")
          .upsert(INITIAL_TRANSACTIONS.map(toTransactionRow), {
            onConflict: "id",
          });
        if (txInsert.error) console.error(txInsert.error);
      }

      if (INITIAL_INCOME_RECORDS.length > 0) {
        const incomeInsert = await supabase
          .from("income_records")
          .upsert(INITIAL_INCOME_RECORDS.map(toIncomeRow), {
            onConflict: "id",
          });
        if (incomeInsert.error) console.error(incomeInsert.error);
      }
    })();
  };

  const clearAllData = () => {
    setItems([]);
    setTransactions([]);
    setIncomeRecords([]);

    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify([]));
    localStorage.setItem(LOCAL_STORAGE_INCOME_KEY, JSON.stringify([]));

    void Promise.all([
      supabase.from("apbs_transactions").delete().neq("id", "__never__"),
      supabase.from("income_records").delete().neq("id", "__never__"),
      supabase.from("apbs_items").delete().neq("id", "__never__"),
    ]).then((results) => {
      results.forEach((result) => {
        if (result.error) console.error("Gagal menghapus data:", result.error);
      });
    });
  };

  const getSummaryStats = () => {
    const expenseItems = items.filter((item) => item.type === "EXPENSE");
    const incomeItems = items.filter((item) => item.type === "INCOME");

    const totalIncomeEntered = incomeRecords.reduce(
      (total, record) => total + safeNumber(record.amount),
      0
    );
    const totalIncomeBudget = incomeItems.reduce(
      (total, item) => total + safeNumber(item.totalBudget),
      0
    );
    const totalIncome =
      totalIncomeEntered > 0 ? totalIncomeEntered : totalIncomeBudget;

    const totalBudgetExpense = expenseItems.reduce(
      (total, item) => total + safeNumber(item.totalBudget),
      0
    );
    const totalRealizedExpense = expenseItems.reduce(
      (total, item) => total + safeNumber(item.usedBudget),
      0
    );
    const totalRemainingExpense = totalBudgetExpense - totalRealizedExpense;
    const netCashRemaining = totalIncomeEntered - totalRealizedExpense;

    const lowBudgetCount = expenseItems.filter((item) => {
      const total = safeNumber(item.totalBudget);
      const remaining = safeNumber(item.remainingBudget);
      return total > 0 && remaining > 0 && remaining / total <= 0.2;
    }).length;

    const depletedCount = expenseItems.filter(
      (item) =>
        safeNumber(item.totalBudget) > 0 &&
        safeNumber(item.remainingBudget) <= 0
    ).length;

    const pendingTxCount = transactions.filter(
      (tx) => tx.status === "PENDING"
    ).length;

    return {
      totalIncome,
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
