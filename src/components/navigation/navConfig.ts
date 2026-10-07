import React from 'react';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined';
import EggAltOutlinedIcon from '@mui/icons-material/EggAltOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

export type NavTab =
  | 'dashboard'
  | 'chicken'
  | 'harvest'
  | 'stock'
  | 'sales'
  | 'expenses'
  | 'profit'
  | 'conversion'
  | 'reports'
  | 'settings';

export interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ sx?: any; fontSize?: 'small' | 'inherit' | 'medium' | 'large' }>;
  highlight?: boolean;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon },
  { id: 'chicken', label: 'Data Ayam', icon: PetsOutlinedIcon },
  { id: 'harvest', label: 'Panen Telur', icon: EggAltOutlinedIcon },
  { id: 'stock', label: 'Stok Telur', icon: Inventory2OutlinedIcon },
  { id: 'sales', label: 'Penjualan', icon: PointOfSaleOutlinedIcon },
  { id: 'expenses', label: 'Pengeluaran', icon: PaymentsOutlinedIcon },
  { id: 'profit', label: 'Keuntungan', icon: TrendingUpOutlinedIcon },
  { id: 'conversion', label: 'Konversi Modal', icon: AutorenewOutlinedIcon, highlight: true },
  { id: 'reports', label: 'Laporan', icon: AssessmentOutlinedIcon },
  { id: 'settings', label: 'Pengaturan', icon: SettingsOutlinedIcon },
];

export const TAB_TITLES: Record<NavTab, string> = {
  dashboard: 'Dashboard',
  chicken: 'Data Ayam',
  harvest: 'Panen Telur',
  stock: 'Stok Telur',
  sales: 'Penjualan Telur',
  expenses: 'Pengeluaran',
  profit: 'Keuntungan',
  conversion: 'Konversi Modal',
  reports: 'Laporan Usaha',
  settings: 'Pengaturan',
};
