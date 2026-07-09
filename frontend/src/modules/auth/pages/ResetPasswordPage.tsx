import { useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Link, Stack } from '@mui/material';
import { PasswordField } from '../../../components/PasswordField';
import { authService } from '../../../services/authService';
import { paths } from '../../../routes/paths';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      navigate(paths.customer.login);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Reset failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <PasswordField label="New password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
        <PasswordField label="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required fullWidth />
        <Button type="submit" variant="contained" disabled={loading || !token}>
          {loading ? 'Updating…' : 'Reset password'}
        </Button>
        <Link component={RouterLink} to={paths.customer.login} variant="body2" textAlign="center">
          Back to sign in
        </Link>
      </Stack>
    </form>
  );
}
