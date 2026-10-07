import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { HarvestRecord } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { FormInput, DateInput, TextareaInput } from '../common/FormInputs';
import { formatTanggal, formatAngka, getTodayDateString } from '../../utils/formatters';
import { exportToCsv, formatCsvDate, CsvColumn } from '../../utils/csvExport';
import { Egg, Plus, Edit2, Trash2, Eye, TrendingUp, Feather, CheckCircle2, Download } from 'lucide-react';

interface HarvestPageProps {
  isAddModalOpen?: boolean;
  setIsAddModalOpen?: (open: boolean) => void;
}

export const HarvestPage: React.FC<HarvestPageProps> = ({
  isAddModalOpen = false,
  setIsAddModalOpen,
}) => {
  const {
    farm,
    harvests,
    addHarvest,
    updateHarvest,
    deleteHarvest,
    currentStock,
    activeProductiveChickens,
    showToast,
  } = useApp();

  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HarvestRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<HarvestRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleExportCSV = () => {
    const columns: CsvColumn<HarvestRecord>[] = [
      { key: 'no', label: 'No', format: (_v, _r, idx) => idx + 1 },
      { key: 'date', label: 'Tanggal Panen', format: (v) => formatCsvDate(v) },
      { key: 'productiveChickens', label: 'Ayam Produktif (Ekor)', format: (v) => Number(v) || 0 },
      { key: 'totalWeight', label: 'Berat Panen (KG)', format: (v) => Number(v) || 0 },
      { key: 'brokenWeight', label: 'Telur Rusak / Pecah (KG)', format: (v) => Number(v) || 0 },
      { key: 'notes', label: 'Catatan', format: (v) => v || '-' },
    ];

    exportToCsv({
      filename: `telurku_panen_${getTodayDateString()}`,
      title: `${farm.name.toUpperCase()} - RIWAYAT PANEN TELUR`,
      metadata: {
        'Peternakan': farm.name,
        'Pemilik': farm.ownerName,
        'Total Panen': `${totalPanenKg} KG`,
        'Tanggal Unduh': formatTanggal(getTodayDateString()),
      },
      columns,
      data: harvests,
      summaryRow: {
        no: 'TOTAL',
        date: `${harvests.length} Hari Panen`,
        productiveChickens: `${activeProductiveChickens} Ekor`,
        totalWeight: totalPanenKg,
        brokenWeight: totalRusakKg,
        notes: '-',
      },
      onSuccess: (fn, count) => {
        showToast('success', 'Eksport CSV Berhasil', `File ${fn} (${count} baris) berhasil diunduh.`);
      },
      onError: (err) => {
        showToast('error', 'Gagal Ekspor CSV', err);
      },
    });
  };

  // Sync external prop if provided
  useEffect(() => {
    if (isAddModalOpen) {
      handleOpenAdd();
      if (setIsAddModalOpen) setIsAddModalOpen(false);
    }
  }, [isAddModalOpen, setIsAddModalOpen]);

  // Form states - jumlah ayam produktif otomatis sesuai dengan stock ayam aktif!
  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    productiveChickens: activeProductiveChickens,
    totalWeight: 125,
    brokenWeight: 0,
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      date: getTodayDateString(),
      productiveChickens: activeProductiveChickens,
      totalWeight: 120,
      brokenWeight: 0,
      notes: '',
    });
    setInternalModalOpen(true);
  };

  const handleOpenEdit = (rec: HarvestRecord) => {
    setEditingRecord(rec);
    setFormData({
      date: rec.date,
      productiveChickens: rec.productiveChickens,
      totalWeight: rec.totalWeight,
      brokenWeight: rec.brokenWeight || 0,
      notes: rec.notes || '',
    });
    setInternalModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.totalWeight <= 0) {
      alert('Total berat panen telur harus lebih dari 0 kg.');
      return;
    }

    const payload = {
      ...formData,
      productiveChickens: Number(formData.productiveChickens) || activeProductiveChickens,
      totalWeight: Number(formData.totalWeight) || 0,
      brokenWeight: Number(formData.brokenWeight) || 0,
    };

    if (editingRecord) {
      updateHarvest(editingRecord.id, payload);
    } else {
      addHarvest(payload);
    }
    setInternalModalOpen(false);
  };

  // Summary Metrics
  const totalPanenKg = harvests.reduce((acc, h) => acc + h.totalWeight, 0);
  const rataRataPanenKg = harvests.length > 0 ? totalPanenKg / harvests.length : 0;
  const totalRusakKg = harvests.reduce((acc, h) => acc + (h.brokenWeight || 0), 0);

  const columns: Column<HarvestRecord>[] = [
    {
      header: 'Tanggal',
      accessor: (r) => formatTanggal(r.date),
      className: 'font-medium',
    },
    {
      header: 'Ayam Produktif',
      accessor: (r) => `${formatAngka(r.productiveChickens)} ekor`,
      align: 'right',
    },
    {
      header: 'Berat Panen',
      accessor: (r) => (
        <span className="font-bold text-neutral-900">{formatAngka(r.totalWeight)} kg</span>
      ),
      align: 'right',
    },
    {
      header: 'Telur Rusak / Pecah',
      accessor: (r) => (
        r.brokenWeight && r.brokenWeight > 0 ? (
          <span className="text-neutral-500 font-mono tabular-nums">{formatAngka(r.brokenWeight)} kg</span>
        ) : (
          <span className="text-neutral-300">-</span>
        )
      ),
      align: 'right',
    },
    {
      header: 'Catatan',
      accessor: (r) => (
        <span className="text-xs text-neutral-500 truncate max-w-xs block">{r.notes || '-'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">Panen Telur</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Pencatatan hasil panen harian langsung dalam kilogram. Menambah stok telur otomatis.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-neutral-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Panen</span>
          </button>
        </div>
      </div>

      {/* Summary Banner Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Ayam Produktif Aktif</p>
          <p className="text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
            {formatAngka(activeProductiveChickens)} <span className="text-sm font-normal text-neutral-500">ekor</span>
          </p>
          <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sesuai stok ayam aktif</span>
          </p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Total Panen Dicatat</p>
          <p className="text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
            {formatAngka(totalPanenKg)} <span className="text-sm font-normal text-neutral-500">kg</span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">{harvests.length} hari panen</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Rata-Rata Panen Harian</p>
          <p className="text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
            {formatAngka(rataRataPanenKg)} <span className="text-sm font-normal text-neutral-500">kg</span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">Produksi per hari</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Stok Gudang Tersedia</p>
          <p className="text-2xl font-bold text-amber-600 font-mono tabular-nums mt-1">
            {formatAngka(currentStock)} <span className="text-sm font-normal text-neutral-500">kg</span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">Siap untuk dipasarkan</p>
        </div>
      </div>

      {/* Tabel Data Panen */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">Riwayat Panen Telur</h3>
          <span className="text-xs text-neutral-500 font-mono tabular-nums">{harvests.length} entri</span>
        </div>

        <DataTable
          columns={columns}
          data={harvests}
          keyExtractor={(r) => r.id}
          emptyMessage="Belum ada riwayat panen telur."
          actions={(r) => (
            <>
              <button
                onClick={() => setDetailRecord(r)}
                className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
                title="Lihat Detail"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenEdit(r)}
                className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTargetId(r.id)}
                className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        />
      </div>

      {/* Modal Form Tambah / Edit Panen */}
      <Modal
        isOpen={internalModalOpen}
        onClose={() => setInternalModalOpen(false)}
        title={editingRecord ? 'Edit Catatan Panen' : 'Tambah Panen Telur'}
        subtitle="Stok telur otomatis bertambah sesuai berat panen yang disimpan"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <DateInput
            label="Tanggal Panen"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          {/* Jumlah Ayam Produktif disesuaikan dengan stock ayam */}
          <div className="space-y-1">
            <FormInput
              label="Jumlah Ayam Produktif (Ekor)"
              type="number"
              min={1}
              required
              value={formData.productiveChickens}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  productiveChickens: parseInt(e.target.value, 10) || 0,
                })
              }
              helperText={`Otomatis diambil dari pengaturan stok ayam aktif (${activeProductiveChickens} ekor)`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Berat Panen Telur (KG)"
              type="number"
              step="0.1"
              min={0.1}
              required
              value={formData.totalWeight}
              onChange={(e) =>
                setFormData({ ...formData, totalWeight: parseFloat(e.target.value) || 0 })
              }
              helperText="Total berat telur yang dipanen hari ini"
            />
            <FormInput
              label="Telur Retak / Pecah (KG) - Opsional"
              type="number"
              step="0.1"
              min={0}
              value={formData.brokenWeight}
              onChange={(e) =>
                setFormData({ ...formData, brokenWeight: parseFloat(e.target.value) || 0 })
              }
              helperText="Catatan jika ada telur yang rusak"
            />
          </div>

          <TextareaInput
            label="Catatan Panen"
            placeholder="Kondisi telur, jam panen, kebersihan kandang..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setInternalModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs"
            >
              {editingRecord ? 'Perbarui Panen' : 'Simpan & Tambah Stok'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Panen */}
      {detailRecord && (
        <Modal
          isOpen={true}
          onClose={() => setDetailRecord(null)}
          title={`Detail Panen - ${formatTanggal(detailRecord.date)}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-xl space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Tanggal:</span>
                <span className="font-medium text-neutral-900">{formatTanggal(detailRecord.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Ayam Produktif:</span>
                <span className="font-mono tabular-nums">{formatAngka(detailRecord.productiveChickens)} ekor</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base">
                <span className="font-bold text-neutral-900">Berat Panen:</span>
                <span className="font-black font-mono tabular-nums text-neutral-900">{formatAngka(detailRecord.totalWeight)} kg</span>
              </div>
              {detailRecord.brokenWeight && detailRecord.brokenWeight > 0 ? (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Telur Retak/Pecah:</span>
                  <span className="font-mono tabular-nums text-rose-600">{formatAngka(detailRecord.brokenWeight)} kg</span>
                </div>
              ) : null}
            </div>

            {detailRecord.notes && (
              <div className="p-3 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-600">
                <span className="font-semibold text-neutral-800 block mb-0.5">Catatan:</span>
                {detailRecord.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailRecord(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteHarvest(deleteTargetId);
        }}
        title="Hapus Catatan Panen"
        message="Menghapus panen ini akan otomatis mengurangi stok telur di gudang sebesar berat yang dicatat. Lanjutkan?"
      />
    </div>
  );
};
