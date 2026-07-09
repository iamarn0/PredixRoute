import { useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Alert, CircularProgress, Link, Stack, Typography } from '@mui/material';
import { authService } from '../../../services/authService';
import { paths } from '../../../routes/paths';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token');
      return;
    }
    authService
      .verifyEmail(token)
      .then((result) => {
        setStatus('success');
        setMessage(result.message);
      })
      .catch((err: unknown) => {
        setStatus('error');
        const msg =
          (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
          'Verification failed';
        setMessage(msg);
      });
  }, [token]);

  return (
    <Stack spacing={2} alignItems="center" textAlign="center">
      {status === 'loading' && <CircularProgress />}
      {status === 'success' && <Alert severity="success">{message}</Alert>}
      {status === 'error' && <Alert severity="error">{message}</Alert>}
      <Typography variant="body2">
        <Link component={RouterLink} to={paths.customer.login}>
          Continue to sign in
        </Link>
      </Typography>
    </Stack>
  );
}
