import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseRecord, ExpenseCategory } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { FormInput, DateInput, SelectInput, CurrencyInput, TextareaInput } from '../common/FormInputs';
import { formatTanggal, formatRupiah, getTodayDateString } from '../../utils/formatters';
import { isWithinDateRange } from '../../utils/calculations';
import { Receipt, Plus, Edit2, Trash2, Eye, Filter } from 'lucide-react';

interface ExpensesPageProps {
  isAddModalOpen?: boolean;
  setIsAddModalOpen?: (open: boolean) => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  isAddModalOpen = false,
  setIsAddModalOpen,
}) => {
  const { expenses, addExpense, updateExpense, deleteExpense } = useApp();

  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExpenseRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<ExpenseRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (isAddModalOpen) {
      handleOpenAdd();
      if (setIsAddModalOpen) setIsAddModalOpen(false);
    }
  }, [isAddModalOpen, setIsAddModalOpen]);

  // Form states
  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    category: 'Pakan' as ExpenseCategory,
    description: '',
    amount: 1500000,
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      date: getTodayDateString(),
      category: 'Pakan',
      description: '',
      amount: 500000,
      notes: '',
    });
    setInternalModalOpen(true);
  };

  const handleOpenEdit = (rec: ExpenseRecord) => {
    setEditingRecord(rec);
    setFormData({
      date: rec.date,
      category: rec.category,
      description: rec.description,
      amount: rec.amount,
      notes: rec.notes || '',
    });
    setInternalModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('Keterangan pengeluaran wajib diisi.');
      return;
    }
    if (formData.amount <= 0) {
      alert('Nominal pengeluaran harus lebih dari Rp 0.');
      return;
    }

    if (editingRecord) {
      updateExpense(editingRecord.id, formData);
    } else {
      addExpense(formData);
    }
    setInternalModalOpen(false);
  };

  // Metrics: Hari ini, Minggu ini, Bulan ini (Sesuai Section 10)
  const totalHariIni = useMemo(() => {
    return expenses
      .filter((e) => isWithinDateRange(e.date, 'today'))
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const totalMingguIni = useMemo(() => {
    return expenses
      .filter((e) => isWithinDateRange(e.date, 'week'))
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const totalBulanIni = useMemo(() => {
    return expenses
      .filter((e) => isWithinDateRange(e.date, 'month'))
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const categoryOptions: { label: string; value: ExpenseCategory }[] = [
    { label: 'Pakan', value: 'Pakan' },
    { label: 'Pembelian Ayam', value: 'Pembelian Ayam' },
    { label: 'Upah', value: 'Upah' },
    { label: 'Listrik', value: 'Listrik' },
    { label: 'Air', value: 'Air' },
    { label: 'Vitamin', value: 'Vitamin' },
    { label: 'Vaksin', value: 'Vaksin' },
    { label: 'Transportasi', value: 'Transportasi' },
    { label: 'Perawatan', value: 'Perawatan' },
    { label: 'Lainnya', value: 'Lainnya' },
  ];

  const filteredExpenses = useMemo(() => {
    if (selectedCategoryFilter === 'all') return expenses;
    return expenses.filter((e) => e.category === selectedCategoryFilter);
  }, [expenses, selectedCategoryFilter]);

  const columns: Column<ExpenseRecord>[] = [
    {
      header: 'Tanggal',
      accessor: (r) => formatTanggal(r.date),
      className: 'font-medium',
    },
    {
      header: 'Kategori',
      accessor: (r) => (
        <span className="font-semibold text-neutral-800 text-xs px-2 py-0.5 rounded bg-neutral-100">
          {r.category}
        </span>
      ),
    },
    {
      header: 'Keterangan',
      accessor: (r) => (
        <div>
          <span className="text-neutral-900 font-medium block">{r.description}</span>
          {r.notes && <span className="text-xs text-neutral-400 block">{r.notes}</span>}
        </div>
      ),
    },
    {
      header: 'Nominal',
      accessor: (r) => (
        <span className="font-bold text-neutral-900 font-mono tabular-nums">
          {formatRupiah(r.amount)}
        </span>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">Pengeluaran Operasional</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Pencatatan biaya pakan, upah, utilitas kandang, dan perawatan ayam petelur.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Pengeluaran</span>
        </button>
      </div>

      {/* 3 Metric Cards: Hari ini, Minggu ini, Bulan ini (Sesuai Section 10) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Pengeluaran Hari Ini</p>
          <p className="text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
            {formatRupiah(totalHariIni)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Biaya harian berjalan</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Pengeluaran Minggu Ini</p>
          <p className="text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
            {formatRupiah(totalMingguIni)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">7 hari terakhir</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Pengeluaran Bulan Ini</p>
          <p className="text-2xl font-bold text-rose-600 font-mono tabular-nums mt-1">
            {formatRupiah(totalBulanIni)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Total biaya bulan berjalan</p>
        </div>
      </div>

      {/* Filter by Category */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        <button
          onClick={() => setSelectedCategoryFilter('all')}
          className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            selectedCategoryFilter === 'all'
              ? 'bg-neutral-900 text-white'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Semua ({expenses.length})
        </button>
        {categoryOptions.map((cat) => {
          const count = expenses.filter((e) => e.category === cat.value).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategoryFilter(cat.value)}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategoryFilter === cat.value
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Expenses Table */}
      <div className="space-y-3">
        <DataTable
          columns={columns}
          data={filteredExpenses}
          keyExtractor={(r) => r.id}
          emptyMessage="Belum ada catatan pengeluaran."
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

      {/* Modal Add / Edit Expense */}
      <Modal
        isOpen={internalModalOpen}
        onClose={() => setInternalModalOpen(false)}
        title={editingRecord ? 'Edit Catatan Pengeluaran' : 'Tambah Pengeluaran Operasional'}
        subtitle="Mencatat pengeluaran yang mempengaruhi kalkulasi keuntungan"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput
              label="Tanggal"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <SelectInput
              label="Kategori Pengeluaran"
              options={categoryOptions}
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as ExpenseCategory })
              }
            />
          </div>

          <FormInput
            label="Keterangan Pengeluaran"
            placeholder="Contoh: Beli konsentrat layer 10 sak"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <CurrencyInput
            label="Nominal (Rp)"
            required
            value={formData.amount}
            onChangeValue={(val) => setFormData({ ...formData, amount: val })}
            helperText="Total biaya yang dikeluarkan"
          />

          <TextareaInput
            label="Catatan Tambahan (Opsional)"
            placeholder="Nomor nota, supplier, nama penerima upah..."
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
              className="px-5 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-2xs"
            >
              {editingRecord ? 'Perbarui Pengeluaran' : 'Simpan Pengeluaran'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Expense */}
      {detailRecord && (
        <Modal
          isOpen={true}
          onClose={() => setDetailRecord(null)}
          title={`Detail Pengeluaran - ${detailRecord.category}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-xl space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Tanggal:</span>
                <span className="font-medium text-neutral-900">{formatTanggal(detailRecord.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Kategori:</span>
                <span className="font-semibold text-neutral-900">{detailRecord.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Keterangan:</span>
                <span className="font-medium text-neutral-900">{detailRecord.description}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base">
                <span className="font-bold text-neutral-900">Nominal:</span>
                <span className="font-black font-mono tabular-nums text-rose-600">
                  {formatRupiah(detailRecord.amount)}
                </span>
              </div>
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
          if (deleteTargetId) deleteExpense(deleteTargetId);
        }}
        title="Hapus Pengeluaran"
        message="Menghapus pengeluaran ini akan mengubah kalkulasi total pengeluaran dan keuntungan. Lanjutkan?"
      />
    </div>
  );
};
