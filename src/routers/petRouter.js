import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';

import {
  createPet,
  deletePet,
  getPetById,
  getPets,
  updatePet,
} from '../controllers/petController.js';

const router = Router();
router.get('/', authenticateToken, getPets);
router.get('/:id', authenticateToken, getPetById);
router.post('/', authenticateToken, createPet);
router.put('/:id', authenticateToken, updatePet);
router.delete('/:id', authenticateToken, deletePet);

export default router;
