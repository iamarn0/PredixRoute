import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { adminService } from '../../../services/adminService';
import { AdminConfirmDialog } from '../components/AdminConfirmDialog';
import { AdminPageHeader } from '../components/AdminPagination';
import { AdminStatCard } from '../components/AdminStatCard';
import { AdminStatusChip } from '../components/AdminStatusChip';
import { paths } from '../../../routes/paths';

export function AdminOrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<'ACTIVE' | 'SUSPENDED' | null>(null);

  const { data: org, isLoading, error } = useQuery({
    queryKey: ['admin-org', id],
    queryFn: () => adminService.getOrganization(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'SUSPENDED') => adminService.updateOrganizationStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-org', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orgs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setConfirmAction(null);
    },
  });

  if (isLoading) return <LinearProgress />;
  if (error || !org) return <Alert severity="error">Organization not found</Alert>;

  return (
    <Stack spacing={3}>
      <Link
        component={RouterLink}
        to={paths.admin.organizations}
        color="text.secondary"
        underline="hover"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, width: 'fit-content' }}
      >
        <ArrowBackIcon fontSize="small" /> Back to organizations
      </Link>

      <AdminPageHeader
        title={org.name}
        subtitle={org.slug}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <AdminStatusChip status={org.status} size="medium" />
            {org.status === 'ACTIVE' ? (
              <Button color="warning" variant="outlined" onClick={() => setConfirmAction('SUSPENDED')}>
                Suspend
              </Button>
            ) : org.status === 'SUSPENDED' ? (
              <Button color="success" variant="outlined" onClick={() => setConfirmAction('ACTIVE')}>
                Activate
              </Button>
            ) : null}
          </Stack>
        }
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <AdminStatCard label="Users" value={org.userCount} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <AdminStatCard label="Predictions" value={org.predictionCount} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <AdminStatCard label="Industry" value={org.industry} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Organization Details</Typography>
              <Stack spacing={1}>
                <Typography variant="body2"><strong>Billing email:</strong> {org.billingEmail}</Typography>
                <Typography variant="body2"><strong>Timezone:</strong> {org.settings.timezone}</Typography>
                <Typography variant="body2"><strong>Currency:</strong> {org.settings.defaultCurrency}</Typography>
                <Typography variant="body2"><strong>Data retention:</strong> {org.settings.dataRetentionDays} days</Typography>
                <Typography variant="body2"><strong>Created:</strong> {new Date(org.createdAt).toLocaleString()}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Subscription</Typography>
              {org.subscription ? (
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body1" fontWeight={600}>{org.subscription.planName}</Typography>
                    <AdminStatusChip status={org.subscription.status} />
                  </Stack>
                  <Typography variant="body2"><strong>Billing cycle:</strong> {org.subscription.billingCycle}</Typography>
                  <Typography variant="body2">
                    <strong>Period:</strong> {new Date(org.subscription.currentPeriodStart).toLocaleDateString()} – {new Date(org.subscription.currentPeriodEnd).toLocaleDateString()}
                  </Typography>
                  {org.subscription.trialEndsAt && (
                    <Typography variant="body2">
                      <strong>Trial ends:</strong> {new Date(org.subscription.trialEndsAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Stack>
              ) : (
                <Typography color="text.secondary">No active subscription on file.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <AdminConfirmDialog
        open={!!confirmAction}
        title={confirmAction === 'SUSPENDED' ? 'Suspend organization?' : 'Activate organization?'}
        message={
          confirmAction === 'SUSPENDED'
            ? `${org.name} will lose access to the platform until reactivated.`
            : `${org.name} will regain full platform access.`
        }
        confirmLabel={confirmAction === 'SUSPENDED' ? 'Suspend' : 'Activate'}
        confirmColor={confirmAction === 'SUSPENDED' ? 'warning' : 'success'}
        loading={statusMutation.isPending}
        onConfirm={() => confirmAction && statusMutation.mutate(confirmAction)}
        onCancel={() => setConfirmAction(null)}
      />
    </Stack>
  );
}
