import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { adminService } from '../../../services/adminService';
import { AdminPageHeader } from '../components/AdminPagination';

function HealthCard({ name, status, latencyMs }: { name: string; status: string; latencyMs?: number }) {
  const healthy = status === 'healthy';
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
          {healthy ? (
            <CheckCircleOutlineIcon color="success" />
          ) : (
            <ErrorOutlineIcon color="error" />
          )}
          <Typography variant="h6" fontWeight={600}>{name}</Typography>
        </Stack>
        <Typography variant="body2" color={healthy ? 'success.main' : 'error.main'} fontWeight={600}>
          {status.toUpperCase()}
        </Typography>
        {latencyMs !== undefined && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Latency: {latencyMs}ms
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminSystemPage() {
  const { data: health, isLoading, error } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => adminService.getSystemHealth(),
    refetchInterval: 30000,
  });

  if (isLoading) return <LinearProgress />;
  if (error || !health) return <Alert severity="error">Failed to load system health</Alert>;

  const checks = health.checks;

  return (
    <Stack spacing={3}>
      <AdminPageHeader title="System Health" subtitle="Infrastructure status for the PredixRoute platform" />

      <Alert severity={health.status === 'healthy' ? 'success' : 'warning'}>
        Platform status: {health.status.toUpperCase()} · Service: {health.service} · Environment: {health.environment}
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <HealthCard name="MongoDB" status={checks.mongodb?.status ?? 'unknown'} latencyMs={checks.mongodb?.latencyMs} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <HealthCard name="Redis" status={checks.redis?.status ?? 'unknown'} latencyMs={checks.redis?.latencyMs} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <HealthCard name="AI Service" status={checks.aiService?.status ?? 'unknown'} latencyMs={checks.aiService?.latencyMs} />
        </Grid>
      </Grid>
    </Stack>
  );
}
