import { Router } from 'express';
import authRouter from './auth';
import publicationRouter from './publication';
const router = Router();

// Ejemplo de ruta
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Rutas de autenticación
router.use('/auth', authRouter);
router.use('/publications', publicationRouter);

export default router;