import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { predictionService } from '../../../services/predictionService';
import { RiskBadge } from '../../../components/RiskBadge';

export function PredictionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['prediction', id],
    queryFn: () => predictionService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) return <CircularProgress />;
  if (error || !data) return <Typography color="error">Prediction not found</Typography>;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Prediction {data.predictionId}
      </Typography>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <RiskBadge level={data.riskLevel} score={data.riskScore} />
            <Typography>Pincode: {data.destinationPincode}</Typography>
            <Typography>Delivery probability: {(data.deliveryProbability * 100).toFixed(1)}%</Typography>
            <Typography>Recommended: {data.recommendedCourier}</Typography>
            <Typography variant="subtitle2">Explanations</Typography>
            {data.explanations.map((ex, i) => (
              <Alert key={i} severity={ex.direction === 'INCREASES_RISK' ? 'warning' : 'info'}>
                {ex.description}
              </Alert>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
