import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  createInteraction,
  getPetsForUser,
  getUserInteractions,
} from '../controllers/interactionController.js';

const router = Router();

// Todas as rotas aqui são autenticadas
router.use(authenticateToken);

router.post('/', createInteraction);
router.get('/', getPetsForUser);
router.get('/list', getUserInteractions);

export default router; 