import { supabase } from '../lib/supabase';
import {
  ChickenRecord,
  HarvestRecord,
  SaleRecord,
  ExpenseRecord,
  ProfitAllocation,
  AllocationSettings,
  FarmProfile,
  UserProfile,
} from '../types';

/**
 * Service layer to handle direct Supabase CRUD operations
 * for Lingga Mandiri Farm.
 */

/**
 * Upload logo image file to Supabase storage bucket 'app-files'
 */
export const uploadLogoToSupabaseStorage = async (
  file: File,
  farmId: string
): Promise<{ url: string | null; error?: string }> => {
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `farm-logo-${farmId}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    // Upload directly to 'app-files' storage bucket
    const { data: uploadData, error } = await supabase.storage
      .from('app-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Storage upload note:', error.message);
      return { url: null, error: error.message };
    }

    // Retrieve public URL from Supabase
    const { data: publicData } = supabase.storage
      .from('app-files')
      .getPublicUrl(filePath);

    return { url: publicData.publicUrl };
  } catch (err: any) {
    console.error('uploadLogoToSupabaseStorage exception:', err);
    return { url: null, error: err.message || 'Gagal mengunggah logo ke storage bucket.' };
  }
};

// --- PROFILE SERVICE ---
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('fetchUserProfile error:', error.message);
      return null;
    }
    if (!data) return null;
    return {
      id: data.id,
      email: data.email || '',
      fullName: data.full_name || '',
      avatarUrl: data.avatar_url || '',
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('fetchUserProfile exception:', err);
    return null;
  }
};

export const upsertUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      full_name: profile.fullName || '',
      avatar_url: profile.avatarUrl || '',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('upsertUserProfile exception:', err);
  }
};

// --- FARMS SERVICE ---
export const fetchFarm = async (userId?: string): Promise<FarmProfile | null> => {
  try {
    let query = supabase.from('farms').select('*');
    if (userId) {
      query = query.eq('owner_id', userId);
    }
    const { data, error } = await query.order('created_at', { ascending: true }).limit(1);

    if (error) {
      console.warn('fetchFarm query error:', error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    const row = data[0];
    return {
      id: row.id,
      name: row.name || 'Lingga Mandiri Farm',
      ownerName: row.owner_name || 'H. Sudirman',
      location: row.location || 'Blitar, Jawa Timur',
      initialStock: Number(row.initial_stock) || 305,
      productiveChickens: Number(row.productive_chickens) || 920,
      totalChickens: Number(row.total_chickens) || 1000,
      logoUrl: row.logo_url || '',
    };
  } catch (err) {
    console.error('fetchFarm exception:', err);
    return null;
  }
};

export const updateFarm = async (
  farmId: string,
  profile: Partial<FarmProfile>,
  userId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (profile.name !== undefined) payload.name = profile.name;
    if (profile.ownerName !== undefined) payload.owner_name = profile.ownerName;
    if (profile.location !== undefined) payload.location = profile.location;
    if (profile.initialStock !== undefined) payload.initial_stock = profile.initialStock;
    if (profile.productiveChickens !== undefined) payload.productive_chickens = profile.productiveChickens;
    if (profile.totalChickens !== undefined) payload.total_chickens = profile.totalChickens;
    if (profile.logoUrl !== undefined) payload.logo_url = profile.logoUrl;
    if (userId) payload.owner_id = userId;

    const { error } = await supabase.from('farms').update(payload).eq('id', farmId);
    if (error) {
      console.warn('updateFarm error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('updateFarm exception:', err);
    return { success: false, error: err?.message || 'Gagal update data farm.' };
  }
};

export const createFarm = async (
  farm: Omit<FarmProfile, 'id'>,
  userId?: string
): Promise<{ farm: FarmProfile | null; error?: string }> => {
  try {
    const payload: Record<string, any> = {
      name: farm.name,
      owner_name: farm.ownerName,
      location: farm.location,
      initial_stock: farm.initialStock,
      productive_chickens: farm.productiveChickens,
      total_chickens: farm.totalChickens,
      logo_url: farm.logoUrl || null,
    };
    if (userId) payload.owner_id = userId;

    const { data, error } = await supabase.from('farms').insert(payload).select().single();
    if (error || !data) {
      console.warn('createFarm note:', error?.message);
      return { farm: null, error: error?.message };
    }
    return {
      farm: {
        id: data.id,
        name: data.name,
        ownerName: data.owner_name,
        location: data.location,
        initialStock: Number(data.initial_stock) || 0,
        productiveChickens: Number(data.productive_chickens) || 0,
        totalChickens: Number(data.total_chickens) || 0,
        logoUrl: data.logo_url || '',
      },
    };
  } catch (err: any) {
    console.error('createFarm exception:', err);
    return { farm: null, error: err?.message || 'Gagal membuat data farm.' };
  }
};

// --- CHICKENS SERVICE ---
export const fetchChickens = async (farmId: string): Promise<ChickenRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('chickens')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('fetchChickens error:', error.message);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      farmId: row.farm_id,
      date: row.date,
      quantity: Number(row.quantity) || 0,
      productiveQuantity: Number(row.productive_quantity) || 0,
      deadQuantity: Number(row.dead_quantity) || 0,
      culledQuantity: Number(row.culled_quantity) || 0,
      incomingQuantity: Number(row.incoming_quantity) || 0,
      notes: row.notes || '',
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('fetchChickens exception:', err);
    return [];
  }
};

export const insertChicken = async (record: Omit<ChickenRecord, 'id' | 'createdAt'>): Promise<ChickenRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('chickens')
      .insert({
        farm_id: record.farmId,
        date: record.date,
        quantity: record.quantity,
        productive_quantity: record.productiveQuantity,
        dead_quantity: record.deadQuantity || 0,
        culled_quantity: record.culledQuantity || 0,
        incoming_quantity: record.incomingQuantity || 0,
        notes: record.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('insertChicken error:', error?.message);
      return null;
    }
    return {
      id: data.id,
      farmId: data.farm_id,
      date: data.date,
      quantity: Number(data.quantity) || 0,
      productiveQuantity: Number(data.productive_quantity) || 0,
      deadQuantity: Number(data.dead_quantity) || 0,
      culledQuantity: Number(data.culled_quantity) || 0,
      incomingQuantity: Number(data.incoming_quantity) || 0,
      notes: data.notes || '',
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('insertChicken exception:', err);
    return null;
  }
};

export const updateChickenRecord = async (id: string, record: Partial<ChickenRecord>): Promise<boolean> => {
  try {
    const payload: Record<string, any> = {};
    if (record.date !== undefined) payload.date = record.date;
    if (record.quantity !== undefined) payload.quantity = record.quantity;
    if (record.productiveQuantity !== undefined) payload.productive_quantity = record.productiveQuantity;
    if (record.deadQuantity !== undefined) payload.dead_quantity = record.deadQuantity;
    if (record.culledQuantity !== undefined) payload.culled_quantity = record.culledQuantity;
    if (record.incomingQuantity !== undefined) payload.incoming_quantity = record.incomingQuantity;
    if (record.notes !== undefined) payload.notes = record.notes;

    const { error } = await supabase.from('chickens').update(payload).eq('id', id);
    return !error;
  } catch (err) {
    console.error('updateChickenRecord exception:', err);
    return false;
  }
};

export const deleteChickenRecord = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('chickens').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('deleteChickenRecord exception:', err);
    return false;
  }
};

// --- HARVESTS SERVICE ---
export const fetchHarvests = async (farmId: string): Promise<HarvestRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('egg_harvests')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('fetchHarvests error:', error.message);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      farmId: row.farm_id,
      date: row.date,
      productiveChickens: Number(row.productive_chickens) || 0,
      totalWeight: Number(row.total_weight) || 0,
      brokenWeight: Number(row.broken_weight) || 0,
      notes: row.notes || '',
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('fetchHarvests exception:', err);
    return [];
  }
};

export const insertHarvest = async (record: Omit<HarvestRecord, 'id' | 'createdAt'>): Promise<HarvestRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('egg_harvests')
      .insert({
        farm_id: record.farmId,
        date: record.date,
        productive_chickens: record.productiveChickens,
        total_weight: record.totalWeight,
        broken_weight: record.brokenWeight || 0,
        notes: record.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('insertHarvest error:', error?.message);
      return null;
    }
    return {
      id: data.id,
      farmId: data.farm_id,
      date: data.date,
      productiveChickens: Number(data.productive_chickens) || 0,
      totalWeight: Number(data.total_weight) || 0,
      brokenWeight: Number(data.broken_weight) || 0,
      notes: data.notes || '',
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('insertHarvest exception:', err);
    return null;
  }
};

export const updateHarvestRecord = async (id: string, record: Partial<HarvestRecord>): Promise<boolean> => {
  try {
    const payload: Record<string, any> = {};
    if (record.date !== undefined) payload.date = record.date;
    if (record.productiveChickens !== undefined) payload.productive_chickens = record.productiveChickens;
    if (record.totalWeight !== undefined) payload.total_weight = record.totalWeight;
    if (record.brokenWeight !== undefined) payload.broken_weight = record.brokenWeight;
    if (record.notes !== undefined) payload.notes = record.notes;

    const { error } = await supabase.from('egg_harvests').update(payload).eq('id', id);
    return !error;
  } catch (err) {
    console.error('updateHarvestRecord exception:', err);
    return false;
  }
};

export const deleteHarvestRecord = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('egg_harvests').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('deleteHarvestRecord exception:', err);
    return false;
  }
};

// --- SALES SERVICE ---
export const fetchSales = async (farmId: string): Promise<SaleRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('fetchSales error:', error.message);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      farmId: row.farm_id,
      date: row.date,
      customer: row.customer_name || '',
      quantity: Number(row.quantity) || 0,
      unitPrice: Number(row.unit_price) || 0,
      total: Number(row.total) || 0,
      paymentStatus: (row.payment_status as any) || 'Lunas',
      notes: row.notes || '',
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('fetchSales exception:', err);
    return [];
  }
};

export const insertSale = async (record: Omit<SaleRecord, 'id' | 'createdAt'>): Promise<SaleRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .insert({
        farm_id: record.farmId,
        date: record.date,
        customer_name: record.customer || null,
        quantity: record.quantity,
        unit_price: record.unitPrice,
        total: record.total,
        payment_status: record.paymentStatus || 'Lunas',
        notes: record.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('insertSale error:', error?.message);
      return null;
    }
    return {
      id: data.id,
      farmId: data.farm_id,
      date: data.date,
      customer: data.customer_name || '',
      quantity: Number(data.quantity) || 0,
      unitPrice: Number(data.unit_price) || 0,
      total: Number(data.total) || 0,
      paymentStatus: data.payment_status as any,
      notes: data.notes || '',
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('insertSale exception:', err);
    return null;
  }
};

export const updateSaleRecord = async (id: string, record: Partial<SaleRecord>): Promise<boolean> => {
  try {
    const payload: Record<string, any> = {};
    if (record.date !== undefined) payload.date = record.date;
    if (record.customer !== undefined) payload.customer_name = record.customer;
    if (record.quantity !== undefined) payload.quantity = record.quantity;
    if (record.unitPrice !== undefined) payload.unit_price = record.unitPrice;
    if (record.total !== undefined) payload.total = record.total;
    if (record.paymentStatus !== undefined) payload.payment_status = record.paymentStatus;
    if (record.notes !== undefined) payload.notes = record.notes;

    const { error } = await supabase.from('sales').update(payload).eq('id', id);
    return !error;
  } catch (err) {
    console.error('updateSaleRecord exception:', err);
    return false;
  }
};

export const deleteSaleRecord = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('deleteSaleRecord exception:', err);
    return false;
  }
};

// --- EXPENSES SERVICE ---
export const fetchExpenses = async (farmId: string): Promise<ExpenseRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('fetchExpenses error:', error.message);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      farmId: row.farm_id,
      date: row.date,
      category: row.category as any,
      description: row.description || '',
      amount: Number(row.amount) || 0,
      notes: row.notes || '',
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('fetchExpenses exception:', err);
    return [];
  }
};

export const insertExpense = async (record: Omit<ExpenseRecord, 'id' | 'createdAt'>): Promise<ExpenseRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        farm_id: record.farmId,
        date: record.date,
        category: record.category,
        description: record.description,
        amount: record.amount,
        notes: record.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('insertExpense error:', error?.message);
      return null;
    }
    return {
      id: data.id,
      farmId: data.farm_id,
      date: data.date,
      category: data.category as any,
      description: data.description || '',
      amount: Number(data.amount) || 0,
      notes: data.notes || '',
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('insertExpense exception:', err);
    return null;
  }
};

export const updateExpenseRecord = async (id: string, record: Partial<ExpenseRecord>): Promise<boolean> => {
  try {
    const payload: Record<string, any> = {};
    if (record.date !== undefined) payload.date = record.date;
    if (record.category !== undefined) payload.category = record.category;
    if (record.description !== undefined) payload.description = record.description;
    if (record.amount !== undefined) payload.amount = record.amount;
    if (record.notes !== undefined) payload.notes = record.notes;

    const { error } = await supabase.from('expenses').update(payload).eq('id', id);
    return !error;
  } catch (err) {
    console.error('updateExpenseRecord exception:', err);
    return false;
  }
};

export const deleteExpenseRecord = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('deleteExpenseRecord exception:', err);
    return false;
  }
};

// --- PROFIT ALLOCATIONS SERVICE ---
export const fetchAllocations = async (farmId: string): Promise<ProfitAllocation[]> => {
  try {
    const { data, error } = await supabase
      .from('profit_allocations')
      .select('*')
      .eq('farm_id', farmId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('fetchAllocations error:', error.message);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      farmId: row.farm_id,
      date: row.date,
      profit: Number(row.profit) || 0,
      feedAmount: Number(row.feed_amount) || 0,
      chickenAmount: Number(row.chicken_amount) || 0,
      laborAmount: Number(row.labor_amount) || 0,
      electricityAmount: Number(row.electricity_amount) || 0,
      waterAmount: Number(row.water_amount) || 0,
      vitaminAmount: Number(row.vitamin_amount) || 0,
      feedPercentage: Number(row.feed_percentage) || 63,
      chickenPercentage: Number(row.chicken_percentage) || 20,
      laborPercentage: Number(row.labor_percentage) || 12,
      electricityPercentage: Number(row.electricity_percentage) || 0.5,
      waterPercentage: Number(row.water_percentage) || 1,
      vitaminPercentage: Number(row.vitamin_percentage) || 3.5,
      notes: row.notes || '',
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('fetchAllocations exception:', err);
    return [];
  }
};

export const insertAllocation = async (record: Omit<ProfitAllocation, 'id' | 'createdAt'>): Promise<ProfitAllocation | null> => {
  try {
    const { data, error } = await supabase
      .from('profit_allocations')
      .insert({
        farm_id: record.farmId,
        date: record.date,
        profit: record.profit,
        feed_amount: record.feedAmount,
        chicken_amount: record.chickenAmount,
        labor_amount: record.laborAmount,
        electricity_amount: record.electricityAmount,
        water_amount: record.waterAmount,
        vitamin_amount: record.vitaminAmount,
        feed_percentage: record.feedPercentage,
        chicken_percentage: record.chickenPercentage,
        labor_percentage: record.laborPercentage,
        electricity_percentage: record.electricityPercentage,
        water_percentage: record.waterPercentage,
        vitamin_percentage: record.vitaminPercentage,
        notes: record.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('insertAllocation error:', error?.message);
      return null;
    }
    return {
      id: data.id,
      farmId: data.farm_id,
      date: data.date,
      profit: Number(data.profit) || 0,
      feedAmount: Number(data.feed_amount) || 0,
      chickenAmount: Number(data.chicken_amount) || 0,
      laborAmount: Number(data.labor_amount) || 0,
      electricityAmount: Number(data.electricity_amount) || 0,
      waterAmount: Number(data.water_amount) || 0,
      vitaminAmount: Number(data.vitamin_amount) || 0,
      feedPercentage: Number(data.feed_percentage) || 63,
      chickenPercentage: Number(data.chicken_percentage) || 20,
      laborPercentage: Number(data.labor_percentage) || 12,
      electricityPercentage: Number(data.electricity_percentage) || 0.5,
      waterPercentage: Number(data.water_percentage) || 1,
      vitaminPercentage: Number(data.vitamin_percentage) || 3.5,
      notes: data.notes || '',
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('insertAllocation exception:', err);
    return null;
  }
};

export const deleteAllocationRecord = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('profit_allocations').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('deleteAllocationRecord exception:', err);
    return false;
  }
};

// --- ALLOCATION SETTINGS SERVICE ---
export const fetchAllocationSettings = async (farmId: string): Promise<AllocationSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('allocation_settings')
      .select('*')
      .eq('farm_id', farmId)
      .single();

    if (error) {
      console.warn('fetchAllocationSettings error:', error.message);
      return null;
    }
    if (!data) return null;
    return {
      id: data.id,
      farmId: data.farm_id,
      feedPercentage: Number(data.feed_percentage) || 63,
      chickenPercentage: Number(data.chicken_percentage) || 20,
      laborPercentage: Number(data.labor_percentage) || 12,
      electricityPercentage: Number(data.electricity_percentage) || 0.5,
      waterPercentage: Number(data.water_percentage) || 1,
      vitaminPercentage: Number(data.vitamin_percentage) || 3.5,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('fetchAllocationSettings exception:', err);
    return null;
  }
};

export const upsertAllocationSettings = async (settings: AllocationSettings): Promise<boolean> => {
  try {
    const { error } = await supabase.from('allocation_settings').upsert(
      {
        farm_id: settings.farmId,
        feed_percentage: settings.feedPercentage,
        chicken_percentage: settings.chickenPercentage,
        labor_percentage: settings.laborPercentage,
        electricity_percentage: settings.electricityPercentage,
        water_percentage: settings.waterPercentage,
        vitamin_percentage: settings.vitaminPercentage,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'farm_id' }
    );
    return !error;
  } catch (err) {
    console.error('upsertAllocationSettings exception:', err);
    return false;
  }
};

export interface DatabaseDiagnostics {
  connected: boolean;
  message: string;
  tables: Record<string, { status: 'ready' | 'missing' | 'error'; message?: string }>;
  allReady: boolean;
}

/**
 * Diagnostic test to verify if Supabase API is reachable and tables are created.
 */
export const testSupabaseConnection = async (): Promise<DatabaseDiagnostics> => {
  const tableNames = [
    'farms',
    'chickens',
    'egg_harvests',
    'sales',
    'expenses',
    'profit_allocations',
    'allocation_settings',
  ];

  const results: Record<string, { status: 'ready' | 'missing' | 'error'; message?: string }> = {};
  let overallConnected = true;
  let allReady = true;

  for (const tableName of tableNames) {
    try {
      const { error } = await supabase.from(tableName).select('id').limit(1);
      if (!error) {
        results[tableName] = { status: 'ready' };
      } else if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        results[tableName] = { status: 'missing', message: 'Tabel belum dibuat di Supabase' };
        allReady = false;
      } else {
        results[tableName] = { status: 'error', message: error.message };
        allReady = false;
      }
    } catch (e: any) {
      results[tableName] = { status: 'error', message: e.message };
      overallConnected = false;
      allReady = false;
    }
  }

  return {
    connected: overallConnected,
    allReady,
    message: allReady
      ? 'Seluruh 7 tabel Supabase terhubung dan siap digunakan!'
      : 'Koneksi ke Supabase aktif, tetapi beberapa tabel belum dibuat di SQL Editor.',
    tables: results,
  };
};

/**
 * Upload all in-memory / local data to Supabase in one batch.
 */
export const syncAllLocalDataToSupabase = async (
  farm: FarmProfile,
  settings: AllocationSettings,
  chickens: ChickenRecord[],
  harvests: HarvestRecord[],
  sales: SaleRecord[],
  expenses: ExpenseRecord[],
  allocations: ProfitAllocation[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Upsert Farm
    const { error: farmErr } = await supabase.from('farms').upsert({
      id: farm.id.startsWith('farm-') ? 'a0000000-0000-0000-0000-000000000001' : farm.id,
      name: farm.name,
      owner_name: farm.ownerName,
      location: farm.location,
      initial_stock: farm.initialStock,
      productive_chickens: farm.productiveChickens,
      total_chickens: farm.totalChickens,
      logo_url: farm.logoUrl || null,
      updated_at: new Date().toISOString(),
    });

    const targetFarmId = farm.id.startsWith('farm-') ? 'a0000000-0000-0000-0000-000000000001' : farm.id;

    if (farmErr) {
      return { success: false, error: `Gagal menyimpan data farm: ${farmErr.message}` };
    }

    // 2. Settings
    await upsertAllocationSettings({ ...settings, farmId: targetFarmId });

    // 3. Chickens
    if (chickens.length > 0) {
      const chickenPayloads = chickens.map((c) => ({
        farm_id: targetFarmId,
        date: c.date,
        quantity: c.quantity,
        productive_quantity: c.productiveQuantity,
        dead_quantity: c.deadQuantity || 0,
        culled_quantity: c.culledQuantity || 0,
        incoming_quantity: c.incomingQuantity || 0,
        notes: c.notes || null,
      }));
      await supabase.from('chickens').insert(chickenPayloads);
    }

    // 4. Harvests
    if (harvests.length > 0) {
      const harvestPayloads = harvests.map((h) => ({
        farm_id: targetFarmId,
        date: h.date,
        productive_chickens: h.productiveChickens,
        total_weight: h.totalWeight,
        broken_weight: h.brokenWeight || 0,
        notes: h.notes || null,
      }));
      await supabase.from('egg_harvests').insert(harvestPayloads);
    }

    // 5. Sales
    if (sales.length > 0) {
      const salesPayloads = sales.map((s) => ({
        farm_id: targetFarmId,
        date: s.date,
        customer_name: s.customer || null,
        quantity: s.quantity,
        unit_price: s.unitPrice,
        total: s.total,
        payment_status: s.paymentStatus || 'Lunas',
        notes: s.notes || null,
      }));
      await supabase.from('sales').insert(salesPayloads);
    }

    // 6. Expenses
    if (expenses.length > 0) {
      const expensesPayloads = expenses.map((e) => ({
        farm_id: targetFarmId,
        date: e.date,
        category: e.category,
        description: e.description,
        amount: e.amount,
        notes: e.notes || null,
      }));
      await supabase.from('expenses').insert(expensesPayloads);
    }

    // 7. Allocations
    if (allocations.length > 0) {
      const allocationPayloads = allocations.map((a) => ({
        farm_id: targetFarmId,
        date: a.date,
        profit: a.profit,
        feed_amount: a.feedAmount,
        chicken_amount: a.chickenAmount,
        labor_amount: a.laborAmount,
        electricity_amount: a.electricityAmount,
        water_amount: a.waterAmount,
        vitamin_amount: a.vitaminAmount,
        feed_percentage: a.feedPercentage,
        chicken_percentage: a.chickenPercentage,
        labor_percentage: a.laborPercentage,
        electricity_percentage: a.electricityPercentage,
        water_percentage: a.waterPercentage,
        vitamin_percentage: a.vitaminPercentage,
        notes: a.notes || null,
      }));
      await supabase.from('profit_allocations').insert(allocationPayloads);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Terjadi kesalahan sinkronisasi.' };
  }
};
