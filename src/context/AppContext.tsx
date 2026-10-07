import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
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
  UserProfile,
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
import * as db from '../services/supabaseService';

export interface AppContextType {
  // Auth State
  user: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  isAuthDialogOpen: boolean;
  setIsAuthDialogOpen: (open: boolean) => void;
  signOut: () => Promise<void>;

  // Database Loading & Refresh
  dbLoading: boolean;
  refreshDatabaseData: () => Promise<void>;

  // Farm
  farm: FarmProfile;
  setFarm: React.Dispatch<React.SetStateAction<FarmProfile>>;
  updateFarmProfile: (data: Partial<FarmProfile>) => Promise<void>;

  // Chickens
  chickens: ChickenRecord[];
  addChicken: (record: Omit<ChickenRecord, 'id' | 'farmId' | 'createdAt'>) => Promise<void>;
  updateChicken: (id: string, record: Partial<ChickenRecord>) => Promise<void>;
  deleteChicken: (id: string) => Promise<void>;

  // Harvests
  harvests: HarvestRecord[];
  addHarvest: (record: Omit<HarvestRecord, 'id' | 'farmId' | 'createdAt'>) => Promise<void>;
  updateHarvest: (id: string, record: Partial<HarvestRecord>) => Promise<void>;
  deleteHarvest: (id: string) => Promise<void>;

  // Sales
  sales: SaleRecord[];
  addSale: (record: Omit<SaleRecord, 'id' | 'farmId' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateSale: (id: string, record: Partial<SaleRecord>) => Promise<{ success: boolean; error?: string }>;
  deleteSale: (id: string) => Promise<void>;

  // Expenses
  expenses: ExpenseRecord[];
  addExpense: (record: Omit<ExpenseRecord, 'id' | 'farmId' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, record: Partial<ExpenseRecord>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Profit Allocations
  allocations: ProfitAllocation[];
  addAllocation: (record: Omit<ProfitAllocation, 'id' | 'farmId' | 'createdAt'>) => Promise<void>;
  deleteAllocation: (id: string) => Promise<void>;

  // Settings
  settings: AllocationSettings;
  updateSettings: (newSettings: AllocationSettings) => Promise<void>;
  resetSettingsToDefault: () => Promise<void>;

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
  convertDailyProfitToCapital: (targetDate?: string) => Promise<{ success: boolean; message: string; allocation?: ProfitAllocation }>;
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

  // Supabase status & config
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
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState<boolean>(false);
  const [dbLoading, setDbLoading] = useState<boolean>(false);

  // Core Farm Entities (Initialized from local cache, then updated via Supabase)
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
  const [supabaseConfig, setSupabaseConfig] = useState<{ url: string; anonKey: string }>(() => {
    const stored = loadStorage(STORAGE_KEYS.SUPABASE, { url: '', anonKey: '' });
    return {
      url: stored.url || import.meta.env.VITE_SUPABASE_URL || 'https://anggsdesivvelfaawsah.supabase.co',
      anonKey: stored.anonKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_cHTb-Af7H-0oyZ-tRly8LA_KvSNXQ0K',
    };
  });
  const [syncStatus, setSyncStatus] = useState<'local' | 'synced' | 'connecting'>('synced');
  const [autoDailyConversionEnabled, setAutoDailyConversionEnabled] = useState<boolean>(() =>
    loadStorage('telurku_auto_conversion_v2', false)
  );

  // Sync to localStorage as offline cache
  useEffect(() => saveStorage(STORAGE_KEYS.FARM, farm), [farm]);
  useEffect(() => saveStorage(STORAGE_KEYS.SETTINGS, settings), [settings]);
  useEffect(() => saveStorage(STORAGE_KEYS.CHICKENS, chickens), [chickens]);
  useEffect(() => saveStorage(STORAGE_KEYS.HARVESTS, harvests), [harvests]);
  useEffect(() => saveStorage(STORAGE_KEYS.SALES, sales), [sales]);
  useEffect(() => saveStorage(STORAGE_KEYS.EXPENSES, expenses), [expenses]);
  useEffect(() => saveStorage(STORAGE_KEYS.ALLOCATIONS, allocations), [allocations]);
  useEffect(() => saveStorage(STORAGE_KEYS.SUPABASE, supabaseConfig), [supabaseConfig]);
  useEffect(() => saveStorage('telurku_auto_conversion_v2', autoDailyConversionEnabled), [autoDailyConversionEnabled]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all database records from Supabase
  const refreshDatabaseData = useCallback(async () => {
    setDbLoading(true);
    try {
      // 1. Fetch Farm
      const currentFarm = await db.fetchFarm(user?.id);
      if (currentFarm) {
        setFarm(currentFarm);
        const farmId = currentFarm.id;

        // 2. Fetch parallel modules
        const [chickensData, harvestsData, salesData, expensesData, allocationsData, settingsData] =
          await Promise.all([
            db.fetchChickens(farmId),
            db.fetchHarvests(farmId),
            db.fetchSales(farmId),
            db.fetchExpenses(farmId),
            db.fetchAllocations(farmId),
            db.fetchAllocationSettings(farmId),
          ]);

        if (chickensData && chickensData.length > 0) setChickens(chickensData);
        if (harvestsData && harvestsData.length > 0) setHarvests(harvestsData);
        if (salesData && salesData.length > 0) setSales(salesData);
        if (expensesData && expensesData.length > 0) setExpenses(expensesData);
        if (allocationsData && allocationsData.length > 0) setAllocations(allocationsData);
        if (settingsData) setSettings(settingsData);
        setSyncStatus('synced');
      } else if (user?.id) {
        // Only attempt creating farm if user is authenticated
        const result = await db.createFarm(INITIAL_FARM, user.id);
        if (result.farm) {
          setFarm(result.farm);
        }
      }
    } catch (error) {
      console.warn('Supabase initial fetch failed, using local cached data:', error);
    } finally {
      setDbLoading(false);
    }
  }, [user]);

  // Auth Lifecycle Listener
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user || null);
          if (session?.user) {
            const prof = await db.fetchUserProfile(session.user.id);
            setUserProfile(prof || { id: session.user.id, email: session.user.email || '' });
          }
          setAuthLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) setAuthLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        const prof = await db.fetchUserProfile(currentUser.id);
        setUserProfile(prof || { id: currentUser.id, email: currentUser.email || '' });
      } else {
        setUserProfile(null);
      }
      setAuthLoading(false);
      refreshDatabaseData();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshDatabaseData]);

  // Initial DB Load and Connection Verification on Mount
  useEffect(() => {
    async function verifyAndLoad() {
      try {
        const conn = await checkSupabaseConnection();
        if (conn.connected) {
          setSyncStatus('synced');
        } else {
          console.info('Supabase connection info:', conn.message);
        }
      } catch (e) {
        console.warn('Connection check error:', e);
      }
      refreshDatabaseData();
    }
    verifyAndLoad();
  }, [refreshDatabaseData]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    showToast('info', 'Berhasil Keluar', 'Sesi login telah diakhiri.');
  };

  const updateFarmProfile = async (data: Partial<FarmProfile>) => {
    setFarm((prev) => ({ ...prev, ...data }));
    const res = await db.updateFarm(farm.id, data, user?.id);
    if (res.success) {
      showToast('success', 'Profil Berhasil Disimpan', 'Data peternakan diperbarui di Supabase.');
    } else if (res.error && res.error.includes('row-level security')) {
      showToast(
        'warning',
        'RLS Policy Terdeteksi',
        'Data tersimpan di perangkat. Jalankan RLS Policy SQL di Supabase SQL Editor atau Login terlebih dahulu.'
      );
    } else {
      showToast('info', 'Profil Diperbarui', 'Data peternakan tersimpan di aplikasi.');
    }
  };

  const activeProductiveChickens = useMemo(() => {
    if (chickens.length > 0 && chickens[0]?.productiveQuantity > 0) {
      return chickens[0].productiveQuantity;
    }
    return farm.productiveChickens || 920;
  }, [chickens, farm.productiveChickens]);

  // Chicken CRUD
  const addChicken = async (record: Omit<ChickenRecord, 'id' | 'farmId' | 'createdAt'>) => {
    const tempId = `chk-${Date.now()}`;
    const newRecord: ChickenRecord = {
      ...record,
      id: tempId,
      farmId: farm.id,
      createdAt: new Date().toISOString(),
    };
    setChickens((prev) => [newRecord, ...prev]);
    setFarm((prev) => ({
      ...prev,
      totalChickens: record.quantity,
      productiveChickens: record.productiveQuantity,
    }));

    const inserted = await db.insertChicken({ ...record, farmId: farm.id });
    if (inserted) {
      setChickens((prev) => prev.map((item) => (item.id === tempId ? inserted : item)));
    }
    showToast('success', 'Data Ayam Ditambahkan', `Populasi ayam produktif ${record.productiveQuantity} ekor.`);
  };

  const updateChicken = async (id: string, record: Partial<ChickenRecord>) => {
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

    await db.updateChickenRecord(id, record);
    showToast('success', 'Data Ayam Diperbarui');
  };

  const deleteChicken = async (id: string) => {
    setChickens((prev) => prev.filter((item) => item.id !== id));
    await db.deleteChickenRecord(id);
    showToast('info', 'Data Ayam Dihapus');
  };

  // Harvest CRUD
  const addHarvest = async (record: Omit<HarvestRecord, 'id' | 'farmId' | 'createdAt'>) => {
    const tempId = `hrv-${Date.now()}`;
    const newRecord: HarvestRecord = {
      ...record,
      productiveChickens: record.productiveChickens || activeProductiveChickens,
      id: tempId,
      farmId: farm.id,
      createdAt: new Date().toISOString(),
    };
    setHarvests((prev) => [newRecord, ...prev]);

    const inserted = await db.insertHarvest({
      ...record,
      productiveChickens: record.productiveChickens || activeProductiveChickens,
      farmId: farm.id,
    });
    if (inserted) {
      setHarvests((prev) => prev.map((item) => (item.id === tempId ? inserted : item)));
    }
    showToast('success', 'Panen Berhasil Dicatat', `Stok telur bertambah ${record.totalWeight} kg.`);
  };

  const updateHarvest = async (id: string, record: Partial<HarvestRecord>) => {
    setHarvests((prev) => prev.map((item) => (item.id === id ? { ...item, ...record } : item)));
    await db.updateHarvestRecord(id, record);
    showToast('success', 'Data Panen Diperbarui');
  };

  const deleteHarvest = async (id: string) => {
    setHarvests((prev) => prev.filter((item) => item.id !== id));
    await db.deleteHarvestRecord(id);
    showToast('info', 'Data Panen Dihapus', 'Stok telur diperbarui kembali.');
  };

  // Real-time stock computation
  const totalHarvestWeight = useMemo(() => {
    return harvests.reduce((acc, h) => acc + (Number(h.totalWeight) || 0), 0);
  }, [harvests]);

  const totalSoldWeight = useMemo(() => {
    return sales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
  }, [sales]);

  const currentStock = useMemo(() => {
    return Math.max(0, farm.initialStock + totalHarvestWeight - totalSoldWeight);
  }, [farm.initialStock, totalHarvestWeight, totalSoldWeight]);

  // Sales CRUD
  const addSale = async (record: Omit<SaleRecord, 'id' | 'farmId' | 'createdAt'>) => {
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

    const tempId = `sal-${Date.now()}`;
    const newRecord: SaleRecord = {
      ...record,
      id: tempId,
      farmId: farm.id,
      createdAt: new Date().toISOString(),
    };
    setSales((prev) => [newRecord, ...prev]);

    const inserted = await db.insertSale({ ...record, farmId: farm.id });
    if (inserted) {
      setSales((prev) => prev.map((item) => (item.id === tempId ? inserted : item)));
    }

    showToast(
      'success',
      'Penjualan Berhasil',
      `Penjualan ${record.quantity} kg dicatat. Stok berkurang otomatis.`
    );
    return { success: true };
  };

  const updateSale = async (id: string, record: Partial<SaleRecord>) => {
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
    await db.updateSaleRecord(id, record);
    showToast('success', 'Penjualan Diperbarui');
    return { success: true };
  };

  const deleteSale = async (id: string) => {
    setSales((prev) => prev.filter((item) => item.id !== id));
    await db.deleteSaleRecord(id);
    showToast('info', 'Penjualan Dihapus', 'Stok telur bertambah kembali.');
  };

  // Expenses CRUD
  const addExpense = async (record: Omit<ExpenseRecord, 'id' | 'farmId' | 'createdAt'>) => {
    const tempId = `exp-${Date.now()}`;
    const newRecord: ExpenseRecord = {
      ...record,
      id: tempId,
      farmId: farm.id,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newRecord, ...prev]);

    const inserted = await db.insertExpense({ ...record, farmId: farm.id });
    if (inserted) {
      setExpenses((prev) => prev.map((item) => (item.id === tempId ? inserted : item)));
    }
    showToast('success', 'Pengeluaran Dicatat', `${record.category}: Rp ${record.amount.toLocaleString('id-ID')}`);
  };

  const updateExpense = async (id: string, record: Partial<ExpenseRecord>) => {
    setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, ...record } : item)));
    await db.updateExpenseRecord(id, record);
    showToast('success', 'Pengeluaran Diperbarui');
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    await db.deleteExpenseRecord(id);
    showToast('info', 'Pengeluaran Dihapus');
  };

  // Allocations CRUD
  const addAllocation = async (record: Omit<ProfitAllocation, 'id' | 'farmId' | 'createdAt'>) => {
    const tempId = `alc-${Date.now()}`;
    const newRecord: ProfitAllocation = {
      ...record,
      id: tempId,
      farmId: farm.id,
      createdAt: new Date().toISOString(),
    };
    setAllocations((prev) => [newRecord, ...prev]);

    const inserted = await db.insertAllocation({ ...record, farmId: farm.id });
    if (inserted) {
      setAllocations((prev) => prev.map((item) => (item.id === tempId ? inserted : item)));
    }
    showToast(
      'success',
      'Konversi Modal Berhasil',
      `Alokasi modal Rp ${record.profit.toLocaleString('id-ID')} tersimpan di Supabase.`
    );
  };

  const deleteAllocation = async (id: string) => {
    setAllocations((prev) => prev.filter((item) => item.id !== id));
    await db.deleteAllocationRecord(id);
    showToast('info', 'Alokasi Dihapus');
  };

  // Settings
  const updateSettings = async (newSettings: AllocationSettings) => {
    setSettings(newSettings);
    await db.upsertAllocationSettings({ ...newSettings, farmId: farm.id });
    showToast('success', 'Pengaturan Disimpan', 'Persentase alokasi modal berhasil diperbarui.');
  };

  const resetSettingsToDefault = async () => {
    const defaultSettings: AllocationSettings = {
      ...DEFAULT_ALLOCATION_SETTINGS,
      farmId: farm.id,
      updatedAt: new Date().toISOString(),
    };
    setSettings(defaultSettings);
    await db.upsertAllocationSettings(defaultSettings);
    showToast('info', 'Pengaturan Di-reset', 'Persentase alokasi kembali ke bawaan sistem.');
  };

  // Stock Movements
  const stockMovements: StockMovement[] = useMemo(() => {
    const movements: StockMovement[] = [];
    let runningBalance = farm.initialStock;

    movements.push({
      id: 'init-stock',
      date: '2026-10-01',
      type: 'PENYESUAIAN',
      description: 'Stok Awal Periode',
      inWeight: farm.initialStock,
      outWeight: 0,
      balance: runningBalance,
    });

    const allEvents: Array<{
      date: string;
      type: 'PANEN' | 'PENJUALAN';
      weight: number;
      refId: string;
      description: string;
    }> = [];

    harvests.forEach((h) => {
      allEvents.push({
        date: h.date,
        type: 'PANEN',
        weight: h.totalWeight,
        refId: h.id,
        description: `Panen Telur (${h.totalWeight} kg)`,
      });
    });

    sales.forEach((s) => {
      allEvents.push({
        date: s.date,
        type: 'PENJUALAN',
        weight: s.quantity,
        refId: s.id,
        description: `Penjualan Telur (${s.quantity} kg) - ${s.customer || 'Tunai'}`,
      });
    });

    allEvents.sort((a, b) => a.date.localeCompare(b.date));

    allEvents.forEach((event, idx) => {
      if (event.type === 'PANEN') {
        runningBalance += event.weight;
        movements.push({
          id: `mov-${event.refId}-${idx}`,
          date: event.date,
          type: 'PANEN',
          description: event.description,
          inWeight: event.weight,
          outWeight: 0,
          balance: runningBalance,
          referenceId: event.refId,
        });
      } else {
        runningBalance -= event.weight;
        movements.push({
          id: `mov-${event.refId}-${idx}`,
          date: event.date,
          type: 'PENJUALAN',
          description: event.description,
          inWeight: 0,
          outWeight: event.weight,
          balance: runningBalance,
          referenceId: event.refId,
        });
      }
    });

    return movements.reverse();
  }, [farm.initialStock, harvests, sales]);

  const todayActiveDateStr = useMemo(() => {
    const dates = [
      ...harvests.map((h) => h.date),
      ...sales.map((s) => s.date),
      ...expenses.map((e) => e.date),
    ];
    if (dates.length === 0) return '2026-10-07';
    dates.sort((a, b) => b.localeCompare(a));
    return dates[0];
  }, [harvests, sales, expenses]);

  const todayHarvestKg = useMemo(() => {
    return harvests
      .filter((h) => h.date === todayActiveDateStr)
      .reduce((acc, h) => acc + (Number(h.totalWeight) || 0), 0);
  }, [harvests, todayActiveDateStr]);

  const todaySalesAmount = useMemo(() => {
    return sales
      .filter((s) => s.date === todayActiveDateStr)
      .reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  }, [sales, todayActiveDateStr]);

  const todayExpensesAmount = useMemo(() => {
    return expenses
      .filter((e) => e.date === todayActiveDateStr)
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [expenses, todayActiveDateStr]);

  const todayProfitAmount = useMemo(() => {
    return Math.max(0, todaySalesAmount - todayExpensesAmount);
  }, [todaySalesAmount, todayExpensesAmount]);

  const monthExpensesAmount = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith('2026-10'))
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const monthSalesAmount = useMemo(() => {
    return sales
      .filter((s) => s.date.startsWith('2026-10'))
      .reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  }, [sales]);

  const monthProfitAmount = useMemo(() => {
    return Math.max(0, monthSalesAmount - monthExpensesAmount);
  }, [monthSalesAmount, monthExpensesAmount]);

  const convertDailyProfitToCapital = async (
    targetDate?: string
  ): Promise<{ success: boolean; message: string; allocation?: ProfitAllocation }> => {
    const dateToProcess = targetDate || todayActiveDateStr;

    const daySales = sales
      .filter((s) => s.date === dateToProcess)
      .reduce((acc, s) => acc + (Number(s.total) || 0), 0);

    const dayExpenses = expenses
      .filter((e) => e.date === dateToProcess)
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const dayNetProfit = daySales - dayExpenses;

    if (dayNetProfit <= 0) {
      const msg = `Keuntungan bersih pada ${formatTanggal(dateToProcess)} adalah Rp 0 atau minus, tidak ada modal untuk dikonversi.`;
      showToast('warning', 'Konversi Tidak Dapat Diproses', msg);
      return { success: false, message: msg };
    }

    const calculated = calculateProfitAllocation(dayNetProfit, settings);

    const newRecord: ProfitAllocation = {
      id: `alc-${Date.now()}`,
      farmId: farm.id,
      date: dateToProcess,
      profit: dayNetProfit,
      feedAmount: calculated.feedAmount,
      chickenAmount: calculated.chickenAmount,
      laborAmount: calculated.laborAmount,
      electricityAmount: calculated.electricityAmount,
      waterAmount: calculated.waterAmount,
      vitaminAmount: calculated.vitaminAmount,
      feedPercentage: settings.feedPercentage,
      chickenPercentage: settings.chickenPercentage,
      laborPercentage: settings.laborPercentage,
      electricityPercentage: settings.electricityPercentage,
      waterPercentage: settings.waterPercentage,
      vitaminPercentage: settings.vitaminPercentage,
      notes: `Konversi otomatis laba harian tanggal ${formatTanggal(dateToProcess)}`,
      createdAt: new Date().toISOString(),
    };

    setAllocations((prev) => [newRecord, ...prev]);
    await db.insertAllocation({ ...newRecord, farmId: farm.id });

    const successMsg = `Berhasil mengonversi keuntungan Rp ${dayNetProfit.toLocaleString('id-ID')} menjadi modal operasional.`;
    showToast('success', 'Konversi Berhasil!', successMsg);

    return { success: true, message: successMsg, allocation: newRecord };
  };

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
    showToast('info', 'Data Demo Dipulihkan', 'Semua data telah dikembalikan ke kondisi awal.');
  };

  const saveSupabaseConfig = (url: string, key: string) => {
    setSupabaseConfig({ url, anonKey: key });
    setSyncStatus('connecting');
    setTimeout(() => {
      setSyncStatus('synced');
      refreshDatabaseData();
      showToast('success', 'Konfigurasi Supabase Disimpan', 'Sinkronisasi database aktif.');
    }, 800);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userProfile,
        authLoading,
        isAuthDialogOpen,
        setIsAuthDialogOpen,
        signOut,
        dbLoading,
        refreshDatabaseData,
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
