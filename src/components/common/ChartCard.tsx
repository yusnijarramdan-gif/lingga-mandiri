import React, { ReactNode } from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  minHeight?: number;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  action,
  minHeight = 280,
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '12px',
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.95rem', color: theme.palette.text.primary }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box>{action}</Box>}
        </Box>
      </CardContent>

      <Box sx={{ flex: 1, minHeight, px: { xs: 1, sm: 2 }, pb: 2 }}>
        {children}
      </Box>
    </Card>
  );
};
