import { Box, Container, Divider, Grid, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { paths } from '../../../routes/paths';

export function MarketingFooter() {
  return (
    <Box component="footer" sx={{ bgcolor: 'grey.900', color: 'grey.300', mt: 8 }}>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={800} color="primary.light" gutterBottom>
              PredixRoute
            </Typography>
            <Typography variant="body2" color="grey.500">
              AI-powered logistics intelligence for smarter shipping decisions, courier selection, and delivery risk
              prediction across India.
            </Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} color="grey.100" gutterBottom>
              Product
            </Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to={paths.features} color="inherit" underline="hover">
                Features
              </Link>
              <Link component={RouterLink} to={paths.pricing} color="inherit" underline="hover">
                Pricing
              </Link>
              <Link component={RouterLink} to={paths.about} color="inherit" underline="hover">
                About
              </Link>
            </Stack>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" fontWeight={700} color="grey.100" gutterBottom>
              Customer Portal
            </Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to={paths.customer.login} color="inherit" underline="hover">
                Sign In
              </Link>
              <Link component={RouterLink} to={paths.customer.register} color="inherit" underline="hover">
                Register Organization
              </Link>
              <Link component={RouterLink} to={paths.app.root} color="inherit" underline="hover">
                Dashboard
              </Link>
            </Stack>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" fontWeight={700} color="grey.100" gutterBottom>
              Platform Admin
            </Typography>
            <Stack spacing={1}>
              <Link component={RouterLink} to={paths.admin.login} color="inherit" underline="hover">
                Admin Sign In
              </Link>
              <Link component={RouterLink} to={paths.admin.register} color="inherit" underline="hover">
                Admin Registration
              </Link>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 4, borderColor: 'grey.800' }} />
        <Typography variant="body2" color="grey.600" textAlign="center">
          © {new Date().getFullYear()} PredixRoute. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
