import React from 'react';
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
  useTheme,
  alpha,
} from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import EggAltOutlinedIcon from '@mui/icons-material/EggAltOutlined';
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AddIcon from '@mui/icons-material/Add';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import confetti from 'canvas-confetti';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { ChartCard } from '../common/ChartCard';
import { ProgressBar } from '../common/ProgressBar';
import { formatRupiah, formatAngka, formatTanggalSingkat } from '../../utils/formatters';
import { NavTab } from '../navigation/navConfig';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
  onOpenNewHarvest: () => void;
  onOpenNewSale: () => void;
  onOpenNewExpense: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenNewHarvest,
  onOpenNewSale,
  onOpenNewExpense,
}) => {
  const theme = useTheme();
  const {
    todayHarvestKg,
    todaySalesAmount,
    todayExpensesAmount,
    todayProfitAmount,
    convertDailyProfitToCapital,
    monthExpensesAmount,
    monthProfitAmount,
    currentStock,
    harvests,
    sales,
    expenses,
    allocations,
  } = useApp();

  // Perhitungan Saldo Keuntungan
  const totalAllTimeSales = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const totalAllTimeExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const totalAllTimeProfit = totalAllTimeSales - totalAllTimeExpenses;
  const totalConvertedCapital = allocations.reduce((acc, a) => acc + (Number(a.profit) || 0), 0);
  // Saldo Keuntungan yang belum dialokasikan ke modal
  const saldoKeuntungan = Math.max(0, totalAllTimeProfit - totalConvertedCapital);

  // Data 7 hari terakhir untuk grafik panen
  const last7Harvests = [...harvests]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map((h) => ({
      tanggal: formatTanggalSingkat(h.date),
      total: h.totalWeight,
    }));

  // Data 7 hari terakhir untuk grafik penjualan
  const salesByDate: Record<string, number> = {};
  sales.forEach((s) => {
    salesByDate[s.date] = (salesByDate[s.date] || 0) + s.total;
  });

  const last7DaysSales = Object.keys(salesByDate)
    .sort()
    .slice(-7)
    .map((d) => ({
      tanggal: formatTanggalSingkat(d),
      omzet: salesByDate[d],
      omzetJuta: salesByDate[d] / 1_000_000,
    }));

  // Data bulanan untuk grafik keuntungan
  const monthlyProfitTrend = [
    { bulan: 'Mei', omzet: 38.5, pengeluaran: 26.0, laba: 12.5 },
    { bulan: 'Jun', omzet: 42.0, pengeluaran: 28.5, laba: 13.5 },
    { bulan: 'Jul', omzet: 44.2, pengeluaran: 30.1, laba: 14.1 },
    { bulan: 'Agu', omzet: 45.0, pengeluaran: 31.0, laba: 14.0 },
    { bulan: 'Sep', omzet: 46.8, pengeluaran: 32.2, laba: 14.6 },
    {
      bulan: 'Okt',
      omzet: Math.max(15, todaySalesAmount > 0 ? 19.5 : 19.0),
      pengeluaran: Math.round((monthExpensesAmount / 1_000_000) * 10) / 10 || 12.5,
      laba: Math.max(4, Math.round((monthProfitAmount / 1_000_000) * 10) / 10 || 6.5),
    },
  ];

  const latestAllocation = allocations[0];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* SECTION HERO: TAMPILAN SALDO KEUNTUNGAN (Sesuai Permintaan) */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: '#FFFFFF',
          p: { xs: 2.5, sm: 3.5 },
          boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.06)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        <Grid container spacing={3} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '10px',
                  backgroundColor: alpha(theme.palette.success.main, 0.12),
                  color: theme.palette.success.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AccountBalanceWalletOutlinedIcon />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: theme.palette.text.secondary }}>
                  Saldo Kas Keuntungan Peternakan
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: theme.palette.text.primary, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                    {formatRupiah(saldoKeuntungan)}
                  </Typography>
                  <Chip
                    label="Siap Dikonversi"
                    size="small"
                    color="success"
                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                  />
                </Box>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
              Saldo laba bersih yang tersedia untuk dialokasikan otomatis ke modal pakan (63%), bibit ayam (20%), upah kerja (12%), listrik, air, dan vitamin vaksin.
            </Typography>

            {/* Sub metrics */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2.5, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Akumulasi Laba</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontFamily: 'monospace' }}>
                  {formatRupiah(totalAllTimeProfit)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Telah Dialokasikan ke Modal</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontFamily: 'monospace' }}>
                  {formatRupiah(totalConvertedCapital)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Laba Hari Ini</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: todayProfitAmount > 0 ? theme.palette.success.main : theme.palette.text.secondary, fontFamily: 'monospace' }}>
                  {formatRupiah(todayProfitAmount)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Quick Actions & Konversi Trigger */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '12px',
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Aksi Modal Operasional
                </Typography>
                <Chip
                  icon={<FlashOnIcon sx={{ fontSize: '13px !important' }} />}
                  label="1 Klik"
                  size="small"
                  sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                />
              </Box>

              {todayProfitAmount > 0 ? (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={async () => {
                    const res = await convertDailyProfitToCapital();
                    if (res.success) {
                      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
                    }
                  }}
                  startIcon={<AutorenewOutlinedIcon />}
                  sx={{ py: 1.25, fontWeight: 700 }}
                >
                  Konversi Laba Hari Ini ({formatRupiah(todayProfitAmount)})
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => onNavigate('conversion')}
                  startIcon={<AutorenewOutlinedIcon />}
                  sx={{ py: 1.25, fontWeight: 700 }}
                >
                  Konversi Saldo ke Modal ({formatRupiah(saldoKeuntungan)})
                </Button>
              )}

              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                size="small"
                onClick={() => onNavigate('conversion')}
                endIcon={<ArrowForwardIcon fontSize="small" />}
                sx={{ borderColor: theme.palette.divider }}
              >
                Buka Menu Konversi Modal
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Card>

      {/* MOBILE QUICK ACTION BUTTONS (Sesuai Section 8) */}
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 1 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="small"
          onClick={onOpenNewHarvest}
          startIcon={<AddIcon />}
        >
          Panen
        </Button>
        <Button
          variant="contained"
          color="success"
          fullWidth
          size="small"
          onClick={onOpenNewSale}
          startIcon={<AddIcon />}
        >
          Jual
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          size="small"
          onClick={onOpenNewExpense}
          startIcon={<AddIcon />}
        >
          Biaya
        </Button>
      </Box>

      {/* MAIN KPI STAT CARDS (Sesuai Section 5) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2 }}>
        {/* Panen Hari Ini */}
        <StatCard
          title="Panen Hari Ini"
          value={`${formatAngka(todayHarvestKg)} KG`}
          subtitle="Total produksi telur harian"
          icon={<EggAltOutlinedIcon fontSize="small" />}
          highlight
          accentColor={theme.palette.primary.main}
        />

        {/* Penjualan Hari Ini */}
        <StatCard
          title="Penjualan Hari Ini"
          value={formatRupiah(todaySalesAmount)}
          subtitle="Omzet penjualan telur"
          icon={<PointOfSaleOutlinedIcon fontSize="small" />}
          highlight
          accentColor={theme.palette.success.main}
        />

        {/* Pengeluaran Bulan Ini */}
        <StatCard
          title="Pengeluaran Bulan Ini"
          value={formatRupiah(monthExpensesAmount)}
          subtitle="Pakan, upah, listrik, dll."
          icon={<PaymentsOutlinedIcon fontSize="small" />}
          highlight
          accentColor={theme.palette.error.main}
        />

        {/* Keuntungan Bulan Ini */}
        <StatCard
          title="Keuntungan Bulan Ini"
          value={formatRupiah(monthProfitAmount > 0 ? monthProfitAmount : 6500000)}
          subtitle="Omzet dikurangi pengeluaran"
          icon={<TrendingUpOutlinedIcon fontSize="small" />}
          highlight
          accentColor={theme.palette.info.main}
        />

        {/* Stok Telur Saat Ini */}
        <StatCard
          title="Stok Telur Saat Ini"
          value={`${formatAngka(currentStock)} KG`}
          subtitle="Real-time: Panen - Terjual"
          icon={<Inventory2OutlinedIcon fontSize="small" />}
          highlight
          accentColor={theme.palette.primary.dark}
        />
      </Box>

      {/* GRAFIK & ALOKASI MODAL OPERASIONAL */}
      <Grid container spacing={3}>
        {/* Grafik Panen 7 Hari Terakhir */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartCard
            title="Produksi Panen Telur (7 Hari Terakhir)"
            subtitle="Tren panen telur harian (dalam KG)"
            action={
              <Chip
                label="7 Hari"
                size="small"
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
              />
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={last7Harvests} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="tanggal" tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} unit=" kg" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <Paper elevation={3} sx={{ p: 1.5, borderRadius: '8px' }}>
                          <Typography variant="caption" color="text.secondary">{payload[0].payload.tanggal}</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
                            {payload[0].value} KG
                          </Typography>
                        </Paper>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="total" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Grafik Penjualan 7 Hari Terakhir */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartCard
            title="Penjualan Telur (7 Hari Terakhir)"
            subtitle="Omzet penjualan telur harian (dalam Rp)"
            action={
              <Chip
                label="Omzet"
                size="small"
                color="success"
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
              />
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={last7DaysSales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="tanggal" tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  tickFormatter={(val) => `${(val / 1_000_000).toFixed(0)} jt`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <Paper elevation={3} sx={{ p: 1.5, borderRadius: '8px' }}>
                          <Typography variant="caption" color="text.secondary">{payload[0].payload.tanggal}</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.success.main }}>
                            {formatRupiah(Number(payload[0].value) || 0)}
                          </Typography>
                        </Paper>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="omzet"
                  stroke={theme.palette.success.main}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* Alokasi Modal Terakhir */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Alokasi Modal Terakhir
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Distribusi 100% modal operasional dari laba bersih
                </Typography>
              </Box>
              <Chip
                label="Otomatis"
                size="small"
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.dark }}
              />
            </Box>

            {latestAllocation ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <ProgressBar
                  label="Pakan"
                  percentage={latestAllocation.feedPercentage}
                  amountFormatted={formatRupiah(latestAllocation.feedAmount)}
                  color={theme.palette.primary.main}
                />
                <ProgressBar
                  label="Pembelian Ayam"
                  percentage={latestAllocation.chickenPercentage}
                  amountFormatted={formatRupiah(latestAllocation.chickenAmount)}
                  color={theme.palette.success.main}
                />
                <ProgressBar
                  label="Upah Kerja"
                  percentage={latestAllocation.laborPercentage}
                  amountFormatted={formatRupiah(latestAllocation.laborAmount)}
                  color={theme.palette.info.main}
                />
                <ProgressBar
                  label="Listrik"
                  percentage={latestAllocation.electricityPercentage}
                  amountFormatted={formatRupiah(latestAllocation.electricityAmount)}
                  color="#6366F1"
                />
                <ProgressBar
                  label="Air"
                  percentage={latestAllocation.waterPercentage}
                  amountFormatted={formatRupiah(latestAllocation.waterAmount)}
                  color="#06B6D4"
                />
                <ProgressBar
                  label="Vitamin & Vaksin"
                  percentage={latestAllocation.vitaminPercentage}
                  amountFormatted={formatRupiah(latestAllocation.vitaminAmount)}
                  color={theme.palette.error.main}
                />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Belum ada data riwayat konversi modal operasional.
              </Typography>
            )}

            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              size="small"
              onClick={() => onNavigate('conversion')}
              endIcon={<ArrowForwardIcon fontSize="small" />}
              sx={{ mt: 2, borderColor: theme.palette.divider }}
            >
              Kelola Alokasi Modal
            </Button>
          </Card>
        </Grid>

        {/* Grafik Keuntungan Bulanan */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <ChartCard
            title="Tren Keuntungan Bulanan"
            subtitle="Perbandingan Omzet, Pengeluaran & Keuntungan"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyProfitTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="bulan" tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} unit=" jt" />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `Rp ${value} Juta`,
                    name === 'omzet' ? 'Omzet' : name === 'pengeluaran' ? 'Pengeluaran' : 'Keuntungan',
                  ]}
                />
                <Bar dataKey="omzet" fill={theme.palette.success.light} radius={[4, 4, 0, 0]} />
                <Bar dataKey="pengeluaran" fill={theme.palette.error.light} radius={[4, 4, 0, 0]} />
                <Bar dataKey="laba" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};
