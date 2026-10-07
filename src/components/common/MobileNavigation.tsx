import React from 'react';
import {
  LayoutDashboard,
  Egg,
  Boxes,
  ShoppingBag,
  Menu,
  X,
  Feather,
  Receipt,
  TrendingUp,
  Percent,
  FileSpreadsheet,
  Settings,
  Sparkles,
} from 'lucide-react';
import { NavTab, NAV_ITEMS } from './Sidebar';
import { useApp } from '../../context/AppContext';

interface MobileNavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onSelectTab,
  isDrawerOpen,
  setIsDrawerOpen,
}) => {
  const { farm, currentStock } = useApp();

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    setIsDrawerOpen(false);
  };

  // Primary quick tabs for bottom bar
  const quickTabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'harvest', label: 'Panen', icon: Egg },
    { id: 'stock', label: 'Stok', icon: Boxes },
    { id: 'sales', label: 'Penjualan', icon: ShoppingBag },
  ];

  return (
    <>
      {/* Bottom Sticky Navigation Bar - Khusus Mobile View Saja */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 py-1.5 px-3 flex items-center justify-around shadow-lg no-print">
        {quickTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-xs transition-colors min-w-[56px] ${
                isActive ? 'text-neutral-900 font-bold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-600 stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] leading-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Menu button to open drawer */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-xs transition-colors min-w-[56px] ${
            isDrawerOpen || !quickTabs.some((t) => t.id === activeTab)
              ? 'text-neutral-900 font-bold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight">Lainnya</span>
        </button>
      </nav>

      {/* Drawer Overlay - Khusus Mobile View Saja */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden no-print">
          <div
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-white shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Egg className="w-4 h-4 fill-white text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Lingga Mandiri Farm</h3>
                  <p className="text-[11px] text-neutral-500 truncate">{farm.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Menu List */}
            <div className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-neutral-900 text-white font-semibold'
                        : item.highlight
                        ? 'text-amber-800 bg-amber-50 hover:bg-amber-100/70 font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-amber-600' : 'text-neutral-500'}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.highlight && !isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-700 bg-amber-200/80 px-1.5 py-0.5 rounded-sm">
                        <Sparkles className="w-2.5 h-2.5" />
                        Fitur
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Info */}
            <div className="p-4 border-t border-neutral-100 bg-neutral-50 text-xs text-neutral-500">
              <p className="font-semibold text-neutral-800">Stok Telur: {currentStock.toLocaleString('id-ID')} KG</p>
              <p className="text-[11px] mt-0.5">{farm.location}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
