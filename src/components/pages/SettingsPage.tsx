import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Avatar,
  IconButton,
  Chip,
  Paper,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RotateLeftOutlinedIcon from '@mui/icons-material/RotateLeftOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import EggAltIcon from '@mui/icons-material/EggAlt';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import SyncIcon from '@mui/icons-material/Sync';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import { useApp } from '../../context/AppContext';
import { validatePercentageSum } from '../../utils/calculations';
import {
  testSupabaseConnection,
  syncAllLocalDataToSupabase,
  uploadLogoToSupabaseStorage,
  DatabaseDiagnostics,
} from '../../services/supabaseService';

export const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const {
    farm,
    updateFarmProfile,
    settings,
    updateSettings,
    resetSettingsToDefault,
    supabaseConfig,
    saveSupabaseConfig,
    syncStatus,
    showToast,
    chickens,
    harvests,
    sales,
    expenses,
    allocations,
    refreshDatabaseData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'logo' | 'profile' | 'allocation' | 'supabase' | 'sql'>('supabase');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Diagnostics State
  const [diagnostics, setDiagnostics] = useState<DatabaseDiagnostics | null>(null);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [syncingData, setSyncingData] = useState<boolean>(false);

  // Logo state
  const [logoPreview, setLogoPreview] = useState<string>(farm.logoUrl || '');
  const [logoInputUrl, setLogoInputUrl] = useState<string>(farm.logoUrl || '');
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);

  // Allocation form state
  const [allocationForm, setAllocationForm] = useState({
    feedPercentage: settings.feedPercentage,
    chickenPercentage: settings.chickenPercentage,
    laborPercentage: settings.laborPercentage,
    electricityPercentage: settings.electricityPercentage,
    waterPercentage: settings.waterPercentage,
    vitaminPercentage: settings.vitaminPercentage,
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: farm.name,
    ownerName: farm.ownerName,
    location: farm.location,
    initialStock: farm.initialStock,
    productiveChickens: farm.productiveChickens,
    totalChickens: farm.totalChickens,
  });

  // Supabase state
  const [sbForm, setSbForm] = useState({
    url: supabaseConfig.url,
    anonKey: supabaseConfig.anonKey,
  });

  // Validation for allocation percentages
  const sumValidation = validatePercentageSum(allocationForm);

  // Handle Logo Upload from device
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast('error', 'Ukuran File Terlalu Besar', 'Maksimal ukuran file logo adalah 3 MB.');
        return;
      }
      setSelectedLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        setLogoInputUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = async () => {
    setIsUploadingLogo(true);
    let finalLogoUrl = logoPreview;

    if (selectedLogoFile) {
      const uploadRes = await uploadLogoToSupabaseStorage(selectedLogoFile, farm.id);
      if (uploadRes.url) {
        finalLogoUrl = uploadRes.url;
        setLogoPreview(uploadRes.url);
        setLogoInputUrl(uploadRes.url);
        showToast('success', 'Upload Supabase Berhasil', 'File logo tersimpan di storage bucket app-files.');
      } else {
        console.warn('Storage bucket note:', uploadRes.error);
        showToast('info', 'Logo Disimpan Lokal', 'Logo aktif di aplikasi. Pastikan bucket app-files dibuat di Supabase.');
      }
    }

    await updateFarmProfile({ logoUrl: finalLogoUrl });
    setIsUploadingLogo(false);
  };

  const handleRemoveLogo = async () => {
    setSelectedLogoFile(null);
    setLogoPreview('');
    setLogoInputUrl('');
    await updateFarmProfile({ logoUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('info', 'Logo Dihapus', 'Kembali menggunakan icon logo default.');
  };

  // Handle Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateFarmProfile({
      name: profileForm.name,
      ownerName: profileForm.ownerName,
      location: profileForm.location,
      initialStock: Number(profileForm.initialStock) || 0,
      productiveChickens: Number(profileForm.productiveChickens) || 0,
      totalChickens: Number(profileForm.totalChickens) || 0,
    });
  };

  // Handle Allocation Save
  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sumValidation.isValid) {
      showToast('error', 'Validasi Gagal', `Total persentase harus tepat 100%. Saat ini ${sumValidation.total}%.`);
      return;
    }

    updateSettings({
      ...settings,
      feedPercentage: allocationForm.feedPercentage,
      chickenPercentage: allocationForm.chickenPercentage,
      laborPercentage: allocationForm.laborPercentage,
      electricityPercentage: allocationForm.electricityPercentage,
      waterPercentage: allocationForm.waterPercentage,
      vitaminPercentage: allocationForm.vitaminPercentage,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.text.primary, letterSpacing: '-0.02em' }}>
          Pengaturan Aplikasi & Peternakan
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Kelola logo aplikasi, profil peternakan, persentase konversi modal, dan integrasi database.
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val)}
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
          <Tab value="logo" icon={<ImageOutlinedIcon fontSize="small" />} iconPosition="start" label="Logo Aplikasi" />
          <Tab value="profile" icon={<BusinessOutlinedIcon fontSize="small" />} iconPosition="start" label="Profil Peternakan" />
          <Tab value="allocation" icon={<PercentOutlinedIcon fontSize="small" />} iconPosition="start" label="Alokasi Konversi Modal" />
          <Tab value="supabase" icon={<StorageOutlinedIcon fontSize="small" />} iconPosition="start" label="Database Supabase" />
          <Tab value="sql" icon={<DataObjectOutlinedIcon fontSize="small" />} iconPosition="start" label="Skema SQL (7 Tabel)" />
        </Tabs>

        {/* TAB 1: PENGATURAN LOGO APLIKASI */}
        {activeTab === 'logo' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Logo Aplikasi Lingga Mandiri Farm
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload logo kustom usaha peternakan Anda. Logo akan ditampilkan pada Sidebar, Header, dan Laporan.
              </Typography>
            </Box>

            <Grid container spacing={4} sx={{ alignItems: 'center' }}>
              {/* Preview Box */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: '12px',
                    textAlign: 'center',
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 2 }}>
                    PREVIEW LOGO SAAT INI
                  </Typography>

                  <Box
                    sx={{
                      width: 96,
                      height: 96,
                      borderRadius: '16px',
                      backgroundColor: logoPreview ? '#FFFFFF' : theme.palette.primary.main,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  >
                    {logoPreview ? (
                      <Box
                        component="img"
                        src={logoPreview}
                        alt="Logo Preview"
                        sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <EggAltIcon sx={{ fontSize: 48, color: '#FFFFFF' }} />
                    )}
                  </Box>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {farm.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {logoPreview ? 'Logo Kustom Aktif' : 'Menggunakan Icon Telur Bawaan'}
                  </Typography>
                </Paper>
              </Grid>

              {/* Upload & Action Controls */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Unggah File Logo (PNG, JPG, SVG, WebP)
                    </Typography>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      style={{ display: 'none' }}
                    />

                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => fileInputRef.current?.click()}
                      startIcon={<CloudUploadOutlinedIcon />}
                      sx={{ mr: 1.5 }}
                    >
                      Pilih Gambar dari Perangkat
                    </Button>

                    {logoPreview && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleRemoveLogo}
                        startIcon={<DeleteIcon />}
                      >
                        Hapus Logo
                      </Button>
                    )}
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Atau Masukkan Tautan URL Logo
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="https://contoh-domain.com/logo.png"
                      value={logoInputUrl}
                      onChange={(e) => {
                        setLogoInputUrl(e.target.value);
                        setLogoPreview(e.target.value);
                      }}
                      helperText="Gunakan URL gambar publik langsung (direct link)."
                    />
                  </Box>

                  <Box sx={{ pt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={isUploadingLogo}
                      onClick={handleSaveLogo}
                      startIcon={isUploadingLogo ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
                      sx={{ px: 3 }}
                    >
                      {isUploadingLogo ? 'Mengunggah ke Supabase...' : 'Simpan & Upload Logo'}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      File otomatis diunggah ke storage bucket <code>app-files</code> Supabase.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 2: PROFIL PETERNAKAN */}
        {activeTab === 'profile' && (
          <Box component="form" onSubmit={handleSaveProfile} sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Informasi Peternakan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Data nama usaha, pemilik, lokasi, dan populasi ayam untuk sinkronisasi otomatis.
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nama Peternakan / Usaha"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nama Pemilik / Pengelola"
                  value={profileForm.ownerName}
                  onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Lokasi / Alamat Peternakan"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stok Telur Awal Fisik (KG)"
                  value={profileForm.initialStock}
                  onChange={(e) => setProfileForm({ ...profileForm, initialStock: Number(e.target.value) })}
                  helperText="Stok fisik awal saat mulai pembukuan."
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Populasi Ayam Produktif (Ekor)"
                  value={profileForm.productiveChickens}
                  onChange={(e) => setProfileForm({ ...profileForm, productiveChickens: Number(e.target.value) })}
                  helperText="Digunakan sebagai standar bawaan pada form panen harian."
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Populasi Ayam (Ekor)"
                  value={profileForm.totalChickens}
                  onChange={(e) => setProfileForm({ ...profileForm, totalChickens: Number(e.target.value) })}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" color="primary" startIcon={<SaveOutlinedIcon />}>
                Simpan Profil Peternakan
              </Button>
            </Box>
          </Box>
        )}

        {/* TAB 3: ALOKASI KONVERSI MODAL */}
        {activeTab === 'allocation' && (
          <Box component="form" onSubmit={handleSaveAllocation} sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Persentase Alokasi Modal Operasional (Default: 100%)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Atur pembagian keuntungan bersih harian ke dalam 6 pos operasional peternakan.
              </Typography>
            </Box>

            {!sumValidation.isValid && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {sumValidation.message} (Saat ini: {sumValidation.total}%)
              </Alert>
            )}

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="1. Pakan (%)"
                  value={allocationForm.feedPercentage}
                  onChange={(e) => setAllocationForm({ ...allocationForm, feedPercentage: parseFloat(e.target.value) || 0 })}
                  helperText="Default: 63%"
                  slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="2. Pembelian Ayam (%)"
                  value={allocationForm.chickenPercentage}
                  onChange={(e) => setAllocationForm({ ...allocationForm, chickenPercentage: parseFloat(e.target.value) || 0 })}
                  helperText="Default: 20%"
                  slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="3. Upah Kerja (%)"
                  value={allocationForm.laborPercentage}
                  onChange={(e) => setAllocationForm({ ...allocationForm, laborPercentage: parseFloat(e.target.value) || 0 })}
                  helperText="Default: 12%"
                  slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="4. Listrik (%)"
                  value={allocationForm.electricityPercentage}
                  onChange={(e) => setAllocationForm({ ...allocationForm, electricityPercentage: parseFloat(e.target.value) || 0 })}
                  helperText="Default: 0.5%"
                  slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="5. Air (%)"
                  value={allocationForm.waterPercentage}
                  onChange={(e) => setAllocationForm({ ...allocationForm, waterPercentage: parseFloat(e.target.value) || 0 })}
                  helperText="Default: 1.0%"
                  slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="6. Vitamin & Vaksin (%)"
                  value={allocationForm.vitaminPercentage}
                  onChange={(e) => setAllocationForm({ ...allocationForm, vitaminPercentage: parseFloat(e.target.value) || 0 })}
                  helperText="Default: 3.5%"
                  slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => {
                  resetSettingsToDefault();
                  setAllocationForm({
                    feedPercentage: 63,
                    chickenPercentage: 20,
                    laborPercentage: 12,
                    electricityPercentage: 0.5,
                    waterPercentage: 1,
                    vitaminPercentage: 3.5,
                  });
                  showToast('info', 'Di-reset', 'Persentase alokasi kembali ke bawaan sistem.');
                }}
                startIcon={<RotateLeftOutlinedIcon />}
              >
                Reset Default (100%)
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!sumValidation.isValid}
                startIcon={<SaveOutlinedIcon />}
              >
                Simpan Alokasi Modal
              </Button>
            </Box>
          </Box>
        )}

        {/* TAB 4: DATABASE SUPABASE */}
        {activeTab === 'supabase' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Koneksi Database Cloud (Supabase)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aplikasi terhubung ke database Supabase Anda untuk sinkronisasi data real-time.
                </Typography>
              </Box>
              <Chip
                label={sbForm.url ? 'Supabase Terhubung' : 'Mode Offline Local'}
                color={sbForm.url ? 'success' : 'default'}
                icon={<CheckCircleIcon />}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            <Alert severity="success" sx={{ mb: 3 }}>
              Database Cloud Supabase aktif: <strong>https://anggsdesivvelfaawsah.supabase.co</strong>
            </Alert>

            {/* Connection Test & Diagnostic Panel */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 3,
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Status Diagnostik 7 Tabel Database
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Periksa apakah tabel database di Supabase sudah siap menerima data
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={testingConnection}
                    onClick={async () => {
                      setTestingConnection(true);
                      const diag = await testSupabaseConnection();
                      setDiagnostics(diag);
                      setTestingConnection(false);
                      if (diag.allReady) {
                        showToast('success', 'Koneksi Berhasil!', 'Semua 7 tabel di Supabase siap digunakan.');
                      } else {
                        showToast('warning', 'Pemeriksaan Selesai', diag.message);
                      }
                    }}
                    startIcon={testingConnection ? <CircularProgress size={16} /> : <CheckCircleOutlinedIcon />}
                  >
                    {testingConnection ? 'Memeriksa...' : 'Uji Koneksi & Tabel'}
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    disabled={syncingData}
                    onClick={async () => {
                      setSyncingData(true);
                      const res = await syncAllLocalDataToSupabase(
                        farm,
                        settings,
                        chickens,
                        harvests,
                        sales,
                        expenses,
                        allocations
                      );
                      setSyncingData(false);
                      if (res.success) {
                        await refreshDatabaseData();
                        showToast('success', 'Data Berhasil Disinkronkan!', 'Seluruh data peternakan, ayam, panen, & penjualan terunggah ke Supabase.');
                      } else {
                        showToast('error', 'Sinkronisasi Gagal', res.error || 'Pastikan tabel SQL sudah dibuat di Supabase.');
                      }
                    }}
                    startIcon={syncingData ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                  >
                    {syncingData ? 'Mengunggah...' : 'Unggah Data ke Supabase'}
                  </Button>
                </Box>
              </Box>

              {diagnostics && (
                <Box sx={{ mt: 2 }}>
                  <Alert
                    severity={diagnostics.allReady ? 'success' : 'info'}
                    sx={{ mb: 2 }}
                    action={
                      !diagnostics.allReady ? (
                        <Button
                          color="inherit"
                          size="small"
                          onClick={() => setActiveTab('sql')}
                        >
                          Buka Tab SQL
                        </Button>
                      ) : undefined
                    }
                  >
                    {diagnostics.message}
                  </Alert>

                  <Grid container spacing={1.5}>
                    {Object.entries(diagnostics.tables).map(([tableName, statusInfo]) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tableName}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.25,
                            border: `1px solid ${
                              statusInfo.status === 'ready'
                                ? alpha(theme.palette.success.main, 0.3)
                                : alpha(theme.palette.warning.main, 0.4)
                            }`,
                            backgroundColor:
                              statusInfo.status === 'ready'
                                ? alpha(theme.palette.success.main, 0.05)
                                : alpha(theme.palette.warning.main, 0.05),
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                            {tableName}
                          </Typography>
                          <Chip
                            label={statusInfo.status === 'ready' ? 'Siap (OK)' : 'Belum Ada'}
                            size="small"
                            color={statusInfo.status === 'ready' ? 'success' : 'warning'}
                            icon={statusInfo.status === 'ready' ? <CheckCircleIcon /> : <WarningAmberOutlinedIcon />}
                            sx={{ height: 22, fontSize: '0.7rem' }}
                          />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Supabase Project URL"
                placeholder="https://xyzproject.supabase.co"
                value={sbForm.url}
                onChange={(e) => setSbForm({ ...sbForm, url: e.target.value })}
                helperText="URL endpoint API Supabase Anda"
              />

              <TextField
                fullWidth
                label="Supabase Anon Public API Key"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={sbForm.anonKey}
                onChange={(e) => setSbForm({ ...sbForm, anonKey: e.target.value })}
                helperText="Publishable / Anon Key project Supabase"
              />

              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    saveSupabaseConfig(sbForm.url, sbForm.anonKey);
                    showToast('success', 'Konfigurasi Supabase Berhasil Disimpan', 'Koneksi ke project https://anggsdesivvelfaawsah.supabase.co aktif.');
                  }}
                  startIcon={<SaveOutlinedIcon />}
                >
                  Simpan Konfigurasi
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* TAB 5: SKEMA SQL LENGKAP UNTUK 7 TABEL */}
        {activeTab === 'sql' && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Skema SQL Database (PostgreSQL / Supabase)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  7 Tabel terdaftar sesuai spesifikasi sistem manajemen telur Lingga Mandiri Farm.
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  const sqlText = `-- ========================================================================
-- SKEMA DATABASE LINGGA MANDIRI FARM (SUPABASE / POSTGRESQL)
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. farms (profil peternakan)
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Lingga Mandiri Farm',
    owner_name VARCHAR(255) NOT NULL DEFAULT 'H. Sudirman',
    location TEXT NOT NULL DEFAULT 'Blitar, Jawa Timur',
    initial_stock NUMERIC(12, 2) NOT NULL DEFAULT 305.00,
    productive_chickens INTEGER NOT NULL DEFAULT 920,
    total_chickens INTEGER NOT NULL DEFAULT 1000,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. chickens (populasi ayam)
CREATE TABLE IF NOT EXISTS public.chickens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    quantity INTEGER NOT NULL,
    productive_quantity INTEGER NOT NULL,
    dead_quantity INTEGER NOT NULL DEFAULT 0,
    culled_quantity INTEGER NOT NULL DEFAULT 0,
    incoming_quantity INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. egg_harvests (panen grade A, B, reject)
CREATE TABLE IF NOT EXISTS public.egg_harvests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    productive_chickens INTEGER NOT NULL,
    grade_a_weight NUMERIC(10, 2) DEFAULT 0.00,
    grade_b_weight NUMERIC(10, 2) DEFAULT 0.00,
    reject_weight NUMERIC(10, 2) DEFAULT 0.00,
    total_weight NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. sales (transaksi penjualan telur)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    customer_name VARCHAR(255),
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    unit_price NUMERIC(12, 2) NOT NULL,
    total NUMERIC(14, 2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'Lunas',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. expenses (pengeluaran operasional)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. profit_allocations (alokasi modal operasional)
CREATE TABLE IF NOT EXISTS public.profit_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    profit NUMERIC(14, 2) NOT NULL,
    feed_amount NUMERIC(14, 2) NOT NULL,
    chicken_amount NUMERIC(14, 2) NOT NULL,
    labor_amount NUMERIC(14, 2) NOT NULL,
    electricity_amount NUMERIC(14, 2) NOT NULL,
    water_amount NUMERIC(14, 2) NOT NULL,
    vitamin_amount NUMERIC(14, 2) NOT NULL,
    feed_percentage NUMERIC(5, 2) NOT NULL DEFAULT 63.00,
    chicken_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    labor_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    electricity_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.50,
    water_percentage NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    vitamin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 3.50,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. allocation_settings (persentase pakan, ayam, upah, dll.)
CREATE TABLE IF NOT EXISTS public.allocation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE UNIQUE,
    feed_percentage NUMERIC(5, 2) NOT NULL DEFAULT 63.00,
    chicken_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    labor_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    electricity_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.50,
    water_percentage NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    vitamin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 3.50,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;
                  navigator.clipboard.writeText(sqlText);
                  showToast('success', 'SQL Disalin!', 'Query skema 7 tabel berhasil disalin ke clipboard.');
                }}
                startIcon={<ContentCopyOutlinedIcon />}
              >
                Salin Query SQL (7 Tabel)
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip label="1. farms" size="small" color="primary" variant="outlined" />
              <Chip label="2. chickens" size="small" color="primary" variant="outlined" />
              <Chip label="3. egg_harvests" size="small" color="primary" variant="outlined" />
              <Chip label="4. sales" size="small" color="primary" variant="outlined" />
              <Chip label="5. expenses" size="small" color="primary" variant="outlined" />
              <Chip label="6. profit_allocations" size="small" color="primary" variant="outlined" />
              <Chip label="7. allocation_settings" size="small" color="primary" variant="outlined" />
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '10px',
                backgroundColor: '#0F172A',
                color: '#38BDF8',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                lineHeight: 1.6,
                maxHeight: 460,
                overflowY: 'auto',
                whiteSpace: 'pre',
                border: '1px solid #334155',
              }}
            >
{`-- 1. TABEL: farms (profil peternakan)
CREATE TABLE public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Lingga Mandiri Farm',
    owner_name VARCHAR(255) NOT NULL DEFAULT 'H. Sudirman',
    location TEXT NOT NULL,
    initial_stock NUMERIC(12, 2) NOT NULL DEFAULT 305.00,
    productive_chickens INTEGER NOT NULL DEFAULT 920,
    total_chickens INTEGER NOT NULL DEFAULT 1000,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL: chickens (populasi ayam)
CREATE TABLE public.chickens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    quantity INTEGER NOT NULL,
    productive_quantity INTEGER NOT NULL,
    dead_quantity INTEGER DEFAULT 0,
    culled_quantity INTEGER DEFAULT 0,
    incoming_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL: egg_harvests (panen grade A, B, reject)
CREATE TABLE public.egg_harvests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    productive_chickens INTEGER NOT NULL,
    grade_a_weight NUMERIC(10, 2) DEFAULT 0.00,
    grade_b_weight NUMERIC(10, 2) DEFAULT 0.00,
    reject_weight NUMERIC(10, 2) DEFAULT 0.00,
    total_weight NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL: sales (transaksi penjualan telur)
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    customer_name VARCHAR(255),
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    total NUMERIC(14, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Lunas',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL: expenses (pengeluaran operasional)
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL: profit_allocations (alokasi modal operasional)
CREATE TABLE public.profit_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    profit NUMERIC(14, 2) NOT NULL,
    feed_amount NUMERIC(14, 2) NOT NULL,       -- 63%
    chicken_amount NUMERIC(14, 2) NOT NULL,    -- 20%
    labor_amount NUMERIC(14, 2) NOT NULL,      -- 12%
    electricity_amount NUMERIC(14, 2) NOT NULL,-- 0.5%
    water_amount NUMERIC(14, 2) NOT NULL,      -- 1%
    vitamin_amount NUMERIC(14, 2) NOT NULL,    -- 3.5%
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL: allocation_settings (persentase pakan, ayam, upah, dll.)
CREATE TABLE public.allocation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE UNIQUE,
    feed_percentage NUMERIC(5, 2) DEFAULT 63.00,
    chicken_percentage NUMERIC(5, 2) DEFAULT 20.00,
    labor_percentage NUMERIC(5, 2) DEFAULT 12.00,
    electricity_percentage NUMERIC(5, 2) DEFAULT 0.50,
    water_percentage NUMERIC(5, 2) DEFAULT 1.00,
    vitamin_percentage NUMERIC(5, 2) DEFAULT 3.50,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
