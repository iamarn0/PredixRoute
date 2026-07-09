import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import ApiOutlinedIcon from '@mui/icons-material/ApiOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { analyticsService } from '../../../services/analyticsService';
import { predictionService } from '../../../services/predictionService';
import { settingsService } from '../../../services/settingsService';
import { useAuthStore } from '../../../store/authStore';
import { StatCard } from '../../../components/StatCard';
import { PageHeader } from '../../../components/PageHeader';
import { QuickActionCard } from '../../../components/QuickActionCard';
import { RiskBadge } from '../../../components/RiskBadge';
import { paths } from '../../../routes/paths';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['usage-summary'],
    queryFn: () => analyticsService.getUsage(),
  });

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['org-settings'],
    queryFn: () => settingsService.getOrganization(),
  });

  const { data: predictionsData, isLoading: predsLoading } = useQuery({
    queryKey: ['predictions-recent'],
    queryFn: () => predictionService.list(1, 5),
  });

  const isLoading = usageLoading || orgLoading || predsLoading;
  const predictions = predictionsData?.predictions ?? [];
  const totalPredictions = predictionsData?.pagination?.total ?? predictions.length;

  const highRiskCount = predictions.filter(
    (p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL',
  ).length;

  const apiPct = usage && usage.apiCallsLimit > 0
    ? Math.min((usage.apiCallsUsed / usage.apiCallsLimit) * 100, 100)
    : 0;
  const predPct = usage && usage.predictionsDailyLimit > 0
    ? Math.min((usage.predictionsUsedToday / usage.predictionsDailyLimit) * 100, 100)
    : 0;

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : '';

  return (
    <Stack spacing={3}>
      {isLoading && <LinearProgress />}

      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #059669 100%)',
          color: '#fff',
        }}
      >
        <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 1.2 }}>
          {org?.name ?? 'Your workspace'}
        </Typography>
        <Typography variant="h4" fontWeight={800} mt={0.5}>
          {getGreeting()}, {displayName.split(' ')[0] || 'there'}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mt: 1, maxWidth: 560 }}>
          Monitor RTO risk, track API usage, and run predictions — all from one place.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={2.5}>
          <Button
            component={RouterLink}
            to={paths.app.evaluate}
            variant="contained"
            size="large"
            startIcon={<BoltOutlinedIcon />}
            sx={{
              bgcolor: '#fff',
              color: 'primary.main',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
            }}
          >
            New Evaluation
          </Button>
          <Button
            component={RouterLink}
            to={paths.app.predictions}
            variant="outlined"
            size="large"
            sx={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff', '&:hover': { borderColor: '#fff' } }}
          >
            View History
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Predictions Today"
            value={usage?.predictionsUsedToday ?? '—'}
            subtitle={usage ? `of ${usage.predictionsDailyLimit} daily limit` : undefined}
            icon={<AssessmentOutlinedIcon />}
            color="#4F46E5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="API Calls (Month)"
            value={usage ? usage.apiCallsUsed.toLocaleString() : '—'}
            subtitle={usage ? `of ${usage.apiCallsLimit.toLocaleString()} quota` : undefined}
            icon={<ApiOutlinedIcon />}
            color="#7C3AED"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Predictions"
            value={totalPredictions.toLocaleString()}
            subtitle="All time for your org"
            icon={<TrendingUpOutlinedIcon />}
            color="#059669"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="High Risk (Recent)"
            value={highRiskCount}
            subtitle="In last 5 evaluations"
            icon={<AnalyticsOutlinedIcon />}
            color="#D97706"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <PageHeader title="Recent Predictions" subtitle="Latest RTO risk evaluations" />
                <Link component={RouterLink} to={paths.app.predictions} underline="hover" fontWeight={600}>
                  View all
                </Link>
              </Stack>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Pincode</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>Courier</TableCell>
                    <TableCell align="right">When</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No predictions yet.{' '}
                        <Link component={RouterLink} to={paths.app.evaluate}>
                          Run your first evaluation
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    predictions.map((p) => (
                      <TableRow
                        key={p.predictionId}
                        hover
                        onClick={() => navigate(paths.app.prediction(p.predictionId))}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{p.destinationPincode ?? '—'}</TableCell>
                        <TableCell>
                          <RiskBadge level={p.riskLevel} score={p.riskScore} />
                        </TableCell>
                        <TableCell>{p.recommendedCourier}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {new Date(p.evaluatedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <PageHeader title="Usage Overview" subtitle={usage ? `Billing period: ${usage.month}` : undefined} />
                <Stack spacing={2.5} mt={2}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={0.75}>
                      <Typography variant="body2" fontWeight={500}>
                        Daily Predictions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {usage?.predictionsUsedToday ?? 0} / {usage?.predictionsDailyLimit ?? '—'}
                      </Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={predPct} color="primary" />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={0.75}>
                      <Typography variant="body2" fontWeight={500}>
                        Monthly API Calls
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {usage?.apiCallsUsed.toLocaleString() ?? 0} / {usage?.apiCallsLimit.toLocaleString() ?? '—'}
                      </Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={apiPct} color="secondary" />
                  </Box>
                  {usage && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Rate limit: {usage.rateLimitPerMinute} requests/min per organization
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Quick Actions
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <QuickActionCard
                      title="Bulk Upload"
                      description="CSV batch scoring"
                      to={paths.app.bulkPredictions}
                      icon={<CloudUploadOutlinedIcon fontSize="small" />}
                      color="#7C3AED"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <QuickActionCard
                      title="COD Verify"
                      description="Voice verification"
                      to={paths.app.codVerifications}
                      icon={<VerifiedUserOutlinedIcon fontSize="small" />}
                      color="#059669"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <QuickActionCard
                      title="API Keys"
                      description="Manage credentials"
                      to={paths.app.apiKeys}
                      icon={<KeyOutlinedIcon fontSize="small" />}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <QuickActionCard
                      title="Usage"
                      description="Detailed analytics"
                      to={paths.app.usage}
                      icon={<AnalyticsOutlinedIcon fontSize="small" />}
                      color="#D97706"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
