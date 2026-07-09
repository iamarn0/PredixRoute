import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { demoService, DemoPredictionResult } from '../../../services/demoService';
import { paths } from '../../../routes/paths';
import { RiskBadge } from '../../../components/RiskBadge';

const COURIERS = ['delhivery', 'bluedart', 'dtdc', 'ecom_express'];

export function TryPage() {
  const [form, setForm] = useState({
    destinationPincode: '110001',
    deliveryAddress: 'Flat 12, Block A, Connaught Place, New Delhi, Delhi 110001',
    weightGrams: 500,
    cod: true,
    codAmount: 1499,
    orderValue: 1499,
    availableCouriers: ['delhivery', 'bluedart'],
  });
  const [result, setResult] = useState<DemoPredictionResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const prediction = await demoService.evaluate({
        ...form,
        codAmount: form.cod ? form.codAmount : null,
      });
      setResult(prediction);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Demo evaluation failed. Try again later.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={3}>
        <Box textAlign="center">
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Try RTO Risk Free
          </Typography>
          <Typography color="text.secondary" maxWidth={560} mx="auto">
            Anonymous demo — enter the full delivery address. Risk is scored from address completeness, not pincode alone.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField
                      label="Destination Pincode"
                      value={form.destinationPincode}
                      onChange={(e) => setForm((f) => ({ ...f, destinationPincode: e.target.value }))}
                      inputProps={{ maxLength: 6 }}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Complete Delivery Address"
                      value={form.deliveryAddress}
                      onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
                      required
                      fullWidth
                      multiline
                      minRows={3}
                    />
                    <TextField
                      label="Weight (grams)"
                      type="number"
                      value={form.weightGrams}
                      onChange={(e) => setForm((f) => ({ ...f, weightGrams: Number(e.target.value) }))}
                      required
                      fullWidth
                    />
                    <FormControlLabel
                      control={<Switch checked={form.cod} onChange={(e) => setForm((f) => ({ ...f, cod: e.target.checked }))} />}
                      label="Cash on Delivery"
                    />
                    {form.cod && (
                      <TextField
                        label="COD Amount"
                        type="number"
                        value={form.codAmount}
                        onChange={(e) => setForm((f) => ({ ...f, codAmount: Number(e.target.value) }))}
                        fullWidth
                      />
                    )}
                    <TextField
                      label="Order Value (INR)"
                      type="number"
                      value={form.orderValue}
                      onChange={(e) => setForm((f) => ({ ...f, orderValue: Number(e.target.value) }))}
                      required
                      fullWidth
                    />
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Available Couriers
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {COURIERS.map((c) => (
                          <Chip
                            key={c}
                            label={c}
                            clickable
                            color={form.availableCouriers.includes(c) ? 'primary' : 'default'}
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                availableCouriers: f.availableCouriers.includes(c)
                                  ? f.availableCouriers.filter((x) => x !== c)
                                  : [...f.availableCouriers, c],
                              }))
                            }
                          />
                        ))}
                      </Stack>
                    </Box>
                    <Button type="submit" variant="contained" size="large" disabled={loading || form.availableCouriers.length === 0}>
                      {loading ? 'Evaluating…' : 'Evaluate Risk'}
                    </Button>
                  </Stack>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            {result ? (
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">Demo Result</Typography>
                      <RiskBadge level={result.riskLevel as 'LOW'} score={result.riskScore} />
                    </Box>
                    <Typography>
                      Delivery probability: <strong>{(result.deliveryProbability * 100).toFixed(1)}%</strong>
                    </Typography>
                    <Typography>
                      Recommended courier: <strong>{result.recommendedCourier}</strong>
                    </Typography>
                    {(result.addressQualityScore != null || result.addressAnalysis) && (
                      <Typography variant="body2">
                        Address quality:{' '}
                        <strong>
                          {Math.round(
                            (result.addressQualityScore ?? result.addressAnalysis?.qualityScore ?? 0) * 100,
                          )}
                          %
                        </strong>
                      </Typography>
                    )}
                    {result.addressAnalysis?.issues?.slice(0, 2).map((issue) => (
                      <Alert key={issue} severity="warning" sx={{ py: 0 }}>
                        {issue}
                      </Alert>
                    ))}
                    <Alert severity="info">Demo mode — register for API access, bulk evaluation, and COD verification.</Alert>
                    <Button component={RouterLink} to={paths.customer.register} variant="contained">
                      Get Started Free
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CardContent>
                  <Typography color="text.secondary" textAlign="center">
                    Submit a shipment to see your RTO risk score
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
