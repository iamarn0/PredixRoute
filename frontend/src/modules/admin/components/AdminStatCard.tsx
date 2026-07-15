import { Box, Card, CardContent, Typography } from '@mui/material';
import { ReactNode } from 'react';

type AdminStatCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  color?: string;
};

export function AdminStatCard({ label, value, subtitle, icon, color = '#4F46E5' }: AdminStatCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Box minWidth={0}>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} color="text.primary" mt={0.5} sx={{ letterSpacing: '-0.02em' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${color}14`,
                color,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
