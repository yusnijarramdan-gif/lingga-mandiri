import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProfitAllocation } from '../../types';
import { ProgressBar } from '../common/ProgressBar';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CurrencyInput, DateInput, TextareaInput } from '../common/FormInputs';
import { calculateProfitAllocation } from '../../utils/calculations';
import {
  formatRupiah,
  formatRupiahCompact,
  formatTanggal,
  formatTanggalSingkat,
  getTodayDateString,
} from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  Percent,
  Sparkles,
  CheckCircle2,
  Trash2,
  Eye,
  Settings,
  HelpCircle,
  Coins,
  Zap,
  TrendingUp,
  Receipt,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { NavTab } from '../common/Sidebar';

interface CapitalConversionPageProps {
  initialProfit?: number;
  onNavigateToSettings: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const CapitalConversionPage: React.FC<CapitalConversionPageProps> = ({
  initialProfit,
  onNavigateToSettings,
  onNavigate,
}) => {
  const {
    settings,
    allocations,
    addAllocation,
    deleteAllocation,
    monthProfitAmount,
    todaySalesAmount,
    todayExpensesAmount,
    todayProfitAmount,
    todayActiveDateStr,
    convertDailyProfitToCapital,
    autoDailyConversionEnabled,
    setAutoDailyConversionEnabled,
  } = useApp();

  // Nominal default yang akan dikonversi secara kustom
  const defaultAmount = initialProfit || (todayProfitAmount > 0 ? todayProfitAmount : 10000000);
  const [profitToConvert, setProfitToConvert] = useState<number>(defaultAmount);
  const [conversionDate, setConversionDate] = useState<string>(getTodayDateString());
  const [notes, setNotes] = useState<string>('Alokasi modal operasional');

  const [detailModalRecord, setDetailModalRecord] = useState<ProfitAllocation | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Perhitungan pembagian alokasi untuk laba harian
  const dailyAllocationCalc = calculateProfitAllocation(
    Math.max(0, todayProfitAmount),
    settings
  );

  // Perhitungan pembagian alokasi kustom
  const customAllocationCalc = calculateProfitAllocation(profitToConvert, settings);

  const handleExecuteDailyConversion = () => {
    const res = convertDailyProfitToCapital();
    if (res.success) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#3B82F6'],
        });
      } catch {
        // ignore
      }
    }
  };

  const handleConvertAndSaveCustom = () => {
    if (profitToConvert <= 0) {
      alert('Nominal keuntungan yang akan dikonversi harus lebih dari Rp 0.');
      return;
    }

    addAllocation({
      date: conversionDate,
      profit: profitToConvert,
      feedAmount: customAllocationCalc.feedAmount,
      chickenAmount: customAllocationCalc.chickenAmount,
      laborAmount: customAllocationCalc.laborAmount,
      electricityAmount: customAllocationCalc.electricityAmount,
      waterAmount: customAllocationCalc.waterAmount,
      vitaminAmount: customAllocationCalc.vitaminAmount,
      feedPercentage: settings.feedPercentage,
      chickenPercentage: settings.chickenPercentage,
      laborPercentage: settings.laborPercentage,
      electricityPercentage: settings.electricityPercentage,
      waterPercentage: settings.waterPercentage,
      vitaminPercentage: settings.vitaminPercentage,
      notes,
    });

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F59E0B', '#10B981', '#3B82F6'],
      });
    } catch {
      // ignore
    }
  };

  const columns: Column<ProfitAllocation>[] = [
    {
      header: 'Tanggal',
      accessor: (r) => (
        <div>
          <span className="font-semibold text-neutral-900 block">{formatTanggalSingkat(r.date)}</span>
          <span className="text-[11px] text-neutral-400">{r.notes?.includes('Keuntungan Harian') ? '⚡ Harian Otomatis' : 'Manual'}</span>
        </div>
      ),
    },
    {
      header: 'Keuntungan',
      accessor: (r) => (
        <span className="font-bold text-neutral-900">{formatRupiahCompact(r.profit)}</span>
      ),
      align: 'right',
    },
    {
      header: 'Pakan (63%)',
      accessor: (r) => formatRupiahCompact(r.feedAmount),
      align: 'right',
    },
    {
      header: 'Ayam (20%)',
      accessor: (r) => formatRupiahCompact(r.chickenAmount),
      align: 'right',
    },
    {
      header: 'Upah (12%)',
      accessor: (r) => formatRupiahCompact(r.laborAmount),
      align: 'right',
    },
    {
      header: 'Total Alokasi',
      accessor: (r) => (
        <span className="font-bold text-amber-700">{formatRupiahCompact(r.profit)}</span>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
              Konversi Keuntungan Menjadi Modal
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 rounded-md">
              Fitur Utama
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Otomatisasi pembagian laba bersih harian menjadi pos anggaran operasional dan catatkan langsung ke riwayat modal.
          </p>
        </div>

        <button
          onClick={onNavigateToSettings}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Settings className="w-3.5 h-3.5 text-neutral-500" />
          <span>Atur Persentase Pos</span>
        </button>
      </div>

      {/* 1. KARTU UTAMA: KONVERSI OTOMATIS DARI KEUNTUNGAN HARIAN (Sesuai Permintaan User) */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 rounded-2xl border-2 border-amber-300 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <span>Konversi Otomatis Keuntungan Harian</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-amber-200/70 text-amber-950 rounded-md">
                  Langsung Catat
                </span>
              </h3>
              <p className="text-xs text-neutral-500">
                Periode transaksi harian: <strong>{formatTanggal(todayActiveDateStr)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-600 font-medium cursor-pointer flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-neutral-200 shadow-2xs">
              <input
                type="checkbox"
                checked={autoDailyConversionEnabled}
                onChange={(e) => setAutoDailyConversionEnabled(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Auto-Sync Laba Harian</span>
            </label>
          </div>
        </div>

        {/* 3 Metric Box Hari Ini: Omzet, Pengeluaran, Laba Bersih */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Omzet Penjualan Hari Ini</span>
            </span>
            <p className="text-xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
              {formatRupiah(todaySalesAmount)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-rose-600" />
              <span>Pengeluaran Hari Ini</span>
            </span>
            <p className="text-xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
              {formatRupiah(todayExpensesAmount)}
            </p>
          </div>

          <div className="bg-amber-100/50 p-4 rounded-xl border border-amber-300 shadow-2xs">
            <span className="text-xs text-amber-900 font-bold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
              <span>Keuntungan Bersih Hari Ini</span>
            </span>
            <p className="text-2xl font-black text-amber-950 font-mono tabular-nums mt-1">
              {formatRupiah(todayProfitAmount)}
            </p>
          </div>
        </div>

        {/* Preview Alokasi Modal Otomatis Hari Ini */}
        {todayProfitAmount > 0 ? (
          <div className="bg-white p-5 rounded-xl border border-neutral-200/90 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Preview Distribusi Modal Otomatis dari Laba Hari Ini:
              </span>
              <span className="text-xs font-mono font-bold text-amber-700">
                Total: {formatRupiah(todayProfitAmount)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
              <ProgressBar
                label="Pakan"
                percentage={settings.feedPercentage}
                amountFormatted={formatRupiah(dailyAllocationCalc.feedAmount)}
                color="bg-amber-500"
              />
              <ProgressBar
                label="Pembelian Ayam"
                percentage={settings.chickenPercentage}
                amountFormatted={formatRupiah(dailyAllocationCalc.chickenAmount)}
                color="bg-emerald-600"
              />
              <ProgressBar
                label="Upah Kerja"
                percentage={settings.laborPercentage}
                amountFormatted={formatRupiah(dailyAllocationCalc.laborAmount)}
                color="bg-sky-600"
              />
              <ProgressBar
                label="Listrik"
                percentage={settings.electricityPercentage}
                amountFormatted={formatRupiah(dailyAllocationCalc.electricityAmount)}
                color="bg-indigo-500"
              />
              <ProgressBar
                label="Air"
                percentage={settings.waterPercentage}
                amountFormatted={formatRupiah(dailyAllocationCalc.waterAmount)}
                color="bg-cyan-500"
              />
              <ProgressBar
                label="Vitamin & Vaksin"
                percentage={settings.vitaminPercentage}
                amountFormatted={formatRupiah(dailyAllocationCalc.vitaminAmount)}
                color="bg-rose-500"
              />
            </div>

            {/* Direct Execute Button */}
            <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-neutral-500">
                Klik tombol untuk langsung menghitung dan mencatat pembagian modal hari ini ke dalam riwayat konversi.
              </p>
              <button
                onClick={handleExecuteDailyConversion}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors shrink-0 whitespace-nowrap"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>⚡ Konversi & Catatkan Laba Hari Ini Langsung</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-xl border border-neutral-200 text-xs text-neutral-500 flex items-center justify-between">
            <span>Belum ada keuntungan bersih harian yang dapat dikonversi (Omzet belum melebihi pengeluaran).</span>
            <button
              onClick={() => onNavigate('sales')}
              className="text-amber-700 font-semibold hover:underline"
            >
              Catat Penjualan Hari Ini →
            </button>
          </div>
        )}
      </div>

      {/* 2. KARTU INPUT MANUAL / KUSTOM (Jika ingin mengkonversi nominal kustom) */}
      <details className="bg-white rounded-2xl border border-neutral-200/90 shadow-2xs p-5 transition-all">
        <summary className="text-sm font-bold text-neutral-900 cursor-pointer flex items-center justify-between list-none">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-neutral-500" />
            <span>Konversi Nominal Kustom Manual (Opsional)</span>
          </div>
          <span className="text-xs text-amber-700 font-medium">Buka Form Kustom ↓</span>
        </summary>

        <div className="pt-6 border-t border-neutral-100 mt-4 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex-1 max-w-lg space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Nominal Keuntungan yang Akan Dikonversi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-xl sm:text-2xl font-black text-neutral-400 font-mono">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={profitToConvert > 0 ? profitToConvert.toLocaleString('id-ID') : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setProfitToConvert(raw ? parseInt(raw, 10) : 0);
                  }}
                  className="w-full pl-14 pr-4 py-2.5 text-2xl font-black text-neutral-900 font-mono tabular-nums bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-hidden focus:border-neutral-900"
                  placeholder="10.000.000"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setProfitToConvert(10000000)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Rp 10 Juta
              </button>
              <button
                type="button"
                onClick={() => setProfitToConvert(5000000)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Rp 5 Juta
              </button>
              {monthProfitAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setProfitToConvert(monthProfitAmount)}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200/80 rounded-lg transition-colors"
                >
                  Laba Bulan Ini ({formatRupiahCompact(monthProfitAmount)})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput
              label="Tanggal Konversi"
              value={conversionDate}
              onChange={(e) => setConversionDate(e.target.value)}
            />
            <TextareaInput
              label="Keterangan / Catatan Alokasi"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan periode konversi modal..."
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleConvertAndSaveCustom}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-2xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simpan Konversi Manual</span>
            </button>
          </div>
        </div>
      </details>

      {/* 3. RIWAYAT KONVERSI MODAL (Tercatat langsung di sini) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Riwayat Konversi Modal</h3>
            <p className="text-xs text-neutral-500">
              Histori alokasi modal operasional yang telah dicatat (termasuk konversi otomatis harian)
            </p>
          </div>
          <span className="text-xs text-neutral-500 font-mono tabular-nums">{allocations.length} entri</span>
        </div>

        <DataTable
          columns={columns}
          data={allocations}
          keyExtractor={(r) => r.id}
          emptyMessage="Belum ada riwayat konversi modal."
          actions={(r) => (
            <>
              <button
                onClick={() => setDetailModalRecord(r)}
                className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
                title="Lihat Rincian Lengkap"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTargetId(r.id)}
                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Hapus Riwayat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        />
      </div>

      {/* Modal Detail Konversi Lengkap */}
      {detailModalRecord && (
        <Modal
          isOpen={true}
          onClose={() => setDetailModalRecord(null)}
          title={`Rincian Alokasi Modal - ${formatTanggal(detailModalRecord.date)}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-xl space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                <span className="text-neutral-500">Tanggal Pencatatan:</span>
                <span className="font-semibold text-neutral-900">{formatTanggal(detailModalRecord.date)}</span>
              </div>
              <div className="flex justify-between items-center text-base font-bold text-neutral-900 pb-2 border-b border-neutral-200">
                <span>Keuntungan Dikonversi:</span>
                <span className="font-mono tabular-nums text-amber-700">{formatRupiah(detailModalRecord.profit)}</span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Pakan ({detailModalRecord.feedPercentage}%):</span>
                  <span className="font-mono tabular-nums font-semibold">{formatRupiah(detailModalRecord.feedAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Pembelian Ayam ({detailModalRecord.chickenPercentage}%):</span>
                  <span className="font-mono tabular-nums font-semibold">{formatRupiah(detailModalRecord.chickenAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Upah Kerja ({detailModalRecord.laborPercentage}%):</span>
                  <span className="font-mono tabular-nums font-semibold">{formatRupiah(detailModalRecord.laborAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Listrik ({detailModalRecord.electricityPercentage}%):</span>
                  <span className="font-mono tabular-nums font-semibold">{formatRupiah(detailModalRecord.electricityAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Air ({detailModalRecord.waterPercentage}%):</span>
                  <span className="font-mono tabular-nums font-semibold">{formatRupiah(detailModalRecord.waterAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Vitamin & Vaksin ({detailModalRecord.vitaminPercentage}%):</span>
                  <span className="font-mono tabular-nums font-semibold">{formatRupiah(detailModalRecord.vitaminAmount)}</span>
                </div>
              </div>
            </div>

            {detailModalRecord.notes && (
              <div className="p-3 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-600">
                <span className="font-semibold text-neutral-800 block mb-0.5">Catatan:</span>
                {detailModalRecord.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailModalRecord(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteAllocation(deleteTargetId);
        }}
        title="Hapus Riwayat Konversi"
        message="Apakah Anda yakin ingin menghapus catatan histori konversi modal ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
};
