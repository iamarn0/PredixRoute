import { Box, Link, Paper, Stack, Typography } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import { Link as RouterLink, Outlet } from 'react-router-dom';
import { paths } from '../routes/paths';

type AuthLayoutProps = {
  variant?: 'user' | 'admin';
};

const FEATURES = [
  { icon: <SpeedOutlinedIcon />, text: 'Real-time RTO risk scoring' },
  { icon: <ShieldOutlinedIcon />, text: 'COD verification & fraud prevention' },
  { icon: <LocalShippingOutlinedIcon />, text: 'Courier intelligence & routing' },
];

export function AuthLayout({ variant = 'user' }: AuthLayoutProps) {
  const isAdmin = variant === 'admin';

  if (isAdmin) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{ bgcolor: 'grey.900', p: 2 }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 440,
            borderRadius: 3,
            bgcolor: 'grey.800',
            color: 'grey.100',
          }}
        >
          <Link
            component={RouterLink}
            to={paths.home}
            underline="hover"
            color="grey.500"
            variant="body2"
            sx={{ display: 'block', mb: 2 }}
          >
            ← Back to home
          </Link>
          <Typography variant="h5" fontWeight={700} color="warning.main" mb={1}>
            PredixRoute
          </Typography>
          <Typography variant="body2" color="grey.400" mb={3}>
            Platform Admin Portal
          </Typography>
          <Outlet />
        </Paper>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" display="flex" sx={{ bgcolor: 'background.default' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          p: 6,
          background: 'linear-gradient(145deg, #312E81 0%, #4F46E5 45%, #7C3AED 100%)',
          color: '#fff',
        }}
      >
        <Typography variant="h3" fontWeight={800} letterSpacing="-0.02em" mb={2}>
          PredixRoute
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: 420, mb: 4 }}>
          AI-powered logistics intelligence to reduce RTO, optimize courier selection, and verify COD orders.
        </Typography>
        <Stack spacing={2}>
          {FEATURES.map((f) => (
            <Stack key={f.text} direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {f.icon}
              </Box>
              <Typography variant="body1" fontWeight={500}>
                {f.text}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box
        sx={{
          flex: { xs: 1, md: '0 0 480px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            maxWidth: 420,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Link
            component={RouterLink}
            to={paths.home}
            underline="hover"
            color="text.secondary"
            variant="body2"
            sx={{ display: 'block', mb: 2 }}
          >
            ← Back to home
          </Link>
          <Typography variant="h5" fontWeight={700} color="primary" mb={0.5}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Sign in to your customer workspace
          </Typography>
          <Outlet />
        </Paper>
      </Box>
    </Box>
  );
}
