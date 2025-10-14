import { Request, Response } from 'express';
import { generateToken, createUser } from '../services/token_service';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const token = await generateToken(email, password);
      return res.json({ token });
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { nombre, apellido, usuario, email, contrasena } = req.body;
      const user = await createUser({ nombre, apellido, usuario, email, contrasena });
      return res.json({ message: 'Usuario creado' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
