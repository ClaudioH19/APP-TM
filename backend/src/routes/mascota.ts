import { Router } from 'express';
import { MascotaController } from '../controllers/mascota.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.get('/especies', authMiddleware, (req, res) => MascotaController.listarEspecies(req, res));
router.post('/', authMiddleware, (req, res) => MascotaController.registrar(req, res));
router.get('/', authMiddleware, (req, res) => MascotaController.obtenerMismascotas(req, res));
router.get('/:id', authMiddleware, (req, res) => MascotaController.obtenerPorId(req, res));
router.patch('/:id', authMiddleware, (req, res) => MascotaController.actualizar(req, res));
router.delete('/:id', authMiddleware, (req, res) => MascotaController.eliminar(req, res));

export default router;