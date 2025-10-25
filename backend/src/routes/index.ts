import { Router } from 'express';
import authRouter from './auth';
import publicationRouter from './publication';
import interestPointRouter from './interest_point'; 
import reviewRouter from './review'; 
const router = Router();


router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Rutas de autenticación
router.use('/auth', authRouter);
// Rutas de publicaciones
router.use('/publications', publicationRouter);
// Rutas de puntos de interés
router.use('/interest_points', interestPointRouter);
// Rutas de reseñas
router.use('/reviews', reviewRouter);

export default router;