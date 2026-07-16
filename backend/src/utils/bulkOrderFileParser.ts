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

function normalizeColumnKey(header: string): string {
  return normalizeHeader(header).toLowerCase().replace(/[\s_]+/g, '');
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

function buildColumnIndex(row: Record<string, string>): Map<string, string> {
  const index = new Map<string, string>();
  for (const [key, value] of Object.entries(row)) {
    index.set(normalizeColumnKey(key), value);
  }
  return index;
}

function getRowValue(row: Record<string, string>, aliases: string[]): string | undefined {
  const index = buildColumnIndex(row);
  for (const alias of aliases) {
    const value = index.get(normalizeColumnKey(alias));
    if (value) return value;
  }
  return undefined;
}

function parseBool(value: unknown): boolean {
  const s = String(value).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'cod';
}

function parsePaymentType(value: unknown): boolean {
  const s = String(value).trim().toLowerCase();
  if (!s) return false;
  if (s.includes('cod') || s.includes('cash on delivery')) return true;
  if (s.includes('prepaid') || s.includes('pre-paid') || s.includes('online') || s.includes('upi')) {
    return false;
  }
  return parseBool(value);
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function normalizePincode(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return digits.slice(-6).padStart(6, '0');
}

function joinAddress(parts: Array<string | undefined>): string {
  return parts.map((p) => p?.trim()).filter(Boolean).join(', ');
}

function weightToGrams(value: unknown): number {
  const n = parseNumber(value);
  if (n === null || n <= 0) return 500;
  // Template / MIS exports often use kg (e.g. 0.5, 16); legacy CSV uses grams.
  return n < 100 ? Math.round(n * 1000) : Math.round(n);
}

function sumOrderValue(row: Record<string, string>): number {
  let total = 0;
  for (let i = 1; i <= 4; i += 1) {
    const price =
      parseNumber(getRowValue(row, [`Item Price${i}`, `Price${i}`, `item_price${i}`, `price${i}`])) ??
      null;
    const qty =
      parseNumber(getRowValue(row, [`Quantity${i}`, `Qty${i}`, `quantity${i}`, `qty${i}`])) ?? null;
    if (price !== null && qty !== null) total += price * qty;
  }
  if (total > 0) return total;

  const directTotal =
    parseNumber(
      getRowValue(row, [
        'Total _Value',
        'Total Value',
        'Total_Value',
        'Total Amount',
        'Total_Amount',
        'order_value',
        'order_amount',
        'Invoice Value',
        'Invoice_Value',
      ]),
    ) ??
    parseNumber(getRowValue(row, ['COD Amount', 'COD_Collectable_Amount', 'cod_amount'])) ??
    0;

  return Math.max(directTotal ?? 0, 0);
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
  const rawPincode = getRowValue(row, [
    'Shipping Pincode',
    'Shipping_Pincode',
    'shipping pincode',
    'destination_pincode',
    'pincode',
  ]);
  const pincode = rawPincode ? normalizePincode(rawPincode) : '';

  const deliveryAddress =
    joinAddress([
      getRowValue(row, [
        'Shipping Address Line1',
        'Shipping_Address_Line1',
        'Shipping Address Line 1',
        'delivery_address',
        'address',
        'full_address',
      ]),
      getRowValue(row, ['Shipping Address Line2', 'Shipping_Address_Line2', 'Shipping Address Line 2']),
      getRowValue(row, ['Shipping City', 'Shipping_City', 'shipping city']),
      getRowValue(row, ['Shipping State', 'Shipping_State', 'shipping state']),
    ]) || undefined;

  if (!pincode || !deliveryAddress) return null;

  const paymentType = getRowValue(row, ['Payment Type', 'Payment_Type', 'payment_type']) ?? '';
  const cod = paymentType ? parsePaymentType(paymentType) : parseBool(getRowValue(row, ['cod']) ?? 'false');

  const orderValue = sumOrderValue(row);
  const codAmount = parseNumber(
    getRowValue(row, ['COD Amount', 'COD_Collectable_Amount', 'COD Collectable Amount', 'cod_amount']),
  );

  return {
    destinationPincode: pincode,
    deliveryAddress: deliveryAddress.trim(),
    weightGrams: weightToGrams(
      getRowValue(row, [
        'Package Weight',
        'Package_Weight_Kg',
        'Package Weight Kg',
        'Package_Weight',
        'weight_grams',
        'weight',
      ]) ?? '500',
    ),
    cod,
    codAmount: cod ? codAmount : null,
    orderValue: orderValue > 0 ? orderValue : cod && codAmount && codAmount > 0 ? codAmount : 1,
    availableCouriers: defaultCouriers,
    externalRef: getRowValue(row, ['Order Id', 'Order_Id', 'external_ref', 'order_id']),
    customerPhone: getRowValue(row, ['Phone Number', 'Phone_Number', 'customer_phone']),
    customerName: getRowValue(row, ['Customer Name', 'Customer_Name', 'customer_name']),
    productName: getRowValue(row, ['Product Name1', 'Product_Name1', 'product_name']),
  };
}
