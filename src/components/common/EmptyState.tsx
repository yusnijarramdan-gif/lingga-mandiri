import React, { ReactNode } from 'react';
import { Paper, Box, Typography, Button, CircularProgress } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import AddIcon from '@mui/icons-material/Add';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        py: 6,
        px: 3,
        textAlign: 'center',
        border: '1px dashed #CBD5E1',
        borderRadius: '12px',
        backgroundColor: '#F8FAFC',
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '12px',
          backgroundColor: '#EDF2F7',
          color: '#64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        {icon || <InboxOutlinedIcon fontSize="medium" />}
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: '#1E293B' }}>
        {title}
      </Typography>

      <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 420, mx: 'auto', mb: actionText ? 2.5 : 0 }}>
        {description}
      </Typography>

      {actionText && onAction && (
        <Button
          variant="contained"
          color="primary"
          onClick={onAction}
          startIcon={<AddIcon />}
          size="small"
        >
          {actionText}
        </Button>
      )}
    </Paper>
  );
};

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Memuat data peternakan...' }) => {
  return (
    <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <CircularProgress size={36} thickness={4} color="primary" />
      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
};
