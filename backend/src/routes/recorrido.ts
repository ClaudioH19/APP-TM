import { Router } from 'express';
import { RecorridoController } from '../controllers/recorrido.controller';

const router = Router();

router.post('/', RecorridoController.create);
router.get('/history', RecorridoController.getHistory);

export default router;
