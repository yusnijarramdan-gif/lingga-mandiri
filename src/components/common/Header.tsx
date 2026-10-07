import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatTanggal, getTodayDateString } from '../../utils/formatters';
import { Egg, Database, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  activeTabTitle,
}) => {
  const { farm, syncStatus, resetAllToDemoData } = useApp();
  const todayStr = getTodayDateString();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
      {/* Zone 1: Brand Wordmark & Active Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 -ml-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
          aria-label="Buka menu navigasi"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            <Egg className="w-5 h-5 fill-white text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-neutral-900 tracking-tight">Lingga Mandiri Farm</span>
              <span className="hidden sm:inline text-neutral-300">/</span>
              <span className="hidden sm:inline text-sm font-medium text-neutral-600 truncate">{activeTabTitle}</span>
            </div>
            <p className="text-xs text-neutral-500 truncate sm:hidden">{farm.name}</p>
          </div>
        </div>
      </div>

      {/* Zone 2: Tanggal Aktif */}
      <div className="hidden md:flex items-center gap-2 text-xs text-neutral-500 font-medium">
        <span>Hari ini</span>
        <span aria-hidden="true">·</span>
        <span className="text-neutral-800 font-semibold">{formatTanggal(todayStr)}</span>
      </div>

      {/* Zone 3: Farm Profile & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={resetAllToDemoData}
          title="Reset ke data demo bawaan"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo</span>
        </button>

        <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-neutral-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-neutral-900 leading-tight">{farm.ownerName}</p>
            <div className="flex items-center justify-end gap-1 text-[11px] text-neutral-500">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>{syncStatus === 'synced' ? 'Supabase' : 'Lokal Siap'}</span>
            </div>
          </div>
          <img
            src="/src/assets/images/farmer_profile_avatar_1791345781152.jpg"
            alt={farm.ownerName}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover border border-neutral-200 shadow-2xs"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </header>
  );
};
