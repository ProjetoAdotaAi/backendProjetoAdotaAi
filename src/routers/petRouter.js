import { Router } from 'express';
import {
  createPet,
  deletePet,
  getPetById,
  getPets,
  updatePet,
} from '../controllers/petController.js';

const router = Router();
router.get('/', getPets);
router.get('/:id', getPetById);
router.post('/', createPet);
router.put('/:id', updatePet);
router.delete('/:id', deletePet);

export default router;
