import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  TextField,
} from '@mui/material';
import { adminService } from '../../../services/adminService';
import { AdminEmptyState, AdminPageHeader, AdminPagination } from '../components/AdminPagination';
import { AdminStatusChip } from '../components/AdminStatusChip';

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminService.listUsers({ page, limit: 20, search: search || undefined }),
  });

  const users = data?.users ?? [];

  return (
    <Stack spacing={3}>
      <AdminPageHeader title="Users" subtitle="All platform users across tenant organizations" />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Search users"
          placeholder="Email or name"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (setSearch(searchInput), setPage(1))}
          size="small"
          sx={{ minWidth: 280 }}
        />
        <Button variant="contained" onClick={() => { setSearch(searchInput); setPage(1); }}>
          Search
        </Button>
      </Stack>

      {isLoading && <LinearProgress />}
      {error && <Alert severity="error">Failed to load users</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {users.length === 0 && !isLoading ? (
            <AdminEmptyState message="No users match your search." />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.publicId} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <AdminStatusChip status={user.role} />
                        {user.role === 'SUPER_ADMIN' && (
                          <Chip label="Platform" size="small" color="primary" variant="outlined" />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{user.organizationName}</TableCell>
                    <TableCell><AdminStatusChip status={user.status} /></TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AdminPagination pagination={data?.pagination} onChange={setPage} />
    </Stack>
  );
}
