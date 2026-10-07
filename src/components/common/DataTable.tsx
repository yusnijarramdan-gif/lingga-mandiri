import React, { ReactNode, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Card,
  CardContent,
  Divider,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { EmptyState } from './EmptyState';

export interface ActionItem<T> {
  label: string;
  icon?: ReactNode;
  onClick: (row: T) => void;
  color?: 'default' | 'primary' | 'error';
}

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  align?: 'left' | 'center' | 'right';
  className?: string;
  width?: string | number;
  mobileHidden?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  actions?: ((row: T) => ActionItem<T>[]) | ((row: T) => ReactNode);
  emptyTitle?: string;
  emptyDescription?: string;
  emptyMessage?: string;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  pageSize?: number;
  mobileCardRenderer?: (row: T, actions?: any) => ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  actions,
  emptyTitle = 'Belum Ada Data',
  emptyDescription,
  emptyMessage,
  emptyActionText,
  onEmptyAction,
  pageSize = 10,
  mobileCardRenderer,
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  // Menu action state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeRow, setActiveRow] = useState<T | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, row: T) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setActiveRow(row);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setActiveRow(null);
  };

  const finalEmptyDescription = emptyMessage || emptyDescription || 'Mulai catat transaksi untuk melihat riwayat di sini.';

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={finalEmptyDescription}
        actionText={emptyActionText}
        onAction={onEmptyAction}
      />
    );
  }

  const paginatedData = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const rawActiveActions = activeRow && actions ? actions(activeRow) : [];
  const activeRowActions: ActionItem<T>[] = Array.isArray(rawActiveActions) ? rawActiveActions : [];

  return (
    <Box>
      {/* Mobile Card View */}
      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {paginatedData.map((row) => {
            const rowActions = actions ? actions(row) : [];

            if (mobileCardRenderer) {
              return (
                <Box key={keyExtractor(row)}>
                  {mobileCardRenderer(row, rowActions)}
                </Box>
              );
            }

            // Fallback default mobile card
            return (
              <Card
                key={keyExtractor(row)}
                elevation={0}
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.divider}`,
                  p: 0,
                  boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      {columns.slice(0, 2).map((col, idx) => {
                        const val = typeof col.accessor === 'function' ? col.accessor(row) : col.accessor ? row[col.accessor] : null;
                        return (
                          <Box key={idx} sx={{ mb: 0.5 }}>
                            <Typography variant={idx === 0 ? 'subtitle2' : 'caption'} sx={{ fontWeight: idx === 0 ? 700 : 500, color: idx === 0 ? 'text.primary' : 'text.secondary' }}>
                              {val}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>

                    {rowActions && (
                      !Array.isArray(rowActions) ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {rowActions}
                        </Box>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMenu(e, row)}
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )
                    )}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                    {columns.slice(2).map((col, idx) => {
                      const val = typeof col.accessor === 'function' ? col.accessor(row) : col.accessor ? row[col.accessor] : null;
                      return (
                        <Box key={idx}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                            {col.header}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {val}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : (
        /* Desktop Table View */
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            overflowX: 'auto',
          }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableCell
                    key={idx}
                    align={col.align || 'left'}
                    sx={{ width: col.width, whiteSpace: 'nowrap' }}
                  >
                    {col.header}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell align="right" sx={{ width: 80 }}>
                    Aksi
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedData.map((row) => {
                const rowActions = actions ? actions(row) : [];

                return (
                  <TableRow
                    key={keyExtractor(row)}
                    hover
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {columns.map((col, idx) => {
                      const val =
                        typeof col.accessor === 'function'
                          ? col.accessor(row)
                          : col.accessor
                          ? row[col.accessor]
                          : null;
                      return (
                        <TableCell
                          key={idx}
                          align={col.align || 'left'}
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {val}
                        </TableCell>
                      );
                    })}

                    {actions && (
                      <TableCell align="right">
                        {!Array.isArray(rowActions) ? (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            {rowActions}
                          </Box>
                        ) : rowActions.length <= 2 ? (
                          // Direct IconButtons with Tooltips if 1-2 actions
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            {rowActions.map((act, actIdx) => (
                              <Tooltip key={actIdx} title={act.label} arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => act.onClick(row)}
                                  sx={{
                                    color:
                                      act.color === 'error'
                                        ? theme.palette.error.main
                                        : theme.palette.text.secondary,
                                    '&:hover': {
                                      backgroundColor:
                                        act.color === 'error'
                                          ? alpha(theme.palette.error.main, 0.08)
                                          : alpha(theme.palette.text.primary, 0.04),
                                    },
                                  }}
                                >
                                  {act.icon}
                                </IconButton>
                              </Tooltip>
                            ))}
                          </Box>
                        ) : (
                          // More Action Menu if > 2 actions
                          <Tooltip title="Menu Opsi" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => handleOpenMenu(e, row)}
                              sx={{
                                color: theme.palette.text.secondary,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.text.primary, 0.06),
                                },
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {data.length > 0 && (
        <TablePagination
          component="div"
          count={data.length}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count}`}
          sx={{
            borderTop: isMobile ? 0 : `1px solid ${theme.palette.divider}`,
            mt: isMobile ? 1.5 : 0,
            color: 'text.secondary',
          }}
        />
      )}

      {/* More Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 160,
              borderRadius: '10px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
            },
          },
        }}
      >
        {activeRowActions.map((action, idx) => (
          <MenuItem
            key={idx}
            onClick={() => {
              if (activeRow) action.onClick(activeRow);
              handleCloseMenu();
            }}
            sx={{
              py: 1,
              px: 1.75,
              color: action.color === 'error' ? theme.palette.error.main : theme.palette.text.primary,
              '&:hover': {
                backgroundColor:
                  action.color === 'error'
                    ? alpha(theme.palette.error.main, 0.08)
                    : alpha(theme.palette.text.primary, 0.04),
              },
            }}
          >
            {action.icon && (
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: action.color === 'error' ? theme.palette.error.main : 'inherit',
                }}
              >
                {action.icon}
              </ListItemIcon>
            )}
            <ListItemText
              primary={action.label}
              slotProps={{
                primary: {
                  sx: { fontSize: '0.85rem', fontWeight: 500 },
                },
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
