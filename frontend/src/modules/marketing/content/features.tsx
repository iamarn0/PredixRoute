import type { SvgIconComponent } from '@mui/icons-material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MapIcon from '@mui/icons-material/Map';
import ApiIcon from '@mui/icons-material/Api';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';

export type MarketingFeature = {
  Icon: SvgIconComponent;
  title: string;
  description: string;
  bullets: string[];
};

export const MARKETING_FEATURES: MarketingFeature[] = [
  {
    Icon: PsychologyIcon,
    title: 'Delivery Risk Scoring',
    description:
      'ML models score delivery and RTO risk before you ship — with SHAP-style explanations.',
    bullets: [
      'SHAP-style impact breakdown',
      'Risk levels: LOW → CRITICAL',
      'Model version tracking per prediction',
    ],
  },
  {
    Icon: LocalShippingIcon,
    title: 'Courier Recommendation',
    description: 'Rank couriers by pincode performance, cost, and SLA fit for every shipment.',
    bullets: [
      'Pincode-level courier performance',
      'Cost and SLA fit scoring',
      'Lane-level recommendation ranking',
    ],
  },
  {
    Icon: MapIcon,
    title: 'Pincode Intelligence',
    description: 'Historical success rates, tier classification, and lane-level courier breakdowns.',
    bullets: [
      '19K+ pincode intelligence',
      'Rural/metro tier classification',
      'Historical success rate analytics',
    ],
  },
  {
    Icon: ApiIcon,
    title: 'Developer-First API',
    description: 'REST API with scoped keys, rate limits, and batch evaluation for OMS/ERP integration.',
    bullets: [
      'POST /public/risk/evaluate',
      'Pincode & courier read APIs',
      'Batch evaluation support',
    ],
  },
  {
    Icon: TrendingUpIcon,
    title: 'Analytics Dashboard',
    description: 'Track predictions, compare couriers, and monitor API usage from a multi-tenant SaaS UI.',
    bullets: [
      'ORG_ADMIN & ANALYST roles',
      'Per-org pincode & courier analytics',
      'Prediction and API usage tracking',
    ],
  },
  {
    Icon: SecurityIcon,
    title: 'Enterprise Security',
    description: 'JWT auth, tenant isolation, RBAC, and audit-ready API key management.',
    bullets: [
      'Scoped API keys (TEST/LIVE)',
      'JWT auth and tenant isolation',
      'RBAC and audit-ready key management',
    ],
  },
];
