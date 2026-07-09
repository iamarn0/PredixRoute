import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { codVerificationService, CodVerificationStatus } from '../../../services/codVerificationService';
import { PageHeader } from '../../../components/PageHeader';
import { paths } from '../../../routes/paths';

const STATUS_COLOR: Record<CodVerificationStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  PENDING: 'default',
  SENT: 'info',
  IN_PROGRESS: 'warning',
  CONFIRMED: 'success',
  REJECTED: 'error',
  EXPIRED: 'default',
  NEEDS_REVIEW: 'warning',
};

const STATUS_FILTERS: Array<{ label: string; value?: CodVerificationStatus }> = [
  { label: 'All' },
  { label: 'Active', value: 'IN_PROGRESS' },
  { label: 'Awaiting reply', value: 'SENT' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Needs review', value: 'NEEDS_REVIEW' },
];

function getErrorMessage(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
    fallback
  );
}

export function CodVerificationListPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<CodVerificationStatus | undefined>(undefined);
  const [startOpen, setStartOpen] = useState(false);
  const [form, setForm] = useState({
    externalRef: '',
    customerPhone: '',
    customerName: '',
    productName: '',
    destinationPincode: '',
    codAmount: '',
    orderValue: '',
    predictionId: '',
  });

  const { data: messaging } = useQuery({
    queryKey: ['cod-messaging-config'],
    queryFn: () => codVerificationService.getMessagingConfig(),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['cod-verifications', statusFilter],
    queryFn: () => codVerificationService.list(1, 20, statusFilter),
  });

  const startMutation = useMutation({
    mutationFn: () =>
      codVerificationService.start({
        externalRef: form.externalRef || undefined,
        customerPhone: form.customerPhone,
        customerName: form.customerName || undefined,
        productName: form.productName || undefined,
        destinationPincode: form.destinationPincode || undefined,
        predictionId: form.predictionId || undefined,
        codAmount: form.codAmount ? Number(form.codAmount) : undefined,
        orderValue: form.orderValue ? Number(form.orderValue) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cod-verifications'] });
      setStartOpen(false);
      setForm({
        externalRef: '',
        customerPhone: '',
        customerName: '',
        productName: '',
        destinationPincode: '',
        codAmount: '',
        orderValue: '',
        predictionId: '',
      });
    },
  });

  const items = data?.items ?? [];

  return (
    <Stack spacing={3}>
      <PageHeader
        title="COD Verification"
        subtitle="WhatsApp confirmation for risky COD orders — plus manual review in your dashboard"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setStartOpen(true)}>
            Start verification
          </Button>
        }
      />

      <Card sx={{ borderColor: messaging?.isConfigured ? 'success.light' : 'warning.light' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: '#25D36622',
                color: '#128C7E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <WhatsAppIcon />
            </Box>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                {messaging?.businessName ?? 'PredixRoute COD Verify'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Customers receive verification messages from:{' '}
                <Typography component="span" fontWeight={700} color="text.primary">
                  {messaging?.whatsappSenderDisplay ?? 'Loading…'}
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                {messaging?.customerInstructions}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                label={messaging?.isConfigured ? 'WhatsApp live' : 'Simulated (dev)'}
                color={messaging?.isConfigured ? 'success' : 'warning'}
                size="small"
              />
              <Chip
                label={messaging?.mode === 'template' ? 'Approved template' : messaging?.mode === 'session' ? 'Session messages' : 'Dev mode'}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Alert severity="info">
        <strong>Two ways to verify:</strong> (1) WhatsApp — customer replies YES/NO to the message from the number
        above. (2) Manual — open a session and confirm or reject from the detail page without waiting for WhatsApp.
      </Alert>

      <Tabs
        value={statusFilter ?? 'all'}
        onChange={(_, v) => setStatusFilter(v === 'all' ? undefined : (v as CodVerificationStatus))}
        variant="scrollable"
        scrollButtons="auto"
      >
        {STATUS_FILTERS.map((f) => (
          <Tab key={f.label} label={f.label} value={f.value ?? 'all'} />
        ))}
      </Tabs>

      {isLoading && <LinearProgress />}
      {error && <Alert severity="error">Failed to load verifications</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {items.length === 0 && !isLoading ? (
            <Stack alignItems="center" spacing={2} py={6} px={2}>
              <Typography variant="h6" fontWeight={600}>
                No verification sessions
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={420}>
                Sessions start automatically for MEDIUM+ risk COD orders with a phone number, or you can start one
                manually.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setStartOpen(true)}>
                Start verification
              </Button>
            </Stack>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>COD</TableCell>
                    <TableCell>Turns</TableCell>
                    <TableCell>Expires</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.verificationId} hover>
                      <TableCell>
                        <Link to={paths.app.codVerification(item.verificationId)}>
                          {item.externalRef || item.predictionId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.customerPhone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.status} size="small" color={STATUS_COLOR[item.status]} />
                      </TableCell>
                      <TableCell>{item.riskLevel}</TableCell>
                      <TableCell>₹{item.codAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        {item.turnCount}/{item.maxTurns}
                      </TableCell>
                      <TableCell>{new Date(item.expiresAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={startOpen} onClose={() => !startMutation.isPending && setStartOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Start COD verification</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Alert severity="info" icon={<WhatsAppIcon />}>
              A WhatsApp message will be sent to the customer from{' '}
              <strong>{messaging?.whatsappSender ?? 'your configured business number'}</strong>.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Order reference"
                  value={form.externalRef}
                  onChange={(e) => setForm((f) => ({ ...f, externalRef: e.target.value }))}
                  fullWidth
                  placeholder="ORD-12345"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Prediction ID (optional)"
                  value={form.predictionId}
                  onChange={(e) => setForm((f) => ({ ...f, predictionId: e.target.value }))}
                  fullWidth
                  placeholder="prd_…"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Customer phone"
                  value={form.customerPhone}
                  onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                  required
                  fullWidth
                  placeholder="+919876543210"
                  helperText="E.164 format"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Customer name"
                  value={form.customerName}
                  onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Pincode"
                  value={form.destinationPincode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      destinationPincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                    }))
                  }
                  fullWidth
                  inputProps={{ maxLength: 6 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Product name"
                  value={form.productName}
                  onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="COD amount (INR)"
                  type="number"
                  value={form.codAmount}
                  onChange={(e) => setForm((f) => ({ ...f, codAmount: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Order value (INR)"
                  type="number"
                  value={form.orderValue}
                  onChange={(e) => setForm((f) => ({ ...f, orderValue: e.target.value }))}
                  fullWidth
                />
              </Grid>
            </Grid>
            {startMutation.isError && (
              <Alert severity="error">{getErrorMessage(startMutation.error, 'Failed to start verification')}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartOpen(false)} disabled={startMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!form.customerPhone.trim() || startMutation.isPending}
            onClick={() => startMutation.mutate()}
          >
            {startMutation.isPending ? 'Sending…' : 'Send WhatsApp verification'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
