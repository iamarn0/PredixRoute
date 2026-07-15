import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Button, Link, Stack, TextField } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { PasswordField } from '../../../components/PasswordField';
import { authService } from '../../../services/authService';
import { paths } from '../../../routes/paths';

export function AdminRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: 'Demo@123456',
    firstName: '',
    lastName: '',
    adminSecret: '',
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
      const payload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        ...(form.adminSecret ? { adminSecret: form.adminSecret } : {}),
      };
      const res = await authService.adminRegister(payload);
      setSuccess(res.data?.message ?? 'Admin registration successful. Please sign in.');
      setTimeout(() => navigate(paths.admin.login), 1500);
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
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}
        <TextField label="First Name" value={form.firstName} onChange={update('firstName')} required fullWidth />
        <TextField label="Last Name" value={form.lastName} onChange={update('lastName')} required fullWidth />
        <TextField label="Admin Email" type="email" value={form.email} onChange={update('email')} required fullWidth />
        <PasswordField
          label="Password"
          value={form.password}
          onChange={update('password')}
          required
          fullWidth
          helperText="Min 8 chars, upper, lower, digit, special"
        />
        <PasswordField
          label="Admin Registration Secret"
          value={form.adminSecret}
          onChange={update('adminSecret')}
          fullWidth
          helperText="Required when ADMIN_REGISTRATION_SECRET is set on the server"
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          endIcon={!loading ? <ArrowForwardIcon /> : undefined}
          sx={{ py: 1.25 }}
        >
          {loading ? 'Registering…' : 'Register Platform Admin'}
        </Button>
        <Link
          component={RouterLink}
          to={paths.admin.login}
          variant="body2"
          textAlign="center"
          underline="hover"
        >
          Already have an admin account? Sign in
        </Link>
      </Stack>
    </form>
  );
}
