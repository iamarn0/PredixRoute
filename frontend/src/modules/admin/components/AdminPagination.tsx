import { Box, Pagination, Stack, Typography } from '@mui/material';
import { PaginationMeta } from '../../../types/api.types';

type AdminPaginationProps = {
  pagination?: PaginationMeta;
  onChange: (page: number) => void;
};

export function AdminPagination({ pagination, onChange }: AdminPaginationProps) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
      <Typography variant="body2" color="text.secondary">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
      </Typography>
      <Pagination
        count={pagination.totalPages}
        page={pagination.page}
        onChange={(_, page) => onChange(page)}
        size="small"
        color="primary"
      />
    </Stack>
  );
}

export function AdminPageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
      <Box>
        <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={0.75} sx={{ maxWidth: 560 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}

export function AdminEmptyState({ message }: { message: string }) {
  return (
    <Box py={6} textAlign="center">
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
