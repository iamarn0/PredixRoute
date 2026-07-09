import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink } from 'react-router-dom';
import { paths } from '../../../routes/paths';
import { MARKETING_FEATURES } from '../content/features';

const STATS = [
  { value: '94%', label: 'Avg. prediction accuracy on pilot datasets' },
  { value: '50ms', label: 'P95 API latency for risk evaluation' },
  { value: '19K+', label: 'Pincodes with intelligence coverage' },
  { value: '3+', label: 'Major courier integrations ranked per lane' },
];

const STEPS = [
  { step: '01', title: 'Connect your data', body: 'Register your organization and upload shipment history or call our API from your OMS.' },
  { step: '02', title: 'Evaluate risk', body: 'Submit pincode, COD amount, and courier options — get probability and risk level instantly.' },
  { step: '03', title: 'Ship smarter', body: 'Use recommended couriers and risk insights to cut RTO and improve delivery SLAs.' },
];

export function HomePage() {
  return (
    <>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 45%, #ECFDF5 100%)',
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="AI Logistics Intelligence" color="primary" variant="outlined" sx={{ mb: 2 }} />
              <Typography variant="h2" fontWeight={800} lineHeight={1.15} gutterBottom sx={{ fontSize: { xs: '2.2rem', md: '3.2rem' } }}>
                Predict delivery risk before you ship
              </Typography>
              <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ mb: 4, maxWidth: 560 }}>
                PredixRoute helps logistics teams, aggregators, and ecommerce brands choose the right courier and
                reduce RTO with explainable ML — via dashboard or API.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  component={RouterLink}
                  to={paths.try}
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                >
                  Try Evaluate Free
                </Button>
                <Button
                  component={RouterLink}
                  to={paths.customer.register}
                  variant="outlined"
                  size="large"
                >
                  Signup/Signin
                </Button>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Platform operator?{' '}
                <Button component={RouterLink} to={paths.admin.login} size="small" color="inherit">
                  Admin portal →
                </Button>
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card elevation={4} sx={{ borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 3, py: 2 }}>
                  <Typography fontWeight={700}>Live Risk Evaluation</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pincode 845401 · COD ₹1,499
                  </Typography>
                </Box>
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Delivery probability
                      </Typography>
                      <Typography variant="h4" fontWeight={800} color="error.main">
                        62%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Recommended courier
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        DTDC
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Top factor: rural tier pincode · high historical RTO rate
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={3}>
          {STATS.map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Typography variant="h4" fontWeight={800} color="primary">
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>
            Everything you need to ship intelligently
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 6, maxWidth: 640, mx: 'auto' }}>
            From pincode analytics to real-time risk APIs — built for Indian logistics at scale.
          </Typography>
          <Grid container spacing={3}>
            {MARKETING_FEATURES.map(({ Icon, title, description }) => (
              <Grid item xs={12} sm={6} md={4} key={title}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 4 } }}>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Icon fontSize="large" color="primary" />
                    </Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Stack alignItems="center" sx={{ mt: 5 }}>
            <Button component={RouterLink} to={paths.features} variant="text" endIcon={<ArrowForwardIcon />}>
              View all features
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>
          How it works
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {STEPS.map((s) => (
            <Grid item xs={12} md={4} key={s.step}>
              <Typography variant="overline" color="primary" fontWeight={700}>
                Step {s.step}
              </Typography>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {s.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {s.body}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="md">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Typography variant="h4" fontWeight={800}>
              Ready to reduce RTO and pick better couriers?
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>
              14-day trial on Starter plan. No credit card required for development sandbox.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button component={RouterLink} to={paths.customer.register} variant="contained" color="secondary" size="large">
                Create Organization Account
              </Button>
              <Button component={RouterLink} to={paths.pricing} variant="outlined" sx={{ color: 'white', borderColor: 'white' }} size="large">
                View Pricing
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
