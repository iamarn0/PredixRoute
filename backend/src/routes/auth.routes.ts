import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/errorHandler.middleware';
import { loginSchema, registerSchema, adminRegisterSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';
import { authRateLimitMiddleware } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/user/register', validate(registerSchema), authController.registerUser);
router.post('/user/login', authRateLimitMiddleware(), validate(loginSchema), authController.loginUser);
router.post('/admin/register', validate(adminRegisterSchema), authController.registerAdmin);
router.post('/admin/login', authRateLimitMiddleware(), validate(loginSchema), authController.loginAdmin);

router.post('/register', validate(registerSchema), authController.registerUser);
router.post('/login', authRateLimitMiddleware(), validate(loginSchema), authController.loginUser);

router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/forgot-password', authRateLimitMiddleware(), validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimitMiddleware(), validate(resetPasswordSchema), authController.resetPassword);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
