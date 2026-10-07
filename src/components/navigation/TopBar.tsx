import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import SyncIcon from '@mui/icons-material/Sync';
import { useApp } from '../../context/AppContext';
import { formatTanggal, getTodayDateString } from '../../utils/formatters';
import { NavTab, TAB_TITLES } from './navConfig';

interface TopBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onToggleMobileDrawer: () => void;
  onToggleSidebarCollapse?: () => void;
  isMobile: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onToggleMobileDrawer,
  onToggleSidebarCollapse,
  isMobile,
}) => {
  const theme = useTheme();
  const { farm, syncStatus, user, userProfile, setIsAuthDialogOpen, signOut, dbLoading, refreshDatabaseData, showToast } = useApp();
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setUserMenuAnchor(null);
  };

  const handleOpenNotif = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(event.currentTarget);
  };
  const handleCloseNotif = () => {
    setNotifAnchor(null);
  };

  const todayStr = getTodayDateString();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#FFFFFF',
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 58, sm: 64 }, px: { xs: 2, sm: 3 }, gap: 2 }}>
        {/* Left: Mobile Drawer Trigger or Breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={isMobile ? onToggleMobileDrawer : onToggleSidebarCollapse}
            sx={{
              color: theme.palette.text.primary,
              '&:hover': { backgroundColor: alpha(theme.palette.text.primary, 0.05) },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1rem', sm: '1.15rem' },
                  letterSpacing: '-0.015em',
                  color: theme.palette.text.primary,
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {TAB_TITLES[activeTab]}
              </Typography>

              {!isMobile && (
                <Chip
                  label={farm.name}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 22,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    backgroundColor: alpha(theme.palette.text.primary, 0.02),
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Center/Right: Date Tag */}
        {!isMobile && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: '8px',
              backgroundColor: alpha(theme.palette.text.primary, 0.03),
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
              {formatTanggal(todayStr)}
            </Typography>
          </Box>
        )}

        {/* Right Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
          {/* Supabase Sync Button */}
          <Tooltip title={dbLoading ? 'Sinkronisasi...' : 'Sinkronkan Database Supabase'} arrow>
            <IconButton
              size="small"
              onClick={async () => {
                await refreshDatabaseData();
                showToast('success', 'Data Disinkronkan', 'Data terbaru dari Supabase telah dimuat.');
              }}
              sx={{
                color: theme.palette.success.main,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                width: 36,
                height: 36,
                backgroundColor: alpha(theme.palette.success.main, 0.04),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                },
              }}
            >
              <SyncIcon
                fontSize="small"
                sx={{
                  animation: dbLoading ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifikasi Sistem" arrow>
            <IconButton
              size="small"
              onClick={handleOpenNotif}
              sx={{
                color: theme.palette.text.secondary,
                border: `1px solid ${theme.palette.divider}`,
                width: 36,
                height: 36,
                '&:hover': {
                  color: theme.palette.text.primary,
                  backgroundColor: alpha(theme.palette.text.primary, 0.04),
                },
              }}
            >
              <Badge color="error" variant="dot">
                <NotificationsOutlinedIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Avatar & Menu */}
          <Tooltip title={user ? `Akun: ${user.email}` : 'Masuk / Akun'} arrow>
            <IconButton
              onClick={handleOpenUserMenu}
              sx={{
                p: 0,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: user ? theme.palette.primary.main : '#64748B',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                }}
              >
                {user ? (user.email?.charAt(0).toUpperCase() || 'U') : farm.ownerName.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Notification Menu */}
        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={handleCloseNotif}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{ paper: { sx: { width: 300, p: 0.5 } } }}
        >
          <Box sx={{ p: 1.5, pb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Notifikasi Peternakan
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Aktivitas data real-time Supabase
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleCloseNotif} sx={{ py: 1.25 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Koneksi Supabase Aktif
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Data disimpan langsung ke cloud Supabase (anggsdesivvelfaawsah).
              </Typography>
            </Box>
          </MenuItem>
          <MenuItem onClick={handleCloseNotif} sx={{ py: 1.25 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Kalkulasi Stok Real-time Aktif
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Stok telur otomatis disesuaikan dari panen & penjualan.
              </Typography>
            </Box>
          </MenuItem>
        </Menu>

        {/* User Account Menu */}
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleCloseUserMenu}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          slotProps={{ paper: { sx: { width: 250, p: 0.5 } } }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {user ? (userProfile?.fullName || user.email) : farm.ownerName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user ? user.email : farm.name}
            </Typography>
          </Box>
          <Divider sx={{ my: 0.5 }} />

          {user ? (
            <MenuItem
              onClick={() => {
                handleCloseUserMenu();
                signOut();
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText
                primary="Keluar (Logout)"
                slotProps={{ primary: { sx: { color: 'error.main', fontWeight: 600 } } }}
              />
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                handleCloseUserMenu();
                setIsAuthDialogOpen(true);
              }}
            >
              <ListItemIcon>
                <LoginIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary="Masuk / Daftar Akun" />
            </MenuItem>
          )}

          <MenuItem
            onClick={() => {
              handleCloseUserMenu();
              onSelectTab('settings');
            }}
          >
            <ListItemIcon>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Pengaturan & Profil" />
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudDoneOutlinedIcon fontSize="small" color="success" />
            <Typography variant="caption" color="text.secondary">
              Supabase Cloud Terhubung
            </Typography>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
