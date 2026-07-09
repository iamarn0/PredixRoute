import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import { adminService } from '../../../services/adminService';
import { DatasetRecord } from '../../../services/datasetService';
import { AdminDatasetUploadForm } from '../components/AdminDatasetUploadForm';
import { AdminTrainingContributionsPanel } from '../components/AdminTrainingContributionsPanel';
import { AdminEmptyState, AdminPageHeader, AdminPagination } from '../components/AdminPagination';

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  UPLOADING: 'info',
  PROCESSING: 'info',
  READY: 'success',
  TRAINED: 'success',
  TRAINING: 'warning',
  FAILED: 'error',
};

export function AdminModelTrainingPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['admin-training-datasets', page],
    queryFn: () => adminService.listTrainingDatasets(page),
  });

  const trainMutation = useMutation({
    mutationFn: (datasetPublicId: string) => adminService.trainDataset(datasetPublicId),
    onSuccess: (result) => {
      setMessage(result.message);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['admin-training-datasets'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Training failed';
      setError(msg);
    },
  });

  const datasets = data?.datasets ?? [];
  const pagination = data?.pagination;

  return (
    <Stack spacing={3}>
      <AdminPageHeader
        title="Model Training"
        subtitle="Upload platform shipment data and train the shared risk model used for all predictions"
      />

      {message && <Alert severity="success" onClose={() => setMessage('')}>{message}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Upload training data
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2.5}>
            This is separate from tenant management. Upload courier shipment history (pincode, courier, outcomes) to improve predictions for all customers.
          </Typography>
          <AdminDatasetUploadForm onSuccess={setMessage} onError={setError} />
        </CardContent>
      </Card>

      {loadError && <Alert severity="error">Failed to load datasets</Alert>}
      {isLoading && <LinearProgress />}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" px={2.5} py={2} borderBottom={1} borderColor="divider">
            <Typography variant="subtitle1" fontWeight={600}>
              Training datasets
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Train when status is Ready · min 100 valid rows
            </Typography>
          </Stack>
          {datasets.length === 0 && !isLoading ? (
            <AdminEmptyState message="No training datasets yet. Upload a CSV above." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dataset</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Rows</TableCell>
                  <TableCell align="right">Quality</TableCell>
                  <TableCell>Metrics</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datasets.map((dataset: DatasetRecord) => (
                  <TableRow key={dataset.publicId} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{dataset.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{dataset.originalFileName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={dataset.status} size="small" color={STATUS_COLOR[dataset.status] ?? 'default'} />
                    </TableCell>
                    <TableCell align="right">{dataset.rowCount || '—'}</TableCell>
                    <TableCell align="right">{dataset.qualityScore ? `${dataset.qualityScore}%` : '—'}</TableCell>
                    <TableCell>
                      {dataset.trainingMetrics ? (
                        <Typography variant="caption" display="block">
                          Acc {((dataset.trainingMetrics.accuracy ?? 0) * 100).toFixed(1)}%
                          {dataset.trainingMetrics.f1Score != null && ` · F1 ${(dataset.trainingMetrics.f1Score * 100).toFixed(1)}%`}
                        </Typography>
                      ) : (
                        '—'
                      )}
                      {dataset.errorMessage && (
                        <Typography variant="caption" color="error.main" display="block">
                          {dataset.errorMessage}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {(dataset.status === 'READY' || dataset.status === 'TRAINED') && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<ModelTrainingIcon />}
                          disabled={trainMutation.isPending}
                          onClick={() => trainMutation.mutate(dataset.publicId)}
                        >
                          Train
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {pagination && <AdminPagination pagination={pagination} onChange={setPage} />}

      <AdminTrainingContributionsPanel />
    </Stack>
  );
}
