import { Router } from 'express';
import authRouter from './auth';

const router = Router();

// Ejemplo de ruta
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Rutas de autenticación
router.use('/auth', authRouter);


export default router;