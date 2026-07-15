import { createTheme } from '@mui/material';

/** Full-page background for admin auth screens */
export const adminAuthHeroGradient = 'linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 45%, #ECFDF5 100%)';

/** Hero banner — dark slate, no purple */
export const adminDashboardHeroGradient = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';

/** Accent used for sidebar active states & highlights */
export const adminAccent = '#38bdf8';

/** @deprecated Use adminAuthHeroGradient or adminDashboardHeroGradient */
export const adminHeroGradient = adminAuthHeroGradient;

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0EA5E9', dark: '#0284C7', light: '#38BDF8' },
    secondary: { main: '#0F172A' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
    divider: '#E2E8F0',
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#F8FAFC' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#64748B',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
  },
});

export const adminSidebarSx = {
  width: 260,
  bgcolor: '#09090b',
  color: '#A1A1AA',
  borderRight: '1px solid rgba(255, 255, 255, 0.06)',
} as const;

export const adminNavActiveSx = {
  bgcolor: 'rgba(56, 189, 248, 0.1)',
  color: '#F4F4F5',
  borderLeft: '3px solid #38bdf8',
  borderRight: 'none',
  pl: 'calc(16px - 3px)',
  '& .MuiListItemText-primary': { fontWeight: 600 },
} as const;
