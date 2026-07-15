import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PasswordField } from '../../../components/PasswordField';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../store/authStore';
import { paths } from '../../../routes/paths';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('superadmin@predixroute.com');
  const [password, setPassword] = useState('Demo@123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.adminLogin(email, password);
      setUser(result.user);
      navigate(paths.admin.dashboard);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2.5}>
        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        <TextField
          label="Admin Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          autoComplete="email"
        />
        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          autoComplete="current-password"
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          endIcon={!loading ? <ArrowForwardIcon /> : undefined}
          sx={{ py: 1.25, mt: 0.5 }}
        >
          {loading ? 'Signing in…' : 'Admin Sign In'}
        </Button>

        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={1.5}>
            Need to onboard a new platform admin?
          </Typography>
          <Button
            component={RouterLink}
            to={paths.admin.register}
            variant="outlined"
            fullWidth
            size="large"
            sx={{ py: 1.1 }}
          >
            Register platform admin
          </Button>
        </Box>

        <Stack alignItems="center" sx={{ pt: 0.5 }}>
          <Link
            component={RouterLink}
            to={paths.customer.login}
            variant="body2"
            color="text.secondary"
            underline="hover"
          >
            Customer account? Sign in here
          </Link>
        </Stack>
      </Stack>
    </form>
  );
}
