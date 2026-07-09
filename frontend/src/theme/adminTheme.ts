import { createTheme } from '@mui/material';

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4F46E5', dark: '#4338CA', light: '#818CF8' },
    secondary: { main: '#0F172A' },
    background: { default: '#F1F5F9', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
    divider: '#E2E8F0',
    success: { main: '#059669' },
    warning: { main: '#D97706' },
    error: { main: '#DC2626' },
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
        body: { backgroundColor: '#F1F5F9' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
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
  bgcolor: '#0F172A',
  color: '#CBD5E1',
  borderRight: 'none',
} as const;

export const adminNavActiveSx = {
  bgcolor: 'rgba(79, 70, 229, 0.15)',
  color: '#C7D2FE',
  borderRight: '3px solid',
  borderColor: 'primary.main',
  '& .MuiListItemText-primary': { fontWeight: 600 },
} as const;
