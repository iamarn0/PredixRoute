import path from 'path';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export const BULK_ORDER_TEMPLATE_FILENAME = 'bulk_order_template.xlsx';

export function getBulkOrderTemplatePath(): string {
  return path.join(__dirname, '../../assets', BULK_ORDER_TEMPLATE_FILENAME);
}

function normalizeHeader(header: string): string {
  return header.replace(/\s*\*+\s*$/, '').trim();
}

function normalizeRow(row: Record<string, unknown>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === null || value === undefined) continue;
    const str = String(value).trim();
    if (!str) continue;
    normalized[normalizeHeader(key)] = str;
  }
  return normalized;
}

function parseBool(value: unknown): boolean {
  const s = String(value).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'cod';
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function joinAddress(parts: Array<string | undefined>): string {
  return parts.map((p) => p?.trim()).filter(Boolean).join(', ');
}

function weightToGrams(value: unknown): number {
  const n = parseNumber(value);
  if (n === null || n <= 0) return 500;
  // Template uses kg (e.g. 0.5); legacy CSV uses grams.
  return n < 100 ? Math.round(n * 1000) : Math.round(n);
}

function sumOrderValue(row: Record<string, string>): number {
  let total = 0;
  for (let i = 1; i <= 4; i += 1) {
    const price = parseNumber(row[`Item Price${i}`]);
    const qty = parseNumber(row[`Quantity${i}`]);
    if (price !== null && qty !== null) total += price * qty;
  }
  if (total > 0) return total;

  const fallback =
    parseNumber(row.order_value) ??
    parseNumber(row.order_amount) ??
    parseNumber(row['COD Amount']) ??
    0;
  return fallback ?? 0;
}

export function parseBulkOrderFile(buffer: Buffer, filename: string): Record<string, string>[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    return rawRows.map(normalizeRow).filter((row) => Object.keys(row).length > 0);
  }

  const content = buffer.toString('utf-8');
  const rawRows = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  return rawRows.map(normalizeRow).filter((row) => Object.keys(row).length > 0);
}

export function isSupportedBulkOrderFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.xls');
}

export function mapBulkOrderRow(row: Record<string, string>, defaultCouriers: string[]) {
  const pincode = row['Shipping Pincode'] || row.destination_pincode || row.pincode;
  const deliveryAddress =
    joinAddress([
      row['Shipping Address Line1'] || row.delivery_address || row.address || row.full_address,
      row['Shipping Address Line2'],
      row['Shipping City'],
      row['Shipping State'],
    ]) || undefined;

  if (!pincode || !deliveryAddress) return null;

  const paymentType = row['Payment Type'] || row.payment_type || '';
  const cod = paymentType ? parseBool(paymentType) : parseBool(row.cod ?? 'false');

  return {
    destinationPincode: pincode.trim(),
    deliveryAddress: deliveryAddress.trim(),
    weightGrams: weightToGrams(row['Package Weight'] || row.weight_grams || row.weight || 500),
    cod,
    codAmount: parseNumber(row['COD Amount'] ?? row.cod_amount),
    orderValue: sumOrderValue(row),
    availableCouriers: defaultCouriers,
    externalRef: row['Order Id'] || row.external_ref || row.order_id || undefined,
    customerPhone: row['Phone Number'] || row.customer_phone || undefined,
    customerName: row['Customer Name'] || row.customer_name || undefined,
    productName: row['Product Name1'] || row.product_name || undefined,
  };
}
