import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import {
  codVerificationService,
  CodVerificationStatus,
} from '../../../services/codVerificationService';
import { PageHeader } from '../../../components/PageHeader';
import { useAuthStore } from '../../../store/authStore';
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

const TERMINAL: CodVerificationStatus[] = ['CONFIRMED', 'REJECTED', 'EXPIRED'];

function getErrorMessage(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
    fallback
  );
}

export function CodVerificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.role === 'ORGANIZATION_ADMIN');
  const [note, setNote] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(false);

  const { data: messaging } = useQuery({
    queryKey: ['cod-messaging-config'],
    queryFn: () => codVerificationService.getMessagingConfig(),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['cod-verification', id],
    queryFn: () => codVerificationService.getById(id!),
    enabled: Boolean(id),
  });

  const resolveMutation = useMutation({
    mutationFn: (action: 'CONFIRM' | 'REJECT' | 'NEEDS_REVIEW') =>
      codVerificationService.resolve(id!, { action, note: note || undefined, notifyCustomer }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cod-verification', id] });
      queryClient.invalidateQueries({ queryKey: ['cod-verifications'] });
      setNote('');
    },
  });

  if (isLoading) return <LinearProgress />;
  if (error || !data) return <Alert severity="error">Failed to load verification session</Alert>;

  const canResolve = isAdmin && !TERMINAL.includes(data.status);
  const isExpired = data.status === 'EXPIRED';

  return (
    <Stack spacing={3}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(paths.app.codVerifications)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to sessions
      </Button>

      <PageHeader
        title={data.externalRef || data.verificationId}
        subtitle={`COD verification · ${data.customerName}`}
        action={<Chip label={data.status} color={STATUS_COLOR[data.status]} />}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Order details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography fontWeight={600}>{data.customerName}</Typography>
                    <Typography variant="body2">{data.customerPhone}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      COD amount
                    </Typography>
                    <Typography fontWeight={600}>₹{data.codAmount.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Pincode
                    </Typography>
                    <Typography fontWeight={600}>{data.destinationPincode}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Risk at start
                    </Typography>
                    <Typography fontWeight={600}>{data.riskLevel}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      AI turns
                    </Typography>
                    <Typography fontWeight={600}>
                      {data.turnCount}/{data.maxTurns}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Expires
                    </Typography>
                    <Typography fontWeight={600}>{new Date(data.expiresAt).toLocaleString()}</Typography>
                  </Grid>
                </Grid>
                {data.predictionId && data.predictionId !== 'manual' && (
                  <Typography variant="body2" mt={2}>
                    Linked prediction:{' '}
                    <Link to={paths.app.prediction(data.predictionId)}>{data.predictionId}</Link>
                  </Typography>
                )}
                {data.terminalReason && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {data.terminalReason}
                  </Alert>
                )}
                {(data.extractedPincode || data.extractedLandmark) && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Address update from customer: {data.extractedPincode ?? '—'}{' '}
                    {data.extractedLandmark ?? ''}
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <WhatsAppIcon sx={{ color: '#128C7E' }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    WhatsApp conversation
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Messages sent from {messaging?.whatsappSenderDisplay ?? 'PredixRoute WhatsApp'}
                </Typography>
                <Stack spacing={1.5} divider={<Divider flexItem />}>
                  {data.messages.length === 0 ? (
                    <Typography color="text.secondary">Opening message pending or not yet delivered.</Typography>
                  ) : (
                    data.messages.map((msg, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          alignSelf: msg.direction === 'OUTBOUND' ? 'flex-start' : 'flex-end',
                          maxWidth: '90%',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: msg.direction === 'OUTBOUND' ? 'primary.main' : 'grey.100',
                          color: msg.direction === 'OUTBOUND' ? '#fff' : 'text.primary',
                        }}
                      >
                        <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mb: 0.5 }}>
                          {msg.direction === 'OUTBOUND'
                            ? messaging?.businessName ?? 'PredixRoute'
                            : data.customerName}
                        </Typography>
                        <Typography variant="body2">{msg.body}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ position: { md: 'sticky' }, top: 88 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Manual verification
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Confirm or reject this COD order from your dashboard — useful when the customer verified by phone,
                WhatsApp failed, or you need to override the AI session.
              </Typography>

              {!isAdmin && (
                <Alert severity="warning">Only organization admins can manually resolve sessions.</Alert>
              )}

              {isAdmin && TERMINAL.includes(data.status) && (
                <Alert severity={data.status === 'CONFIRMED' ? 'success' : 'warning'}>
                  Session closed as <strong>{data.status}</strong>
                  {data.confirmedAt && ` on ${new Date(data.confirmedAt).toLocaleString()}`}
                  {data.rejectedAt && ` on ${new Date(data.rejectedAt).toLocaleString()}`}
                </Alert>
              )}

              {isExpired && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This session expired without a customer response.
                </Alert>
              )}

              {canResolve && (
                <Stack spacing={2}>
                  <TextField
                    label="Internal note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="e.g. Customer confirmed via phone call"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={notifyCustomer}
                        onChange={(e) => setNotifyCustomer(e.target.checked)}
                      />
                    }
                    label="Notify customer on WhatsApp when resolving"
                  />
                  {resolveMutation.isError && (
                    <Alert severity="error">
                      {getErrorMessage(resolveMutation.error, 'Failed to update session')}
                    </Alert>
                  )}
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    startIcon={<CheckCircleOutlineIcon />}
                    disabled={resolveMutation.isPending}
                    onClick={() => resolveMutation.mutate('CONFIRM')}
                  >
                    Confirm COD order
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<CancelOutlinedIcon />}
                    disabled={resolveMutation.isPending}
                    onClick={() => resolveMutation.mutate('REJECT')}
                  >
                    Reject / cancel order
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    fullWidth
                    startIcon={<FlagOutlinedIcon />}
                    disabled={resolveMutation.isPending || data.status === 'NEEDS_REVIEW'}
                    onClick={() => resolveMutation.mutate('NEEDS_REVIEW')}
                  >
                    Flag for review
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
