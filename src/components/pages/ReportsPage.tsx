import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  ButtonGroup,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Paper,
  Chip,
  Grid,
  Divider,
  TextField,
  Tooltip,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import EggAltOutlinedIcon from '@mui/icons-material/EggAltOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { useApp } from '../../context/AppContext';
import { formatRupiah, formatAngka, formatTanggal, getTodayDateString } from '../../utils/formatters';
import { isWithinDateRange } from '../../utils/calculations';
import { exportToCsv, formatCsvDate, CsvColumn } from '../../utils/csvExport';

type ReportSubMenu = 'produksi' | 'penjualan' | 'biaya' | 'modal';

export const ReportsPage: React.FC = () => {
  const theme = useTheme();
  const {
    farm,
    harvests,
    sales,
    expenses,
    allocations,
    activeProductiveChickens,
    currentStock,
    totalHarvestWeight,
    totalSoldWeight,
    showToast,
  } = useApp();

  const [activeSubMenu, setActiveSubMenu] = useState<ReportSubMenu>('produksi');
  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('2026-10-01');
  const [customEnd, setCustomEnd] = useState(getTodayDateString());

  // Pagination states for each sub-menu table
  const [pageProduksi, setPageProduksi] = useState(0);
  const [rowsPerPageProduksi, setRowsPerPageProduksi] = useState(10);

  const [pagePenjualan, setPagePenjualan] = useState(0);
  const [rowsPerPagePenjualan, setRowsPerPagePenjualan] = useState(10);

  const [pageBiaya, setPageBiaya] = useState(0);
  const [rowsPerPageBiaya, setRowsPerPageBiaya] = useState(10);

  const [pageModal, setPageModal] = useState(0);
  const [rowsPerPageModal, setRowsPerPageModal] = useState(10);

  // Filter datasets
  const filteredHarvests = useMemo(() => {
    return harvests.filter((h) => isWithinDateRange(h.date, filterType, customStart, customEnd));
  }, [harvests, filterType, customStart, customEnd]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => isWithinDateRange(s.date, filterType, customStart, customEnd));
  }, [sales, filterType, customStart, customEnd]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isWithinDateRange(e.date, filterType, customStart, customEnd));
  }, [expenses, filterType, customStart, customEnd]);

  const filteredAllocations = useMemo(() => {
    return allocations.filter((a) => isWithinDateRange(a.date, filterType, customStart, customEnd));
  }, [allocations, filterType, customStart, customEnd]);

  // Aggregate Metrics
  // Produksi
  const totalPanenKg = filteredHarvests.reduce((acc, h) => acc + (Number(h.totalWeight) || 0), 0);
  const totalRusakKg = filteredHarvests.reduce((acc, h) => acc + (Number(h.brokenWeight) || 0), 0);
  const rataRataPanenKg = filteredHarvests.length > 0 ? totalPanenKg / filteredHarvests.length : 0;

  // Penjualan
  const totalTelurTerjualKg = filteredSales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
  const totalOmzet = filteredSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const totalPenjualanLunas = filteredSales
    .filter((s) => s.paymentStatus === 'Lunas')
    .reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const totalPiutang = totalOmzet - totalPenjualanLunas;

  // Biaya Operasional
  const totalPengeluaran = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // Modal Operasional
  const totalSeluruhAlokasi = filteredAllocations.reduce((acc, a) => acc + (Number(a.profit) || 0), 0);
  const totalAlokasiPakan = filteredAllocations.reduce((acc, a) => acc + (Number(a.feedAmount) || 0), 0);
  const totalAlokasiAyam = filteredAllocations.reduce((acc, a) => acc + (Number(a.chickenAmount) || 0), 0);
  const totalAlokasiUpah = filteredAllocations.reduce((acc, a) => acc + (Number(a.laborAmount) || 0), 0);
  const totalAlokasiListrik = filteredAllocations.reduce((acc, a) => acc + (Number(a.electricityAmount) || 0), 0);
  const totalAlokasiAir = filteredAllocations.reduce((acc, a) => acc + (Number(a.waterAmount) || 0), 0);
  const totalAlokasiVitamin = filteredAllocations.reduce((acc, a) => acc + (Number(a.vitaminAmount) || 0), 0);

  // Label Sub Menu aktif
  const subMenuLabels: Record<ReportSubMenu, string> = {
    produksi: 'Laporan Produksi Telur',
    penjualan: 'Laporan Penjualan Telur',
    biaya: 'Laporan Biaya Operasional',
    modal: 'Laporan Modal Operasional',
  };

  // CSV Export yang sepenuhnya menyesuaikan dengan struktur tabel aktif
  const handleExportCSV = () => {
    const periodeStr =
      filterType === 'today'
        ? formatTanggal(getTodayDateString())
        : filterType === 'month'
        ? 'Bulan Ini (Oktober 2026)'
        : filterType === 'week'
        ? '7 Hari Terakhir'
        : `${formatTanggal(customStart)} s/d ${formatTanggal(customEnd)}`;

    const fileDateSuffix =
      filterType === 'today'
        ? getTodayDateString()
        : filterType === 'custom'
        ? `${customStart}_sampai_${customEnd}`
        : getTodayDateString();

    const baseFilename = `telurku_${activeSubMenu}_${fileDateSuffix}`;

    const metadata: Record<string, string | number> = {
      'Peternakan': farm.name,
      'Pemilik': farm.ownerName,
      'Lokasi': farm.location,
      'Jenis Laporan': subMenuLabels[activeSubMenu],
      'Periode Filter': periodeStr,
      'Tanggal Ekspor': formatTanggal(getTodayDateString()),
    };

    if (activeSubMenu === 'produksi') {
      const columns: CsvColumn<any>[] = [
        { key: 'no', label: 'No', format: (_v, _r, idx) => idx + 1 },
        { key: 'date', label: 'Tanggal Panen', format: (v) => formatCsvDate(v) },
        { key: 'productiveChickens', label: 'Ayam Produktif (Ekor)', format: (v) => Number(v) || 0 },
        { key: 'totalWeight', label: 'Berat Panen (KG)', format: (v) => Number(v) || 0 },
        { key: 'brokenWeight', label: 'Retak / Reject (KG)', format: (v) => Number(v) || 0 },
        {
          key: 'productivity',
          label: 'Produktivitas Harian (%)',
          format: (_v, r) => {
            const prod = r.productiveChickens > 0 ? ((r.totalWeight * 16) / r.productiveChickens) * 100 : 0;
            return `${prod.toFixed(1)}%`;
          },
        },
        { key: 'notes', label: 'Catatan', format: (v) => v || '-' },
      ];

      const summaryRow = {
        no: 'TOTAL',
        date: `${filteredHarvests.length} Hari Panen`,
        productiveChickens: `${activeProductiveChickens} Ekor (Stok Aktif)`,
        totalWeight: totalPanenKg,
        brokenWeight: totalRusakKg,
        productivity: `Rata-rata ${rataRataPanenKg.toFixed(1)} KG/hari`,
        notes: `${filteredHarvests.length} Catatan Panen`,
      };

      exportToCsv({
        filename: baseFilename,
        title: `${farm.name.toUpperCase()} - LAPORAN PRODUKSI TELUR`,
        metadata,
        columns,
        data: filteredHarvests,
        summaryRow,
        onSuccess: (fn, count) => {
          showToast('success', 'Eksport CSV Berhasil', `File ${fn} (${count} baris) berhasil diunduh.`);
        },
        onError: (err) => {
          showToast('error', 'Gagal Ekspor CSV', err);
        },
      });

    } else if (activeSubMenu === 'penjualan') {
      const columns: CsvColumn<any>[] = [
        { key: 'no', label: 'No', format: (_v, _r, idx) => idx + 1 },
        { key: 'date', label: 'Tanggal Penjualan', format: (v) => formatCsvDate(v) },
        { key: 'customer', label: 'Pelanggan / Pembeli', format: (v) => v || 'Umum / Tunai' },
        { key: 'quantity', label: 'Jumlah Telur (KG)', format: (v) => Number(v) || 0 },
        { key: 'unitPrice', label: 'Harga Satuan (Rp)', format: (v) => Number(v) || 0 },
        { key: 'total', label: 'Total Penjualan (Rp)', format: (v) => Number(v) || 0 },
        { key: 'paymentStatus', label: 'Status Pembayaran', format: (v) => v || 'Lunas' },
        { key: 'notes', label: 'Catatan', format: (v) => v || '-' },
      ];

      const summaryRow = {
        no: 'TOTAL',
        date: `${filteredSales.length} Transaksi`,
        customer: '-',
        quantity: totalTelurTerjualKg,
        unitPrice: '-',
        total: totalOmzet,
        paymentStatus: `Lunas: ${totalPenjualanLunas} | Piutang: ${totalPiutang}`,
        notes: `${filteredSales.length} Transaksi Selesai`,
      };

      exportToCsv({
        filename: baseFilename,
        title: `${farm.name.toUpperCase()} - LAPORAN PENJUALAN TELUR`,
        metadata,
        columns,
        data: filteredSales,
        summaryRow,
        onSuccess: (fn, count) => {
          showToast('success', 'Eksport CSV Berhasil', `File ${fn} (${count} transaksi) berhasil diunduh.`);
        },
        onError: (err) => {
          showToast('error', 'Gagal Ekspor CSV', err);
        },
      });

    } else if (activeSubMenu === 'biaya') {
      const columns: CsvColumn<any>[] = [
        { key: 'no', label: 'No', format: (_v, _r, idx) => idx + 1 },
        { key: 'date', label: 'Tanggal Pengeluaran', format: (v) => formatCsvDate(v) },
        { key: 'category', label: 'Kategori Biaya', format: (v) => v || '-' },
        { key: 'description', label: 'Keterangan Pengeluaran', format: (v) => v || '-' },
        { key: 'amount', label: 'Nominal Biaya (Rp)', format: (v) => Number(v) || 0 },
        { key: 'notes', label: 'Catatan', format: (v) => v || '-' },
      ];

      const summaryRow = {
        no: 'TOTAL',
        date: `${filteredExpenses.length} Pos Biaya`,
        category: '-',
        description: 'Total Biaya Operasional',
        amount: totalPengeluaran,
        notes: `${filteredExpenses.length} Transaksi Pengeluaran`,
      };

      exportToCsv({
        filename: baseFilename,
        title: `${farm.name.toUpperCase()} - LAPORAN BIAYA OPERASIONAL`,
        metadata,
        columns,
        data: filteredExpenses,
        summaryRow,
        onSuccess: (fn, count) => {
          showToast('success', 'Eksport CSV Berhasil', `File ${fn} (${count} pos biaya) berhasil diunduh.`);
        },
        onError: (err) => {
          showToast('error', 'Gagal Ekspor CSV', err);
        },
      });

    } else {
      const columns: CsvColumn<any>[] = [
        { key: 'no', label: 'No', format: (_v, _r, idx) => idx + 1 },
        { key: 'date', label: 'Tanggal Alokasi', format: (v) => formatCsvDate(v) },
        { key: 'profit', label: 'Laba Dikonversi (Rp)', format: (v) => Number(v) || 0 },
        { key: 'feedAmount', label: 'Pakan (63%) (Rp)', format: (v) => Number(v) || 0 },
        { key: 'chickenAmount', label: 'Ayam (20%) (Rp)', format: (v) => Number(v) || 0 },
        { key: 'laborAmount', label: 'Upah (12%) (Rp)', format: (v) => Number(v) || 0 },
        { key: 'electricityAmount', label: 'Listrik (0.5%) (Rp)', format: (v) => Number(v) || 0 },
        { key: 'waterAmount', label: 'Air (1.0%) (Rp)', format: (v) => Number(v) || 0 },
        { key: 'vitaminAmount', label: 'Vitamin & Vaksin (3.5%) (Rp)', format: (v) => Number(v) || 0 },
        { key: 'total', label: 'Total Alokasi (Rp)', format: (_v, r) => Number(r.profit) || 0 },
        { key: 'notes', label: 'Catatan', format: (v) => v || '-' },
      ];

      const summaryRow = {
        no: 'TOTAL',
        date: `${filteredAllocations.length} Alokasi`,
        profit: totalSeluruhAlokasi,
        feedAmount: totalAlokasiPakan,
        chickenAmount: totalAlokasiAyam,
        laborAmount: totalAlokasiUpah,
        electricityAmount: totalAlokasiListrik,
        waterAmount: totalAlokasiAir,
        vitaminAmount: totalAlokasiVitamin,
        total: totalSeluruhAlokasi,
        notes: `${filteredAllocations.length} Konversi Modal Selesai`,
      };

      exportToCsv({
        filename: baseFilename,
        title: `${farm.name.toUpperCase()} - LAPORAN MODAL OPERASIONAL`,
        metadata,
        columns,
        data: filteredAllocations,
        summaryRow,
        onSuccess: (fn, count) => {
          showToast('success', 'Eksport CSV Berhasil', `File ${fn} (${count} data alokasi) berhasil diunduh.`);
        },
        onError: (err) => {
          showToast('error', 'Gagal Ekspor CSV', err);
        },
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Header & Actions */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, className: 'no-print' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.text.primary, letterSpacing: '-0.02em' }}>
              Laporan Usaha Peternakan
            </Typography>
            <Chip
              label="Format Tabel Resmi"
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.72rem',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.dark,
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Laporan terbagi dalam 4 sub-menu dengan tabel komprehensif, pagination, dan kalkulasi stok real-time.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={`Eksport tabel ${subMenuLabels[activeSubMenu]} ke format CSV`} arrow>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExportCSV}
              startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
              sx={{ borderColor: theme.palette.divider, color: theme.palette.text.primary, fontWeight: 600 }}
            >
              Export CSV ({activeSubMenu === 'produksi' ? 'Produksi' : activeSubMenu === 'penjualan' ? 'Penjualan' : activeSubMenu === 'biaya' ? 'Biaya' : 'Modal'})
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handlePrint}
            startIcon={<PrintOutlinedIcon fontSize="small" />}
          >
            Cetak Laporan
          </Button>
        </Box>
      </Box>

      {/* Date Filter & Period Control */}
      <Card elevation={0} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, className: 'no-print' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: theme.palette.text.secondary }}>
              Periode:
            </Typography>
            <ButtonGroup size="small" variant="outlined" sx={{ '& .MuiButton-root': { borderColor: theme.palette.divider, fontSize: '0.8rem', fontWeight: 600 } }}>
              <Button
                variant={filterType === 'today' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('today')}
              >
                Hari Ini
              </Button>
              <Button
                variant={filterType === 'week' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('week')}
              >
                Minggu Ini
              </Button>
              <Button
                variant={filterType === 'month' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('month')}
              >
                Bulan Ini
              </Button>
              <Button
                variant={filterType === 'custom' ? 'contained' : 'outlined'}
                onClick={() => setFilterType('custom')}
              >
                Kustom
              </Button>
            </ButtonGroup>
          </Box>

          {filterType === 'custom' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                type="date"
                size="small"
                label="Dari"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 145 }}
              />
              <TextField
                type="date"
                size="small"
                label="Sampai"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 145 }}
              />
            </Box>
          )}

          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            {filterType === 'today'
              ? formatTanggal(getTodayDateString())
              : filterType === 'month'
              ? 'Bulan Berjalan (Oktober 2026)'
              : filterType === 'week'
              ? '7 Hari Terakhir'
              : `${formatTanggal(customStart)} - ${formatTanggal(customEnd)}`}
          </Typography>
        </Box>
      </Card>

      {/* Real-Time Stock Banner */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '12px',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          p: { xs: 2, sm: 2.5 },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: theme.palette.primary.main,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Inventory2OutlinedIcon />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: theme.palette.primary.dark }}>
                  Stok Telur Real-Time Saat Ini
                </Typography>
                <Chip
                  label="Terkalkulasi Otomatis"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    color: theme.palette.primary.dark,
                  }}
                />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.text.primary, my: 0.25 }}>
                {formatAngka(currentStock)} <Typography component="span" variant="h6" sx={{ color: theme.palette.text.secondary }}>KG</Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Rumus: Stok Awal ({formatAngka(farm.initialStock)} kg) + Total Panen ({formatAngka(totalHarvestWeight)} kg) - Total Terjual ({formatAngka(totalSoldWeight)} kg)
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              p: 1.5,
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: `1px solid ${theme.palette.divider}`,
              minWidth: { sm: 260 },
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Total Panen</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                +{formatAngka(totalHarvestWeight)} kg
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">Total Terjual</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                -{formatAngka(totalSoldWeight)} kg
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* 4 SUB MENUS / TABS (Mandatory Request) */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Tabs
          value={activeSubMenu}
          onChange={(_e, val) => setActiveSubMenu(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: '#FFFFFF',
            px: 1,
            '& .MuiTab-root': {
              minHeight: 52,
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              gap: 1,
            },
          }}
        >
          <Tab
            value="produksi"
            icon={<EggAltOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label={`1. Sub Menu Laporan Produksi (${filteredHarvests.length})`}
          />
          <Tab
            value="penjualan"
            icon={<PointOfSaleOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label={`2. Sub Menu Laporan Penjualan (${filteredSales.length})`}
          />
          <Tab
            value="biaya"
            icon={<PaymentsOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label={`3. Sub Menu Biaya Operasional (${filteredExpenses.length})`}
          />
          <Tab
            value="modal"
            icon={<AutorenewOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label={`4. Sub Menu Modal Operasional (${filteredAllocations.length})`}
          />
        </Tabs>

        {/* SUB MENU 1: LAPORAN PRODUKSI */}
        {activeSubMenu === 'produksi' && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Laporan Hasil Produksi Telur
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Data rekapan panen harian, ayam produktif, dan telur reject.
              </Typography>
            </Box>

            {/* Quick KPI Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
              <Card elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">Total Panen Periode Ini</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatAngka(totalPanenKg)} <Typography component="span" variant="body2">KG</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">{filteredHarvests.length} hari panen tercatat</Typography>
              </Card>

              <Card elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">Rata-Rata Panen Harian</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatAngka(Math.round(rataRataPanenKg * 10) / 10)} <Typography component="span" variant="body2">KG / hari</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">Populasi produktif: {formatAngka(activeProductiveChickens)} ekor</Typography>
              </Card>

              <Card elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">Telur Rusak / Reject</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: theme.palette.error.main }}>
                  {formatAngka(totalRusakKg)} <Typography component="span" variant="body2">KG</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {totalPanenKg > 0 ? ((totalRusakKg / totalPanenKg) * 100).toFixed(1) : 0}% rasio kerusakan
                </Typography>
              </Card>
            </Box>

            {/* Tabel Produksi Telur dengan Pagination */}
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '10px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 50, textAlign: 'center' }}>No</TableCell>
                    <TableCell>Tanggal Panen</TableCell>
                    <TableCell align="right">Ayam Produktif</TableCell>
                    <TableCell align="right">Berat Panen (KG)</TableCell>
                    <TableCell align="right">Retak / Reject</TableCell>
                    <TableCell align="right">Produktivitas Harian</TableCell>
                    <TableCell>Catatan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHarvests.length > 0 ? (
                    filteredHarvests
                      .slice(pageProduksi * rowsPerPageProduksi, pageProduksi * rowsPerPageProduksi + rowsPerPageProduksi)
                      .map((h, idx) => {
                        const rowNum = pageProduksi * rowsPerPageProduksi + idx + 1;
                        const prodRatio = h.productiveChickens > 0 ? ((h.totalWeight * 16) / h.productiveChickens) * 100 : 0;
                        return (
                          <TableRow key={h.id} hover>
                            <TableCell sx={{ textAlign: 'center', color: 'text.secondary' }}>{rowNum}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{formatTanggal(h.date)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                              {formatAngka(h.productiveChickens)} ekor
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                              {formatAngka(h.totalWeight)} kg
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', color: (h.brokenWeight || 0) > 0 ? 'error.main' : 'text.secondary' }}>
                              {formatAngka(h.brokenWeight || 0)} kg
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${prodRatio.toFixed(1)}%`}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  backgroundColor: prodRatio >= 80 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                                  color: prodRatio >= 80 ? theme.palette.success.dark : theme.palette.warning.dark,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{h.notes || '-'}</TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        Tidak ada data panen telur pada periode ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Produksi */}
            <TablePagination
              component="div"
              count={filteredHarvests.length}
              page={pageProduksi}
              onPageChange={(_e, newPage) => setPageProduksi(newPage)}
              rowsPerPage={rowsPerPageProduksi}
              onRowsPerPageChange={(e) => {
                setRowsPerPageProduksi(parseInt(e.target.value, 10));
                setPageProduksi(0);
              }}
              labelRowsPerPage="Baris per halaman:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
            />
          </Box>
        )}

        {/* SUB MENU 2: LAPORAN PENJUALAN */}
        {activeSubMenu === 'penjualan' && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Laporan Penjualan Telur
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rincian transaksi omzet penjualan, total telur terjual, harga satuan, dan status pembayaran.
              </Typography>
            </Box>

            {/* KPI Cards Penjualan */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
              <Card elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">Total Omzet Penjualan</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: theme.palette.success.main }}>
                  {formatRupiah(totalOmzet)}
                </Typography>
                <Typography variant="caption" color="text.secondary">{filteredSales.length} transaksi penjualan</Typography>
              </Card>

              <Card elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">Total Telur Terjual</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatAngka(totalTelurTerjualKg)} <Typography component="span" variant="body2">KG</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rata-rata: {totalTelurTerjualKg > 0 ? formatRupiah(Math.round(totalOmzet / totalTelurTerjualKg)) : 'Rp 0'} / kg
                </Typography>
              </Card>

              <Card elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">Status Pembayaran</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                    {formatRupiah(totalPenjualanLunas)}
                  </Typography>
                  <Chip label="Lunas" size="small" color="success" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                </Box>
                {totalPiutang > 0 && (
                  <Typography variant="caption" sx={{ color: theme.palette.warning.main, fontWeight: 600 }}>
                    Belum Lunas: {formatRupiah(totalPiutang)}
                  </Typography>
                )}
              </Card>
            </Box>

            {/* Tabel Penjualan dengan Pagination */}
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '10px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 50, textAlign: 'center' }}>No</TableCell>
                    <TableCell>Tanggal</TableCell>
                    <TableCell align="right">Jumlah (KG)</TableCell>
                    <TableCell align="right">Harga Satuan</TableCell>
                    <TableCell align="right">Total Nilai (Rp)</TableCell>
                    <TableCell align="center">Status Pembayaran</TableCell>
                    <TableCell>Catatan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSales.length > 0 ? (
                    filteredSales
                      .slice(pagePenjualan * rowsPerPagePenjualan, pagePenjualan * rowsPerPagePenjualan + rowsPerPagePenjualan)
                      .map((s, idx) => {
                        const rowNum = pagePenjualan * rowsPerPagePenjualan + idx + 1;
                        return (
                          <TableRow key={s.id} hover>
                            <TableCell sx={{ textAlign: 'center', color: 'text.secondary' }}>{rowNum}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{formatTanggal(s.date)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>
                              {formatAngka(s.quantity)} kg
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                              {formatRupiah(s.unitPrice)} / kg
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 800, color: theme.palette.success.main }}>
                              {formatRupiah(s.total)}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={s.paymentStatus}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  backgroundColor: s.paymentStatus === 'Lunas' ? alpha(theme.palette.success.main, 0.12) : alpha(theme.palette.warning.main, 0.12),
                                  color: s.paymentStatus === 'Lunas' ? theme.palette.success.dark : theme.palette.warning.dark,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{s.notes || '-'}</TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        Tidak ada transaksi penjualan pada periode ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Penjualan */}
            <TablePagination
              component="div"
              count={filteredSales.length}
              page={pagePenjualan}
              onPageChange={(_e, newPage) => setPagePenjualan(newPage)}
              rowsPerPage={rowsPerPagePenjualan}
              onRowsPerPageChange={(e) => {
                setRowsPerPagePenjualan(parseInt(e.target.value, 10));
                setPagePenjualan(0);
              }}
              labelRowsPerPage="Baris per halaman:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
            />
          </Box>
        )}

        {/* SUB MENU 3: BIAYA OPERASIONAL */}
        {activeSubMenu === 'biaya' && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Laporan Biaya Operasional
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rincian pengeluaran operasional per pos: pakan, upah, ayam, listrik, air, vitamin, dsb.
              </Typography>
            </Box>

            {/* Quick Summary Card Biaya */}
            <Card elevation={0} sx={{ p: 2.5, border: `1px solid ${theme.palette.divider}`, mb: 3, backgroundColor: alpha(theme.palette.error.main, 0.02) }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Biaya Operasional</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.error.main }}>
                    {formatRupiah(totalPengeluaran)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{filteredExpenses.length} catatan pengeluaran operasional</Typography>
                </Box>
                <Chip
                  icon={<PaymentsOutlinedIcon sx={{ fontSize: '15px !important' }} />}
                  label="Pengeluaran Terkendali"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Card>

            {/* Tabel Biaya dengan Pagination */}
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '10px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 50, textAlign: 'center' }}>No</TableCell>
                    <TableCell>Tanggal</TableCell>
                    <TableCell>Kategori Pos</TableCell>
                    <TableCell>Keterangan Biaya</TableCell>
                    <TableCell align="right">Nominal (Rp)</TableCell>
                    <TableCell>Catatan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses
                      .slice(pageBiaya * rowsPerPageBiaya, pageBiaya * rowsPerPageBiaya + rowsPerPageBiaya)
                      .map((e, idx) => {
                        const rowNum = pageBiaya * rowsPerPageBiaya + idx + 1;
                        return (
                          <TableRow key={e.id} hover>
                            <TableCell sx={{ textAlign: 'center', color: 'text.secondary' }}>{rowNum}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{formatTanggal(e.date)}</TableCell>
                            <TableCell>
                              <Chip
                                label={e.category}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  backgroundColor: alpha(theme.palette.text.primary, 0.05),
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{e.description}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 800, color: theme.palette.error.main }}>
                              {formatRupiah(e.amount)}
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{e.notes || '-'}</TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        Tidak ada pengeluaran operasional pada periode ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Biaya */}
            <TablePagination
              component="div"
              count={filteredExpenses.length}
              page={pageBiaya}
              onPageChange={(_e, newPage) => setPageBiaya(newPage)}
              rowsPerPage={rowsPerPageBiaya}
              onRowsPerPageChange={(e) => {
                setRowsPerPageBiaya(parseInt(e.target.value, 10));
                setPageBiaya(0);
              }}
              labelRowsPerPage="Baris per halaman:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
            />
          </Box>
        )}

        {/* SUB MENU 4: MODAL OPERASIONAL */}
        {activeSubMenu === 'modal' && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Laporan Modal Operasional (Alokasi Keuntungan)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Riwayat alokasi konversi keuntungan ke modal: Pakan 63%, Ayam 20%, Upah 12%, Listrik 0.5%, Air 1%, Vitamin 3.5%.
              </Typography>
            </Box>

            {/* Breakdown Cards Modal */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
              <Card elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">Total Laba Dikonversi</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5, color: theme.palette.primary.main }}>
                  {formatRupiah(totalSeluruhAlokasi)}
                </Typography>
                <Typography variant="caption" color="text.secondary">{filteredAllocations.length} sesi konversi</Typography>
              </Card>

              <Card elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">Alokasi Pakan (63%)</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatRupiah(totalAlokasiPakan)}
                </Typography>
                <Typography variant="caption" color="text.secondary">Pos biaya terbesar</Typography>
              </Card>

              <Card elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">Pembelian Ayam (20%)</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatRupiah(totalAlokasiAyam)}
                </Typography>
                <Typography variant="caption" color="text.secondary">Regenerasi bibit ayam</Typography>
              </Card>

              <Card elevation={0} sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">Upah Kerja (12%)</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>
                  {formatRupiah(totalAlokasiUpah)}
                </Typography>
                <Typography variant="caption" color="text.secondary">Operasional tenaga kerja</Typography>
              </Card>
            </Box>

            {/* Tabel Modal Operasional dengan Pagination */}
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '10px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 50, textAlign: 'center' }}>No</TableCell>
                    <TableCell>Tanggal</TableCell>
                    <TableCell align="right">Laba Dikonversi</TableCell>
                    <TableCell align="right">Pakan (63%)</TableCell>
                    <TableCell align="right">Ayam (20%)</TableCell>
                    <TableCell align="right">Upah (12%)</TableCell>
                    <TableCell align="right">Listrik (0.5%)</TableCell>
                    <TableCell align="right">Air (1%)</TableCell>
                    <TableCell align="right">Vitamin (3.5%)</TableCell>
                    <TableCell align="right">Total Alokasi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAllocations.length > 0 ? (
                    filteredAllocations
                      .slice(pageModal * rowsPerPageModal, pageModal * rowsPerPageModal + rowsPerPageModal)
                      .map((a, idx) => {
                        const rowNum = pageModal * rowsPerPageModal + idx + 1;
                        return (
                          <TableRow key={a.id} hover>
                            <TableCell sx={{ textAlign: 'center', color: 'text.secondary' }}>{rowNum}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{formatTanggal(a.date)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 800, color: theme.palette.primary.main }}>
                              {formatRupiah(a.profit)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatRupiah(a.feedAmount)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatRupiah(a.chickenAmount)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatRupiah(a.laborAmount)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatRupiah(a.electricityAmount)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatRupiah(a.waterAmount)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace' }}>{formatRupiah(a.vitaminAmount)}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 800 }}>{formatRupiah(a.profit)}</TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        Tidak ada catatan alokasi modal pada periode ini.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Modal */}
            <TablePagination
              component="div"
              count={filteredAllocations.length}
              page={pageModal}
              onPageChange={(_e, newPage) => setPageModal(newPage)}
              rowsPerPage={rowsPerPageModal}
              onRowsPerPageChange={(e) => {
                setRowsPerPageModal(parseInt(e.target.value, 10));
                setPageModal(0);
              }}
              labelRowsPerPage="Baris per halaman:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};
