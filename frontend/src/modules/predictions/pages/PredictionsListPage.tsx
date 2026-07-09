import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Link as RouterLink } from 'react-router-dom';
import { predictionService } from '../../../services/predictionService';
import { RiskBadge } from '../../../components/RiskBadge';
import { PageHeader } from '../../../components/PageHeader';
import { paths } from '../../../routes/paths';

export function PredictionsListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => predictionService.list(),
  });

  if (isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    return <Typography color="error">Failed to load predictions</Typography>;
  }

  const predictions = data?.predictions ?? [];

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Prediction History"
        subtitle="Browse and review past RTO risk evaluations"
        action={
          <Button component={RouterLink} to={paths.app.evaluate} variant="contained" startIcon={<AddIcon />}>
            New Evaluation
          </Button>
        }
      />
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Pincode</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Courier</TableCell>
                <TableCell>Evaluated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {predictions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No predictions yet
                  </TableCell>
                </TableRow>
              ) : (
                predictions.map((p) => (
                  <TableRow key={p.predictionId} hover>
                    <TableCell>
                      <Link component={RouterLink} to={paths.app.prediction(p.predictionId)}>
                        {p.predictionId}
                      </Link>
                    </TableCell>
                    <TableCell>{p.destinationPincode ?? '—'}</TableCell>
                    <TableCell>
                      <RiskBadge level={p.riskLevel} score={p.riskScore} />
                    </TableCell>
                    <TableCell>{p.recommendedCourier}</TableCell>
                    <TableCell>{new Date(p.evaluatedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
