import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Button, Link, Stack, TextField } from '@mui/material';
import { authService } from '../../../services/authService';
import { paths } from '../../../routes/paths';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await authService.forgotPassword(email);
      setMessage(result.message);
    } catch {
      setError('Unable to process request. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <Alert severity="info">Enter your account email and we will send a reset link.</Alert>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
        <Link component={RouterLink} to={paths.customer.login} variant="body2" textAlign="center">
          Back to sign in
        </Link>
      </Stack>
    </form>
  );
}
