import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { HistorialController } from '../controllers/historial.controller';

const router = Router();

router.post('/mascotas/:id/historial', authMiddleware, HistorialController.crear);
router.get('/mascotas/:id/historial', authMiddleware, HistorialController.listaPorMascota);
router.get('/historial', authMiddleware, HistorialController.listMine);
router.get('/historial/categorias', authMiddleware, HistorialController.getCategorias);

router.get('/historial/estados', authMiddleware, HistorialController.getEstados);
router.patch('/historial/:id/estado', authMiddleware, HistorialController.cambiarEstado);

router.patch('/historial/:id', authMiddleware, HistorialController.update);
router.delete('/historial/:id', authMiddleware, HistorialController.remove);

export default router;