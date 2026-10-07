import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StockMovement } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { formatTanggal, formatTanggalSingkat, formatAngka } from '../../utils/formatters';
import { Boxes, ArrowDownLeft, ArrowUpRight, Search, CheckCircle2 } from 'lucide-react';

export const StockPage: React.FC = () => {
  const { currentStock, stockMovements, farm, harvests, sales } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const totalPanenMasuk = harvests.reduce((acc, h) => acc + h.totalWeight, 0);
  const totalPenjualanKeluar = sales.reduce((acc, s) => acc + s.quantity, 0);

  const filteredMovements = stockMovements.filter((m) =>
    m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.date.includes(searchQuery)
  );

  const columns: Column<StockMovement>[] = [
    {
      header: 'Tanggal',
      accessor: (r) => (
        <div>
          <span className="font-semibold text-neutral-900 block">{formatTanggalSingkat(r.date)}</span>
          <span className="text-[11px] text-neutral-400 hidden sm:block">{formatTanggal(r.date)}</span>
        </div>
      ),
    },
    {
      header: 'Keterangan Mutasi',
      accessor: (r) => (
        <div className="flex items-center gap-2">
          {r.type === 'PANEN' ? (
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3" /> Masuk
            </span>
          ) : (
            <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Keluar
            </span>
          )}
          <span className="text-xs text-neutral-700 font-medium">{r.description}</span>
        </div>
      ),
    },
    {
      header: 'Masuk',
      accessor: (r) => (
        r.inWeight > 0 ? (
          <span className="font-mono tabular-nums text-emerald-600 font-semibold">
            +{formatAngka(r.inWeight)} kg
          </span>
        ) : (
          <span className="text-neutral-300">-</span>
        )
      ),
      align: 'right',
    },
    {
      header: 'Keluar',
      accessor: (r) => (
        r.outWeight > 0 ? (
          <span className="font-mono tabular-nums text-rose-600 font-semibold">
            -{formatAngka(r.outWeight)} kg
          </span>
        ) : (
          <span className="text-neutral-300">-</span>
        )
      ),
      align: 'right',
    },
    {
      header: 'Saldo Stok',
      accessor: (r) => (
        <span className="font-mono tabular-nums font-bold text-neutral-900">
          {formatAngka(r.balance)} kg
        </span>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">Gudang & Stok Telur</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Rumus: Stok Akhir = Stok Awal + Total Panen - Total Penjualan.
        </p>
      </div>

      {/* Hero Stock Card */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-amber-500/10 pointer-events-none blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
              <Boxes className="w-4 h-4" />
              <span>STOK TELUR SAAT INI</span>
            </div>
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tabular-nums tracking-tight text-white">
              {formatAngka(currentStock)} <span className="text-2xl sm:text-3xl font-light text-neutral-400">KG</span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-md leading-relaxed">
              Total fisik telur siap jual di gudang {farm.name}. Otomatis bertambah saat panen dan berkurang saat penjualan.
            </p>
          </div>

          {/* Quick Balance Summary Box */}
          <div className="bg-neutral-800/80 backdrop-blur border border-neutral-700/80 rounded-xl p-4 sm:p-5 min-w-[260px] space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-300 pb-2 border-b border-neutral-700">
              Ringkasan Mutasi Gudang
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Stok Awal</span>
                <span className="font-mono tabular-nums font-bold text-neutral-200">
                  {formatAngka(farm.initialStock)} kg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Total Masuk (Panen)</span>
                <span className="font-mono tabular-nums font-bold text-emerald-400">
                  +{formatAngka(totalPanenMasuk)} kg
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Total Keluar (Jual)</span>
                <span className="font-mono tabular-nums font-bold text-rose-400">
                  -{formatAngka(totalPenjualanKeluar)} kg
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movement Ledger Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Histori Pergerakan Stok</h3>
            <p className="text-xs text-neutral-500">Catatan kronologis setiap panen masuk dan penjualan keluar</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari transaksi / tanggal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredMovements}
          keyExtractor={(r) => r.id}
          emptyMessage="Belum ada riwayat pergerakan stok telur."
        />
      </div>
    </div>
  );
};
