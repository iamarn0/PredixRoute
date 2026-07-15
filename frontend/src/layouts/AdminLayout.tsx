import { Outlet, NavLink, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { paths } from '../routes/paths';
import { adminNavActiveSx, adminSidebarSx, adminTheme } from '../theme/adminTheme';

const NAV = [
  { to: paths.admin.dashboard, label: 'Overview', icon: <DashboardIcon fontSize="small" /> },
  { to: paths.admin.organizations, label: 'Organizations', icon: <BusinessIcon fontSize="small" /> },
  { to: paths.admin.training, label: 'Model Training', icon: <ModelTrainingIcon fontSize="small" /> },
  { to: paths.admin.users, label: 'Users', icon: <PeopleIcon fontSize="small" /> },
  { to: paths.admin.system, label: 'System', icon: <MonitorHeartIcon fontSize="small" /> },
];

function getInitials(email?: string) {
  if (!email) return 'A';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return local.slice(0, 2).toUpperCase() || 'A';
}

function AdminShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(paths.admin.login);
  };

  const nav = (
    <List sx={{ px: 1.5, pt: 1 }}>
      {NAV.map((item) => (
        <ListItemButton
          key={item.to}
          component={NavLink}
          to={item.to}
          end={item.to === paths.admin.dashboard}
          onClick={() => setOpen(false)}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            color: '#71717A',
            transition: 'background-color 0.15s ease, color 0.15s ease',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#E4E4E7' },
            '&.active': adminNavActiveSx,
          }}
        >
          <Box mr={1.5} display="flex" alignItems="center">
            {item.icon}
          </Box>
          <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.925rem' }} />
        </ListItemButton>
      ))}
    </List>
  );

  const sidebarHeader = (
    <Toolbar sx={{ px: 2.5, minHeight: 72, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 0.25 }}>
      <Typography
        component={RouterLink}
        to={paths.admin.dashboard}
        variant="h6"
        fontWeight={800}
        sx={{
          textDecoration: 'none',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #7DD3FC 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.2,
        }}
      >
        PredixRoute
      </Typography>
      <Box
        sx={{
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      >
        <Typography variant="caption" sx={{ color: '#7DD3FC', fontWeight: 600, letterSpacing: 0.5 }}>
          ADMIN CONSOLE
        </Typography>
      </Box>
    </Toolbar>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            '& .MuiDrawer-paper': {
              ...adminSidebarSx,
              position: 'relative',
            },
          }}
        >
          {sidebarHeader}
          {nav}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: 1,
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {isMobile && (
              <Button onClick={() => setOpen(true)} startIcon={<MenuIcon />} sx={{ mr: 1, color: 'text.primary' }}>
                Menu
              </Button>
            )}
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
              Platform Console
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  bgcolor: 'primary.main',
                }}
              >
                {getInitials(user?.email)}
              </Avatar>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }} noWrap>
                {user?.email}
              </Typography>
            </Stack>
            <Button
              onClick={handleLogout}
              variant="outlined"
              size="small"
              startIcon={<LogoutIcon />}
              sx={{
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': { borderColor: 'text.secondary', bgcolor: 'rgba(15, 23, 42, 0.04)' },
              }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        {isMobile && (
          <Drawer
            open={open}
            onClose={() => setOpen(false)}
            PaperProps={{ sx: { ...adminSidebarSx, width: 260 } }}
          >
            {sidebarHeader}
            {nav}
          </Drawer>
        )}

        <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 }, flex: 1 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}

export function AdminLayout() {
  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <AdminShell />
    </ThemeProvider>
  );
}
