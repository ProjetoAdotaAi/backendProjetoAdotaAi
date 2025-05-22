import { Router } from 'express';

import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    updateUser,
    updateProfilePicture,
} from '../controllers/userController.js';

const router = Router();
router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id', updateProfilePicture);


export default router;