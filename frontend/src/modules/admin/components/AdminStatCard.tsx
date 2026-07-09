import { Card, CardContent, Typography } from '@mui/material';

type AdminStatCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
};

export function AdminStatCard({ label, value, subtitle }: AdminStatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={800} color="text.primary" mt={0.5}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
