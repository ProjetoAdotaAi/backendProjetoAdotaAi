import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';

import {
    createUser,
    deleteUser,
    getUserById,
    updateUser,
    updateProfilePicture,
    getAllUsers,
    searchUsers,
} from '../controllers/userController.js';

import { getPetsByOwner } from '../controllers/petController.js';

const router = Router();

// Rota pública para criar usuário
router.post('/', createUser);

router.use(authenticateToken);
router.get('/', getAllUsers);
router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id', updateProfilePicture);
router.get('/:ownerId/pets', getPetsByOwner);

export default router;