import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';

import {
  createPet,
  deletePet,
  getPetById,
  getPets,
  updatePet,
  searchPetsByPreferences
} from '../controllers/petController.js';

const router = Router();

router.get('/search', searchPetsByPreferences);

router.get('/', getPets);
router.get('/:id', getPetById);

router.post('/', authenticateToken, createPet);
router.put('/:id', authenticateToken, updatePet);
router.delete('/:id', authenticateToken, deletePet);


export default router;
