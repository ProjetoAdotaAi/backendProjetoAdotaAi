import { Router } from 'express';

import {
    login,
    sendOtp,
    resetPassword,
} from '../controllers/authController.js';

const router = Router();
router.post('/', login);
router.post('/sendOtp', sendOtp);
router.post('/resetPassword', resetPassword);

export default router;