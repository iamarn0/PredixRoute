import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AdminProtectedRoute } from '../components/AdminProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { MarketingLayout } from '../modules/marketing/layouts/MarketingLayout';
import { HomePage } from '../modules/marketing/pages/HomePage';
import { FeaturesPage } from '../modules/marketing/pages/FeaturesPage';
import { PricingPage } from '../modules/marketing/pages/PricingPage';
import { TryPage } from '../modules/marketing/pages/TryPage';
import { UserLoginPage } from '../modules/auth/pages/UserLoginPage';
import { UserRegisterPage } from '../modules/auth/pages/UserRegisterPage';
import { ForgotPasswordPage } from '../modules/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../modules/auth/pages/ResetPasswordPage';
import { VerifyEmailPage } from '../modules/auth/pages/VerifyEmailPage';
import { AdminLoginPage } from '../modules/auth/pages/AdminLoginPage';
import { AdminRegisterPage } from '../modules/auth/pages/AdminRegisterPage';
import { AdminOverviewPage } from '../modules/admin/pages/AdminOverviewPage';
import { AdminOrganizationsPage } from '../modules/admin/pages/AdminOrganizationsPage';
import { AdminOrganizationDetailPage } from '../modules/admin/pages/AdminOrganizationDetailPage';
import { AdminUsersPage } from '../modules/admin/pages/AdminUsersPage';
import { AdminSystemPage } from '../modules/admin/pages/AdminSystemPage';
import { AdminModelTrainingPage } from '../modules/admin/pages/AdminModelTrainingPage';
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage';
import { EvaluatePage } from '../modules/predictions/pages/EvaluatePage';
import { PredictionsListPage } from '../modules/predictions/pages/PredictionsListPage';
import { PredictionDetailPage } from '../modules/predictions/pages/PredictionDetailPage';
import { ApiKeysPage } from '../modules/api-management/pages/ApiKeysPage';
import { PincodeListPage } from '../modules/pincodes/pages/PincodeListPage';
import { UsagePage } from '../modules/analytics/pages/UsagePage';
import { SettingsPage } from '../modules/settings/pages/SettingsPage';
import { WebhooksPage } from '../modules/webhooks/pages/WebhooksPage';
import { AboutPage } from '../modules/marketing/pages/AboutPage';
import { BulkPredictionsPage } from '../modules/bulk-predictions/pages/BulkPredictionsPage';
import { DevelopersPage } from '../modules/developers/pages/DevelopersPage';
import { CodVerificationListPage } from '../modules/cod-verification/pages/CodVerificationListPage';
import { CodVerificationDetailPage } from '../modules/cod-verification/pages/CodVerificationDetailPage';
import { paths } from './paths';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<HomePage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="try" element={<TryPage />} />
      </Route>

      <Route path="/customer/auth" element={<AuthLayout variant="user" />}>
        <Route path="login" element={<UserLoginPage />} />
        <Route path="register" element={<UserRegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify" element={<VerifyEmailPage />} />
      </Route>

      <Route path="/admin/auth" element={<AuthLayout variant="admin" />}>
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="register" element={<AdminRegisterPage />} />
      </Route>

      <Route path="/auth/login" element={<Navigate to={paths.customer.login} replace />} />
      <Route path="/auth/register" element={<Navigate to={paths.customer.register} replace />} />

      <Route path="/app" element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="evaluate" element={<EvaluatePage />} />
          <Route path="predictions" element={<PredictionsListPage />} />
          <Route path="predictions/:id" element={<PredictionDetailPage />} />
          <Route path="pincodes" element={<PincodeListPage />} />
          <Route path="api-keys" element={<ApiKeysPage />} />
          <Route path="usage" element={<UsagePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="webhooks" element={<WebhooksPage />} />
          <Route path="cod-verifications" element={<CodVerificationListPage />} />
          <Route path="cod-verifications/:id" element={<CodVerificationDetailPage />} />
          <Route path="bulk-predictions" element={<BulkPredictionsPage />} />
          <Route path="developers" element={<DevelopersPage />} />
        </Route>
      </Route>

      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/organizations" element={<AdminOrganizationsPage />} />
          <Route path="/admin/organizations/:id" element={<AdminOrganizationDetailPage />} />
          <Route path="/admin/training" element={<AdminModelTrainingPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/system" element={<AdminSystemPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={paths.home} replace />} />
    </Routes>
  );
}
