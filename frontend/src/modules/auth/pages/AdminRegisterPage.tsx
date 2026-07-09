import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Button, Link, Stack, TextField } from '@mui/material';
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
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField label="First Name" value={form.firstName} onChange={update('firstName')} required fullWidth InputLabelProps={{ sx: { color: 'grey.400' } }} sx={{ '& .MuiOutlinedInput-root': { color: 'grey.100' } }} />
        <TextField label="Last Name" value={form.lastName} onChange={update('lastName')} required fullWidth InputLabelProps={{ sx: { color: 'grey.400' } }} sx={{ '& .MuiOutlinedInput-root': { color: 'grey.100' } }} />
        <TextField label="Admin Email" type="email" value={form.email} onChange={update('email')} required fullWidth InputLabelProps={{ sx: { color: 'grey.400' } }} sx={{ '& .MuiOutlinedInput-root': { color: 'grey.100' } }} />
        <PasswordField label="Password" value={form.password} onChange={update('password')} required fullWidth helperText="Min 8 chars, upper, lower, digit, special" InputLabelProps={{ sx: { color: 'grey.400' } }} sx={{ '& .MuiOutlinedInput-root': { color: 'grey.100' }, '& .MuiIconButton-root': { color: 'grey.400' } }} />
        <PasswordField label="Admin Registration Secret" value={form.adminSecret} onChange={update('adminSecret')} fullWidth helperText="Required when ADMIN_REGISTRATION_SECRET is set on the server" InputLabelProps={{ sx: { color: 'grey.400' } }} sx={{ '& .MuiOutlinedInput-root': { color: 'grey.100' }, '& .MuiIconButton-root': { color: 'grey.400' } }} />
        <Button type="submit" variant="contained" color="warning" disabled={loading}>
          Register Platform Admin
        </Button>
        <Link component={RouterLink} to={paths.admin.login} variant="body2" textAlign="center" color="warning.light">
          Already have an admin account? Sign in
        </Link>
      </Stack>
    </form>
  );
}
