import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleRecord, PaymentStatus } from '../../types';
import { DataTable, Column } from '../common/DataTable';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { FormInput, DateInput, SelectInput, CurrencyInput, TextareaInput } from '../common/FormInputs';
import { formatTanggal, formatAngka, formatRupiah, getTodayDateString } from '../../utils/formatters';
import { exportToCsv, formatCsvDate, CsvColumn } from '../../utils/csvExport';
import { ShoppingBag, Plus, Edit2, Trash2, Eye, AlertCircle, CheckCircle, Clock, Boxes, AlertTriangle, Download } from 'lucide-react';

interface SalesPageProps {
  isAddModalOpen?: boolean;
  setIsAddModalOpen?: (open: boolean) => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  isAddModalOpen = false,
  setIsAddModalOpen,
}) => {
  const { sales, addSale, updateSale, deleteSale, currentStock } = useApp();

  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SaleRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<SaleRecord | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAddModalOpen) {
      handleOpenAdd();
      if (setIsAddModalOpen) setIsAddModalOpen(false);
    }
  }, [isAddModalOpen, setIsAddModalOpen]);

  // Form states - TANPA nama pelanggan sesuai permintaan user
  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    quantity: 50,
    unitPrice: 28000,
    paymentStatus: 'Lunas' as PaymentStatus,
    notes: '',
  });

  // Hitung stok maksimal yang tersedia untuk transaksi ini
  // Jika sedang edit, stok yang tersedia adalah currentStock + jumlah yang sedang diedit
  const availableStockForSale = useMemo(() => {
    if (editingRecord) {
      return Math.round((currentStock + (editingRecord.quantity || 0)) * 10) / 10;
    }
    return Math.round(currentStock * 10) / 10;
  }, [currentStock, editingRecord]);

  const isExceedingStock = formData.quantity > availableStockForSale;
  const isStockEmpty = availableStockForSale <= 0;
  const isQuantityInvalid = formData.quantity <= 0;

  const autoTotal = Math.round((Number(formData.quantity) || 0) * (Number(formData.unitPrice) || 0));

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormError(null);
    const initialQty = currentStock > 0 ? Math.min(50, currentStock) : 0;
    setFormData({
      date: getTodayDateString(),
      quantity: initialQty,
      unitPrice: 28000,
      paymentStatus: 'Lunas',
      notes: '',
    });
    setInternalModalOpen(true);
  };

  const handleOpenEdit = (rec: SaleRecord) => {
    setEditingRecord(rec);
    setFormError(null);
    setFormData({
      date: rec.date,
      quantity: rec.quantity,
      unitPrice: rec.unitPrice,
      paymentStatus: rec.paymentStatus,
      notes: rec.notes || '',
    });
    setInternalModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.quantity <= 0) {
      setFormError('Jumlah telur yang dijual harus lebih dari 0 kg.');
      return;
    }

    // Validasi ketat: jumlah tidak boleh melebihi stok yang tersedia
    if (formData.quantity > availableStockForSale) {
      setFormError(
        `Jumlah penjualan (${formData.quantity} kg) melebihi total stok yang tersedia (${availableStockForSale} kg).`
      );
      return;
    }

    if (formData.unitPrice <= 0) {
      setFormError('Harga satuan harus lebih dari Rp 0.');
      return;
    }

    const payload = {
      ...formData,
      total: autoTotal,
    };

    if (editingRecord) {
      const res = await updateSale(editingRecord.id, payload);
      if (!res.success) {
        setFormError(res.error || 'Gagal memperbarui penjualan');
        return;
      }
    } else {
      const res = await addSale(payload);
      if (!res.success) {
        setFormError(res.error || 'Gagal mencatat penjualan');
        return;
      }
    }
    setInternalModalOpen(false);
  };

  const totalOmzet = sales.reduce((acc, s) => acc + s.total, 0);
  const totalVolumeTerjual = sales.reduce((acc, s) => acc + s.quantity, 0);

  const paymentStatusOptions = [
    { label: 'Lunas', value: 'Lunas' },
    { label: 'Belum Lunas', value: 'Belum Lunas' },
    { label: 'Sebagian', value: 'Sebagian' },
  ];

  const columns: Column<SaleRecord>[] = [
    {
      header: 'Tanggal',
      accessor: (r) => formatTanggal(r.date),
      className: 'font-medium',
    },
    {
      header: 'ID Transaksi',
      accessor: (r) => (
        <span className="font-mono text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded font-semibold">
          TRX-{r.id.slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Jumlah Terjual',
      accessor: (r) => `${formatAngka(r.quantity)} kg`,
      align: 'right',
    },
    {
      header: 'Harga / kg',
      accessor: (r) => formatRupiah(r.unitPrice),
      align: 'right',
    },
    {
      header: 'Total Penjualan',
      accessor: (r) => (
        <span className="font-bold text-neutral-900">{formatRupiah(r.total)}</span>
      ),
      align: 'right',
    },
    {
      header: 'Status',
      accessor: (r) => {
        if (r.paymentStatus === 'Lunas') {
          return (
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-semibold inline-flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Lunas
            </span>
          );
        }
        if (r.paymentStatus === 'Belum Lunas') {
          return (
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs font-semibold inline-flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Belum Lunas
            </span>
          );
        }
        return (
          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> Sebagian
          </span>
        );
      },
      align: 'center',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">Penjualan Telur</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Pencatatan transaksi penjualan telur. Stok telur otomatis berkurang sesuai kuantitas yang terjual.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Penjualan</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Total Omzet Penjualan</p>
          <p className="text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
            {formatRupiah(totalOmzet)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">{sales.length} transaksi tercatat</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Volume Telur Terjual</p>
          <p className="text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
            {formatAngka(totalVolumeTerjual)} <span className="text-sm font-normal text-neutral-500">kg</span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">Akumulasi pengeluaran stok</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-neutral-200/80 shadow-xs">
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Stok Gudang Siap Jual</p>
          <p className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
            {formatAngka(currentStock)} <span className="text-sm font-normal text-neutral-500">kg</span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">Batas maksimal kuantitas penjualan</p>
        </div>
      </div>

      {/* Sales DataTable */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900">Riwayat Transaksi Penjualan</h3>
          <span className="text-xs text-neutral-500 font-mono tabular-nums">{sales.length} transaksi</span>
        </div>

        <DataTable
          columns={columns}
          data={sales}
          keyExtractor={(r) => r.id}
          emptyMessage="Belum ada transaksi penjualan telur."
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

      {/* Modal Add / Edit Sale */}
      <Modal
        isOpen={internalModalOpen}
        onClose={() => setInternalModalOpen(false)}
        title={editingRecord ? 'Edit Transaksi Penjualan' : 'Tambah Penjualan Telur'}
        subtitle="Mencatat penjualan telur dan mengurangi stok secara otomatis"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Total Stok Saat Ini (Read-only / Tidak bisa diedit) Sesuai Permintaan */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-amber-600" />
                <span>TOTAL STOK SAAT INI</span>
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-200/80 text-amber-950">
                Tidak bisa diedit (Read-only)
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-3xl font-black text-amber-950 font-mono tabular-nums">
                {formatAngka(availableStockForSale)} <span className="text-base font-normal text-amber-800">KG</span>
              </span>
              <span className="text-xs text-amber-800 font-medium">
                Batas maksimal penjualan
              </span>
            </div>
          </div>

          {/* Validasi jika stok habis */}
          {isStockEmpty && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>
                <strong>Stok Telur Habis (0 KG)!</strong> Anda belum dapat melakukan penjualan hingga mencatat panen telur terlebih dahulu.
              </span>
            </div>
          )}

          {/* Validasi jika input kuantitas melebihi stok yang ada */}
          {isExceedingStock && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-lg text-xs flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Jumlah melebihi stok yang tersedia!</p>
                <p className="mt-0.5 text-rose-700">
                  Anda memasukkan <strong>{formData.quantity} kg</strong>, sedangkan stok yang tersedia hanya <strong>{availableStockForSale} kg</strong>. Jumlah telur yang dijual tidak boleh melebihi stoknya.
                </p>
              </div>
            </div>
          )}

          {formError && !isExceedingStock && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Form Fields: Tanggal, Jumlah (kg), Harga Satuan (Rp/kg), Status Pembayaran - TANPA nama pelanggan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput
              label="Tanggal Penjualan"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />

            <SelectInput
              label="Status Pembayaran"
              options={paymentStatusOptions}
              value={formData.paymentStatus}
              onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <FormInput
                label="Jumlah Telur yang Dijual (KG)"
                type="number"
                step="0.1"
                min={0.1}
                max={availableStockForSale}
                required
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                }
                error={isExceedingStock ? `Melebihi stok (${availableStockForSale} kg)` : undefined}
                helperText={`Maksimal: ${availableStockForSale} kg`}
              />
              {availableStockForSale > 0 && !isExceedingStock && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, quantity: availableStockForSale })}
                  className="text-[11px] text-amber-700 hover:text-amber-800 hover:underline font-medium"
                >
                  Gunakan seluruh stok ({availableStockForSale} kg)
                </button>
              )}
            </div>

            <CurrencyInput
              label="Harga Satuan (Rp / kg)"
              required
              value={formData.unitPrice}
              onChangeValue={(val) => setFormData({ ...formData, unitPrice: val })}
              helperText="Harga per kilogram telur"
            />
          </div>

          {/* Automatic Total Banner */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">
                Total Otomatis (Jumlah × Harga)
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {formData.quantity} kg × Rp {formData.unitPrice.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-xl font-black text-emerald-900 font-mono tabular-nums">
              {formatRupiah(autoTotal)}
            </div>
          </div>

          <TextareaInput
            label="Catatan Transaksi (Opsional)"
            placeholder="Informasi pembayaran, pengantaran, dll..."
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
              disabled={isExceedingStock || isStockEmpty || isQuantityInvalid}
              className={`px-5 py-2 text-sm font-semibold rounded-lg shadow-2xs transition-colors ${
                isExceedingStock || isStockEmpty || isQuantityInvalid
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'text-white bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {editingRecord ? 'Perbarui Transaksi' : 'Simpan & Kurangi Stok'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Sale */}
      {detailRecord && (
        <Modal
          isOpen={true}
          onClose={() => setDetailRecord(null)}
          title={`Detail Transaksi Penjualan`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-xl space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">ID Transaksi:</span>
                <span className="font-mono font-semibold text-neutral-900">TRX-{detailRecord.id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tanggal:</span>
                <span className="font-medium text-neutral-900">{formatTanggal(detailRecord.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Jumlah Telur:</span>
                <span className="font-mono tabular-nums font-semibold">{formatAngka(detailRecord.quantity)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Harga Satuan:</span>
                <span className="font-mono tabular-nums">{formatRupiah(detailRecord.unitPrice)} / kg</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base">
                <span className="font-bold text-neutral-900">Total Penjualan:</span>
                <span className="font-black font-mono tabular-nums text-emerald-700">{formatRupiah(detailRecord.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status Pembayaran:</span>
                <span className="font-bold text-neutral-900">{detailRecord.paymentStatus}</span>
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
          if (deleteTargetId) deleteSale(deleteTargetId);
        }}
        title="Hapus Transaksi Penjualan"
        message="Menghapus penjualan ini akan mengembalikan kuantitas telur ke stok gudang. Lanjutkan?"
      />
    </div>
  );
};
