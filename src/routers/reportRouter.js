import { Router } from 'express';
import {
  createReport,
  updateReportStatus,
  listReports,
} from '../controllers/reportController.js';

const router = Router();

router.post('/', createReport);
router.patch('/:id/status', updateReportStatus);
router.get('/', listReports);

export default router;