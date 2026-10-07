import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ChickenRecord,
  HarvestRecord,
  SaleRecord,
  ExpenseRecord,
  ProfitAllocation,
  AllocationSettings,
  FarmProfile,
  StockMovement,
  ToastMessage,
  ToastType,
} from '../types';
import {
  INITIAL_FARM,
  INITIAL_ALLOCATION_SETTINGS,
  INITIAL_CHICKENS,
  INITIAL_HARVESTS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_PROFIT_ALLOCATIONS,
} from '../utils/mockData';
import { DEFAULT_ALLOCATION_SETTINGS, calculateProfitAllocation } from '../utils/calculations';
import { formatTanggal } from '../utils/formatters';

interface AppContextType {
  farm: FarmProfile;
  setFarm: React.Dispatch<React.SetStateAction<FarmProfile>>;
  updateFarmProfile: (data: Partial<FarmProfile>) => void;

  chickens: ChickenRecord[];
  addChicken: (record: Omit<ChickenRecord, 'id' | 'farmId' | 'createdAt'>) => void;
  updateChicken: (id: string, record: Partial<ChickenRecord>) => void;
  deleteChicken: (id: string) => void;

  harvests: HarvestRecord[];
  addHarvest: (record: Omit<HarvestRecord, 'id' | 'farmId' | 'createdAt'>) => void;
  updateHarvest: (id: string, record: Partial<HarvestRecord>) => void;
  deleteHarvest: (id: string) => void;

  sales: SaleRecord[];
  addSale: (record: Omit<SaleRecord, 'id' | 'farmId' | 'createdAt'>) => { success: boolean; error?: string };
  updateSale: (id: string, record: Partial<SaleRecord>) => { success: boolean; error?: string };
  deleteSale: (id: string) => void;

  expenses: ExpenseRecord[];
  addExpense: (record: Omit<ExpenseRecord, 'id' | 'farmId' | 'createdAt'>) => void;
  updateExpense: (id: string, record: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;

  allocations: ProfitAllocation[];
  addAllocation: (record: Omit<ProfitAllocation, 'id' | 'farmId' | 'createdAt'>) => void;
  deleteAllocation: (id: string) => void;

  settings: AllocationSettings;
  updateSettings: (newSettings: AllocationSettings) => void;
  resetSettingsToDefault: () => void;

  // Real-time stock computations
  currentStock: number;
  totalHarvestWeight: number;
  totalSoldWeight: number;
  stockMovements: StockMovement[];

  // Quick stats & synced chicken stock
  todayHarvestKg: number;
  todaySalesAmount: number;
  todayExpensesAmount: number;
  todayProfitAmount: number;
  todayActiveDateStr: string;
  convertDailyProfitToCapital: (targetDate?: string) => { success: boolean; message: string; allocation?: ProfitAllocation };
  autoDailyConversionEnabled: boolean;
  setAutoDailyConversionEnabled: (enabled: boolean) => void;
  monthExpensesAmount: number;
  monthProfitAmount: number;
  totalChickensLatest: number;
  productiveChickensLatest: number;
  activeProductiveChickens: number;

  // Toast system
  toasts: ToastMessage[];
  showToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;

  // Reset to demo data
  resetAllToDemoData: () => void;

  // Supabase status simulation
  supabaseConfig: { url: string; anonKey: string };
  saveSupabaseConfig: (url: string, key: string) => void;
  syncStatus: 'local' | 'synced' | 'connecting';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  FARM: 'telurku_farm_profile_v2',
  SETTINGS: 'telurku_allocation_settings_v2',
  CHICKENS: 'telurku_chickens_v2',
  HARVESTS: 'telurku_harvests_v2',
  SALES: 'telurku_sales_v2',
  EXPENSES: 'telurku_expenses_v2',
  ALLOCATIONS: 'telurku_allocations_v2',
  SUPABASE: 'telurku_supabase_config_v2',
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [farm, setFarm] = useState<FarmProfile>(() => {
    const stored = loadStorage(STORAGE_KEYS.FARM, INITIAL_FARM);
    if (!stored.name || stored.name === 'Peternakan Telur Berkah Abadi') {
      return { ...stored, name: 'Lingga Mandiri Farm' };
    }
    return stored;
  });
  const [settings, setSettings] = useState<AllocationSettings>(() =>
    loadStorage(STORAGE_KEYS.SETTINGS, INITIAL_ALLOCATION_SETTINGS)
  );
  const [chickens, setChickens] = useState<ChickenRecord[]>(() =>
    loadStorage(STORAGE_KEYS.CHICKENS, INITIAL_CHICKENS)
  );
  const [harvests, setHarvests] = useState<HarvestRecord[]>(() =>
    loadStorage(STORAGE_KEYS.HARVESTS, INITIAL_HARVESTS)
  );
  const [sales, setSales] = useState<SaleRecord[]>(() => loadStorage(STORAGE_KEYS.SALES, INITIAL_SALES));
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() =>
    loadStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES)
  );
  const [allocations, setAllocations] = useState<ProfitAllocation[]>(() =>
    loadStorage(STORAGE_KEYS.ALLOCATIONS, INITIAL_PROFIT_ALLOCATIONS)
  );

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<{ url: string; anonKey: string }>(() =>
    loadStorage(STORAGE_KEYS.SUPABASE, { url: '', anonKey: '' })
  );
  const [syncStatus, setSyncStatus] = useState<'local' | 'synced' | 'connecting'>('local');

  const [autoDailyConversionEnabled, setAutoDailyConversionEnabled] = useState<boolean>(() =>
    loadStorage('telurku_auto_conversion_v2', false)
  );

  // Sync to localStorage
  useEffect(() => saveStorage(STORAGE_KEYS.FARM, farm), [farm]);
  useEffect(() => saveStorage(STORAGE_KEYS.SETTINGS, settings), [settings]);
  useEffect(() => saveStorage(STORAGE_KEYS.CHICKENS, chickens), [chickens]);
  useEffect(() => saveStorage(STORAGE_KEYS.HARVESTS, harvests), [harvests]);
  useEffect(() => saveStorage(STORAGE_KEYS.SALES, sales), [sales]);
  useEffect(() => saveStorage(STORAGE_KEYS.EXPENSES, expenses), [expenses]);
  useEffect(() => saveStorage(STORAGE_KEYS.ALLOCATIONS, allocations), [allocations]);
  useEffect(() => saveStorage(STORAGE_KEYS.SUPABASE, supabaseConfig), [supabaseConfig]);
  useEffect(() => saveStorage('telurku_auto_conversion_v2', autoDailyConversionEnabled), [autoDailyConversionEnabled]);

  const showToast = (type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updateFarmProfile = (data: Partial<FarmProfile>) => {
    setFarm((prev) => {
      const updated = { ...prev, ...data };
      return updated;
    });
    showToast('success', 'Profil Berhasil Disimpan', 'Data peternakan diperbarui.');
  };

  // Jumlah ayam produktif aktif yang disinkronkan dengan data ayam
  const activeProductiveChickens = useMemo(() => {
    if (chickens.length > 0 && chickens[0]?.productiveQuantity > 0) {
      return chickens[0].productiveQuantity;
    }
    return farm.productiveChickens || 920;
  }, [chickens, farm.productiveChickens]);

  // Chicken CRUD
  const addChicken = (record: Omit<ChickenRecord, 'id' | 'farmId' | 'createdAt'>) => {
    const newRecord: ChickenRecord = {
      ...record,
      id: `chk-${Date.now()}`,
      farmId: farm.id,
      createdAt: new Date().toISOString(),
    };
    setChickens((prev) => [newRecord, ...prev]);
    // Sync to farm profile
    setFarm((prev) => ({
      ...prev,
      totalChickens: record.quantity,
      productiveChickens: record.productiveQuantity,
    }));
    showToast('success', 'Data Ayam Ditambahkan', `Populasi ayam produktif ${record.productiveQuantity} ekor.`);
  };

  const updateChicken = (id: string, record: Partial<ChickenRecord>) => {
    setChickens((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...record } : item));
      if (updated[0]?.id === id && record.productiveQuantity !== undefined) {
        setFarm((f) => ({
          ...f,
          totalChickens: record.quantity ?? f.totalChickens,
          productiveChickens: record.productiveQuantity ?? f.productiveChickens,
        }));
      }
      return updated;
    });
    showToast('success', 'Data Ayam Diperbarui');
  };

  const deleteChicken = (id: string) => {
    setChickens((prev) => prev.filter((item) => item.id !== id));
    showToast('info', 'Data Ayam Dihapus');
  };

  // Harvest CRUD
  const addHarvest = (record: Omit<HarvestRecord, 'id' | 'farmId' | 'createdAt'>) => {
    const newRecord: HarvestRecord = {
      ...record,
      productiveChickens: record.productiveChickens || activeProductiveChickens,
      id: `hrv-${Date.now()}`,
      farmId: farm.id,
      createdAt: new Date().toISOString(),
    };
    setHarvests((prev) => [newRecord, ...prev]);
    showToast('success', 'Panen Berhasil Dicatat', `Stok telur bertambah ${record.totalWeight} kg.`);
  };

  const updateHarvest = (id: string, record: Partial<HarvestRecord>) => {
    setHarvests((prev) => prev.map((item) => (item.id === id ? { ...item, ...record } : item)));
    showToast('success', 'Data Panen Diperbarui');
  };

  const deleteHarvest = (id: string) => {
    setHarvests((prev) => prev.filter((item) => item.id !== id));
    showToast('info', 'Data Panen Dihapus', 'Stok telur diperbarui kembali.');
  };

  // Compute total current stock before sales validation
  const totalHarvestWeight = useMemo(() => {
    return harvests.reduce((acc, h) => acc + (Number(h.totalWeight) || 0), 0);
  }, [harvests]);

  const totalSoldWeight = useMemo(() => {
    return sales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
  }, [sales]);

  const currentStock = useMemo(() => {
    return Math.max(0, farm.initialStock + totalHarvestWeight - totalSoldWeight);
  }, [farm.initialStock, totalHarvestWeight, totalSoldWeight]);

  // Sales CRUD with strict stock verification (Business rule 3 & 4)
  const addSale = (record: Omit<SaleRecord, 'id' | 'farmId' | 'createdAt'>) => {
    if (record.quantity > currentStock) {
      showToast(
        'error',
        'Stok Tidak Cukup!',
        `Jumlah penjualan (${record.quantity} kg) melebihi stok yang tersedia (${currentStock} kg).`
      );
      return {
        success: false,
        error: `Stok tidak cukup. Tersedia: ${currentStock} kg`,
      };
    }

    const newRecord: SaleRecord = {
      ...record,
      id: `sal-${Date.now()}`,
      farmId: farm.id,
      createdAt: new Date().toISOString(),
    };
    setSales((prev) => [newRecord, ...prev]);
    showToast(
      'success',
      'Penjualan Berhasil',
      `Penjualan ${record.quantity} kg dicatat. Stok berkurang otomatis.`
    );
    return { success: true };
  };

  const updateSale = (id: string, record: Partial<SaleRecord>) => {
    const existing = sales.find((s) => s.id === id);
    if (!existing) return { success: false, error: 'Transaksi tidak ditemukan' };

    const newQty = record.quantity !== undefined ? record.quantity : existing.quantity;
    const otherSalesSum = sales.filter((s) => s.id !== id).reduce((acc, s) => acc + s.quantity, 0);
    const available = farm.initialStock + totalHarvestWeight - otherSalesSum;

    if (newQty > available) {
      showToast(
        'error',
        'Stok Tidak Cukup!',
        `Jumlah baru (${newQty} kg) melebihi stok tersedia (${available} kg).`
      );
      return { success: false, error: `Stok tidak cukup. Tersedia: ${available} kg` };
    }

    setSales((prev) => prev.map((item) => (item.id === id ? { ...item, ...record } : item)));
    showToast('success', 'Penjualan Diperbarui');
    return { success: true };
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((item) => item.id !== id));
    showToast('info', 'Penjualan Dihapus', 'Stok telur bertambah kembali.');
  };

  // Expenses CRUD
  const addExpense = (record: Omit<ExpenseRecord, 'id' | 'farmId' | 'createdAt'>) => {
    const newRecord: ExpenseRecord = {
      ...record,
      id: `exp-${Date.now()}`,
      farmId: farm.id,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newRecord, ...prev]);
    showToast('success', 'Pengeluaran Dicatat', `${record.category}: Rp ${record.amount.toLocaleString('id-ID')}`);
  };

  const updateExpense = (id: string, record: Partial<ExpenseRecord>) => {
    setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, ...record } : item)));
    showToast('success', 'Pengeluaran Diperbarui');
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    showToast('info', 'Pengeluaran Dihapus');
  };

  // Profit Allocation CRUD
  const addAllocation = (record: Omit<ProfitAllocation, 'id' | 'farmId' | 'createdAt'>) => {
    const newRecord: ProfitAllocation = {
      ...record,
      id: `alloc-${Date.now()}`,
      farmId: farm.id,
      createdAt: new Date().toISOString(),
    };
    setAllocations((prev) => [newRecord, ...prev]);
    showToast(
      'success',
      'Konversi Berhasil Disimpan',
      `Alokasi modal Rp ${record.profit.toLocaleString('id-ID')} tersimpan ke riwayat.`
    );
  };

  const deleteAllocation = (id: string) => {
    setAllocations((prev) => prev.filter((item) => item.id !== id));
    showToast('info', 'Riwayat Konversi Dihapus');
  };

  // Settings
  const updateSettings = (newSettings: AllocationSettings) => {
    setSettings(newSettings);
    showToast('success', 'Pengaturan Tersimpan', 'Persentase alokasi modal telah diperbarui.');
  };

  const resetSettingsToDefault = () => {
    setSettings({ ...DEFAULT_ALLOCATION_SETTINGS, farmId: farm.id });
    showToast('info', 'Pengaturan Direset', 'Persentase dikembalikan ke default standar peternakan.');
  };

  // Stock Movement Ledger
  const stockMovements = useMemo(() => {
    const events: {
      date: string;
      createdAt: string;
      type: 'PANEN' | 'PENJUALAN';
      description: string;
      inWeight: number;
      outWeight: number;
      id: string;
    }[] = [];

    harvests.forEach((h) => {
      events.push({
        id: `m-h-${h.id}`,
        date: h.date,
        createdAt: h.createdAt,
        type: 'PANEN',
        description: `Panen (${h.totalWeight} kg)`,
        inWeight: h.totalWeight,
        outWeight: 0,
      });
    });

    sales.forEach((s) => {
      events.push({
        id: `m-s-${s.id}`,
        date: s.date,
        createdAt: s.createdAt,
        type: 'PENJUALAN',
        description: s.customer ? `Penjualan ${s.customer}` : `Penjualan Telur (${s.quantity} kg)`,
        inWeight: 0,
        outWeight: s.quantity,
      });
    });

    // Sort ascending to calculate running balance
    events.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.createdAt.localeCompare(b.createdAt);
    });

    let runningBalance = farm.initialStock;
    const ledger: StockMovement[] = events.map((e) => {
      runningBalance = runningBalance + e.inWeight - e.outWeight;
      return {
        id: e.id,
        date: e.date,
        type: e.type,
        description: e.description,
        inWeight: e.inWeight,
        outWeight: e.outWeight,
        balance: Math.round(runningBalance * 10) / 10,
      };
    });

    // Return reversed so latest is top
    return ledger.reverse();
  }, [farm.initialStock, harvests, sales]);

  // Derived Dashboard Stats
  const todayDateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  }, []);

  // Tanggal harian aktif (mengutamakan hari ini atau tanggal transaksi terbaru)
  const todayActiveDateStr = useMemo(() => {
    const hasTodayData = sales.some((s) => s.date === todayDateStr) || expenses.some((e) => e.date === todayDateStr);
    if (hasTodayData) return todayDateStr;
    return sales[0]?.date || expenses[0]?.date || harvests[0]?.date || todayDateStr;
  }, [sales, expenses, harvests, todayDateStr]);

  const todayHarvestKg = useMemo(() => {
    const todayRecs = harvests.filter((h) => h.date === todayActiveDateStr);
    if (todayRecs.length > 0) {
      return todayRecs.reduce((acc, h) => acc + h.totalWeight, 0);
    }
    return harvests[0]?.totalWeight || 0;
  }, [harvests, todayActiveDateStr]);

  const todaySalesAmount = useMemo(() => {
    const todayRecs = sales.filter((s) => s.date === todayActiveDateStr);
    return todayRecs.reduce((acc, s) => acc + s.total, 0);
  }, [sales, todayActiveDateStr]);

  const todayExpensesAmount = useMemo(() => {
    const todayRecs = expenses.filter((e) => e.date === todayActiveDateStr);
    return todayRecs.reduce((acc, e) => acc + e.amount, 0);
  }, [expenses, todayActiveDateStr]);

  const todayProfitAmount = useMemo(() => {
    return todaySalesAmount - todayExpensesAmount;
  }, [todaySalesAmount, todayExpensesAmount]);

  // Fungsi konversi keuntungan harian otomatis langsung ke modal
  const convertDailyProfitToCapital = (targetDate?: string) => {
    const dateToUse = targetDate || todayActiveDateStr;
    const daySales = sales.filter((s) => s.date === dateToUse).reduce((acc, s) => acc + s.total, 0);
    const dayExpenses = expenses.filter((e) => e.date === dateToUse).reduce((acc, e) => acc + e.amount, 0);
    const dayProfit = daySales - dayExpenses;

    if (dayProfit <= 0) {
      showToast(
        'warning',
        'Belum Ada Keuntungan Harian',
        `Omzet (Rp ${daySales.toLocaleString('id-ID')}) dikurangi pengeluaran (Rp ${dayExpenses.toLocaleString('id-ID')}) belum menghasilkan laba positif.`
      );
      return { success: false, message: 'Keuntungan belum positif' };
    }

    const calc = calculateProfitAllocation(dayProfit, settings);
    const existingIndex = allocations.findIndex(
      (a) => a.date === dateToUse && a.notes?.includes('Keuntungan Harian')
    );

    const newRecord: ProfitAllocation = {
      id: existingIndex >= 0 ? allocations[existingIndex].id : `alloc-daily-${Date.now()}`,
      farmId: farm.id,
      date: dateToUse,
      profit: dayProfit,
      feedAmount: calc.feedAmount,
      chickenAmount: calc.chickenAmount,
      laborAmount: calc.laborAmount,
      electricityAmount: calc.electricityAmount,
      waterAmount: calc.waterAmount,
      vitaminAmount: calc.vitaminAmount,
      feedPercentage: settings.feedPercentage,
      chickenPercentage: settings.chickenPercentage,
      laborPercentage: settings.laborPercentage,
      electricityPercentage: settings.electricityPercentage,
      waterPercentage: settings.waterPercentage,
      vitaminPercentage: settings.vitaminPercentage,
      notes: `Konversi Otomatis Keuntungan Harian (${formatTanggal(dateToUse)})`,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      setAllocations((prev) => prev.map((a, i) => (i === existingIndex ? newRecord : a)));
      showToast(
        'success',
        'Konversi Modal Harian Diperbarui',
        `Laba harian Rp ${dayProfit.toLocaleString('id-ID')} berhasil dicatat ke Konversi Modal.`
      );
    } else {
      setAllocations((prev) => [newRecord, ...prev]);
      showToast(
        'success',
        'Konversi Modal Harian Berhasil Dicatat!',
        `Laba harian Rp ${dayProfit.toLocaleString('id-ID')} langsung dicatat ke Konversi Modal.`
      );
    }

    return { success: true, message: 'Berhasil dikonversi', allocation: newRecord };
  };

  const currentMonthStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const monthExpensesAmount = useMemo(() => {
    const monthRecs = expenses.filter((e) => e.date.startsWith(currentMonthStr));
    return monthRecs.reduce((acc, e) => acc + e.amount, 0);
  }, [expenses, currentMonthStr]);

  const monthSalesAmount = useMemo(() => {
    const monthRecs = sales.filter((s) => s.date.startsWith(currentMonthStr));
    return monthRecs.reduce((acc, s) => acc + s.total, 0);
  }, [sales, currentMonthStr]);

  const monthProfitAmount = useMemo(() => {
    return monthSalesAmount - monthExpensesAmount;
  }, [monthSalesAmount, monthExpensesAmount]);

  const totalChickensLatest = useMemo(() => {
    return chickens[0]?.quantity || farm.totalChickens || 1000;
  }, [chickens, farm.totalChickens]);

  const productiveChickensLatest = useMemo(() => {
    return chickens[0]?.productiveQuantity || farm.productiveChickens || 920;
  }, [chickens, farm.productiveChickens]);

  const resetAllToDemoData = () => {
    setFarm(INITIAL_FARM);
    setSettings(INITIAL_ALLOCATION_SETTINGS);
    setChickens(INITIAL_CHICKENS);
    setHarvests(INITIAL_HARVESTS);
    setSales(INITIAL_SALES);
    setExpenses(INITIAL_EXPENSES);
    setAllocations(INITIAL_PROFIT_ALLOCATIONS);
    showToast('info', 'Data Demo Dipulihkan', 'Semua data telah dikembalikan ke kondisi demo awal.');
  };

  const saveSupabaseConfig = (url: string, key: string) => {
    setSupabaseConfig({ url, anonKey: key });
    setSyncStatus('connecting');
    setTimeout(() => {
      setSyncStatus('synced');
      showToast('success', 'Konfigurasi Supabase Disimpan', 'Penyimpanan lokal siap disinkronisasi.');
    }, 800);
  };

  return (
    <AppContext.Provider
      value={{
        farm,
        setFarm,
        updateFarmProfile,
        chickens,
        addChicken,
        updateChicken,
        deleteChicken,
        harvests,
        addHarvest,
        updateHarvest,
        deleteHarvest,
        sales,
        addSale,
        updateSale,
        deleteSale,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        allocations,
        addAllocation,
        deleteAllocation,
        settings,
        updateSettings,
        resetSettingsToDefault,
        currentStock,
        totalHarvestWeight,
        totalSoldWeight,
        stockMovements,
        todayHarvestKg,
        todaySalesAmount,
        todayExpensesAmount,
        todayProfitAmount,
        todayActiveDateStr,
        convertDailyProfitToCapital,
        autoDailyConversionEnabled,
        setAutoDailyConversionEnabled,
        monthExpensesAmount,
        monthProfitAmount,
        totalChickensLatest,
        productiveChickensLatest,
        activeProductiveChickens,
        toasts,
        showToast,
        removeToast,
        resetAllToDemoData,
        supabaseConfig,
        saveSupabaseConfig,
        syncStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
