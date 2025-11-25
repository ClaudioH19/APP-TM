import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import multer from 'multer';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo para avatar
  }
});

const router = Router();

//login
router.post('/login', (req, res) => AuthController.login(req, res));

//register
router.post('/register', (req, res) => AuthController.register(req, res));

// Nuevo endpoint: devuelve el usuario asociado al token Bearer
router.get('/me', (req, res) => AuthController.me(req, res));

// Avatar endpoints
router.post('/avatar', upload.single('avatar'), (req, res) => AuthController.uploadAvatar(req, res));
router.delete('/avatar', (req, res) => AuthController.deleteAvatar(req, res));

export default router;