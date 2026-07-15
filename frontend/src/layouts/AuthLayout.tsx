import {
  Box,
  Chip,
  Container,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { AdminAuthIllustration } from '../components/illustrations/AdminAuthIllustration';
import { UserAuthIllustration } from '../components/illustrations/UserAuthIllustration';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { paths } from '../routes/paths';
import { adminAuthHeroGradient } from '../theme/adminTheme';

type AuthLayoutProps = {
  variant?: 'user' | 'admin';
};

const HERO_GRADIENT = adminAuthHeroGradient;

const FEATURES = [
  { icon: <SpeedOutlinedIcon fontSize="small" />, text: 'Real-time RTO risk scoring' },
  { icon: <ShieldOutlinedIcon fontSize="small" />, text: 'COD verification & fraud prevention' },
  { icon: <LocalShippingOutlinedIcon fontSize="small" />, text: 'Courier intelligence & routing' },
];

const ADMIN_FEATURES = [
  { icon: <BusinessOutlinedIcon fontSize="small" />, text: 'Organization & tenant management' },
  { icon: <PsychologyOutlinedIcon fontSize="small" />, text: 'Model training & deployment' },
  { icon: <MonitorHeartOutlinedIcon fontSize="small" />, text: 'System health & usage monitoring' },
];

function AuthFormCard({
  backLink,
  title,
  subtitle,
}: {
  backLink: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 4,
        bgcolor: 'background.paper',
        boxShadow: '0 8px 40px rgba(15, 23, 42, 0.08)',
        border: '1px solid',
        borderColor: 'rgba(226, 232, 240, 0.8)',
      }}
    >
      <Link
        component={RouterLink}
        to={backLink}
        underline="hover"
        color="text.secondary"
        variant="body2"
        sx={{ display: 'inline-flex', alignItems: 'center', mb: 2.5, fontWeight: 500 }}
      >
        ← Back to home
      </Link>
      <Typography variant="h5" fontWeight={800} color="text.primary" mb={0.5}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {subtitle}
      </Typography>
      <Outlet />
    </Paper>
  );
}

function UserAuthBranding() {
  return (
    <Stack spacing={3}>
      <Chip label="AI Logistics Intelligence" color="primary" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
      <Box>
        <Typography
          variant="h3"
          fontWeight={800}
          letterSpacing="-0.02em"
          sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, color: 'text.primary', mb: 1.5 }}
        >
          PredixRoute
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, lineHeight: 1.7 }}>
          AI-powered logistics intelligence to reduce RTO, optimize courier selection, and verify COD orders.
        </Typography>
      </Box>
      <Stack spacing={1.5}>
        {FEATURES.map((f) => (
          <Stack key={f.text} direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.9,
              }}
            >
              {f.icon}
            </Box>
            <Typography variant="body2" fontWeight={500} color="text.primary">
              {f.text}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <UserAuthIllustration />
    </Stack>
  );
}

function AdminAuthBranding() {
  return (
    <Stack spacing={3}>
      <Chip label="Platform Operations" color="primary" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
      <Box>
        <Typography
          variant="h3"
          fontWeight={800}
          letterSpacing="-0.02em"
          sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, color: 'text.primary', mb: 1.5 }}
        >
          PredixRoute Admin
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, lineHeight: 1.7 }}>
          Manage organizations, monitor platform health, and oversee ML model training across the PredixRoute
          logistics intelligence stack.
        </Typography>
      </Box>
      <Stack spacing={1.5}>
        {ADMIN_FEATURES.map((f) => (
          <Stack key={f.text} direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.9,
              }}
            >
              {f.icon}
            </Box>
            <Typography variant="body2" fontWeight={500} color="text.primary">
              {f.text}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <AdminAuthIllustration />
    </Stack>
  );
}

export function AuthLayout({ variant = 'user' }: AuthLayoutProps) {
  const isAdmin = variant === 'admin';
  const isRegister = useLocation().pathname.includes('/register');

  const formTitle = isAdmin
    ? isRegister
      ? 'Create admin account'
      : 'Admin sign in'
    : 'Welcome back';

  const formSubtitle = isAdmin
    ? isRegister
      ? 'Register a new platform operator'
      : 'Access the platform operations console'
    : 'Sign in to your customer workspace';

  return (
    <Box minHeight="100vh" sx={{ background: HERO_GRADIENT }}>
      <Container
        maxWidth="lg"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          py: { xs: 4, md: 6 },
        }}
      >
        <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
          <Grid item xs={12} md={6} lg={7} sx={{ order: { xs: 2, md: 1 } }}>
            {isAdmin ? <AdminAuthBranding /> : <UserAuthBranding />}
          </Grid>

          <Grid item xs={12} md={6} lg={5} sx={{ order: { xs: 1, md: 2 } }}>
            <AuthFormCard
              backLink={paths.home}
              title={formTitle}
              subtitle={formSubtitle}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
