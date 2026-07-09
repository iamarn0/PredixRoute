import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Box, Button, Container, Typography } from '@mui/material';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Box textAlign="center">
            <Typography variant="h5" gutterBottom>
              Something went wrong
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              An unexpected error occurred. Please refresh the page or contact support if the problem persists.
            </Alert>
            <Button variant="contained" onClick={() => window.location.assign('/')}>
              Return Home
            </Button>
          </Box>
        </Container>
      );
    }
    return this.props.children;
  }
}
