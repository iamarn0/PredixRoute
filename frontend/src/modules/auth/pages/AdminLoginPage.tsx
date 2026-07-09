import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Button, Link, Stack, TextField } from '@mui/material';
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
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Admin Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          InputLabelProps={{ sx: { color: 'grey.400' } }}
          sx={{ '& .MuiOutlinedInput-root': { color: 'grey.100' } }}
        />
        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          InputLabelProps={{ sx: { color: 'grey.400' } }}
          sx={{ '& .MuiOutlinedInput-root': { color: 'grey.100' }, '& .MuiIconButton-root': { color: 'grey.400' } }}
        />
        <Button type="submit" variant="contained" color="warning" size="large" disabled={loading}>
          {loading ? 'Signing in…' : 'Admin Sign In'}
        </Button>
        <Link component={RouterLink} to={paths.admin.register} variant="body2" textAlign="center" color="warning.light">
          Register platform admin
        </Link>
        <Link component={RouterLink} to={paths.customer.login} variant="body2" textAlign="center" color="grey.500">
          Customer account? Sign in here
        </Link>
      </Stack>
    </form>
  );
}
