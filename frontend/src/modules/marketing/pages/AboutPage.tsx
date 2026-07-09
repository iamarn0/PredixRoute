import { Box, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { paths } from '../../../routes/paths';
import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@mui/material';

const VALUES = [
  { title: 'Data-driven shipping', body: 'Replace gut-feel courier picks with models trained on real delivery outcomes.' },
  { title: 'Transparency first', body: 'Explainability is not optional — every prediction shows why the score looks the way it does.' },
  { title: 'API-native', body: 'Dashboard for humans, REST API for systems. Same intelligence, two surfaces.' },
];

export function AboutPage() {
  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Typography variant="h3" fontWeight={800} gutterBottom>
          About PredixRoute
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight={400} paragraph>
          PredixRoute is an AI-powered logistics intelligence platform built for companies that ship at scale across
          India. We help teams predict delivery risk, recommend couriers, and integrate intelligence into existing OMS,
          ERP, and WMS workflows.
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Our architecture separates customer-facing SaaS from internal ML services — your frontend and integrations
          always talk to a secure API gateway, never directly to model servers.
        </Typography>

        <Grid container spacing={3} sx={{ my: 4 }}>
          {VALUES.map((v) => (
            <Grid item xs={12} sm={4} key={v.title}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%', borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {v.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {v.body}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button component={RouterLink} to={paths.customer.register} variant="contained" size="large">
            Start your organization
          </Button>
          <Button component={RouterLink} to={paths.features} variant="outlined" size="large">
            See features
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
