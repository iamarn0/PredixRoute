import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { MARKETING_FEATURES } from '../content/features';

export function FeaturesPage() {
  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="lg">
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Features
        </Typography>
        <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ mb: 6, maxWidth: 720 }}>
          PredixRoute combines machine learning, logistics domain data, and developer tooling into one platform.
        </Typography>

        <Grid container spacing={4}>
          {MARKETING_FEATURES.map(({ Icon, title, description, bullets }) => (
            <Grid item xs={12} md={6} key={title}>
              <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Icon color="primary" />
                  </Box>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {description}
                  </Typography>
                  <List dense disablePadding>
                    {bullets.map((bullet) => (
                      <ListItem key={bullet} disableGutters>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon color="secondary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={bullet} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
