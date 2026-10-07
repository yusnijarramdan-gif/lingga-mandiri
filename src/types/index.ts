export type PaymentStatus = 'Lunas' | 'Belum Lunas' | 'Sebagian';

export type ExpenseCategory =
  | 'Pakan'
  | 'Pembelian Ayam'
  | 'Upah'
  | 'Listrik'
  | 'Air'
  | 'Vitamin'
  | 'Vaksin'
  | 'Transportasi'
  | 'Perawatan'
  | 'Lainnya';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface ChickenRecord {
  id: string;
  farmId: string;
  date: string; // YYYY-MM-DD
  quantity: number; // Total ayam
  productiveQuantity: number; // Jumlah ayam produktif
  deadQuantity: number;
  culledQuantity: number; // Ayam afkir
  incomingQuantity: number; // Ayam baru masuk
  notes?: string;
  createdAt: string;
}

export interface HarvestRecord {
  id: string;
  farmId: string;
  date: string; // YYYY-MM-DD
  productiveChickens: number; // disesuaikan dengan data stock ayam
  totalWeight: number; // in kg (berat panen telur)
  brokenWeight?: number; // in kg (opsional: retak/rusak)
  notes?: string;
  createdAt: string;
}

export interface SaleRecord {
  id: string;
  farmId: string;
  date: string; // YYYY-MM-DD
  customer?: string;
  quantity: number; // in kg
  unitPrice: number; // in Rp / kg
  total: number; // quantity * unitPrice
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  farmId: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface ProfitAllocation {
  id: string;
  farmId: string;
  date: string; // YYYY-MM-DD
  profit: number; // total allocated profit
  feedAmount: number;
  chickenAmount: number;
  laborAmount: number;
  electricityAmount: number;
  waterAmount: number;
  vitaminAmount: number;
  feedPercentage: number;
  chickenPercentage: number;
  laborPercentage: number;
  electricityPercentage: number;
  waterPercentage: number;
  vitaminPercentage: number;
  notes?: string;
  createdAt: string;
}

export interface AllocationSettings {
  id?: string;
  farmId: string;
  feedPercentage: number; // default 63
  chickenPercentage: number; // default 20
  laborPercentage: number; // default 12
  electricityPercentage: number; // default 0.5
  waterPercentage: number; // default 1
  vitaminPercentage: number; // default 3.5
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  date: string;
  type: 'PANEN' | 'PENJUALAN' | 'PENYESUAIAN';
  description: string;
  inWeight: number;
  outWeight: number;
  balance: number;
  referenceId?: string;
}

export interface FarmProfile {
  id: string;
  name: string;
  ownerName: string;
  location: string;
  initialStock: number; // KG telur awal
  productiveChickens: number; // Pengaturan jumlah stock ayam produktif
  totalChickens: number; // Total stock populasi ayam
  logoUrl?: string; // URL atau base64 logo aplikasi peternakan
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}
