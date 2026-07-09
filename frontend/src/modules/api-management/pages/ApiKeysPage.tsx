import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  Link as MuiLink,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { apiKeyService } from '../../../services/apiKeyService';
import { PageHeader } from '../../../components/PageHeader';
import { useAuthStore } from '../../../store/authStore';
import { paths } from '../../../routes/paths';

const AVAILABLE_SCOPES = [
  { value: 'risk:evaluate', label: 'Risk evaluate', description: 'Single & outcome API predictions' },
  { value: 'batch', label: 'Batch', description: 'Batch evaluate endpoints' },
  { value: 'cod:verify', label: 'COD verify', description: 'Evaluate-and-verify & COD sessions' },
  { value: 'pincode:read', label: 'Pincode read', description: 'Pincode intelligence lookup' },
  { value: 'courier:read', label: 'Courier read', description: 'Courier performance data' },
  { value: 'recommendation', label: 'Recommendation', description: 'Courier recommendation API' },
] as const;

const STATUS_COLORS: Record<string, 'success' | 'default' | 'error'> = {
  ACTIVE: 'success',
  REVOKED: 'error',
  EXPIRED: 'default',
};

function formatDate(value: string | null | undefined) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

function getErrorMessage(err: unknown, fallback: string) {
  return (
    (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
    fallback
  );
}

export function ApiKeysPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ORGANIZATION_ADMIN';

  const [dialogStep, setDialogStep] = useState<'closed' | 'create' | 'reveal'>('closed');
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState<'LIVE' | 'TEST'>('TEST');
  const [scopes, setScopes] = useState<string[]>(['risk:evaluate', 'batch']);
  const [revealedKey, setRevealedKey] = useState<{ key: string; name: string } | null>(null);
  const [createError, setCreateError] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<{ publicId: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: keys = [], isLoading, error } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeyService.list(),
    enabled: canManage,
  });

  const createMutation = useMutation({
    mutationFn: () => apiKeyService.create({ name, environment, scopes }),
    onSuccess: (data) => {
      if (!data.key) {
        setCreateError(
          'Key was created but the secret was missing from the response. Please revoke and create a new key.',
        );
        return;
      }
      setCreateError('');
      setRevealedKey({ key: data.key, name: data.name });
      setDialogStep('reveal');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setName('');
      setEnvironment('TEST');
      setScopes(['risk:evaluate', 'batch']);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiKeyService.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setRevokeTarget(null);
    },
  });

  const openCreateDialog = () => {
    createMutation.reset();
    setCreateError('');
    setDialogStep('create');
  };

  const closeCreateDialog = () => {
    if (createMutation.isPending) return;
    setDialogStep('closed');
    setName('');
    setEnvironment('TEST');
    setScopes(['risk:evaluate', 'batch']);
  };

  const closeRevealDialog = () => {
    setDialogStep('closed');
    setRevealedKey(null);
    setCopied(false);
  };

  const handleCopyKey = async () => {
    if (!revealedKey?.key) return;
    await navigator.clipboard.writeText(revealedKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleScope = (scope: string) => {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]));
  };

  if (!canManage) {
    return (
      <Stack spacing={3}>
        <PageHeader title="API Keys" subtitle="Manage credentials for public API integrations" />
        <Alert severity="warning">
          Only organization admins can view and manage API keys. Contact your workspace admin for access.
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="API Keys"
        subtitle="Create scoped keys for your OMS, checkout, and automation integrations"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Create key
          </Button>
        }
      />

      <Alert severity="info" icon={<VpnKeyIcon />}>
        Use keys with the{' '}
        <MuiLink component={RouterLink} to={paths.app.developers} underline="hover" fontWeight={600}>
          Developer Portal
        </MuiLink>{' '}
        — send as <code>Authorization: Bearer &lt;key&gt;</code> or <code>X-API-Key: &lt;key&gt;</code> on public API
        requests.
      </Alert>

      {isLoading && <LinearProgress />}

      {error && (
        <Alert severity="error">Failed to load API keys. {getErrorMessage(error, 'Please try again.')}</Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {!isLoading && keys.length === 0 ? (
            <Stack alignItems="center" spacing={2} py={6} px={2}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.main',
                }}
              >
                <VpnKeyIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h6" fontWeight={600}>
                No API keys yet
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>
                Create a test key to integrate PredixRoute with your storefront or OMS. Keys are shown only once at
                creation.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
                Create your first key
              </Button>
            </Stack>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Key prefix</TableCell>
                    <TableCell>Environment</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Scopes</TableCell>
                    <TableCell>Last used</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {keys.map((k) => (
                    <TableRow key={k.publicId} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{k.name}</TableCell>
                      <TableCell>
                        <Typography component="code" variant="body2">
                          {k.keyPrefix}…
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={k.environment}
                          size="small"
                          color={k.environment === 'LIVE' ? 'error' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={k.status} size="small" color={STATUS_COLORS[k.status] ?? 'default'} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {(k.scopes ?? []).map((scope) => (
                            <Chip key={scope} label={scope} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(k.lastUsedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(k.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {k.status === 'ACTIVE' && (
                          <Button size="small" color="error" onClick={() => setRevokeTarget({ publicId: k.publicId, name: k.name })}>
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogStep !== 'closed'}
        onClose={(_event, reason) => {
          if (dialogStep === 'reveal') {
            if (reason === 'backdropClick') return;
            closeRevealDialog();
            return;
          }
          closeCreateDialog();
        }}
        fullWidth
        maxWidth="sm"
        disableEscapeKeyDown={dialogStep === 'reveal'}
      >
        {dialogStep === 'reveal' && revealedKey ? (
          <>
            <DialogTitle>Save your API key</DialogTitle>
            <DialogContent>
              <Stack spacing={2} mt={0.5}>
                <Alert severity="warning">
                  Copy this key now. It will <strong>not</strong> be shown again after you close this dialog.
                </Alert>
                <TextField
                  label={`Key for "${revealedKey.name}"`}
                  value={revealedKey.key}
                  fullWidth
                  multiline
                  minRows={2}
                  onFocus={(e) => e.target.select()}
                  InputProps={{
                    readOnly: true,
                    sx: { fontFamily: 'monospace', fontSize: 13 },
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={copied ? 'Copied!' : 'Copy key'}>
                          <IconButton onClick={handleCopyKey} edge="end" aria-label="Copy API key">
                            <ContentCopyIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
                {copied && (
                  <Typography variant="caption" color="success.main">
                    Copied to clipboard
                  </Typography>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCopyKey} startIcon={<ContentCopyIcon />}>
                Copy key
              </Button>
              <Button onClick={closeRevealDialog} variant="contained">
                I&apos;ve saved the key
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>Create API key</DialogTitle>
            <DialogContent>
              <Stack spacing={2.5} mt={1}>
                <TextField
                  label="Key name"
                  placeholder="Production OMS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  autoFocus
                  helperText="A label to identify where this key is used"
                />
                <FormControl fullWidth>
                  <InputLabel>Environment</InputLabel>
                  <Select
                    value={environment}
                    label="Environment"
                    onChange={(e) => setEnvironment(e.target.value as 'LIVE' | 'TEST')}
                  >
                    <MenuItem value="TEST">Test — sandbox integrations</MenuItem>
                    <MenuItem value="LIVE">Live — production traffic</MenuItem>
                  </Select>
                </FormControl>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Scopes
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Limited to scopes allowed by your subscription plan. Invalid scopes are ignored server-side.
                  </Typography>
                  <FormGroup>
                    {AVAILABLE_SCOPES.map((scope) => (
                      <FormControlLabel
                        key={scope.value}
                        control={
                          <Checkbox
                            checked={scopes.includes(scope.value)}
                            onChange={() => toggleScope(scope.value)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {scope.label}{' '}
                              <Typography component="span" variant="caption" color="text.secondary">
                                ({scope.value})
                              </Typography>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {scope.description}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>
                </Box>
                {createMutation.isError && (
                  <Alert severity="error">{getErrorMessage(createMutation.error, 'Failed to create API key')}</Alert>
                )}
                {createError && <Alert severity="error">{createError}</Alert>}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeCreateDialog} disabled={createMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="contained"
                disabled={!name.trim() || scopes.length === 0 || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? 'Creating…' : 'Create key'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={!!revokeTarget} onClose={() => !revokeMutation.isPending && setRevokeTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Revoke API key?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            <strong>{revokeTarget?.name}</strong> will stop working immediately. Integrations using this key will
            receive 401 errors.
          </Typography>
          {revokeMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {getErrorMessage(revokeMutation.error, 'Failed to revoke key')}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeTarget(null)} disabled={revokeMutation.isPending}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={revokeMutation.isPending}
            onClick={() => revokeTarget && revokeMutation.mutate(revokeTarget.publicId)}
          >
            {revokeMutation.isPending ? 'Revoking…' : 'Revoke key'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
