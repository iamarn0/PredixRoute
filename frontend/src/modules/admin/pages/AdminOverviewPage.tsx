import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, CardContent, Grid, LinearProgress, Link, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { adminService } from '../../../services/adminService';
import { AdminStatCard } from '../components/AdminStatCard';
import { AdminStatusChip } from '../components/AdminStatusChip';
import { AdminPageHeader } from '../components/AdminPagination';
import { paths } from '../../../routes/paths';

export function AdminOverviewPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
  });

  const { data: recentOrgs } = useQuery({
    queryKey: ['admin-orgs-recent'],
    queryFn: () => adminService.listOrganizations({ page: 1, limit: 5 }),
  });

  if (isLoading) return <LinearProgress />;
  if (error) return <Alert severity="error">Failed to load platform stats</Alert>;

  const organizations = recentOrgs?.organizations ?? [];

  return (
    <Stack spacing={3}>
      <AdminPageHeader title="Platform Overview" subtitle="Real-time snapshot of tenant activity and system health" />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard label="Organizations" value={stats?.organizations ?? 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard label="Active" value={stats?.activeOrganizations ?? 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard label="Suspended" value={stats?.suspendedOrganizations ?? 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard label="Users" value={stats?.users ?? 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard label="Predictions" value={stats?.predictions ?? 0} subtitle={`${stats?.predictionsToday ?? 0} today`} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard label="Trial Subs" value={stats?.trialSubscriptions ?? 0} />
        </Grid>
      </Grid>

      <Alert severity={stats?.aiServiceHealthy ? 'success' : 'warning'}>
        AI Service: {stats?.aiServiceHealthy ? 'Healthy' : 'Unavailable'} · Environment: {stats?.environment}
      </Alert>

      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={600}>Recent Tenants</Typography>
            <Link component={RouterLink} to={paths.admin.organizations} color="primary" underline="hover" fontWeight={500}>
              View all
            </Link>
          </Stack>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Organization</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Users</TableCell>
                <TableCell align="right">Predictions</TableCell>
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
                  <TableCell><AdminStatusChip status={org.status} /></TableCell>
                  <TableCell align="right">{org.userCount}</TableCell>
                  <TableCell align="right">{org.predictionCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );
}
