import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { ChartCard } from '../common/ChartCard';
import { formatRupiah, formatAngka, formatTanggal, formatTanggalSingkat, getTodayDateString } from '../../utils/formatters';
import { isWithinDateRange } from '../../utils/calculations';
import { TrendingUp, ShoppingBag, Receipt, ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { NavTab } from '../common/Sidebar';

interface ProfitPageProps {
  onNavigateToConversionWithProfit: (amount: number) => void;
  onNavigate: (tab: NavTab) => void;
}

export const ProfitPage: React.FC<ProfitPageProps> = ({
  onNavigateToConversionWithProfit,
  onNavigate,
}) => {
  const { sales, expenses } = useApp();

  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('2026-10-01');
  const [customEnd, setCustomEnd] = useState(getTodayDateString());

  // Filtered sales and expenses
  const filteredSales = useMemo(() => {
    return sales.filter((s) => isWithinDateRange(s.date, filterType, customStart, customEnd));
  }, [sales, filterType, customStart, customEnd]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isWithinDateRange(e.date, filterType, customStart, customEnd));
  }, [expenses, filterType, customStart, customEnd]);

  const totalOmzet = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.total, 0);
  }, [filteredSales]);

  const totalPengeluaran = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const keuntungan = totalOmzet - totalPengeluaran;
  const marginPersen = totalOmzet > 0 ? Math.round((keuntungan / totalOmzet) * 100) : 0;

  // Group by date for chart
  const chartData = useMemo(() => {
    const datesSet = new Set<string>();
    filteredSales.forEach((s) => datesSet.add(s.date));
    filteredExpenses.forEach((e) => datesSet.add(e.date));

    const sortedDates = Array.from(datesSet).sort();

    return sortedDates.map((date) => {
      const omzetDay = filteredSales
        .filter((s) => s.date === date)
        .reduce((acc, s) => acc + s.total, 0);
      const expenseDay = filteredExpenses
        .filter((e) => e.date === date)
        .reduce((acc, e) => acc + e.amount, 0);
      const profitDay = omzetDay - expenseDay;

      return {
        tanggal: formatTanggalSingkat(date),
        fullDate: date,
        omzet: omzetDay,
        pengeluaran: expenseDay,
        laba: profitDay,
      };
    });
  }, [filteredSales, filteredExpenses]);

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">Kalkulasi Keuntungan</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Omzet penjualan dikurangi total biaya operasional menghasilkan laba bersih usaha telur.
          </p>
        </div>

        {/* Filter Segmented Controls (Sesuai Section 11) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1 bg-neutral-100 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setFilterType('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'today'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setFilterType('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'week'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => setFilterType('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'month'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setFilterType('custom')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filterType === 'custom'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Custom
            </button>
          </div>

          {filterType === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-neutral-200 px-3 py-1 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs text-neutral-700 bg-transparent focus:outline-hidden"
              />
              <span className="text-neutral-400">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs text-neutral-700 bg-transparent focus:outline-hidden"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3 Main Stat Cards (Sesuai Section 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Omzet */}
        <StatCard
          title="Omzet Penjualan"
          value={formatRupiah(totalOmzet)}
          subtitle={`${filteredSales.length} transaksi penjualan`}
          icon={<ShoppingBag className="w-5 h-5 text-emerald-600" />}
          highlight
          accentColor="emerald"
          onClick={() => onNavigate('sales')}
        />

        {/* Total Pengeluaran */}
        <StatCard
          title="Total Pengeluaran"
          value={formatRupiah(totalPengeluaran)}
          subtitle={`${filteredExpenses.length} pos operasional`}
          icon={<Receipt className="w-5 h-5 text-rose-600" />}
          highlight
          accentColor="rose"
          onClick={() => onNavigate('expenses')}
        />

        {/* Keuntungan Bersih */}
        <StatCard
          title="Keuntungan Bersih"
          value={formatRupiah(keuntungan)}
          subtitle={`Margin keuntungan: ${marginPersen}%`}
          icon={<TrendingUp className="w-5 h-5 text-sky-600" />}
          highlight
          accentColor={keuntungan >= 0 ? 'blue' : 'rose'}
        />
      </div>

      {/* CTA Conversion Action Banner (Sesuai Konsep Bisnis) */}
      {keuntungan > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-100">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Siap Dialokasikan Menjadi Modal Operasional</span>
            </div>
            <h3 className="text-lg font-bold">
              Keuntungan Periode Ini: <span className="font-mono tabular-nums">{formatRupiah(keuntungan)}</span>
            </h3>
            <p className="text-xs text-amber-100 max-w-xl">
              Gunakan fitur konversi modal untuk membagi laba ke pos Pakan (63%), Pembelian Ayam (20%), Upah (12%), dll.
            </p>
          </div>

          <button
            onClick={() => onNavigateToConversionWithProfit(keuntungan)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-amber-950 bg-white hover:bg-amber-50 rounded-xl transition-all shadow-sm shrink-0 whitespace-nowrap"
          >
            <span>Konversi Menjadi Modal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Chart: Perbandingan Omzet, Pengeluaran & Keuntungan */}
      <ChartCard
        title="Grafik Perkembangan Keuangan Harian"
        subtitle="Perbandingan omzet penjualan vs pengeluaran operasional"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickFormatter={(val) => `${(val / 1000000).toFixed(1)}jt`}
            />
            <Tooltip
              formatter={(val: any, name: any) => [
                formatRupiah(Number(val) || 0),
                name === 'omzet' ? 'Omzet' : name === 'pengeluaran' ? 'Pengeluaran' : 'Laba',
              ]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px' }}
            />
            <Bar dataKey="omzet" fill="#059669" name="omzet" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pengeluaran" fill="#DC2626" name="pengeluaran" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};
