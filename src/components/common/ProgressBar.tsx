import React from 'react';
import { Box, Typography, LinearProgress, alpha, useTheme } from '@mui/material';

interface ProgressBarProps {
  label: string;
  percentage: number;
  amountFormatted: string;
  color?: string; // hex color or theme palette color
  subLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  percentage,
  amountFormatted,
  color,
  subLabel,
}) => {
  const theme = useTheme();
  const safePercent = Math.min(Math.max(percentage, 0), 100);
  const effectiveColor = color || theme.palette.primary.main;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {label}
          </Typography>
          {subLabel && (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              ({subLabel})
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: effectiveColor,
              backgroundColor: alpha(effectiveColor, 0.1),
              px: 0.75,
              py: 0.2,
              borderRadius: '4px',
            }}
          >
            {safePercent.toLocaleString('id-ID')}%
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontFamily: 'monospace' }}>
            {amountFormatted}
          </Typography>
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={safePercent}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: alpha(effectiveColor, 0.12),
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            backgroundColor: effectiveColor,
          },
        }}
      />
    </Box>
  );
};
