import { AllocationSettings, HarvestRecord, SaleRecord } from '../types';

export interface CalculatedAllocation {
  feedAmount: number;
  chickenAmount: number;
  laborAmount: number;
  electricityAmount: number;
  waterAmount: number;
  vitaminAmount: number;
  totalAllocated: number;
}

/**
 * Menghitung pembagian alokasi modal dengan pembulatan Rupiah yang aman.
 * Menjamin bahwa total seluruh alokasi sama persis dengan nominal keuntungan yang dikonversi.
 */
export function calculateProfitAllocation(
  profit: number,
  settings: AllocationSettings
): CalculatedAllocation {
  if (profit <= 0) {
    return {
      feedAmount: 0,
      chickenAmount: 0,
      laborAmount: 0,
      electricityAmount: 0,
      waterAmount: 0,
      vitaminAmount: 0,
      totalAllocated: 0,
    };
  }

  // Raw amounts
  const rawFeed = (profit * settings.feedPercentage) / 100;
  const rawChicken = (profit * settings.chickenPercentage) / 100;
  const rawLabor = (profit * settings.laborPercentage) / 100;
  const rawElectricity = (profit * settings.electricityPercentage) / 100;
  const rawWater = (profit * settings.waterPercentage) / 100;
  const rawVitamin = (profit * settings.vitaminPercentage) / 100;

  // Round to nearest integer (Rupiah)
  let feedAmount = Math.round(rawFeed);
  const chickenAmount = Math.round(rawChicken);
  const laborAmount = Math.round(rawLabor);
  const electricityAmount = Math.round(rawElectricity);
  const waterAmount = Math.round(rawWater);
  const vitaminAmount = Math.round(rawVitamin);

  const subtotal = chickenAmount + laborAmount + electricityAmount + waterAmount + vitaminAmount;
  // Sesuaikan pada pos terbesar (pakan) agar total selalu 100% tepat sama persis
  feedAmount = profit - subtotal;

  return {
    feedAmount,
    chickenAmount,
    laborAmount,
    electricityAmount,
    waterAmount,
    vitaminAmount,
    totalAllocated: profit,
  };
}

export const DEFAULT_ALLOCATION_SETTINGS: AllocationSettings = {
  farmId: 'farm-1',
  feedPercentage: 63,
  chickenPercentage: 20,
  laborPercentage: 12,
  electricityPercentage: 0.5,
  waterPercentage: 1,
  vitaminPercentage: 3.5,
  updatedAt: new Date().toISOString(),
};

export function validatePercentageSum(settings: Partial<AllocationSettings>): {
  isValid: boolean;
  total: number;
  message?: string;
} {
  const sum =
    (settings.feedPercentage ?? 0) +
    (settings.chickenPercentage ?? 0) +
    (settings.laborPercentage ?? 0) +
    (settings.electricityPercentage ?? 0) +
    (settings.waterPercentage ?? 0) +
    (settings.vitaminPercentage ?? 0);

  // Floating point tolerance check (e.g. 99.999999 or 100.00001)
  const isClose = Math.abs(sum - 100) < 0.001;

  return {
    isValid: isClose,
    total: Math.round(sum * 10) / 10,
    message: isClose ? undefined : 'Total persentase harus 100%',
  };
}

/**
 * Filter record berdasarkan rentang tanggal
 */
export function isWithinDateRange(
  recordDate: string,
  filterType: 'today' | 'week' | 'month' | 'custom',
  customStart?: string,
  customEnd?: string
): boolean {
  if (!recordDate) return false;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  if (filterType === 'today') {
    return recordDate === todayStr;
  }

  if (filterType === 'week') {
    const target = new Date(recordDate);
    const diffTime = now.getTime() - target.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays >= -1 && diffDays <= 7;
  }

  if (filterType === 'month') {
    const targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return recordDate.startsWith(targetMonth);
  }

  if (filterType === 'custom') {
    if (customStart && recordDate < customStart) return false;
    if (customEnd && recordDate > customEnd) return false;
    return true;
  }

  return true;
}

/**
 * Menghitung stok saat ini dan pergerakan stok
 */
export function calculateCurrentStock(
  initialStock: number,
  harvests: HarvestRecord[],
  sales: SaleRecord[]
): {
  total: number;
  totalHarvestKg: number;
  totalSoldKg: number;
} {
  const totalHarvestKg = harvests.reduce((acc, h) => acc + (h.totalWeight || 0), 0);
  const totalSoldKg = sales.reduce((acc, s) => acc + (s.quantity || 0), 0);
  const total = Math.max(0, initialStock + totalHarvestKg - totalSoldKg);

  return {
    total,
    totalHarvestKg,
    totalSoldKg,
  };
}
