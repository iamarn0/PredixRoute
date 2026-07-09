import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Button, Link, Stack, TextField } from '@mui/material';
import { PasswordField } from '../../../components/PasswordField';
import { authService } from '../../../services/authService';
import { paths } from '../../../routes/paths';

export function UserRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    organizationName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.userRegister(form);
      setSuccess(res.data?.message ?? 'Registration successful. Please sign in.');
      setTimeout(() => navigate(paths.customer.login), 1500);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField label="Organization Name" value={form.organizationName} onChange={update('organizationName')} required fullWidth autoComplete="organization" />
        <TextField label="First Name" value={form.firstName} onChange={update('firstName')} required fullWidth autoComplete="given-name" />
        <TextField label="Last Name" value={form.lastName} onChange={update('lastName')} required fullWidth autoComplete="family-name" />
        <TextField label="Email" type="email" value={form.email} onChange={update('email')} required fullWidth autoComplete="email" />
        <PasswordField label="Password" value={form.password} onChange={update('password')} required fullWidth autoComplete="new-password" helperText="Min 8 chars, upper, lower, digit, special" />
        <Button type="submit" variant="contained" disabled={loading}>
          Register Organization
        </Button>
        <Link component={RouterLink} to={paths.customer.login} variant="body2" textAlign="center">
          Already have an account? Sign in
        </Link>
      </Stack>
    </form>
  );
}
