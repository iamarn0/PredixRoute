import { Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ReactNode } from 'react';

type QuickActionCardProps = {
  title: string;
  description: string;
  to: string;
  icon: ReactNode;
  color?: string;
};

export function QuickActionCard({ title, description, to, icon, color = '#4F46E5' }: QuickActionCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardActionArea component={RouterLink} to={to} sx={{ height: '100%' }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
            >
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: `${color}14`,
                  color,
                }}
              >
                {icon}
              </Stack>
              <Typography variant="subtitle1" fontWeight={600}>
                {title}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
