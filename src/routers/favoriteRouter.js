import { Router } from 'express';
import {
  addFavorite,
  removeFavorite,
  getUserFavorites
} from '../controllers/favoriteController.js';

const router = Router();

router.post('/', addFavorite);
router.delete('/:userId/:petId', removeFavorite);
router.get('/:userId', getUserFavorites);
export default router; 