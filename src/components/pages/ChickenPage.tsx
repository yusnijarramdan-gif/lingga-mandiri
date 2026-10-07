import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChickenRecord } from '../../types';
import { StatCard } from '../common/StatCard';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { FormInput, DateInput, TextareaInput } from '../common/FormInputs';
import { formatTanggal, formatAngka, getTodayDateString } from '../../utils/formatters';
import { Feather, Plus, Edit2, Trash2, ShieldCheck, Skull, ArrowDownRight } from 'lucide-react';

export const ChickenPage: React.FC = () => {
  const { chickens, addChicken, updateChicken, deleteChicken } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ChickenRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    quantity: 1000,
    productiveQuantity: 920,
    deadQuantity: 0,
    culledQuantity: 0,
    incomingQuantity: 0,
    notes: '',
  });

  const latestRecord = chickens[0];
  const totalAyam = latestRecord ? latestRecord.quantity : 0;
  const ayamProduktif = latestRecord ? latestRecord.productiveQuantity : 0;
  const totalAyamMati = chickens.reduce((acc, c) => acc + (c.deadQuantity || 0), 0);
  const totalAyamAfkir = chickens.reduce((acc, c) => acc + (c.culledQuantity || 0), 0);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      date: getTodayDateString(),
      quantity: latestRecord ? latestRecord.quantity : 1000,
      productiveQuantity: latestRecord ? latestRecord.productiveQuantity : 920,
      deadQuantity: 0,
      culledQuantity: 0,
      incomingQuantity: 0,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: ChickenRecord) => {
    setEditingRecord(rec);
    setFormData({
      date: rec.date,
      quantity: rec.quantity,
      productiveQuantity: rec.productiveQuantity,
      deadQuantity: rec.deadQuantity,
      culledQuantity: rec.culledQuantity,
      incomingQuantity: rec.incomingQuantity,
      notes: rec.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      updateChicken(editingRecord.id, formData);
    } else {
      addChicken(formData);
    }
    setIsModalOpen(false);
  };

  const columns: Column<ChickenRecord>[] = [
    {
      header: 'Tanggal',
      accessor: (r) => formatTanggal(r.date),
      className: 'font-medium',
    },
    {
      header: 'Total Populasi',
      accessor: (r) => `${formatAngka(r.quantity)} ekor`,
      align: 'right',
    },
    {
      header: 'Produktif',
      accessor: (r) => `${formatAngka(r.productiveQuantity)} ekor`,
      align: 'right',
    },
    {
      header: 'Ayam Mati',
      accessor: (r) => (r.deadQuantity > 0 ? `${r.deadQuantity} ekor` : '-'),
      align: 'right',
    },
    {
      header: 'Ayam Afkir',
      accessor: (r) => (r.culledQuantity > 0 ? `${r.culledQuantity} ekor` : '-'),
      align: 'right',
    },
    {
      header: 'Ayam Masuk',
      accessor: (r) => (r.incomingQuantity > 0 ? `+${r.incomingQuantity}` : '-'),
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
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">Data Populasi Ayam</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Pantau jumlah ayam petelur aktif, persentase produktif, mortalitas, dan mutasi afkir.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Ayam</span>
        </button>
      </div>

      {/* Mini Dashboard 4 Cards (Sesuai Section 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Ayam"
          value={`${formatAngka(totalAyam)} Ekor`}
          subtitle="Populasi kandang saat ini"
          icon={<Feather className="w-5 h-5 text-neutral-700" />}
          highlight
          accentColor="neutral"
        />
        <StatCard
          title="Ayam Produktif"
          value={`${formatAngka(ayamProduktif)} Ekor`}
          subtitle={
            totalAyam > 0
              ? `${Math.round((ayamProduktif / totalAyam) * 100)}% dari total ayam`
              : 'Aktif bertelur'
          }
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          highlight
          accentColor="emerald"
        />
        <StatCard
          title="Ayam Mati (Kumulatif)"
          value={`${formatAngka(totalAyamMati)} Ekor`}
          subtitle="Tercatat dalam riwayat"
          icon={<Skull className="w-5 h-5 text-rose-600" />}
          highlight
          accentColor="rose"
        />
        <StatCard
          title="Ayam Afkir"
          value={`${formatAngka(totalAyamAfkir)} Ekor`}
          subtitle="Penurunan produksi / sortir"
          icon={<ArrowDownRight className="w-5 h-5 text-amber-600" />}
          highlight
          accentColor="amber"
        />
      </div>

      {/* Tabel Data Ayam */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">Riwayat Mutasi Populasi</h3>
          <span className="text-xs text-neutral-500 font-mono tabular-nums">{chickens.length} catatan</span>
        </div>

        <DataTable
          columns={columns}
          data={chickens}
          keyExtractor={(r) => r.id}
          emptyMessage="Belum ada catatan mutasi ayam."
          actions={(r) => (
            <>
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

      {/* Modal Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Edit Catatan Populasi Ayam' : 'Tambah Catatan Populasi Ayam'}
        subtitle="Perbarui data jumlah ayam kandang dan status produktivitas harian"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <DateInput
            label="Tanggal"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Total Jumlah Ayam"
              type="number"
              min={0}
              required
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })
              }
              helperText="Ekor ayam total di kandang"
            />
            <FormInput
              label="Ayam Produktif (Bertelur)"
              type="number"
              min={0}
              required
              value={formData.productiveQuantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  productiveQuantity: parseInt(e.target.value, 10) || 0,
                })
              }
              helperText="Jumlah ayam yang aktif produksi"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormInput
              label="Ayam Mati (Ekor)"
              type="number"
              min={0}
              value={formData.deadQuantity}
              onChange={(e) =>
                setFormData({ ...formData, deadQuantity: parseInt(e.target.value, 10) || 0 })
              }
            />
            <FormInput
              label="Ayam Afkir (Ekor)"
              type="number"
              min={0}
              value={formData.culledQuantity}
              onChange={(e) =>
                setFormData({ ...formData, culledQuantity: parseInt(e.target.value, 10) || 0 })
              }
            />
            <FormInput
              label="Ayam Masuk / Baru (Ekor)"
              type="number"
              min={0}
              value={formData.incomingQuantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  incomingQuantity: parseInt(e.target.value, 10) || 0,
                })
              }
            />
          </div>

          <TextareaInput
            label="Catatan Tambahan"
            placeholder="Kondisi pakan, cuaca kandang, suhu, dll."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-2xs"
            >
              {editingRecord ? 'Simpan Perubahan' : 'Simpan Catatan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteChicken(deleteTargetId);
        }}
        title="Hapus Catatan Ayam"
        message="Apakah Anda yakin ingin menghapus catatan populasi ayam ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
};
