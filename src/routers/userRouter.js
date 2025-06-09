import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';

import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    updateUser,
    updateProfilePicture,
} from '../controllers/userController.js';

const router = Router();

// Rota pública para criar usuário
router.post('/', createUser);

router.use(authenticateToken);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id', updateProfilePicture);


export default router;