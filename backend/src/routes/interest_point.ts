import { Router } from 'express';
import { InterestPointController } from '../controllers/interest_point.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/interest_points
router.post('/', authMiddleware, InterestPointController.crearPuntoInteres);
// GET /api/interest_points
router.get('/', InterestPointController.obtenerPuntosInteres);

export default router;