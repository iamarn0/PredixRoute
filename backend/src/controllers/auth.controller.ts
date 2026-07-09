import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import { config } from '../config';

const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict' as const,
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('prx_access', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
  res.cookie('prx_refresh', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

export class AuthController {
  registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.registerUser(req.body);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  registerAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.registerAdmin(req.body);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  };

  loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.loginUser(req.body, req.ip ?? 'unknown');
      setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
      sendSuccess(res, { user: result.user, organization: result.organization });
    } catch (err) {
      next(err);
    }
  };

  loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.loginAdmin(req.body, req.ip ?? 'unknown');
      setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
      sendSuccess(res, { user: result.user, organization: result.organization });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.prx_refresh ?? req.body.refreshToken;
      const tokens = await authService.refresh(refreshToken);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      sendSuccess(res, { message: 'Token refreshed' });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logout(req.cookies?.prx_refresh, req.cookies?.prx_access);
      res.clearCookie('prx_access', { path: '/' });
      res.clearCookie('prx_refresh', { path: '/api/v1/auth' });
      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.verifyEmail(req.body.token);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.forgotPassword(req.body.email);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, { user: req.user });
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
