import { Router } from 'express';
import authRoutes from './auth.routes';
import publicRoutes from './public.routes';
import dashboardRoutes from './dashboard.routes';
import adminRoutes from './admin.routes';
import webhookInboundRoutes from './webhook.routes';
import { healthController } from '../controllers/health.controller';

const router = Router();

router.get('/health', healthController.check);

router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/webhooks', webhookInboundRoutes);

export default router;
