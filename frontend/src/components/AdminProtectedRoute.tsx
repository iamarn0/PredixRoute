import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CircularProgress, Box } from '@mui/material';
import { paths } from '../routes/paths';

export function AdminProtectedRoute() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress color="warning" />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to={paths.admin.login} replace />;
  }

  if (user.role !== 'SUPER_ADMIN') {
    return <Navigate to={paths.customer.login} replace />;
  }

  return <Outlet />;
}
