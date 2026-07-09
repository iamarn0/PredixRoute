import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { apiClient } from '../../../services/apiClient';
import { ApiSuccessResponse, PincodeIntelligence } from '../../../types/api.types';

export function PincodeListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['pincodes'],
    queryFn: async () => {
      const { data: res } = await apiClient.get<
        ApiSuccessResponse<PincodeIntelligence[]> & { meta?: { pagination: unknown } }
      >('/dashboard/pincodes');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Pincode Intelligence
      </Typography>
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pincode</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell>Success Rate</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Best Courier</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data ?? []).map((p) => (
                <TableRow key={p.pincode}>
                  <TableCell>{p.pincode}</TableCell>
                  <TableCell>{p.city}</TableCell>
                  <TableCell>{p.tier}</TableCell>
                  <TableCell>{(p.successRate * 100).toFixed(1)}%</TableCell>
                  <TableCell>{p.riskScore}</TableCell>
                  <TableCell>{p.bestCourier ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
