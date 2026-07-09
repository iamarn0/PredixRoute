import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, rbacMiddleware } from '../middleware/auth.middleware';
import { adminController } from '../controllers/admin/admin.controller';
import { adminTrainingContributionController } from '../controllers/admin/trainingContribution.controller';
import { validate } from '../middleware/errorHandler.middleware';
import { z } from 'zod';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      cb(new Error('Only CSV files are allowed'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.use(authMiddleware, rbacMiddleware('SUPER_ADMIN'));

router.get('/stats', adminController.platformStats);
router.get('/system/health', adminController.systemHealth);

router.get('/datasets/template', adminController.datasetTemplate);
router.get('/datasets', adminController.listTrainingDatasets);
router.post('/datasets/upload', upload.single('file'), adminController.uploadTrainingDataset);
router.post('/datasets/:datasetId/train', adminController.trainTrainingDataset);

router.get('/training-contributions', adminTrainingContributionController.listPending);
router.post('/training-contributions/:id/approve', adminTrainingContributionController.approve);
router.post('/training-contributions/:id/reject', adminTrainingContributionController.reject);
router.post('/training-contributions/:id/merge', adminTrainingContributionController.merge);

router.get('/organizations', adminController.listOrganizations);
router.get('/organizations/:id', adminController.getOrganization);
router.patch(
  '/organizations/:id/status',
  validate(
    z.object({
      status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING', 'DELETED']),
    }),
  ),
  adminController.updateOrganizationStatus,
);

router.get('/users', adminController.listUsers);

export default router;
