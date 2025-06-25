import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  createReport,
  updateReportStatus,
  listReports,
} from '../controllers/reportController.js';

const router = Router();

router.patch('/:id/status', updateReportStatus);

router.use(authenticateToken);

router.post('/', createReport);
router.get('/', listReports);

export default router;