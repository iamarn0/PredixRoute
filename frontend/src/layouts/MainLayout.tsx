import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import WebhookOutlinedIcon from '@mui/icons-material/WebhookOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useState, ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { paths } from '../routes/paths';

type NavItem = { to: string; label: string; icon: ReactNode };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ to: paths.app.root, label: 'Dashboard', icon: <DashboardOutlinedIcon fontSize="small" /> }],
  },
  {
    title: 'Predictions',
    items: [
      { to: paths.app.evaluate, label: 'Evaluate', icon: <BoltOutlinedIcon fontSize="small" /> },
      { to: paths.app.predictions, label: 'History', icon: <HistoryOutlinedIcon fontSize="small" /> },
      { to: paths.app.bulkPredictions, label: 'Bulk Upload', icon: <CloudUploadOutlinedIcon fontSize="small" /> },
      { to: paths.app.codVerifications, label: 'COD Verify', icon: <VerifiedUserOutlinedIcon fontSize="small" /> },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { to: paths.app.developers, label: 'Developers', icon: <CodeOutlinedIcon fontSize="small" /> },
      { to: paths.app.apiKeys, label: 'API Keys', icon: <KeyOutlinedIcon fontSize="small" /> },
      { to: paths.app.webhooks, label: 'Webhooks', icon: <WebhookOutlinedIcon fontSize="small" /> },
    ],
  },
  {
    title: 'Insights',
    items: [
      { to: paths.app.pincodes, label: 'Pincodes', icon: <LocationOnOutlinedIcon fontSize="small" /> },
      { to: paths.app.usage, label: 'Usage', icon: <AnalyticsOutlinedIcon fontSize="small" /> },
      { to: paths.app.settings, label: 'Settings', icon: <SettingsOutlinedIcon fontSize="small" /> },
    ],
  },
];

const DRAWER_WIDTH = 260;

function getInitials(firstName?: string, lastName?: string, email?: string) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return 'PR';
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2.5, minHeight: { xs: 64, sm: 72 } }}>
        <Typography
          component={NavLink}
          to={paths.home}
          variant="h6"
          fontWeight={800}
          sx={{
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          PredixRoute
        </Typography>
      </Toolbar>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
        {NAV_GROUPS.map((group, gi) => (
          <Box key={group.title} sx={{ mb: gi < NAV_GROUPS.length - 1 ? 1.5 : 0 }}>
            <Typography
              variant="overline"
              sx={{ px: 1.5, color: 'text.secondary', fontSize: '0.68rem', letterSpacing: 1 }}
            >
              {group.title}
            </Typography>
            <List dense disablePadding>
              {group.items.map((item) => (
                <ListItemButton
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end={item.to === paths.app.root}
                  onClick={onNavigate}
                  sx={{
                    borderRadius: 2,
                    mb: 0.25,
                    '&.active': {
                      bgcolor: 'primary.main',
                      color: '#fff',
                      '& .MuiListItemIcon-root': { color: '#fff' },
                      '&:hover': { bgcolor: 'primary.dark' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(paths.customer.login);
  };

  const initials = getInitials(user?.firstName, user?.lastName, user?.email);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setOpen(true)} aria-label="Open menu">
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Stack alignItems="flex-end" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                  {user ? `${user.firstName} ${user.lastName}`.trim() : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
                  {user?.email}
                </Typography>
              </Stack>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
                {initials}
              </Avatar>
              <Button
                onClick={handleLogout}
                variant="outlined"
                size="small"
                startIcon={<LogoutOutlinedIcon />}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Logout
              </Button>
              <IconButton onClick={handleLogout} sx={{ display: { xs: 'inline-flex', sm: 'none' } }} aria-label="Logout">
                <LogoutOutlinedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        {isMobile && (
          <Drawer open={open} onClose={() => setOpen(false)}>
            <Box sx={{ width: DRAWER_WIDTH }}>
              <SidebarContent onNavigate={() => setOpen(false)} />
              <Divider />
              <Box sx={{ p: 2 }}>
                <Button fullWidth variant="outlined" startIcon={<LogoutOutlinedIcon />} onClick={handleLogout}>
                  Logout
                </Button>
              </Box>
            </Box>
          </Drawer>
        )}

        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, maxWidth: 1280, width: '100%', mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
