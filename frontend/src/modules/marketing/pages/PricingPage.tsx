import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { Link as RouterLink } from 'react-router-dom';
import { paths } from '../../../routes/paths';

const PLANS = [
  {
    name: 'Starter',
    price: '₹4,999',
    period: '/ month',
    highlight: false,
    description: 'For growing brands testing AI-driven shipping decisions.',
    features: [
      '10,000 API calls / month',
      '500 predictions / day',
      'Dashboard access',
      'Pincode & courier intelligence',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    price: '₹14,999',
    period: '/ month',
    highlight: true,
    description: 'For aggregators and mid-size logistics teams at scale.',
    features: [
      '100,000 API calls / month',
      '5,000 predictions / day',
      'Batch evaluation',
      'Priority support',
      'Custom rate limits',
      'Webhook events (coming soon)',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    highlight: false,
    description: 'Dedicated models, SLAs, and on-prem deployment options.',
    features: [
      'Unlimited scale',
      'Private model training',
      'Dedicated success manager',
      'SSO & advanced RBAC',
      'Custom integrations',
    ],
  },
];

export function PricingPage() {
  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="lg">
        <Stack spacing={2} alignItems="center" textAlign="center" sx={{ mb: 6 }}>
          <Typography variant="h3" fontWeight={800}>
            Simple, transparent pricing
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400} maxWidth={640}>
            Start with a 14-day trial on Starter. Upgrade as your shipment volume and API usage grow.
          </Typography>
        </Stack>

        <Grid container spacing={3} alignItems="stretch">
          {PLANS.map((plan) => (
            <Grid item xs={12} md={4} key={plan.name}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  borderWidth: plan.highlight ? 2 : 1,
                  borderColor: plan.highlight ? 'primary.main' : 'divider',
                  position: 'relative',
                }}
              >
                {plan.highlight && (
                  <Chip label="Most popular" color="primary" size="small" sx={{ position: 'absolute', top: 16, right: 16 }} />
                )}
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {plan.name}
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 1 }}>
                    <Typography variant="h3" fontWeight={800} color="primary">
                      {plan.price}
                    </Typography>
                    <Typography color="text.secondary">{plan.period}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 48 }}>
                    {plan.description}
                  </Typography>
                  <List dense disablePadding sx={{ mb: 3 }}>
                    {plan.features.map((f) => (
                      <ListItem key={f} disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="secondary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={f} />
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    component={RouterLink}
                    to={paths.customer.register}
                    variant={plan.highlight ? 'contained' : 'outlined'}
                    fullWidth
                    size="large"
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
