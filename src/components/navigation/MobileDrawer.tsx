import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EggAltIcon from '@mui/icons-material/EggAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { NavTab, NAV_ITEMS } from './navConfig';
import { useApp } from '../../context/AppContext';
import { formatAngka } from '../../utils/formatters';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  activeTab,
  onSelectTab,
}) => {
  const theme = useTheme();
  const { farm, currentStock } = useApp();

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better mobile opening performance
      }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
    >
      <Box>
        {/* Drawer Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                backgroundColor: farm.logoUrl ? 'transparent' : theme.palette.primary.main,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                border: farm.logoUrl ? `1px solid ${theme.palette.divider}` : 'none',
              }}
            >
              {farm.logoUrl ? (
                <Box
                  component="img"
                  src={farm.logoUrl}
                  alt={farm.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <EggAltIcon fontSize="small" />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.2, color: theme.palette.text.primary }}
              >
                Lingga Mandiri Farm
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {farm.location}
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={onClose} size="small" sx={{ color: theme.palette.text.secondary }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Navigation List */}
        <List sx={{ px: 1.5, py: 1.5 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.icon;

            return (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleSelect(item.id)}
                  sx={{
                    borderRadius: '9px',
                    minHeight: 44,
                    px: 1.75,
                    backgroundColor: isActive
                      ? alpha(theme.palette.primary.main, 0.12)
                      : item.highlight
                      ? alpha(theme.palette.primary.main, 0.04)
                      : 'transparent',
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive
                        ? theme.palette.primary.main
                        : item.highlight
                        ? theme.palette.primary.dark
                        : theme.palette.text.secondary,
                    }}
                  >
                    <IconComponent fontSize="small" />
                  </ListItemIcon>

                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? theme.palette.primary.dark : theme.palette.text.primary,
                        },
                      },
                    }}
                  />

                  {item.highlight && (
                    <Chip
                      icon={<AutoAwesomeIcon sx={{ fontSize: '11px !important', color: `${theme.palette.primary.main} !important` }} />}
                      label="Auto"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                        color: theme.palette.primary.dark,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Drawer Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, backgroundColor: alpha(theme.palette.text.primary, 0.02) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Inventory2OutlinedIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
          <Box>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', lineHeight: 1 }}>
              Stok Telur Real-Time
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
              {formatAngka(currentStock)} KG
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, fontSize: '0.75rem', fontWeight: 700 }}>
            {farm.ownerName.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.2 }}>
              {farm.ownerName}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Pemilik Peternakan
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};
