import React, { ReactNode } from 'react';
import { Card, CardContent, Typography, Box, Chip, alpha, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  highlight?: boolean;
  accentColor?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
  accentColor,
  onClick,
}) => {
  const theme = useTheme();

  // Robust color resolver for MUI alpha()
  const resolveColor = (colorInput?: string): string => {
    if (!colorInput) return theme.palette.primary.main;
    if (
      colorInput.startsWith('#') ||
      colorInput.startsWith('rgb') ||
      colorInput.startsWith('hsl')
    ) {
      return colorInput;
    }
    const colorMap: Record<string, string> = {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      success: theme.palette.success.main,
      error: theme.palette.error.main,
      warning: theme.palette.warning.main,
      info: theme.palette.info.main,
      amber: '#D97706',
      emerald: '#16A34A',
      green: '#16A34A',
      rose: '#DC2626',
      red: '#DC2626',
      blue: '#0284C7',
      sky: '#0284C7',
      neutral: '#64748B',
      slate: '#64748B',
      gray: '#64748B',
      indigo: '#6366F1',
      cyan: '#06B6D4',
      purple: '#9333EA',
    };
    return colorMap[colorInput.toLowerCase()] || theme.palette.primary.main;
  };

  const effectiveAccent = resolveColor(accentColor);

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '12px',
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${highlight ? alpha(effectiveAccent, 0.4) : theme.palette.divider}`,
        backgroundColor: highlight ? alpha(effectiveAccent, 0.03) : '#FFFFFF',
        boxShadow: highlight
          ? `0 2px 8px ${alpha(effectiveAccent, 0.1)}`
          : '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: alpha(effectiveAccent, 0.5),
          boxShadow: `0 4px 12px ${alpha(effectiveAccent, 0.08)}`,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: theme.palette.text.secondary,
              fontSize: '0.75rem',
            }}
          >
            {title}
          </Typography>

          {icon && (
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(effectiveAccent, 0.12),
                color: effectiveAccent,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.45rem', sm: '1.75rem' },
            color: theme.palette.text.primary,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            mb: 0.5,
          }}
        >
          {value}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {trend && (
            <Chip
              icon={trend.isPositive ? <TrendingUpIcon sx={{ fontSize: '13px !important' }} /> : <TrendingDownIcon sx={{ fontSize: '13px !important' }} />}
              label={trend.value}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: trend.isPositive
                  ? alpha(theme.palette.success.main, 0.12)
                  : alpha(theme.palette.error.main, 0.12),
                color: trend.isPositive ? theme.palette.success.dark : theme.palette.error.dark,
              }}
            />
          )}

          {subtitle && (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
