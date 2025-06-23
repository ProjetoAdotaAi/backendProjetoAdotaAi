import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  createInteraction,
  getPetsForUser,
  getUserInteractions,
  favoritePet,
} from '../controllers/interactionController.js';

const router = Router();

router.use(authenticateToken);

router.post('/', createInteraction);
router.get('/', getPetsForUser);
router.get('/list', getUserInteractions);
router.post('/favorite', favoritePet);

export default router; 