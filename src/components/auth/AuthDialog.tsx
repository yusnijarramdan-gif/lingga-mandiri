import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EggAltIcon from '@mui/icons-material/EggAlt';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ open, onClose, initialMode = 'login' }) => {
  const { showToast, refreshDatabaseData } = useApp();
  const [tab, setTab] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message || 'Gagal masuk. Periksa kembali email dan kata sandi.');
          setLoading(false);
          return;
        }

        showToast('success', 'Berhasil Masuk', `Selamat datang kembali, ${data.user?.email}`);
        await refreshDatabaseData();
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          setErrorMsg(error.message || 'Gagal mendaftar akun baru.');
          setLoading(false);
          return;
        }

        showToast('success', 'Registrasi Berhasil', 'Akun berhasil dibuat dan otomatis terhubung.');
        await refreshDatabaseData();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'inline-flex', p: 1.25, borderRadius: '12px', bgcolor: 'primary.light', color: 'primary.dark', mb: 1 }}>
          <EggAltIcon fontSize="large" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Lingga Mandiri Farm
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sistem Manajemen Telur & Peternakan Modern
        </Typography>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setErrorMsg(null); }} variant="fullWidth">
          <Tab label="Masuk" value="login" sx={{ fontWeight: 600 }} />
          <Tab label="Daftar Akun" value="register" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ px: 3, pt: 2.5 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '0.85rem' }} onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        <form onSubmit={handleSubmit} id="auth-form">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tab === 'register' && (
              <TextField
                label="Nama Lengkap / Nama Peternak"
                fullWidth
                size="small"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}

            <TextField
              label="Email"
              type="email"
              fullWidth
              size="small"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              size="small"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              helperText={tab === 'register' ? 'Minimal 6 karakter' : undefined}
            />
          </Box>
        </form>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          type="submit"
          form="auth-form"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ py: 1.1, fontWeight: 700 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : tab === 'login' ? (
            'Masuk ke Akun'
          ) : (
            'Buat Akun Baru'
          )}
        </Button>

        <Button variant="text" color="inherit" fullWidth size="small" onClick={onClose} disabled={loading}>
          Batal / Lanjutkan sebagai Tamu
        </Button>
      </DialogActions>
    </Dialog>
  );
};
