import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { IDatasetQualityIssue } from '../models/dataset.model';
import { resolveDatasetPath } from '../utils/datasetStorage';

const COLUMN_ALIASES: Record<string, string[]> = {
  destination_pincode: [
    'destination_pincode',
    'pincode',
    'to_pincode',
    'delivery_pincode',
    'dest_pincode',
    'consignee_pincode',
    'customer_pincode',
    'shipping_pincode',
    'ship_to_pincode',
    'receiver_pincode',
    'pin_code',
    'destination_pin',
    'consignee_pin',
    'to_pin',
    'delivery_pin',
    'zip',
  ],
  weight_grams: ['weight_grams', 'weight_g', 'weight_in_grams', 'package_weight_grams', 'shipment_weight_grams'],
  weight_kg: [
    'weight_kg',
    'weight_in_kg',
    'charged_weight',
    'charged_wt',
    'dead_weight',
    'package_weight',
    'weight',
    'shipment_weight',
    'phys_weight',
    'physical_weight',
    'gross_weight',
    'wt',
  ],
  cod: ['cod', 'is_cod', 'cash_on_delivery', 'cod_flag'],
  payment_mode: [
    'payment_mode',
    'payment_type',
    'payment_method',
    'order_payment_type',
    'pay_mode',
    'mode_of_payment',
    'pay_type',
  ],
  cod_amount: [
    'cod_amount',
    'cod_value',
    'cod_amt',
    'collectable_amount',
    'collectable_value',
    'collectible_amount',
    'cod_collectable',
    'cod_collection_amount',
    'cod_to_collect',
    'amount_to_collect',
  ],
  order_value: [
    'order_value',
    'order_amount',
    'invoice_value',
    'order_total',
    'shipment_value',
    'invoice_amount',
    'product_value',
    'total_amount',
    'declared_value',
    'bill_amount',
    'net_amount',
  ],
  courier: [
    'courier',
    'courier_name',
    'courier_code',
    'carrier',
    'shipping_partner',
    'logistics_partner',
    'lsp',
    'lsp_name',
    'courier_partner',
    'shipping_provider',
    'delivery_partner',
    'shipping_courier',
    'logistics_name',
  ],
  status: [
    'final_status',
    'final_delivery_status',
    'closure_status',
    'terminal_status',
    'status',
    'delivery_status',
    'shipment_status',
    'current_status',
    'latest_status',
    'order_status',
    'outcome',
    'delivery_outcome',
  ],
  address_quality_score: ['address_quality_score', 'address_quality', 'address_score'],
};

const SUCCESS_STATUSES = new Set([
  'delivered',
  'success',
  'completed',
  'delivered_successfully',
  'successful',
  'reattempt_delivered',
  'delivered_after_reattempt',
  'delivered_on_reattempt',
  'second_attempt_delivered',
]);
const FAIL_STATUSES = new Set([
  'rto',
  'returned',
  'cancelled',
  'return_to_origin',
  'rto_initiated',
  'rto_in_transit',
  'return_to_seller',
  'returned_to_origin',
]);
/** In-flight statuses (e.g. NDR before seller chooses RTO vs reattempt) — excluded from training. */
const INTERMEDIATE_STATUSES = new Set([
  'ndr',
  'non_delivery_report',
  'non_delivery',
  'failed',
  'undelivered',
  'delivery_attempt_failed',
  'failed_delivery',
  'out_for_delivery',
  'in_transit',
  'pending',
  'picked_up',
  'shipped',
  'manifested',
  'reattempt',
  'reattempt_scheduled',
  'awaiting_seller_action',
  'seller_action_pending',
  'open',
  'processing',
]);

export interface ProcessedDatasetResult {
  processedRelativePath: string;
  rowCount: number;
  qualityScore: number;
  qualityIssues: IDatasetQualityIssue[];
  columnMapping: Record<string, string>;
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[-./]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function findHeader(headers: string[], normalized: string[], aliases: string[]) {
  const match = aliases.find((alias) => normalized.includes(alias));
  if (!match) return undefined;
  return headers[normalized.indexOf(match)];
}

function detectColumnMapping(headers: string[]) {
  const normalized = headers.map(normalizeHeader);
  const mapping: Record<string, string> & { _weightUnit?: 'grams' | 'kg'; _codFromPaymentMode?: boolean } = {};
  const issues: IDatasetQualityIssue[] = [];

  const pincodeHeader = findHeader(headers, normalized, COLUMN_ALIASES.destination_pincode);
  if (pincodeHeader) mapping.destination_pincode = pincodeHeader;
  else issues.push({ severity: 'ERROR', message: 'Required column not found: destination pincode', column: 'destination_pincode' });

  const weightGramsHeader = findHeader(headers, normalized, COLUMN_ALIASES.weight_grams);
  const weightKgHeader = findHeader(headers, normalized, COLUMN_ALIASES.weight_kg);
  if (weightGramsHeader) {
    mapping.weight_grams = weightGramsHeader;
    mapping._weightUnit = 'grams';
  } else if (weightKgHeader) {
    mapping.weight_grams = weightKgHeader;
    mapping._weightUnit = 'kg';
  } else {
    issues.push({ severity: 'ERROR', message: 'Required column not found: weight', column: 'weight_grams' });
  }

  const codHeader = findHeader(headers, normalized, COLUMN_ALIASES.cod);
  const paymentModeHeader = findHeader(headers, normalized, COLUMN_ALIASES.payment_mode);
  if (codHeader) {
    mapping.cod = codHeader;
  } else if (paymentModeHeader) {
    mapping.cod = paymentModeHeader;
    mapping._codFromPaymentMode = true;
  } else {
    issues.push({ severity: 'ERROR', message: 'Required column not found: cod or payment_mode', column: 'cod' });
  }

  const orderValueHeader = findHeader(headers, normalized, COLUMN_ALIASES.order_value);
  if (orderValueHeader) mapping.order_value = orderValueHeader;
  else issues.push({ severity: 'ERROR', message: 'Required column not found: order_value', column: 'order_value' });

  const courierHeader = findHeader(headers, normalized, COLUMN_ALIASES.courier);
  if (courierHeader) mapping.courier = courierHeader;
  else issues.push({ severity: 'ERROR', message: 'Required column not found: courier', column: 'courier' });

  const statusHeader = findHeader(headers, normalized, COLUMN_ALIASES.status);
  if (statusHeader) mapping.status = statusHeader;
  else issues.push({ severity: 'ERROR', message: 'Required column not found: status', column: 'status' });

  const addressHeader = findHeader(headers, normalized, COLUMN_ALIASES.address_quality_score);
  if (addressHeader) mapping.address_quality_score = addressHeader;

  const codAmountHeader = findHeader(headers, normalized, COLUMN_ALIASES.cod_amount);
  if (codAmountHeader) mapping.cod_amount = codAmountHeader;

  return { mapping, issues };
}

function parseCod(value: unknown): boolean {
  const v = String(value).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'y';
}

function parseCodFromPaymentMode(value: unknown): boolean {
  const v = String(value).trim().toLowerCase();
  if (v.includes('cod') || v.includes('cash on delivery') || v === 'cash_on_delivery') return true;
  if (v.includes('prepaid') || v.includes('pre-paid') || v === 'ppd' || v.includes('online') || v.includes('upi')) {
    return false;
  }
  return parseCod(value);
}

function parseWeightGrams(raw: unknown, unit: 'grams' | 'kg'): number {
  const n = parseFloat(String(raw).replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return NaN;
  const grams = unit === 'kg' ? Math.round(n * 1000) : Math.round(n);
  if (grams <= 0 || grams > 50000) return NaN;
  return grams;
}

function normalizeStatus(status: unknown): string {
  return String(status).trim().toLowerCase().replace(/\s+/g, '_');
}

function classifyStatus(status: unknown): { label: number } | { skip: 'intermediate' | 'unknown' } {
  const s = normalizeStatus(status);
  if (SUCCESS_STATUSES.has(s)) return { label: 1 };
  if (FAIL_STATUSES.has(s)) return { label: 0 };
  if (INTERMEDIATE_STATUSES.has(s)) return { skip: 'intermediate' };
  return { skip: 'unknown' };
}

export async function processDatasetCsv(
  rawRelativePath: string,
  organizationId: string,
  datasetPublicId: string,
): Promise<ProcessedDatasetResult> {
  const rawPath = resolveDatasetPath(rawRelativePath);
  const content = await fs.readFile(rawPath, 'utf-8');
  const records = parse(content, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true }) as Record<
    string,
    string
  >[];

  if (records.length < 100) {
    return {
      processedRelativePath: '',
      rowCount: records.length,
      qualityScore: 0,
      qualityIssues: [{ severity: 'ERROR', message: `Minimum 100 rows required for training (found ${records.length})` }],
      columnMapping: {},
    };
  }

  const headers = Object.keys(records[0] ?? {});
  const { mapping, issues } = detectColumnMapping(headers);
  if (issues.some((i) => i.severity === 'ERROR')) {
    return { processedRelativePath: '', rowCount: records.length, qualityScore: 0, qualityIssues: issues, columnMapping: mapping };
  }

  const processedRows = [
    'destination_pincode,weight_grams,cod,cod_amount,order_value,address_quality_score,available_couriers,label',
  ];
  let invalidPincode = 0;
  let invalidStatus = 0;
  let intermediateStatus = 0;
  let invalidWeight = 0;

  for (const row of records) {
    const pincode = String(row[mapping.destination_pincode]).trim();
    if (!/^\d{6}$/.test(pincode)) {
      invalidPincode++;
      continue;
    }
    const weight = parseWeightGrams(row[mapping.weight_grams], mapping._weightUnit ?? 'grams');
    if (!Number.isFinite(weight)) {
      invalidWeight++;
      continue;
    }
    const orderValue = parseFloat(String(row[mapping.order_value]).replace(/,/g, ''));
    if (!Number.isFinite(orderValue) || orderValue <= 0) continue;

    const statusResult = classifyStatus(row[mapping.status]);
    if ('skip' in statusResult) {
      if (statusResult.skip === 'intermediate') intermediateStatus++;
      else invalidStatus++;
      continue;
    }
    const label = statusResult.label;

    const cod = mapping._codFromPaymentMode
      ? parseCodFromPaymentMode(row[mapping.cod])
      : parseCod(row[mapping.cod]);
    const codAmountRaw = mapping.cod_amount ? row[mapping.cod_amount] : '';
    const codAmount = codAmountRaw ? parseFloat(String(codAmountRaw).replace(/,/g, '')) : 0;
    const addressScore = mapping.address_quality_score
      ? parseFloat(String(row[mapping.address_quality_score]))
      : 0.75;
    const courier = String(row[mapping.courier]).trim().toLowerCase().replace(/\s+/g, '_');

    processedRows.push(
      [
        pincode,
        weight,
        cod ? 1 : 0,
        cod && codAmount > 0 ? codAmount : 0,
        orderValue,
        Number.isFinite(addressScore) ? Math.min(1, Math.max(0, addressScore)) : 0.75,
        courier,
        label,
      ].join(','),
    );
  }

  const validCount = processedRows.length - 1;
  const qualityIssues = [...issues];
  if (invalidPincode > 0) {
    qualityIssues.push({ severity: 'WARNING', message: `${invalidPincode} rows skipped (invalid pincode)`, column: 'destination_pincode' });
  }
  if (invalidWeight > 0) {
    qualityIssues.push({ severity: 'WARNING', message: `${invalidWeight} rows skipped (invalid weight)`, column: 'weight_grams' });
  }
  if (intermediateStatus > 0) {
    qualityIssues.push({
      severity: 'WARNING',
      message: `${intermediateStatus} rows skipped (in-flight status such as NDR — use final delivered or rto only)`,
      column: 'status',
    });
  }
  if (invalidStatus > 0) {
    qualityIssues.push({ severity: 'WARNING', message: `${invalidStatus} rows skipped (unrecognized status)`, column: 'status' });
  }

  if (validCount < 100) {
    qualityIssues.push({
      severity: 'ERROR',
      message: `Only ${validCount} valid rows after cleaning (minimum 100 required)`,
    });
    return { processedRelativePath: '', rowCount: validCount, qualityScore: 0, qualityIssues, columnMapping: mapping };
  }

  const errorCount = qualityIssues.filter((i) => i.severity === 'ERROR').length;
  const warningCount = qualityIssues.filter((i) => i.severity === 'WARNING').length;
  const qualityScore = Math.max(0, Math.min(100, 100 - errorCount * 10 - warningCount * 2));

  const processedPath = path.join(path.dirname(rawPath), 'processed.csv');
  await fs.writeFile(processedPath, processedRows.join('\n'), 'utf-8');
  const processedRelativePath = `${organizationId}/${datasetPublicId}/processed.csv`;

  return { processedRelativePath, rowCount: validCount, qualityScore, qualityIssues, columnMapping: mapping };
}
