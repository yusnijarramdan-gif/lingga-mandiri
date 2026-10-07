import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { ProfitAllocation } from '../../types';
import { calculateProfitAllocation } from '../../utils/calculations';
import {
  formatRupiah,
  formatRupiahCompact,
  formatTanggal,
  formatTanggalSingkat,
  getTodayDateString,
} from '../../utils/formatters';
import { exportToCsv, formatCsvDate, CsvColumn } from '../../utils/csvExport';
import { NavTab } from '../navigation/navConfig';

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
  const theme = useTheme();
  const {
    farm,
    settings,
    allocations,
    addAllocation,
    deleteAllocation,
    sales,
    expenses,
    todaySalesAmount,
    todayExpensesAmount,
    todayProfitAmount,
    todayActiveDateStr,
    convertDailyProfitToCapital,
    autoDailyConversionEnabled,
    setAutoDailyConversionEnabled,
    showToast,
  } = useApp();

  // Selected date to convert
  const [selectedDate, setSelectedDate] = useState<string>(todayActiveDateStr || getTodayDateString());

  // Custom conversion state
  const defaultAmount = initialProfit || (todayProfitAmount > 0 ? todayProfitAmount : 5000000);
  const [customProfitInput, setCustomProfitInput] = useState<number>(defaultAmount);
  const [customDate, setCustomDate] = useState<string>(getTodayDateString());
  const [customNotes, setCustomNotes] = useState<string>('Alokasi modal operasional kustom');

  // Modal detail & delete state
  const [detailModalRecord, setDetailModalRecord] = useState<ProfitAllocation | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Calculate selected date sales, expenses, and net profit
  const selectedDateSales = useMemo(() => {
    return sales
      .filter((s) => s.date === selectedDate)
      .reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  }, [sales, selectedDate]);

  const selectedDateExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date === selectedDate)
      .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [expenses, selectedDate]);

  const selectedDateNetProfit = useMemo(() => {
    return Math.max(0, selectedDateSales - selectedDateExpenses);
  }, [selectedDateSales, selectedDateExpenses]);

  // Allocation calculation for selected auto date
  const autoAllocationCalc = useMemo(() => {
    return calculateProfitAllocation(selectedDateNetProfit, settings);
  }, [selectedDateNetProfit, settings]);

  // Allocation calculation for custom amount
  const customAllocationCalc = useMemo(() => {
    return calculateProfitAllocation(customProfitInput, settings);
  }, [customProfitInput, settings]);

  // Execute Auto Conversion for selected date
  const handleExecuteAutoConversion = async () => {
    const res = await convertDailyProfitToCapital(selectedDate);
    if (res.success) {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#3B82F6'],
        });
      } catch {
        // ignore
      }
    }
  };

  // Execute Custom Conversion
  const handleSaveCustomConversion = async () => {
    if (customProfitInput <= 0) {
      showToast('error', 'Nominal Tidak Valid', 'Nominal laba yang akan dikonversi harus lebih dari Rp 0.');
      return;
    }

    await addAllocation({
      date: customDate,
      profit: customProfitInput,
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
      notes: customNotes,
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

  // Export CSV
  const handleExportCSV = () => {
    const columns: CsvColumn<ProfitAllocation>[] = [
      { key: 'no', label: 'No', format: (_v, _r, idx) => idx + 1 },
      { key: 'date', label: 'Tanggal Alokasi', format: (v) => formatCsvDate(v) },
      { key: 'profit', label: 'Keuntungan Bersih (Rp)', format: (v) => Number(v) || 0 },
      { key: 'feedAmount', label: 'Pakan (63%) (Rp)', format: (v) => Number(v) || 0 },
      { key: 'chickenAmount', label: 'Ayam (20%) (Rp)', format: (v) => Number(v) || 0 },
      { key: 'laborAmount', label: 'Upah (12%) (Rp)', format: (v) => Number(v) || 0 },
      { key: 'electricityAmount', label: 'Listrik (0.5%) (Rp)', format: (v) => Number(v) || 0 },
      { key: 'waterAmount', label: 'Air (1.0%) (Rp)', format: (v) => Number(v) || 0 },
      { key: 'vitaminAmount', label: 'Vitamin & Vaksin (3.5%) (Rp)', format: (v) => Number(v) || 0 },
      { key: 'notes', label: 'Catatan', format: (v) => v || '-' },
    ];

    const totalAlokasi = allocations.reduce((acc, a) => acc + a.profit, 0);

    exportToCsv({
      filename: `telurku_konversi_modal_${getTodayDateString()}`,
      title: `${farm.name.toUpperCase()} - RIWAYAT KONVERSI MODAL OPERASIONAL`,
      metadata: {
        'Peternakan': farm.name,
        'Pemilik': farm.ownerName,
        'Total Riwayat Alokasi': formatRupiah(totalAlokasi),
        'Tanggal Ekspor': formatTanggal(getTodayDateString()),
      },
      columns,
      data: allocations,
      summaryRow: {
        no: 'TOTAL',
        date: `${allocations.length} Transaksi`,
        profit: totalAlokasi,
        feedAmount: allocations.reduce((acc, a) => acc + a.feedAmount, 0),
        chickenAmount: allocations.reduce((acc, a) => acc + a.chickenAmount, 0),
        laborAmount: allocations.reduce((acc, a) => acc + a.laborAmount, 0),
        electricityAmount: allocations.reduce((acc, a) => acc + a.electricityAmount, 0),
        waterAmount: allocations.reduce((acc, a) => acc + a.waterAmount, 0),
        vitaminAmount: allocations.reduce((acc, a) => acc + a.vitaminAmount, 0),
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

  const paginatedAllocations = allocations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const allocationBuckets = [
    { label: 'Pakan', pct: settings.feedPercentage, color: '#D97706', amount: autoAllocationCalc.feedAmount, icon: '🌽' },
    { label: 'Pembelian Ayam', pct: settings.chickenPercentage, color: '#0284C7', amount: autoAllocationCalc.chickenAmount, icon: '🐔' },
    { label: 'Upah Tenaga Kerja', pct: settings.laborPercentage, color: '#16A34A', amount: autoAllocationCalc.laborAmount, icon: '💼' },
    { label: 'Listrik', pct: settings.electricityPercentage, color: '#EAB308', amount: autoAllocationCalc.electricityAmount, icon: '⚡' },
    { label: 'Air', pct: settings.waterPercentage, color: '#06B6D4', amount: autoAllocationCalc.waterAmount, icon: '💧' },
    { label: 'Vitamin & Vaksin', pct: settings.vitaminPercentage, color: '#9333EA', amount: autoAllocationCalc.vitaminAmount, icon: '💊' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.text.primary, letterSpacing: '-0.02em' }}>
              Konversi Keuntungan Menjadi Modal
            </Typography>
            <Chip label="Auto Engine" color="primary" size="small" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Otomatisasi pembagian laba bersih harian menjadi pos anggaran operasional dan catat langsung ke database Supabase.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          onClick={onNavigateToSettings}
          startIcon={<SettingsOutlinedIcon />}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
        >
          Atur Persentase Pos
        </Button>
      </Box>

      {/* 1. KARTU UTAMA: AUTO CONVERSION ENGINE */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
          backgroundColor: '#FFFFFF',
          p: { xs: 2.5, sm: 3.5 },
          boxShadow: '0 2px 10px -2px rgba(217, 119, 6, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                backgroundColor: theme.palette.primary.main,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <FlashOnIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Konversi Otomatis Laba Harian
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pilih tanggal transaksi untuk menghitung dan mengalokasikan laba secara otomatis
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              type="date"
              size="small"
              label="Tanggal Transaksi"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 160 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={autoDailyConversionEnabled}
                  onChange={(e) => {
                    setAutoDailyConversionEnabled(e.target.checked);
                    showToast(
                      'info',
                      e.target.checked ? 'Auto-Sync Diaktifkan' : 'Auto-Sync Dinonaktifkan',
                      'Sinkronisasi laba harian otomatis berjalan.'
                    );
                  }}
                  color="primary"
                />
              }
              label={
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  Auto-Sync
                </Typography>
              }
            />
          </Box>
        </Box>

        {/* 3 Metric Cards for Selected Date */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.success.main, 0.04),
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <PointOfSaleOutlinedIcon color="success" fontSize="small" />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Omzet Penjualan
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                {formatRupiah(selectedDateSales)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTanggal(selectedDate)}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.error.main, 0.04),
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <PaymentsOutlinedIcon color="error" fontSize="small" />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Total Pengeluaran Biaya
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                {formatRupiah(selectedDateExpenses)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTanggal(selectedDate)}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.06),
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <TrendingUpOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="caption" color="primary.dark" sx={{ fontWeight: 700 }}>
                  Laba Bersih Siap Dikonversi
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                {formatRupiah(selectedDateNetProfit)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedDateNetProfit > 0 ? 'Siap dialokasikan ke 6 pos' : 'Tidak ada laba bersih'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Breakdown 6 Allocation Buckets */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Rincian Pembagian Pos Modal ({formatTanggal(selectedDate)}):
          </Typography>

          <Grid container spacing={1.5}>
            {allocationBuckets.map((bucket, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: '10px',
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>{bucket.icon}</span>
                      <span>{bucket.label}</span>
                    </Typography>
                    <Chip label={`${bucket.pct}%`} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: bucket.color }}>
                    {formatRupiah(bucket.amount)}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Action Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" color="text.secondary">
            *Konversi akan langsung mencatat 6 pos modal ke database Supabase dan mengurangi saldo keuntungan.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size="large"
            disabled={selectedDateNetProfit <= 0}
            onClick={handleExecuteAutoConversion}
            startIcon={<AutorenewOutlinedIcon />}
            sx={{ fontWeight: 700, px: 3.5, py: 1.25 }}
          >
            Konversi Laba Tanggal Ini ({formatRupiah(selectedDateNetProfit)})
          </Button>
        </Box>
      </Card>

      {/* 2. KARTU KONVERSI KUSTOM / SIMULASI */}
      <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, p: { xs: 2.5, sm: 3 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
          Simulasi & Konversi Modal Kustom
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Gunakan simulasi ini untuk mengonversi modal dengan nominal keuntungan kustom di luar transaksi harian.
        </Typography>

        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Nominal Keuntungan (Rp)"
              type="number"
              size="small"
              value={customProfitInput}
              onChange={(e) => setCustomProfitInput(Math.max(0, Number(e.target.value) || 0))}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              type="date"
              label="Tanggal Konversi"
              size="small"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Catatan Alokasi"
              size="small"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSaveCustomConversion}
            startIcon={<CalculateOutlinedIcon />}
            sx={{ fontWeight: 700 }}
          >
            Simpan Konversi Kustom ({formatRupiah(customProfitInput)})
          </Button>
        </Box>
      </Card>

      {/* 3. TABEL RIWAYAT KONVERSI MODAL */}
      <Card elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Riwayat Konversi Modal ({allocations.length} Transaksi)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Daftar seluruh alokasi modal operasional yang tersimpan di Supabase
            </Typography>
          </Box>

          <Button
            variant="outlined"
            size="small"
            onClick={handleExportCSV}
            startIcon={<FileDownloadOutlinedIcon />}
          >
            Export CSV
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TableCell>Tanggal</TableCell>
                <TableCell align="right">Laba Dikonversi</TableCell>
                <TableCell align="right">Pakan (63%)</TableCell>
                <TableCell align="right">Ayam (20%)</TableCell>
                <TableCell align="right">Upah (12%)</TableCell>
                <TableCell align="right">Listrik / Air / Vit</TableCell>
                <TableCell align="center">Aksi</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedAllocations.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatTanggal(row.date)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.notes || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                      {formatRupiah(row.profit)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatRupiah(row.feedAmount)}</TableCell>
                  <TableCell align="right">{formatRupiah(row.chickenAmount)}</TableCell>
                  <TableCell align="right">{formatRupiah(row.laborAmount)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                      Listrik: {formatRupiah(row.electricityAmount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Air: {formatRupiah(row.waterAmount)} | Vit: {formatRupiah(row.vitaminAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Detail Rincian" arrow>
                      <IconButton size="small" onClick={() => setDetailModalRecord(row)}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Hapus Alokasi" arrow>
                      <IconButton size="small" color="error" onClick={() => setDeleteTargetId(row.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {allocations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      Belum ada riwayat konversi modal. Klik tombol konversi di atas untuk memulai.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {allocations.length > 0 && (
          <TablePagination
            component="div"
            count={allocations.length}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Baris:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
            rowsPerPageOptions={[5, 10, 25]}
          />
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={Boolean(detailModalRecord)}
        onClose={() => setDetailModalRecord(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Rincian Konversi Modal
        </DialogTitle>
        <DialogContent>
          {detailModalRecord && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.06), borderRadius: '10px' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Total Laba Bersih Dikonversi</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                  {formatRupiah(detailModalRecord.profit)}
                </Typography>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Tanggal: <strong>{formatTanggal(detailModalRecord.date)}</strong> | Catatan: <strong>{detailModalRecord.notes || '-'}</strong>
              </Typography>

              <Divider />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">🌽 Pakan (63%)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatRupiah(detailModalRecord.feedAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">🐔 Pembelian Ayam (20%)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatRupiah(detailModalRecord.chickenAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">💼 Upah Tenaga Kerja (12%)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatRupiah(detailModalRecord.laborAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">⚡ Listrik (0.5%)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatRupiah(detailModalRecord.electricityAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">💧 Air (1.0%)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatRupiah(detailModalRecord.waterAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">💊 Vitamin & Vaksin (3.5%)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatRupiah(detailModalRecord.vitaminAmount)}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setDetailModalRecord(null)}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        slotProps={{ paper: { sx: { borderRadius: '12px' } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Hapus Riwayat Konversi?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Apakah Anda yakin ingin menghapus data konversi modal ini dari database?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTargetId(null)}>Batal</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (deleteTargetId) {
                await deleteAllocation(deleteTargetId);
                setDeleteTargetId(null);
              }
            }}
          >
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
