import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

//login
router.post('/login', (req, res) => AuthController.login(req, res));

//register
router.post('/register', (req, res) => AuthController.register(req, res));

// Nuevo endpoint: devuelve el usuario asociado al token Bearer
router.get('/me', (req, res) => AuthController.me(req, res));

export default router;