/**
 * Standard RFC-4180 Compliant CSV Serializer & Exporter for TelurKu.
 * 
 * Key Features:
 * - Full UTF-8 BOM (\uFEFF) support for Microsoft Excel, Google Sheets, & LibreOffice.
 * - Standard RFC-4180 character escaping (commas, double quotes, line breaks \n & \r\n).
 * - Guaranteed column count consistency across header and all data rows.
 * - Record count validation before triggering download.
 * - Explicit typed column mappings for all modules (Panen, Penjualan, Pengeluaran, Ayam, Konversi Modal, Stok).
 * - Safe numeric & Indonesian date formatting (DD/MM/YYYY).
 */

export interface CsvColumn<T = any> {
  key: string;
  label: string;
  format?: (value: any, row: T, rowIndex: number) => string | number | null | undefined;
}

/**
 * Escapes a single cell value according to RFC-4180 specifications.
 */
export function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Ya' : 'Tidak';
  }

  // Handle numbers
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) return '0';
    return String(value);
  }

  // Handle Date objects
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Convert objects/arrays safely without [object Object]
  let strValue: string;
  if (typeof value === 'object') {
    try {
      strValue = JSON.stringify(value);
    } catch {
      strValue = '';
    }
  } else {
    strValue = String(value);
  }

  // Check if string contains special characters that require RFC-4180 double quote wrapping
  const needsQuotes =
    strValue.includes(',') ||
    strValue.includes('"') ||
    strValue.includes('\n') ||
    strValue.includes('\r') ||
    strValue.includes(';') ||
    strValue.startsWith(' ') ||
    strValue.endsWith(' ');

  if (needsQuotes) {
    // RFC-4180: Double any existing quotes inside the string
    const escaped = strValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return strValue;
}

export interface ExportToCsvOptions<T = any> {
  filename: string;
  columns: CsvColumn<T>[];
  data: T[];
  title?: string;
  metadata?: Record<string, string | number | undefined>;
  summaryRow?: Record<string, any>;
  allowEmpty?: boolean;
  onError?: (errorMessage: string) => void;
  onSuccess?: (filename: string, rowCount: number) => void;
}

/**
 * Validates, serializes, and triggers download of a standardized CSV file.
 * Returns true if export was successful, false otherwise.
 */
export function exportToCsv<T = any>(options: ExportToCsvOptions<T>): boolean {
  const {
    filename,
    columns,
    data,
    title,
    metadata,
    summaryRow,
    allowEmpty = false,
    onError,
    onSuccess,
  } = options;

  try {
    // 1. Column configuration validation
    if (!columns || columns.length === 0) {
      const err = 'Gagal export CSV: Tidak ada konfigurasi kolom yang ditentukan.';
      console.error(err);
      if (onError) onError(err);
      return false;
    }

    // 2. Record count validation
    if (!data || data.length === 0) {
      if (!allowEmpty) {
        const err = 'Tidak ada data untuk diekspor ke file CSV.';
        if (onError) onError(err);
        return false;
      }
    }

    const expectedColumnCount = columns.length;
    const lines: string[] = [];

    // 3. Optional Document Title & Metadata
    if (title) {
      lines.push(escapeCsvValue(title));
    }
    if (metadata) {
      Object.entries(metadata).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          lines.push(`${escapeCsvValue(k)}: ${escapeCsvValue(v)}`);
        }
      });
      lines.push(''); // Blank separator line before table headers
    }

    // 4. Table Headers (Strictly N columns)
    const headerRow = columns.map((col) => escapeCsvValue(col.label));
    if (headerRow.length !== expectedColumnCount) {
      throw new Error(`Header column count mismatch: expected ${expectedColumnCount}, got ${headerRow.length}`);
    }
    lines.push(headerRow.join(','));

    // 5. Data Rows (Each MUST have exactly N columns in same order)
    if (data && data.length > 0) {
      data.forEach((rowItem, rowIndex) => {
        const rowCells: string[] = [];

        for (let c = 0; c < columns.length; c++) {
          const col = columns[c];
          let rawVal: any;

          // Support nested dot notation like 'farm.name' or simple property access
          if (col.key.includes('.')) {
            const parts = col.key.split('.');
            rawVal = parts.reduce((acc: any, part) => (acc ? acc[part] : undefined), rowItem);
          } else {
            rawVal = (rowItem as any)?.[col.key];
          }

          // Apply custom column formatter if defined
          if (col.format) {
            rawVal = col.format(rawVal, rowItem, rowIndex);
          }

          rowCells.push(escapeCsvValue(rawVal));
        }

        // Strict row column count validation
        if (rowCells.length !== expectedColumnCount) {
          throw new Error(
            `Row ${rowIndex + 1} column count mismatch: expected ${expectedColumnCount}, got ${rowCells.length}`
          );
        }

        lines.push(rowCells.join(','));
      });
    }

    // 6. Optional Summary / Total Row (Strictly N columns)
    if (summaryRow) {
      const summaryCells: string[] = [];
      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        const val = summaryRow[col.key] !== undefined ? summaryRow[col.key] : '';
        summaryCells.push(escapeCsvValue(val));
      }
      if (summaryCells.length !== expectedColumnCount) {
        throw new Error(`Summary row column count mismatch: expected ${expectedColumnCount}, got ${summaryCells.length}`);
      }
      lines.push(''); // Blank row before summary
      lines.push(summaryCells.join(','));
    }

    // 7. Build Final Content with UTF-8 BOM (\uFEFF) and RFC-4180 CRLF (\r\n) line endings
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // 8. Safe Browser Download
    const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', cleanFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (onSuccess) {
      onSuccess(cleanFilename, data ? data.length : 0);
    }
    return true;
  } catch (err: any) {
    const errorMsg = `Terjadi kesalahan saat membuat file CSV: ${err.message || err}`;
    console.error('CSV Export Exception:', err);
    if (onError) onError(errorMsg);
    return false;
  }
}

/**
 * Format helper for dates into clean DD/MM/YYYY format for spreadsheet cells.
 */
export function formatCsvDate(dateStr: string): string {
  if (!dateStr) return '';
  // Handles YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Helper to generate current timestamp for filenames (YYYY-MM-DD)
 */
export function getCsvDateStamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
