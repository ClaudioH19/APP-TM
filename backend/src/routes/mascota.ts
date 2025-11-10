import { Router } from 'express';
import { MascotaController } from '../controllers/mascota.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.post('/', authMiddleware, (req, res) => MascotaController.registrar(req, res));
router.get('/', authMiddleware, (req, res) => MascotaController.obtenerMismascotas(req, res));
router.get('/:id', authMiddleware, (req, res) => MascotaController.obtenerPorId(req, res));

export default router;