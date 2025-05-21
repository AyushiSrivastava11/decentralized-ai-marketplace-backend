import { Router } from 'express';
import { register, login, logout, forgotPassword } from './auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgot-password', forgotPassword);

export default router;
