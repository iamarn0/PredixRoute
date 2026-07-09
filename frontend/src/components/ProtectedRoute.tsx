import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CircularProgress, Box } from '@mui/material';
import { paths } from '../routes/paths';

export function ProtectedRoute() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to={paths.customer.login} replace />;
  }

  if (user.role === 'SUPER_ADMIN') {
    return <Navigate to={paths.admin.dashboard} replace />;
  }

  return <Outlet />;
}
