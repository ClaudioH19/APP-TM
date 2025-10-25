import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserFromToken } from '../services/token_service'; 
import { Usuario } from '../entities/Usuario';


export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // obtiene el token del header Authorization
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // verifica el token y obtiene el usuario asociado
    await verifyToken(token); 
    const user = await getUserFromToken(token); // Obtiene el usuario de la BD

    if (!user) {
      return res.status(404).json({ error: 'Usuario del token no encontrado' });
    }

    (req as any).user = user;

    // redirige al siguientecontrolador
    next();
    
  } catch (err: any) {
    return res.status(401).json({ error: 'Token inválido', details: err.message });
  }
};