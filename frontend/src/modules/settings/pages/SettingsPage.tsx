import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { settingsService } from '../../../services/settingsService';
import { trainingContributionService } from '../../../services/trainingContributionService';

function useSyncedState(initial: string) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    setValue(initial);
  }, [initial]);
  return [value, setValue] as const;
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => settingsService.getOrganization(),
  });

  const [name, setName] = useSyncedState(data?.name ?? '');
  const [billingEmail, setBillingEmail] = useSyncedState(data?.billingEmail ?? '');
  const [timezone, setTimezone] = useSyncedState(data?.settings.timezone ?? 'Asia/Kolkata');
  const [codEnabled, setCodEnabled] = useState(true);
  const [expiryHours, setExpiryHours] = useState('24');
  const [maxTurns, setMaxTurns] = useState('4');
  const [trainingConsent, setTrainingConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [trainingMessage, setTrainingMessage] = useState('');

  useEffect(() => {
    if (data?.settings.codVerification) {
      setCodEnabled(data.settings.codVerification.enabled);
      setExpiryHours(String(data.settings.codVerification.expiryHours));
      setMaxTurns(String(data.settings.codVerification.maxTurns));
    }
    if (data?.settings.trainingData) {
      setTrainingConsent(data.settings.trainingData.allowTrainingDataUse);
      setWebhookUrl(data.settings.trainingData.webhookSyncUrl ?? '');
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      settingsService.updateOrganization({
        name,
        billingEmail,
        settings: {
          timezone,
          codVerification: {
            enabled: codEnabled,
            riskLevels: data?.settings.codVerification?.riskLevels ?? ['MEDIUM', 'HIGH', 'CRITICAL'],
            expiryHours: Number(expiryHours),
            maxTurns: Number(maxTurns),
          },
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org-settings'] }),
  });

  const consentMutation = useMutation({
    mutationFn: () =>
      trainingContributionService.updateConsent({
        allowTrainingDataUse: trainingConsent,
        termsAccepted: trainingConsent ? termsAccepted : undefined,
        webhookSyncUrl: webhookUrl || null,
        webhookSyncSecret: webhookSecret || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] });
      setTrainingMessage('Training data preferences saved.');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      trainingContributionService.upload(file, uploadName || file.name),
    onSuccess: (res) => {
      setTrainingMessage(res.message);
      if (fileRef.current) fileRef.current.value = '';
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => trainingContributionService.triggerSync(),
    onSuccess: (res) => setTrainingMessage(res.message),
  });

  if (isLoading) return <LinearProgress />;
  if (error || !data) return <Alert severity="error">Failed to load organization settings</Alert>;

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Organization Settings
      </Typography>

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="Organization name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Billing email"
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Plan status: {data.status} · Slug: {data.slug}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            COD AI Verification
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            COD WhatsApp confirmation is only triggered via Evaluate + Verify or the public evaluate-and-verify API — not
            on predict-only evaluations.
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={<Switch checked={codEnabled} onChange={(e) => setCodEnabled(e.target.checked)} />}
              label="Enable COD verification (for booking / confirm APIs)"
            />
            <TextField
              label="Verification expiry (hours)"
              type="number"
              value={expiryHours}
              onChange={(e) => setExpiryHours(e.target.value)}
              inputProps={{ min: 1, max: 168 }}
              sx={{ maxWidth: 280 }}
            />
            <TextField
              label="Max AI conversation turns"
              type="number"
              value={maxTurns}
              onChange={(e) => setMaxTurns(e.target.value)}
              inputProps={{ min: 1, max: 10 }}
              sx={{ maxWidth: 280 }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data &amp; model improvement
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Share real shipment outcomes (Delivered/RTO) to improve the shared RTO model. We never train on PredixRoute
            prediction scores — only independent shipment data from your systems.
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={<Switch checked={trainingConsent} onChange={(e) => setTrainingConsent(e.target.checked)} />}
              label="Allow PredixRoute to use my shipment data for model training"
            />
            {trainingConsent && (
              <>
                <FormControlLabel
                  control={<Checkbox checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />}
                  label="I confirm I have rights to share this shipment data with PredixRoute"
                />
                <TextField
                  label="Webhook sync URL (optional)"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  fullWidth
                  helperText="GET endpoint returning { shipments: [...] } for ongoing sync"
                />
                <TextField
                  label="Webhook sync secret (optional)"
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  fullWidth
                />
              </>
            )}
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => consentMutation.mutate()} disabled={consentMutation.isPending}>
                Save data preferences
              </Button>
              {trainingConsent && webhookUrl && (
                <Button variant="outlined" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                  Sync now
                </Button>
              )}
            </Stack>
            {data.settings.trainingData.lastSyncAt && (
              <Typography variant="caption" color="text.secondary">
                Last sync: {new Date(data.settings.trainingData.lastSyncAt).toLocaleString()}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {trainingConsent && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Historical backfill (CSV)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload closed shipments with status Delivered or RTO. Admin reviews before merge into platform training.
            </Typography>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems="flex-start">
              <TextField
                label="Dataset name"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                sx={{ minWidth: 240 }}
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                Upload CSV
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadMutation.mutate(file);
                }}
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      <Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : 'Save organization settings'}
      </Button>
      {mutation.isSuccess && <Alert severity="success">Settings updated</Alert>}
      {trainingMessage && <Alert severity="info" onClose={() => setTrainingMessage('')}>{trainingMessage}</Alert>}
    </Stack>
  );
}
