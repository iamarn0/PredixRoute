import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Alert, Button, Divider, Link, Stack, TextField, Typography } from '@mui/material';
import { PasswordField } from '../../../components/PasswordField';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../store/authStore';
import { paths } from '../../../routes/paths';

export function UserLoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authService.userLogin(email, password);
      setUser(result.user);
      navigate(paths.app.root);
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
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Work email"
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
        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>

        <Divider>
          <Typography variant="caption" color="text.secondary">
            New to PredixRoute?
          </Typography>
        </Divider>

        <Button component={RouterLink} to={paths.customer.register} variant="outlined" fullWidth>
          Create organization account
        </Button>

        <Stack spacing={1} alignItems="center">
          <Link component={RouterLink} to={paths.customer.forgotPassword} variant="body2">
            Forgot password?
          </Link>
          <Link component={RouterLink} to={paths.admin.login} variant="body2" color="text.secondary">
            Platform admin sign in
          </Link>
        </Stack>
      </Stack>
    </form>
  );
}
