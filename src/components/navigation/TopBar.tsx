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
  const { farm, syncStatus, resetAllToDemoData, showToast } = useApp();
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
          <Tooltip title="Menu Peternak" arrow>
            <IconButton
              onClick={handleOpenUserMenu}
              sx={{
                p: 0,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.875rem',
                  fontWeight: 700,
                }}
              >
                {farm.ownerName.charAt(0)}
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
              Aktivitas data real-time
            </Typography>
          </Box>
          <Divider />
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
          <MenuItem onClick={handleCloseNotif} sx={{ py: 1.25 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Konversi Modal Otomatis
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Alokasi pakan 63%, ayam 20%, upah 12%, listrik 0.5%, air 1%, vaksin 3.5%.
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
          slotProps={{ paper: { sx: { width: 240, p: 0.5 } } }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {farm.ownerName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {farm.name}
            </Typography>
          </Box>
          <Divider sx={{ my: 0.5 }} />

          <MenuItem
            onClick={() => {
              handleCloseUserMenu();
              onSelectTab('settings');
            }}
          >
            <ListItemIcon>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Pengaturan Profil, Logo & Modal" />
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorageOutlinedIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
            <Typography variant="caption" color="text.secondary">
              Status Database: {syncStatus === 'synced' ? 'Supabase Terhubung' : 'Penyimpanan Lokal'}
            </Typography>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
