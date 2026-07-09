# Phase 20 — Frontend Architecture

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite 5 |
| Language | TypeScript (strict mode) |
| UI | Material UI v5 + Emotion |
| Routing | React Router v6 |
| Data Fetching | TanStack Query v5 |
| HTTP | Axios |
| Forms | React Hook Form + Zod |
| Charts | Recharts + Chart.js |
| Animation | Framer Motion |
| State | Zustand (global) + React Context (theme, auth) |

## Routing Architecture

```typescript
// frontend/src/routes/index.tsx
const routes = [
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <ExecutiveDashboardPage /> },

      // Predictions
      { path: 'predictions', element: <PredictionListPage /> },
      { path: 'predictions/:id', element: <PredictionDetailPage /> },
      { path: 'predictions/evaluate', element: <BatchEvaluatePage /> },
      { path: 'predictions/analytics', element: <PredictionAnalyticsPage /> },

      // Shipments
      { path: 'shipments', element: <ShipmentListPage /> },
      { path: 'shipments/:id', element: <ShipmentDetailPage /> },

      // Couriers
      { path: 'couriers', element: <CourierListPage /> },
      { path: 'couriers/:code', element: <CourierDetailPage /> },
      { path: 'couriers/analytics', element: <CourierAnalyticsPage /> },

      // Pincodes
      { path: 'pincodes', element: <PincodeListPage /> },
      { path: 'pincodes/:pincode', element: <PincodeDetailPage /> },
      { path: 'pincodes/analytics', element: <PincodeAnalyticsPage /> },

      // Datasets (ORG_ADMIN for upload)
      { path: 'datasets', element: <DatasetListPage /> },
      { path: 'datasets/upload', element: <ProtectedRoute roles={['ORGANIZATION_ADMIN']}><DatasetUploadPage /></ProtectedRoute> },
      { path: 'datasets/:id', element: <DatasetDetailPage /> },

      // Models (ORG_ADMIN)
      { path: 'models', element: <ModelListPage /> },
      { path: 'models/:id', element: <ModelDetailPage /> },
      { path: 'models/analytics', element: <ModelAnalyticsPage /> },

      // Reports
      { path: 'reports', element: <ReportListPage /> },
      { path: 'reports/generate', element: <ReportGeneratePage /> },

      // Risk
      { path: 'risk', element: <RiskDashboardPage /> },

      // API Management (ORG_ADMIN)
      { path: 'api-keys', element: <ProtectedRoute roles={['ORGANIZATION_ADMIN']}><ApiKeysPage /></ProtectedRoute> },
      { path: 'api-usage', element: <ApiUsagePage /> },
      { path: 'webhooks', element: <ProtectedRoute roles={['ORGANIZATION_ADMIN']}><WebhooksPage /></ProtectedRoute> },
      { path: 'api-docs', element: <ApiDocumentationPage /> },

      // Settings
      { path: 'settings/profile', element: <ProfileSettingsPage /> },
      { path: 'settings/security', element: <SecuritySettingsPage /> },
      { path: 'settings/organization', element: <ProtectedRoute roles={['ORGANIZATION_ADMIN']}><OrganizationSettingsPage /></ProtectedRoute> },
      { path: 'settings/team', element: <ProtectedRoute roles={['ORGANIZATION_ADMIN']}><TeamManagementPage /></ProtectedRoute> },

      // Billing (ORG_ADMIN)
      { path: 'billing', element: <ProtectedRoute roles={['ORGANIZATION_ADMIN']}><SubscriptionPage /></ProtectedRoute> },
      { path: 'billing/plans', element: <PlansPage /> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
    ],
  },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <NotFoundPage /> },
];
```

## Page Hierarchy

```
/ (Executive Dashboard)
├── /predictions
│   ├── /predictions/:id (Detail + SHAP)
│   ├── /predictions/evaluate (Batch)
│   └── /predictions/analytics
├── /shipments
│   └── /shipments/:id
├── /couriers
│   ├── /couriers/:code
│   └── /couriers/analytics
├── /pincodes
│   ├── /pincodes/:pincode
│   └── /pincodes/analytics
├── /datasets
│   ├── /datasets/upload
│   └── /datasets/:id
├── /models
│   ├── /models/:id
│   └── /models/analytics
├── /reports
│   └── /reports/generate
├── /risk
├── /api-keys
├── /api-usage
├── /webhooks
├── /api-docs
├── /billing
│   └── /billing/plans
└── /settings
    ├── /settings/profile
    ├── /settings/security
    ├── /settings/organization
    └── /settings/team
```

## RBAC Navigation

```typescript
// frontend/src/layouts/MainLayout/Sidebar.tsx
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: DashboardIcon, roles: ['ORGANIZATION_ADMIN', 'ANALYST'] },
  { label: 'Predictions', path: '/predictions', icon: PredictionsIcon, roles: ['ORGANIZATION_ADMIN', 'ANALYST'] },
  { label: 'Shipments', path: '/shipments', icon: ShipmentIcon, roles: ['ORGANIZATION_ADMIN', 'ANALYST'] },
  { label: 'Couriers', path: '/couriers', icon: CourierIcon, roles: ['ORGANIZATION_ADMIN', 'ANALYST'] },
  { label: 'Pincodes', path: '/pincodes', icon: PincodeIcon, roles: ['ORGANIZATION_ADMIN', 'ANALYST'] },
  { label: 'Risk Analysis', path: '/risk', icon: RiskIcon, roles: ['ORGANIZATION_ADMIN', 'ANALYST'] },
  { label: 'Datasets', path: '/datasets', icon: DatasetIcon, roles: ['ORGANIZATION_ADMIN', 'ANALYST'] },
  { label: 'Models', path: '/models', icon: ModelIcon, roles: ['ORGANIZATION_ADMIN'] },
  { label: 'Reports', path: '/reports', icon: ReportIcon, roles: ['ORGANIZATION_ADMIN', 'ANALYST'] },
  { section: 'API Platform' },
  { label: 'API Keys', path: '/api-keys', icon: KeyIcon, roles: ['ORGANIZATION_ADMIN'] },
  { label: 'API Usage', path: '/api-usage', icon: UsageIcon, roles: ['ORGANIZATION_ADMIN', 'ANALYST'] },
  { label: 'Webhooks', path: '/webhooks', icon: WebhookIcon, roles: ['ORGANIZATION_ADMIN'] },
  { label: 'API Docs', path: '/api-docs', icon: DocsIcon, roles: ['ORGANIZATION_ADMIN', 'ANALYST'] },
  { section: 'Settings' },
  { label: 'Organization', path: '/settings/organization', icon: OrgIcon, roles: ['ORGANIZATION_ADMIN'] },
  { label: 'Team', path: '/settings/team', icon: TeamIcon, roles: ['ORGANIZATION_ADMIN'] },
  { label: 'Billing', path: '/billing', icon: BillingIcon, roles: ['ORGANIZATION_ADMIN'] },
];
```

## Theme System (Dark/Light Mode)

```typescript
// frontend/src/contexts/ThemeContext.tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: mode, setTheme } = useThemeStore();

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: mode === 'dark' ? '#818CF8' : '#4F46E5' },
      secondary: { main: mode === 'dark' ? '#34D399' : '#059669' },
      background: {
        default: mode === 'dark' ? '#0F172A' : '#F8FAFC',
        paper: mode === 'dark' ? '#1E293B' : '#FFFFFF',
      },
      risk: {
        low: '#22C55E',
        medium: '#EAB308',
        high: '#F97316',
        critical: '#EF4444',
      },
    },
    typography: { fontFamily: '"Inter", "Roboto", sans-serif' },
    components: {
      MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } } },
      MuiCard: { styleOverrides: { root: { borderRadius: 12 } } },
    },
  }), [mode]);

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}
```

## API Client

```typescript
// frontend/src/services/apiClient.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,  // send httpOnly cookies
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        return apiClient(error.config);
      } catch {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  },
);
```

## Error Boundaries

```typescript
// frontend/src/components/common/ErrorBoundary/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5">Something went wrong</Typography>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
```

## Global Notifications

```typescript
// frontend/src/store/notificationStore.ts
interface Notification {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id: nanoid() }],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
```

## Responsive Design

- **Breakpoints:** MUI defaults (xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536)
- **Sidebar:** Permanent drawer on lg+; temporary drawer (hamburger) on md and below
- **Data tables:** Horizontal scroll on mobile; card view alternative on xs
- **Charts:** ResponsiveContainer from Recharts; simplified views on mobile
