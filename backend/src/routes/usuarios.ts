import { Router } from 'express';
import { UsuarioController  } from '../controllers/usuario.controller';
const router = Router();

router.get('/', UsuarioController.getUser);
router.put('/', UsuarioController.updateUser);
router.delete('/', UsuarioController.deleteUser);
router.get('/pets', UsuarioController.getPets);
router.post('/change-password', UsuarioController.changePassword);
export default router;  

