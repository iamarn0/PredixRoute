import { apiClient } from './apiClient';
import { ApiSuccessResponse, Organization, User } from '../types/api.types';

export const authService = {
  async userLogin(email: string, password: string) {
    const { data } = await apiClient.post<ApiSuccessResponse<{ user: User; organization: Organization }>>(
      '/auth/user/login',
      { email, password },
    );
    return data.data;
  },

  async adminLogin(email: string, password: string) {
    const { data } = await apiClient.post<ApiSuccessResponse<{ user: User; organization: Organization }>>(
      '/auth/admin/login',
      { email, password },
    );
    return data.data;
  },

  async userRegister(payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  }) {
    const { data } = await apiClient.post('/auth/user/register', payload);
    return data;
  },

  async adminRegister(payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    adminSecret?: string;
  }) {
    const { data } = await apiClient.post('/auth/admin/register', payload);
    return data;
  },

  async me() {
    const { data } = await apiClient.get<ApiSuccessResponse<{ user: User }>>('/auth/me');
    return data.data.user;
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async forgotPassword(email: string) {
    const { data } = await apiClient.post<ApiSuccessResponse<{ message: string }>>('/auth/forgot-password', { email });
    return data.data;
  },

  async resetPassword(token: string, password: string) {
    const { data } = await apiClient.post<ApiSuccessResponse<{ message: string }>>('/auth/reset-password', {
      token,
      password,
    });
    return data.data;
  },

  async verifyEmail(token: string) {
    const { data } = await apiClient.post<ApiSuccessResponse<{ message: string }>>('/auth/verify-email', { token });
    return data.data;
  },
};
