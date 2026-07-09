import { useState } from 'react';
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
  FormControlLabel,
  FormGroup,
  Checkbox,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { webhookService } from '../../../services/webhookService';

const WEBHOOK_EVENTS = [
  { value: 'prediction.completed', label: 'Prediction completed' },
  { value: 'prediction.batch_completed', label: 'Batch completed' },
  { value: 'cod.verification.started', label: 'COD verification started' },
  { value: 'cod.verification.confirmed', label: 'COD verification confirmed' },
  { value: 'cod.verification.rejected', label: 'COD verification rejected' },
  { value: 'cod.verification.expired', label: 'COD verification expired' },
  { value: 'cod.verification.needs_review', label: 'COD verification needs review' },
] as const;

export function WebhooksPage() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'prediction.completed',
    'cod.verification.confirmed',
  ]);
  const [secretDialog, setSecretDialog] = useState<{ secret: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => webhookService.list(),
  });

  const createMutation = useMutation({
    mutationFn: () => webhookService.create(url, selectedEvents),
    onSuccess: (result) => {
      setUrl('');
      setSecretDialog({ secret: result.secret });
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (publicId: string) => webhookService.remove(publicId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  if (isLoading) return <LinearProgress />;
  if (error) return <Alert severity="error">Failed to load webhooks</Alert>;

  const webhooks = data ?? [];

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Webhooks
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Receive signed HTTP callbacks for predictions and COD verification events. Use{' '}
        <code>cod.verification.confirmed</code> as your ship gate.
      </Typography>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Endpoint URL"
              placeholder="https://your-app.com/webhooks/predixroute"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => createMutation.mutate()}
              disabled={!url || selectedEvents.length === 0 || createMutation.isPending}
            >
              Add webhook
            </Button>
          </Stack>
          <FormGroup row sx={{ mt: 2 }}>
            {WEBHOOK_EVENTS.map((evt) => (
              <FormControlLabel
                key={evt.value}
                control={
                  <Checkbox
                    checked={selectedEvents.includes(evt.value)}
                    onChange={(e) => {
                      setSelectedEvents((prev) =>
                        e.target.checked ? [...prev, evt.value] : prev.filter((v) => v !== evt.value),
                      );
                    }}
                  />
                }
                label={evt.label}
              />
            ))}
          </FormGroup>
          {createMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to create webhook
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active endpoints
          </Typography>
          {webhooks.length === 0 ? (
            <Typography color="text.secondary">No webhooks configured yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {webhooks.map((hook) => (
                <Box
                  key={hook.publicId}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={1}
                  borderBottom="1px solid"
                  borderColor="divider"
                >
                  <Box>
                    <Typography fontWeight={600}>{hook.url}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Secret: {hook.secretPreview} · Events: {hook.events.join(', ')}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={hook.isActive ? 'Active' : 'Inactive'} size="small" color="success" />
                    <IconButton
                      color="error"
                      onClick={() => deleteMutation.mutate(hook.publicId)}
                      aria-label="Delete webhook"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!secretDialog} onClose={() => setSecretDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Webhook secret</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Copy this secret now. It will not be shown again.
          </Alert>
          <TextField value={secretDialog?.secret ?? ''} fullWidth InputProps={{ readOnly: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSecretDialog(null)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
