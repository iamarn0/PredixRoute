import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControlLabel,
  Grid,
  LinearProgress,
  Link,
  Stack,
  Switch,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import { predictionService } from '../../../services/predictionService';
import { intelligenceService } from '../../../services/intelligenceService';
import { PredictionResult, PincodeIntelligence } from '../../../types/api.types';
import { RiskBadge } from '../../../components/RiskBadge';
import { PageHeader } from '../../../components/PageHeader';
import { paths } from '../../../routes/paths';

const COURIERS = [
  { id: 'delhivery', label: 'Delhivery' },
  { id: 'bluedart', label: 'Blue Dart' },
  { id: 'dtdc', label: 'DTDC' },
  { id: 'ecom_express', label: 'Ecom Express' },
];

const RISK_COLORS: Record<string, string> = {
  LOW: '#059669',
  MEDIUM: '#D97706',
  HIGH: '#DC2626',
  CRITICAL: '#991B1B',
};

const INITIAL_FORM = {
  destinationPincode: '',
  deliveryAddress: '',
  weightGrams: 500,
  cod: false,
  codAmount: 0,
  orderValue: 0,
  availableCouriers: ['delhivery', 'bluedart', 'dtdc'] as string[],
  externalRef: '',
  customerPhone: '',
  customerName: '',
  productName: '',
};

function FormSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      <Stack spacing={2}>{children}</Stack>
    </Box>
  );
}

function MetricTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={700}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Box>
  );
}

function ScoreRing({
  value,
  label,
  color,
  suffix = '%',
}: {
  value: number;
  label: string;
  color: string;
  suffix?: string;
}) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <Stack alignItems="center" spacing={0.5}>
      <Box position="relative" display="inline-flex">
        <CircularProgress
          variant="determinate"
          value={pct}
          size={88}
          thickness={5}
          sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={800}>
            {suffix === '%' ? pct.toFixed(0) : value.toFixed(0)}
            {suffix}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>
    </Stack>
  );
}

function EmptyResultState() {
  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 420,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
      }}
    >
      <CardContent sx={{ textAlign: 'center', maxWidth: 320 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <AnalyticsOutlinedIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Ready to evaluate
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fill in shipment details and run an evaluation to see RTO risk, courier recommendations, and pincode intelligence.
        </Typography>
      </CardContent>
    </Card>
  );
}

function buildPayload(form: typeof INITIAL_FORM) {
  return {
    ...form,
    codAmount: form.cod ? form.codAmount : null,
    externalRef: form.externalRef || undefined,
    customerPhone: form.cod && form.customerPhone ? form.customerPhone : undefined,
    customerName: form.cod && form.customerName ? form.customerName : undefined,
    productName: form.productName || undefined,
  };
}

export function EvaluatePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [pincodeInfo, setPincodeInfo] = useState<PincodeIntelligence | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const canSubmit = form.availableCouriers.length > 0 && form.destinationPincode.length === 6;
  const riskColor = result ? RISK_COLORS[result.riskLevel] ?? '#64748B' : '#4F46E5';

  const toggleCourier = (id: string) => {
    setForm((f) => ({
      ...f,
      availableCouriers: f.availableCouriers.includes(id)
        ? f.availableCouriers.filter((x) => x !== id)
        : [...f.availableCouriers, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const [prediction, pincode] = await Promise.all([
        predictionService.evaluate(buildPayload(form)),
        intelligenceService.getPincode(form.destinationPincode).catch(() => null),
      ]);
      setResult(prediction);
      setVerifyResult(null);
      setPincodeInfo(pincode);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Evaluation failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await predictionService.evaluateAndVerify(buildPayload(form));
      setResult(data.prediction);
      setVerifyResult(
        data.codVerification.triggered
          ? 'COD WhatsApp verification started. Check COD Verify for session status.'
          : data.codVerification.skippedReason ?? 'Verification not started.',
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Verification failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const addressQuality = result?.addressAnalysis
    ? Math.round((result.addressQualityScore ?? result.addressAnalysis.qualityScore) * 100)
    : null;

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Shipment Risk Evaluation"
        subtitle="Score RTO risk and get courier recommendations for a single order"
      />

      {loading && <LinearProgress />}

      <Grid container spacing={3} alignItems="flex-start">
        <Grid item xs={12} lg={6}>
          <Card sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  {error && <Alert severity="error">{error}</Alert>}

                  <FormSection
                    icon={<LocationOnOutlinedIcon fontSize="small" />}
                    title="Delivery details"
                    subtitle="Full address is used for risk scoring"
                  >
                    <TextField
                      label="Destination pincode"
                      placeholder="110001"
                      value={form.destinationPincode}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          destinationPincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                        }))
                      }
                      inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                      required
                      fullWidth
                      error={form.destinationPincode.length > 0 && form.destinationPincode.length < 6}
                      helperText={
                        form.destinationPincode.length > 0 && form.destinationPincode.length < 6
                          ? 'Enter a 6-digit pincode'
                          : '6-digit Indian pincode'
                      }
                    />
                    <TextField
                      label="Complete delivery address"
                      placeholder="Flat 12, Block A, Connaught Place, New Delhi 110001"
                      value={form.deliveryAddress}
                      onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
                      required
                      fullWidth
                      multiline
                      minRows={3}
                    />
                  </FormSection>

                  <Divider />

                  <FormSection
                    icon={<LocalShippingOutlinedIcon fontSize="small" />}
                    title="Order details"
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Weight (grams)"
                          type="number"
                          value={form.weightGrams}
                          onChange={(e) => setForm((f) => ({ ...f, weightGrams: Number(e.target.value) }))}
                          required
                          fullWidth
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Order value (INR)"
                          type="number"
                          value={form.orderValue || ''}
                          onChange={(e) => setForm((f) => ({ ...f, orderValue: Number(e.target.value) }))}
                          required
                          fullWidth
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                    </Grid>
                    <TextField
                      label="Product name"
                      placeholder="Optional"
                      value={form.productName}
                      onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                      fullWidth
                    />
                  </FormSection>

                  <Divider />

                  <FormSection
                    icon={<PaymentsOutlinedIcon fontSize="small" />}
                    title="Payment"
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.cod}
                          onChange={(e) => setForm((f) => ({ ...f, cod: e.target.checked }))}
                        />
                      }
                      label="Cash on delivery (COD)"
                    />
                    <Collapse in={form.cod}>
                      <Stack spacing={2}>
                        <TextField
                          label="COD amount (INR)"
                          type="number"
                          value={form.codAmount || ''}
                          onChange={(e) => setForm((f) => ({ ...f, codAmount: Number(e.target.value) }))}
                          fullWidth
                          inputProps={{ min: 0 }}
                        />
                        <TextField
                          label="Customer phone"
                          placeholder="+919876543210"
                          value={form.customerPhone}
                          onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                          fullWidth
                          helperText="E.164 format — required for COD verification"
                        />
                        <TextField
                          label="Customer name"
                          value={form.customerName}
                          onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                          fullWidth
                        />
                      </Stack>
                    </Collapse>
                  </FormSection>

                  <Divider />

                  <FormSection
                    icon={<LocalShippingOutlinedIcon fontSize="small" />}
                    title="Available couriers"
                    subtitle="Select couriers to rank"
                  >
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {COURIERS.map((c) => {
                        const selected = form.availableCouriers.includes(c.id);
                        return (
                          <Chip
                            key={c.id}
                            label={c.label}
                            clickable
                            onClick={() => toggleCourier(c.id)}
                            color={selected ? 'primary' : 'default'}
                            variant={selected ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 500, px: 0.5 }}
                          />
                        );
                      })}
                    </Stack>
                    {form.availableCouriers.length === 0 && (
                      <Typography variant="caption" color="error">
                        Select at least one courier
                      </Typography>
                    )}
                  </FormSection>

                  <Box>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => setAdvancedOpen((o) => !o)}
                      endIcon={advancedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{ color: 'text.secondary', mb: advancedOpen ? 1.5 : 0 }}
                    >
                      Advanced options
                    </Button>
                    <Collapse in={advancedOpen}>
                      <TextField
                        label="External order reference"
                        placeholder="ORD-12345"
                        value={form.externalRef}
                        onChange={(e) => setForm((f) => ({ ...f, externalRef: e.target.value }))}
                        fullWidth
                      />
                    </Collapse>
                  </Box>

                  <Stack spacing={1.5}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading || !canSubmit}
                      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <BoltOutlinedIcon />}
                    >
                      {loading ? 'Evaluating…' : 'Evaluate risk'}
                    </Button>
                    {form.cod && form.customerPhone && (
                      <Button
                        variant="outlined"
                        size="large"
                        fullWidth
                        disabled={loading || !canSubmit}
                        startIcon={<VerifiedUserOutlinedIcon />}
                        onClick={handleVerify}
                      >
                        Evaluate + send COD verify
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          {!result ? (
            <EmptyResultState />
          ) : (
            <Stack spacing={2}>
              <Card>
                <CardContent>
                  <Stack spacing={2.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          Prediction result
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
                          <Typography variant="h6" fontWeight={700}>
                            Risk assessment
                          </Typography>
                          <RiskBadge level={result.riskLevel} score={result.riskScore} />
                        </Stack>
                      </Box>
                      <Link
                        component={RouterLink}
                        to={paths.app.prediction(result.predictionId)}
                        variant="body2"
                        fontWeight={600}
                      >
                        View details →
                      </Link>
                    </Stack>

                    <Stack
                      direction="row"
                      justifyContent="space-around"
                      alignItems="center"
                      sx={{
                        py: 2,
                        px: 1,
                        borderRadius: 2,
                        bgcolor: alpha(riskColor, 0.06),
                      }}
                    >
                      <ScoreRing
                        value={result.deliveryProbability * 100}
                        label="Delivery probability"
                        color="#059669"
                      />
                      <ScoreRing
                        value={result.riskScore}
                        label="Risk score"
                        color={riskColor}
                        suffix=""
                      />
                    </Stack>

                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <MetricTile label="Recommended courier" value={result.recommendedCourier} />
                      </Grid>
                      <Grid item xs={6}>
                        <MetricTile
                          label="Address quality"
                          value={addressQuality != null ? `${addressQuality}%` : '—'}
                          hint={
                            result.addressAnalysis?.pincodeMatch
                              ? 'Pincode verified'
                              : result.addressAnalysis
                                ? 'Check address'
                                : undefined
                          }
                        />
                      </Grid>
                    </Grid>

                    {result.addressAnalysis && result.addressAnalysis.issues.length > 0 && (
                      <Stack spacing={1}>
                        {result.addressAnalysis.issues.slice(0, 3).map((issue) => (
                          <Alert key={issue} severity="warning" sx={{ py: 0.5 }}>
                            {issue}
                          </Alert>
                        ))}
                      </Stack>
                    )}

                    {result.verificationEligible && !verifyResult && (
                      <Alert severity="info" icon={<VerifiedUserOutlinedIcon />}>
                        This COD order qualifies for WhatsApp verification (MEDIUM+ risk).
                      </Alert>
                    )}
                    {verifyResult && (
                      <Alert severity={verifyResult.includes('started') ? 'success' : 'warning'}>
                        {verifyResult}
                      </Alert>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      Model v{result.modelVersion} · ID {result.predictionId}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              {result.explanations.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Risk factors
                    </Typography>
                    <Stack spacing={1} divider={<Divider flexItem />}>
                      {result.explanations.slice(0, 6).map((ex, i) => (
                        <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start" py={0.5}>
                          <Box
                            sx={{
                              mt: 0.25,
                              color: ex.direction === 'INCREASES_RISK' ? 'warning.main' : 'success.main',
                            }}
                          >
                            {ex.direction === 'INCREASES_RISK' ? (
                              <TrendingUpIcon fontSize="small" />
                            ) : (
                              <TrendingDownIcon fontSize="small" />
                            )}
                          </Box>
                          <Box flex={1}>
                            <Typography variant="body2">{ex.description}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ex.feature} · impact {ex.impact > 0 ? '+' : ''}
                              {ex.impact.toFixed(2)}
                            </Typography>
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {pincodeInfo && (
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <LocationOnOutlinedIcon color="primary" fontSize="small" />
                      <Typography variant="subtitle1" fontWeight={600}>
                        Pincode intelligence — {pincodeInfo.pincode}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {pincodeInfo.city}, {pincodeInfo.state} · Tier {pincodeInfo.tier}
                      {' · '}
                      {(pincodeInfo.source ?? 'DEFAULT') === 'DATABASE'
                        ? 'Tenant analytics'
                        : 'Default fallback'}
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6} sm={3}>
                        <MetricTile
                          label="Success rate"
                          value={`${(pincodeInfo.successRate * 100).toFixed(1)}%`}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <MetricTile label="RTO rate" value={`${(pincodeInfo.rtoRate * 100).toFixed(1)}%`} />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <MetricTile label="Best courier" value={pincodeInfo.bestCourier ?? '—'} />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <MetricTile label="Avg delivery" value={`${pincodeInfo.avgDeliveryDays}d`} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Stack>
          )}
        </Grid>
      </Grid>
    </Stack>
  );
}
