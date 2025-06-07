import { Router } from 'express';
import { register, login, logout, forgotPassword, checkAuth } from './auth.controller';
import { authenticate } from './auth.middleware';

const router = Router();

router.get('/check-auth', authenticate, checkAuth);
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgot-password', forgotPassword);

export default router;
