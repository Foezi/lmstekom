import XLSX from 'xlsx';

/**
 * Parse workbook (xlsx/xls/csv) dari buffer menjadi array of object
 * berdasarkan baris header pertama.
 */
export function parseWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('File tidak memiliki sheet');
  const sheet = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
}

/** Buat buffer file template .xlsx berisi header + satu baris contoh. */
export function buildTemplate(headers, exampleRow, sheetName = 'Template') {
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/** Buat buffer export .xlsx dari array of object sesuai daftar kolom [{header, key}]. */
export function buildExport(rows, columns, sheetName = 'Data') {
  const aoa = [columns.map((c) => c.header), ...rows.map((row) => columns.map((c) => row[c.key] ?? ''))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = columns.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
