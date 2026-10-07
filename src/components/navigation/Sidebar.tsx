import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EggAltIcon from '@mui/icons-material/EggAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { NavTab, NAV_ITEMS } from './navConfig';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  widthExpanded?: number;
  widthCollapsed?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  widthExpanded = 240,
  widthCollapsed = 70,
}) => {
  const theme = useTheme();
  const { farm, currentStock } = useApp();
  const currentWidth = collapsed ? widthCollapsed : widthExpanded;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: currentWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: '#FFFFFF',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
    >
      {/* Brand Header */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            px: collapsed ? 1 : 2.5,
            py: 2,
            minHeight: 64,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              minWidth: 0,
            }}
            onClick={() => onSelectTab('dashboard')}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: farm.logoUrl ? 'transparent' : theme.palette.primary.main,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
                border: farm.logoUrl ? `1px solid ${theme.palette.divider}` : 'none',
                boxShadow: farm.logoUrl ? 'none' : `0 2px 6px ${alpha(theme.palette.primary.main, 0.35)}`,
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

            {!collapsed && (
              <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    lineHeight: 1.2,
                    color: theme.palette.text.primary,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  Lingga Mandiri
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    lineHeight: 1,
                  }}
                >
                  Farm Management
                </Typography>
              </Box>
            )}
          </Box>

          {!collapsed && (
            <Tooltip title="Ciutkan Sidebar (Collapse)" placement="right">
              <IconButton
                onClick={onToggleCollapse}
                size="small"
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': { backgroundColor: alpha(theme.palette.text.primary, 0.05) },
                }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Collapsed Toggle Button below Logo */}
        {collapsed && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Tooltip title="Perluas Sidebar (Expand)" placement="right">
              <IconButton
                onClick={onToggleCollapse}
                size="small"
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': { backgroundColor: alpha(theme.palette.text.primary, 0.05) },
                }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Navigation List */}
        <List sx={{ px: 1.25, py: 1.5 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const IconComponent = item.icon;

            const buttonContent = (
              <ListItemButton
                selected={isActive}
                onClick={() => onSelectTab(item.id)}
                sx={{
                  minHeight: 44,
                  borderRadius: '9px',
                  mb: 0.5,
                  px: collapsed ? 1.5 : 1.75,
                  justifyContent: collapsed ? 'center' : 'initial',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive
                    ? alpha(theme.palette.primary.main, 0.12)
                    : item.highlight && !collapsed
                    ? alpha(theme.palette.primary.main, 0.04)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive
                      ? alpha(theme.palette.primary.main, 0.18)
                      : alpha(theme.palette.text.primary, 0.04),
                  },
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.18),
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 1.75,
                    justifyContent: 'center',
                    color: isActive
                      ? theme.palette.primary.main
                      : item.highlight
                      ? theme.palette.primary.dark
                      : theme.palette.text.secondary,
                  }}
                >
                  <IconComponent fontSize="small" />
                </ListItemIcon>

                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: '0.84rem',
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? theme.palette.primary.dark : theme.palette.text.primary,
                        },
                      },
                    }}
                  />
                )}

                {!collapsed && item.highlight && (
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
            );

            return (
              <ListItem key={item.id} disablePadding sx={{ display: 'block' }}>
                {collapsed ? (
                  <Tooltip title={item.label} placement="right" arrow>
                    {buttonContent}
                  </Tooltip>
                ) : (
                  buttonContent
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Bottom User & Farm Status */}
      <Box sx={{ p: collapsed ? 1 : 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
        {collapsed ? (
          <Tooltip title={`${farm.ownerName} - Stok: ${currentStock} KG`} placement="right" arrow>
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {farm.ownerName.charAt(0)}
              </Avatar>
            </Box>
          </Tooltip>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1,
              borderRadius: '9px',
              backgroundColor: alpha(theme.palette.text.primary, 0.02),
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              {farm.ownerName.charAt(0)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {farm.ownerName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: theme.palette.success.main,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 11 }} />
                <span>Peternak Telur</span>
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};
