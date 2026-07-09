import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
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
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { bulkPredictionService } from '../../../services/bulkPredictionService';

const COURIERS = ['delhivery', 'bluedart', 'dtdc', 'ecom_express'];

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  QUEUED: 'info',
  PROCESSING: 'warning',
  COMPLETED: 'success',
  FAILED: 'error',
};

export function BulkPredictionsPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>(['delhivery', 'bluedart']);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['bulk-predictions'],
    queryFn: () => bulkPredictionService.list(),
    refetchInterval: (q) => {
      const jobs = q.state.data?.jobs ?? [];
      return jobs.some((j) => j.status === 'QUEUED' || j.status === 'PROCESSING') ? 3000 : false;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => bulkPredictionService.upload(file, name || file.name, selectedCouriers),
    onSuccess: (res) => {
      setMessage(res.message);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['bulk-predictions'] });
      if (fileRef.current) fileRef.current.value = '';
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Upload failed';
      setError(msg);
    },
  });

  const toggleCourier = (c: string) => {
    setSelectedCouriers((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Bulk Predictions
      </Typography>
      <Alert severity="info">
        Download the bulk order template, fill in your orders, then upload the Excel file. Predictions run
        asynchronously — download results when complete. No COD messages are sent.
      </Alert>

      {message && <Alert severity="success" onClose={() => setMessage('')}>{message}</Alert>}
      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <TextField label="Job name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <Box>
              <Typography variant="body2" gutterBottom>
                Couriers for ranking
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {COURIERS.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    clickable
                    color={selectedCouriers.includes(c) ? 'primary' : 'default'}
                    onClick={() => toggleCourier(c)}
                  />
                ))}
              </Stack>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => bulkPredictionService.downloadTemplate()}
              >
                Download Template
              </Button>
              <Button
                variant="contained"
                startIcon={<UploadFileIcon />}
                disabled={uploadMutation.isPending || selectedCouriers.length === 0}
                onClick={() => fileRef.current?.click()}
              >
                Upload File
              </Button>
            </Stack>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
              }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Jobs
          </Typography>
          {isLoading ? (
            <LinearProgress />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.jobs ?? []).map((job) => (
                  <TableRow key={job.publicId}>
                    <TableCell>{job.name}</TableCell>
                    <TableCell>
                      <Chip label={job.status} size="small" color={STATUS_COLOR[job.status] ?? 'default'} />
                    </TableCell>
                    <TableCell>
                      {job.processedRows}/{job.totalRows} ({job.progressPercent}%)
                    </TableCell>
                    <TableCell align="right">
                      {job.status === 'COMPLETED' && (
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => bulkPredictionService.download(job.publicId)}
                        >
                          Download
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.jobs ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No bulk jobs yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
