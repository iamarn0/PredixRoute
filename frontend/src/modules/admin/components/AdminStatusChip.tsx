import { Chip } from '@mui/material';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  PENDING: 'info',
  DELETED: 'error',
  TRIAL: 'info',
  LOCKED: 'warning',
  DEACTIVATED: 'default',
  SUPER_ADMIN: 'warning',
  ORGANIZATION_ADMIN: 'info',
  ANALYST: 'default',
};

type AdminStatusChipProps = {
  status: string;
  size?: 'small' | 'medium';
};

export function AdminStatusChip({ status, size = 'small' }: AdminStatusChipProps) {
  return (
    <Chip
      label={status.replace(/_/g, ' ')}
      size={size}
      color={STATUS_COLORS[status] ?? 'default'}
      sx={{ textTransform: 'capitalize' }}
    />
  );
}
