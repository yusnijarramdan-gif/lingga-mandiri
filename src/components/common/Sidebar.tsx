import React from 'react';
import {
  LayoutDashboard,
  Feather,
  Egg,
  Boxes,
  ShoppingBag,
  Receipt,
  TrendingUp,
  Percent,
  FileSpreadsheet,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

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

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const NAV_ITEMS: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; highlight?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chicken', label: 'Data Ayam', icon: Feather },
  { id: 'harvest', label: 'Panen Telur', icon: Egg },
  { id: 'stock', label: 'Stok Telur', icon: Boxes },
  { id: 'sales', label: 'Penjualan', icon: ShoppingBag },
  { id: 'expenses', label: 'Pengeluaran', icon: Receipt },
  { id: 'profit', label: 'Keuntungan', icon: TrendingUp },
  { id: 'conversion', label: 'Konversi Modal', icon: Percent, highlight: true },
  { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { farm, currentStock } = useApp();

  return (
    <aside className="w-64 bg-white border-r border-neutral-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
            <Egg className="w-5 h-5 fill-white text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black text-neutral-900 tracking-tight leading-snug">Lingga Mandiri Farm</h1>
            <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">{farm.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : item.highlight
                  ? 'text-amber-700 bg-amber-50/70 hover:bg-amber-100/60 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 shrink-0 ${
                  isActive ? 'text-white' : item.highlight ? 'text-amber-600' : 'text-neutral-500'
                }`}
              />
              <span className="truncate flex-1">{item.label}</span>
              {item.highlight && !isActive && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200/70 px-1.5 py-0.5 rounded-sm">
                  <Sparkles className="w-2.5 h-2.5" />
                  Fitur
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Summary Widget */}
      <div className="p-4 border-t border-neutral-100 bg-neutral-50/60 m-3 rounded-xl border">
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
          <span>Stok Telur Aktif</span>
          <span className="text-emerald-700 font-medium">Tersedia</span>
        </div>
        <p className="text-xl font-bold text-neutral-900 font-mono tabular-nums">
          {currentStock.toLocaleString('id-ID')} <span className="text-xs font-normal text-neutral-500">KG</span>
        </p>
        <p className="text-[11px] text-neutral-500 mt-1 truncate">{farm.location}</p>
      </div>
    </aside>
  );
};
