import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { HistorialController } from '../controllers/historial.controller';

const router = Router();

router.post('/mascotas/:id/historial', authMiddleware, HistorialController.crear);
router.get('/mascotas/:id/historial', authMiddleware, HistorialController.listaPorMascota);

// Rutas específicas de /historial DEBEN ir ANTES de las rutas con parámetros (:id)
router.get('/historial/categorias', authMiddleware, HistorialController.getCategorias);
router.get('/historial/estados', authMiddleware, HistorialController.getEstados);
router.get('/historial/contar-por-estado', authMiddleware, HistorialController.contarPorEstado);
router.get('/historial/por-estado/:estado', authMiddleware, HistorialController.listarPorEstado);

// Rutas generales (sin sub-rutas específicas)
router.get('/historial', authMiddleware, HistorialController.listMine);

// Rutas con parámetros :id DEBEN ir AL FINAL para evitar conflictos
router.patch('/historial/:id/estado', authMiddleware, HistorialController.cambiarEstado);
router.patch('/historial/:id', authMiddleware, HistorialController.update);
router.delete('/historial/:id', authMiddleware, HistorialController.remove);

export default router;