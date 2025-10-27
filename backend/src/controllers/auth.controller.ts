import { Request, Response } from 'express';
import { verifyToken, getUserFromToken } from '../services/token_service';
import { createUser, generateToken } from '../services/token_service';

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

  static async me(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

      if (!token) {
        return res.status(401).json({ error: 'Sin token' });
      }


      await verifyToken(token);

      const user = await getUserFromToken(token);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

     
      const { contrasena, ...safeUser } = (user as any);
      return res.json({ user: safeUser });
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Token inválido' });
    }
  }
}
