# Phase 18 — Analytics Dashboards

## Dashboard Architecture

Each dashboard page fetches aggregated data from dedicated backend endpoints. TanStack Query handles caching (staleTime: 60s) and background refetch.

```typescript
// frontend/src/services/analyticsService.ts
export const analyticsService = {
  getExecutiveDashboard: () => apiClient.get('/dashboard/analytics/executive'),
  getRiskDashboard: (filters) => apiClient.get('/dashboard/analytics/risk', { params: filters }),
  getPredictionDashboard: (filters) => apiClient.get('/dashboard/analytics/predictions', { params: filters }),
  getCourierDashboard: () => apiClient.get('/dashboard/analytics/couriers'),
  getPincodeDashboard: () => apiClient.get('/dashboard/analytics/pincodes'),
  getDatasetDashboard: () => apiClient.get('/dashboard/analytics/datasets'),
  getApiUsageDashboard: () => apiClient.get('/dashboard/analytics/api-usage'),
  getModelPerformanceDashboard: () => apiClient.get('/dashboard/analytics/models'),
};
```

---

## 1. Executive Dashboard

**Route:** `/dashboard`  
**Role:** ANALYST+

| Widget | Metric | Visualization |
|--------|--------|---------------|
| Total Predictions (30d) | Count | KPI Card with trend arrow |
| Average Risk Score | Mean riskScore | KPI Card |
| Delivery Success Rate | Predicted avg deliveryProbability | KPI Card |
| API Calls (30d) | Sum from ApiUsage | KPI Card |
| Risk Distribution | Count by riskLevel | Donut Chart (Chart.js) |
| Predictions Trend | Daily count, 30 days | Line Chart (Recharts) |
| Top Risk Pincodes | Top 5 by avg riskScore | Horizontal Bar Chart |
| Recent Predictions | Last 10 predictions | Data Table |
| Courier Recommendation Split | % recommended per courier | Pie Chart |

---

## 2. Risk Dashboard

**Route:** `/dashboard/risk`

| Widget | Metric | Visualization |
|--------|--------|---------------|
| Risk Score Distribution | Histogram buckets (0-25, 25-50, 50-75, 75-100) | Bar Chart |
| Risk by Pincode Tier | Avg riskScore per tier | Grouped Bar Chart |
| Risk by COD | COD vs non-COD avg risk | Comparison Cards |
| Risk by Weight Bucket | Avg riskScore per weight range | Bar Chart |
| High Risk Alerts | CRITICAL predictions last 24h | Alert List |
| Risk Trend (90d) | Daily avg riskScore | Area Chart |
| Risk Heatmap | Pincode risk on India map | Heatmap Component |

**Filters:** Date range, risk level, courier, pincode tier

---

## 3. Prediction Dashboard

**Route:** `/dashboard/predictions/analytics`

| Widget | Metric | Visualization |
|--------|--------|---------------|
| Total Predictions | Count by period | KPI Card |
| Predictions by Source | DASHBOARD vs PUBLIC_API vs BATCH | Stacked Bar |
| Avg Latency | Mean latencyMs | KPI Card with p95 |
| Model Version Usage | Predictions per model version | Bar Chart |
| Batch vs Single | Ratio | Pie Chart |
| Hourly Volume | Predictions per hour (24h) | Line Chart |
| Error Rate | Failed predictions / total | KPI Card |

---

## 4. Courier Dashboard

**Route:** `/dashboard/couriers/analytics`

| Widget | Metric | Visualization |
|--------|--------|---------------|
| Courier Success Rates | Per courier | Horizontal Bar |
| RTO Comparison | RTO rate per courier | Grouped Bar |
| Delivery Time Comparison | Avg days per courier | Bar Chart |
| Recommendation Frequency | Times recommended as #1 | Bar Chart |
| Courier Trend (6mo) | Monthly success rate lines | Multi-Line Chart |
| Cost Efficiency | Avg cost/kg per courier | Bar Chart |
| Courier vs Pincode Matrix | Heatmap (courier × tier) | Matrix Heatmap |

---

## 5. Pincode Dashboard

**Route:** `/dashboard/pincodes/analytics`

| Widget | Metric | Visualization |
|--------|--------|---------------|
| Highest Risk Pincodes | Top 20 by riskScore | Sortable Table |
| Pincode Tier Distribution | Count per tier | Donut Chart |
| Success Rate by Tier | Avg per tier | Bar Chart |
| Pincode Trend | Monthly avg riskScore | Line Chart |
| Geographic Heatmap | Risk scores on map | Map Component |
| Best/Worst Courier per Tier | Table | Data Table |

---

## 6. Dataset Dashboard

**Route:** `/dashboard/datasets/analytics`

| Widget | Metric | Visualization |
|--------|--------|---------------|
| Total Datasets | Count by status | KPI Cards |
| Total Rows Processed | Sum rowCount | KPI Card |
| Avg Quality Score | Mean qualityReport.overallScore | Gauge Chart |
| Dataset Size Distribution | File sizes | Histogram |
| Processing Time | Avg processing duration | KPI Card |
| Quality Issues | Common issue types | Bar Chart |
| Version History | Datasets with multiple versions | Timeline |

---

## 7. API Usage Dashboard

**Route:** `/dashboard/api-management/usage`

| Widget | Metric | Visualization |
|--------|--------|---------------|
| Calls This Month | Current vs plan limit | Progress Bar |
| Daily Call Volume | Last 30 days | Line Chart |
| Calls by Endpoint | Breakdown per endpoint | Pie Chart |
| Error Rate | 4xx + 5xx / total | KPI Card |
| Rate Limit Hits | 429 count | KPI Card |
| Top API Keys | Usage per key | Bar Chart |
| Quota Projection | Estimated month-end usage | Trend Line + projection |
| Latency by Endpoint | p50, p95, p99 | Grouped Bar |

---

## 8. Model Performance Dashboard

**Route:** `/dashboard/models/analytics`

| Widget | Metric | Visualization |
|--------|--------|---------------|
| Active Model | Current version + algorithm | Info Card |
| Model Metrics | F1, AUC, Accuracy, Precision, Recall | Metric Cards |
| Confusion Matrix | TP, FP, TN, FN | Matrix Heatmap |
| Version Comparison | Metrics across versions | Grouped Bar |
| CV Score Distribution | Box plot of 5-fold scores | Box Plot |
| Feature Importance | Top 10 features | Horizontal Bar |
| Training History | Timeline of train events | Timeline |
| Model Drift Indicator | Prediction distribution shift | Alert Badge |

---

## Shared Dashboard Components

```typescript
// Reusable widgets
<KpiCard title="Total Predictions" value={1234} trend={+12.5} period="30d" />
<TrendLineChart data={dailyData} xKey="date" yKey="count" />
<RiskGaugeChart score={23.5} level="LOW" />
<DateRangeFilter onChange={setFilters} defaultRange="30d" />
<ExportButton formats={['CSV', 'PDF']} onExport={handleExport} />
```

## Data Refresh Strategy

| Dashboard | staleTime | refetchInterval |
|-----------|-----------|-----------------|
| Executive | 60s | 5 min |
| Risk | 60s | 5 min |
| API Usage | 30s | 1 min |
| Model Performance | 5 min | 10 min |
| Others | 60s | 5 min |
