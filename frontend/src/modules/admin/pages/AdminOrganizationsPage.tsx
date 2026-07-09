import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { adminService } from '../../../services/adminService';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { AdminEmptyState, AdminPageHeader, AdminPagination } from '../components/AdminPagination';
import { AdminStatusChip } from '../components/AdminStatusChip';
import { paths } from '../../../routes/paths';
import { AdminOrganization } from '../../../types/api.types';

export function AdminOrganizationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirm, setConfirm] = useState<{ org: AdminOrganization; action: 'ACTIVE' | 'SUSPENDED' } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orgs', page, search, statusFilter],
    queryFn: () =>
      adminService.listOrganizations({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ publicId, status }: { publicId: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      adminService.updateOrganizationStatus(publicId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orgs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orgs-recent'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setConfirm(null);
    },
  });

  const organizations = data?.organizations ?? [];

  return (
    <Stack spacing={3}>
      <AdminPageHeader title="Organizations" subtitle="Manage tenant accounts across the platform" />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Search"
          placeholder="Name, slug, or billing email"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (setSearch(searchInput), setPage(1))}
          size="small"
          sx={{ minWidth: 280 }}
        />
        <Button variant="contained" onClick={() => { setSearch(searchInput); setPage(1); }}>
          Search
        </Button>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {isLoading && <LinearProgress />}
      {error && <Alert severity="error">Failed to load organizations</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {organizations.length === 0 && !isLoading ? (
            <AdminEmptyState message="No organizations match your filters." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Billing Email</TableCell>
                  <TableCell align="right">Users</TableCell>
                  <TableCell align="right">Predictions</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow
                    key={org.publicId}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(paths.admin.organization(org.publicId))}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{org.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{org.slug}</TableCell>
                    <TableCell><AdminStatusChip status={org.status} /></TableCell>
                    <TableCell>{org.billingEmail}</TableCell>
                    <TableCell align="right">{org.userCount}</TableCell>
                    <TableCell align="right">{org.predictionCount}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      {org.status === 'ACTIVE' ? (
                        <Button
                          size="small"
                          color="warning"
                          variant="outlined"
                          onClick={() => setConfirm({ org, action: 'SUSPENDED' })}
                        >
                          Suspend
                        </Button>
                      ) : org.status === 'SUSPENDED' ? (
                        <Button
                          size="small"
                          color="success"
                          variant="outlined"
                          onClick={() => setConfirm({ org, action: 'ACTIVE' })}
                        >
                          Activate
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminPagination pagination={data?.pagination} onChange={setPage} />

      <AdminConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'SUSPENDED' ? 'Suspend organization?' : 'Activate organization?'}
        message={
          confirm?.action === 'SUSPENDED'
            ? `${confirm?.org.name} will lose access to the platform until reactivated.`
            : `${confirm?.org.name} will regain full platform access.`
        }
        confirmLabel={confirm?.action === 'SUSPENDED' ? 'Suspend' : 'Activate'}
        confirmColor={confirm?.action === 'SUSPENDED' ? 'warning' : 'success'}
        loading={statusMutation.isPending}
        onConfirm={() => {
          if (confirm) {
            statusMutation.mutate({ publicId: confirm.org.publicId, status: confirm.action });
          }
        }}
        onCancel={() => setConfirm(null)}
      />
    </Stack>
  );
}
