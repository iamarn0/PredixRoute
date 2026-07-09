import { Outlet, NavLink, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
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
            color: '#94A3B8',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#E2E8F0' },
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
    <Toolbar sx={{ px: 2.5, minHeight: 72 }}>
      <Typography
        component={RouterLink}
        to={paths.admin.dashboard}
        variant="h6"
        fontWeight={800}
        sx={{
          textDecoration: 'none',
          background: 'linear-gradient(135deg, #818CF8 0%, #C7D2FE 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        PredixRoute
      </Typography>
      <Typography variant="caption" sx={{ ml: 1, color: '#64748B', alignSelf: 'flex-end', pb: 0.5 }}>
        Admin
      </Typography>
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
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar>
            {isMobile && (
              <Button onClick={() => setOpen(true)} startIcon={<MenuIcon />} sx={{ mr: 1, color: 'text.primary' }}>
                Menu
              </Button>
            )}
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 600, fontSize: '1.05rem' }}>
              Platform Console
            </Typography>
            <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}>
              {user?.email}
            </Typography>
            <Button onClick={handleLogout} variant="outlined" size="small" startIcon={<LogoutIcon />} color="inherit">
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
