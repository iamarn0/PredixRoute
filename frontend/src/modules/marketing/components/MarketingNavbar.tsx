import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { Link as RouterLink, NavLink } from 'react-router-dom';
import { paths } from '../../../routes/paths';
import { useAuthStore } from '../../../store/authStore';

const NAV_LINKS = [
  { to: paths.try, label: 'Try Free' },
  { to: paths.features, label: 'Features' },
  { to: paths.pricing, label: 'Pricing' },
  { to: paths.about, label: 'About' },
];

export function MarketingNavbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const dashboardTarget =
    user?.role === 'SUPER_ADMIN' ? paths.admin.dashboard : paths.app.root;

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2 }}>
          <Typography
            component={RouterLink}
            to={paths.home}
            variant="h6"
            fontWeight={800}
            color="primary"
            sx={{ textDecoration: 'none', flexShrink: 0 }}
          >
            PredixRoute
          </Typography>

          {!isMobile && (
            <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.to}
                  component={NavLink}
                  to={link.to}
                  color="inherit"
                  sx={{
                    fontWeight: 500,
                    '&.active': { color: 'primary.main' },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Stack>
          )}

          <Box sx={{ flex: isMobile ? 1 : 0 }} />

          {!isMobile && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button component={RouterLink} to={paths.admin.login} size="small" color="inherit">
                Admin
              </Button>
              {user ? (
                <Button component={RouterLink} to={dashboardTarget} variant="contained">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button component={RouterLink} to={paths.customer.login} color="inherit">
                    Sign In
                  </Button>
                  <Button component={RouterLink} to={paths.customer.register} variant="contained">
                    Get Started
                  </Button>
                </>
              )}
            </Stack>
          )}

          {isMobile && (
            <IconButton onClick={() => setOpen(true)} edge="end">
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </Container>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }}>
          <List>
            {NAV_LINKS.map((link) => (
              <ListItemButton key={link.to} component={NavLink} to={link.to} onClick={() => setOpen(false)}>
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
            <ListItemButton component={RouterLink} to={paths.admin.login} onClick={() => setOpen(false)}>
              <ListItemText primary="Admin Portal" />
            </ListItemButton>
            {user ? (
              <ListItemButton component={RouterLink} to={dashboardTarget} onClick={() => setOpen(false)}>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            ) : (
              <>
                <ListItemButton component={RouterLink} to={paths.customer.login} onClick={() => setOpen(false)}>
                  <ListItemText primary="Sign In" />
                </ListItemButton>
                <ListItemButton component={RouterLink} to={paths.customer.register} onClick={() => setOpen(false)}>
                  <ListItemText primary="Get Started" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
