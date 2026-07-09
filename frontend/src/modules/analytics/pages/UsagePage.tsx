import { useQuery } from '@tanstack/react-query';
import { Alert, Grid, LinearProgress, Stack } from '@mui/material';
import { analyticsService } from '../../../services/analyticsService';
import { PageHeader } from '../../../components/PageHeader';
import { StatCard } from '../../../components/StatCard';
import ApiOutlinedIcon from '@mui/icons-material/ApiOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';

export function UsagePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['usage-summary'],
    queryFn: () => analyticsService.getUsage(),
  });

  if (isLoading) return <LinearProgress />;
  if (error) return <Alert severity="error">Failed to load usage summary</Alert>;
  if (!data) return null;

  const apiPct = data.apiCallsLimit > 0 ? (data.apiCallsUsed / data.apiCallsLimit) * 100 : 0;
  const predPct = data.predictionsDailyLimit > 0 ? (data.predictionsUsedToday / data.predictionsDailyLimit) * 100 : 0;

  return (
    <Stack spacing={3}>
      <PageHeader
        title="API & Prediction Usage"
        subtitle={data ? `Billing period: ${data.month}` : undefined}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StatCard
            label="Monthly API Calls"
            value={`${data.apiCallsUsed.toLocaleString()} / ${data.apiCallsLimit.toLocaleString()}`}
            subtitle={`${apiPct.toFixed(1)}% of plan quota used`}
            icon={<ApiOutlinedIcon />}
            color="#7C3AED"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatCard
            label="Predictions Today"
            value={`${data.predictionsUsedToday} / ${data.predictionsDailyLimit}`}
            subtitle={`${predPct.toFixed(1)}% of daily limit used`}
            icon={<AssessmentOutlinedIcon />}
            color="#4F46E5"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <StatCard
            label="Rate Limit"
            value={`${data.rateLimitPerMinute} req/min`}
            subtitle="Per organization"
            icon={<SpeedOutlinedIcon />}
            color="#059669"
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
