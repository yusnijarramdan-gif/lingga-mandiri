import React from 'react';
import { Snackbar, Alert, AlertTitle, Slide, SlideProps } from '@mui/material';
import { useApp } from '../../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  // Show the latest toast
  const latestToast = toasts[toasts.length - 1];

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    removeToast(latestToast.id);
  };

  const muiSeverity =
    latestToast.type === 'error'
      ? 'error'
      : latestToast.type === 'warning'
      ? 'warning'
      : latestToast.type === 'info'
      ? 'info'
      : 'success';

  return (
    <Snackbar
      open={Boolean(latestToast)}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{ zIndex: 9999 }}
    >
      <Alert
        onClose={handleClose}
        severity={muiSeverity}
        variant="filled"
        sx={{
          width: '100%',
          minWidth: 280,
          borderRadius: '10px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
        }}
      >
        <AlertTitle sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{latestToast.title}</AlertTitle>
        {latestToast.message}
      </Alert>
    </Snackbar>
  );
};
