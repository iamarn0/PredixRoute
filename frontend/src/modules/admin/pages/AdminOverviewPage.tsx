import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ModelTrainingOutlinedIcon from '@mui/icons-material/ModelTrainingOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import { adminService } from '../../../services/adminService';
import { QuickActionCard } from '../../../components/QuickActionCard';
import { AdminStatCard } from '../components/AdminStatCard';
import { AdminStatusChip } from '../components/AdminStatusChip';
import { AdminEmptyState } from '../components/AdminPagination';
import { paths } from '../../../routes/paths';
import { adminDashboardHeroGradient } from '../../../theme/adminTheme';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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
  const aiHealthy = stats?.aiServiceHealthy ?? false;

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          background: adminDashboardHeroGradient,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '-40%',
            right: '-5%',
            width: '45%',
            height: '160%',
            background: 'radial-gradient(ellipse, rgba(14, 165, 233, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'relative' }}>
          <Chip
            label="Platform Operations"
            size="small"
            sx={{
              alignSelf: 'flex-start',
              mb: 1.5,
              fontWeight: 600,
              bgcolor: 'rgba(56, 189, 248, 0.12)',
              color: '#7DD3FC',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          />
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
            {getGreeting()}, Admin
          </Typography>
          <Typography variant="body1" sx={{ color: '#94A3B8', mt: 1, maxWidth: 520 }}>
            Real-time snapshot of tenant activity, predictions, and system health across the platform.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={2.5}>
            <Button
              component={RouterLink}
              to={paths.admin.organizations}
              variant="contained"
              size="large"
              startIcon={<BusinessOutlinedIcon />}
              sx={{
                bgcolor: '#0EA5E9',
                '&:hover': { bgcolor: '#0284C7' },
              }}
            >
              Manage Organizations
            </Button>
            <Button
              component={RouterLink}
              to={paths.admin.system}
              variant="outlined"
              size="large"
              startIcon={<MonitorHeartOutlinedIcon />}
              sx={{
                borderColor: 'rgba(148, 163, 184, 0.4)',
                color: '#E2E8F0',
                '&:hover': { borderColor: '#94A3B8', bgcolor: 'rgba(255, 255, 255, 0.04)' },
              }}
            >
              System Health
            </Button>
          </Stack>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard
            label="Organizations"
            value={stats?.organizations ?? 0}
            icon={<BusinessOutlinedIcon />}
            color="#0EA5E9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard
            label="Active"
            value={stats?.activeOrganizations ?? 0}
            icon={<CheckCircleOutlineIcon />}
            color="#10B981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard
            label="Suspended"
            value={stats?.suspendedOrganizations ?? 0}
            icon={<PauseCircleOutlineIcon />}
            color="#F59E0B"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard
            label="Users"
            value={stats?.users ?? 0}
            icon={<PeopleOutlineIcon />}
            color="#38BDF8"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard
            label="Predictions"
            value={stats?.predictions ?? 0}
            subtitle={`${stats?.predictionsToday ?? 0} today`}
            icon={<AssessmentOutlinedIcon />}
            color="#0284C7"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <AdminStatCard
            label="Trial Subs"
            value={stats?.trialSubscriptions ?? 0}
            icon={<StarOutlineIcon />}
            color="#64748B"
          />
        </Grid>
      </Grid>

      <Card
        sx={{
          bgcolor: aiHealthy ? 'rgba(236, 253, 245, 0.8)' : 'rgba(255, 251, 235, 0.9)',
          borderColor: aiHealthy ? 'rgba(167, 243, 208, 0.6)' : 'rgba(253, 230, 138, 0.6)',
        }}
      >
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {aiHealthy ? (
              <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 28 }} />
            ) : (
              <ErrorOutlineIcon sx={{ color: 'warning.main', fontSize: 28 }} />
            )}
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                AI Service: {aiHealthy ? 'Healthy' : 'Unavailable'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Environment: {stats?.environment ?? 'unknown'}
              </Typography>
            </Box>
            <Chip
              label={aiHealthy ? 'Operational' : 'Degraded'}
              size="small"
              color={aiHealthy ? 'success' : 'warning'}
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Recent Tenants
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.25}>
                    Latest organizations on the platform
                  </Typography>
                </Box>
                <Link
                  component={RouterLink}
                  to={paths.admin.organizations}
                  color="primary"
                  underline="hover"
                  fontWeight={600}
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
                >
                  View all
                  <ChevronRightIcon fontSize="small" />
                </Link>
              </Stack>
              {organizations.length === 0 ? (
                <AdminEmptyState message="No organizations yet." />
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Organization</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Users</TableCell>
                      <TableCell align="right">Predictions</TableCell>
                      <TableCell width={40} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow
                        key={org.publicId}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:last-child td': { borderBottom: 0 },
                        }}
                        onClick={() => navigate(paths.admin.organization(org.publicId))}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{org.name}</TableCell>
                        <TableCell>
                          <AdminStatusChip status={org.status} />
                        </TableCell>
                        <TableCell align="right">{org.userCount}</TableCell>
                        <TableCell align="right">{org.predictionCount}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary' }}>
                          <ChevronRightIcon fontSize="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2} height="100%">
            <QuickActionCard
              title="Model Training"
              description="Upload datasets and manage ML training pipelines"
              to={paths.admin.training}
              icon={<ModelTrainingOutlinedIcon />}
              color="#0EA5E9"
            />
            <QuickActionCard
              title="Platform Users"
              description="View and manage all registered users"
              to={paths.admin.users}
              icon={<PeopleOutlineIcon />}
              color="#38BDF8"
            />
            <QuickActionCard
              title="System Monitor"
              description="Check MongoDB, Redis, and AI service status"
              to={paths.admin.system}
              icon={<MonitorHeartOutlinedIcon />}
              color="#10B981"
            />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
