import {Router} from 'express';
import {PerfilController} from '../controllers/perfil.controller';


const router = Router();
router.get('/mascotas', PerfilController.getMascotas);
router.post('/mascotas', PerfilController.createMascota);
router.delete('/mascotas/:id', PerfilController.deleteMascota);
router.put('/mascotas/:id', PerfilController.updateMascota);
router.get('/mascotas/:id', PerfilController.getMascota);
router.get('/publicaciones', PerfilController.getPublicaciones);

export default router;