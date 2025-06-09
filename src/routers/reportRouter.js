import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  createReport,
  updateReportStatus,
  listReports,
} from '../controllers/reportController.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createReport);
router.patch('/:id/status', updateReportStatus);
router.get('/', listReports);

export default router;