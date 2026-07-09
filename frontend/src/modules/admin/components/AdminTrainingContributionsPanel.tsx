import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
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
import { adminService } from '../../../services/adminService';

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  PENDING_REVIEW: 'warning',
  APPROVED: 'info',
  REJECTED: 'error',
  MERGED: 'success',
  FAILED: 'error',
};

export function AdminTrainingContributionsPanel() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-training-contributions', page],
    queryFn: () => adminService.listTrainingContributions(page),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes: n }: { id: string; notes?: string }) => adminService.approveContribution(id, n),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-training-contributions'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes: n }: { id: string; notes?: string }) => adminService.rejectContribution(id, n),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-training-contributions'] }),
  });

  const mergeMutation = useMutation({
    mutationFn: (id: string) => adminService.mergeContribution(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-training-contributions'] }),
  });

  const contributions = data?.contributions ?? [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Seller training contributions
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Review real shipment data from sellers (CSV backfill or outcome API). Reject rows with model output fields.
          Merge approved contributions into the platform training pool.
        </Typography>

        {isLoading ? (
          <LinearProgress />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Organization</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Rows</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Review</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contributions.map((c) => (
                <TableRow key={c.publicId}>
                  <TableCell>{c.organizationId?.slice(-8) ?? '—'}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.source}</TableCell>
                  <TableCell>{c.rowCount}</TableCell>
                  <TableCell>
                    <Chip label={c.status} size="small" color={STATUS_COLOR[c.status] ?? 'default'} />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      <TextField
                        size="small"
                        placeholder="Review notes"
                        value={notes[c.publicId] ?? ''}
                        onChange={(e) => setNotes((n) => ({ ...n, [c.publicId]: e.target.value }))}
                      />
                      {c.status === 'PENDING_REVIEW' && (
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() =>
                              approveMutation.mutate({ id: c.publicId, notes: notes[c.publicId] })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() =>
                              rejectMutation.mutate({ id: c.publicId, notes: notes[c.publicId] })
                            }
                          >
                            Reject
                          </Button>
                        </Stack>
                      )}
                      {c.status === 'APPROVED' && (
                        <Button size="small" variant="contained" onClick={() => mergeMutation.mutate(c.publicId)}>
                          Merge to platform
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {contributions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No pending seller contributions
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {data?.pagination && data.pagination.totalPages > 1 && (
          <Stack direction="row" spacing={1} mt={2}>
            <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button disabled={!data.pagination.hasNext} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
