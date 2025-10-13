import { Router, Request, Response } from 'express';
import { generateToken, createUser } from '../services/token_service';

const router = Router();

// Ruta para login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const token = await generateToken(email, password);
    res.json({ token });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Ruta para registro
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { nombre, contrasena, ubicacion } = req.body;
    const user = await createUser({ nombre, contrasena, ubicacion });
    res.json({ message: 'Usuario creado', user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;