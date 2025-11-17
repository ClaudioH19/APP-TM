import { Request, Response } from 'express';
import { verifyToken, getUserFromToken } from '../services/token_service';
import { createUser, generateToken } from '../services/token_service';
import { crearMascotaParaUsuario, getAllPublicacionesByUsuarioId, getMascotaById, getMascotasByUsuarioId, deleteMascota, updateMascota} from '../services/perfil_service';

export class PerfilController {
  static async getMascotas(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
        if (!token) {
        return res.status(401).json({ error: 'Sin token' });
        }
        await verifyToken(token);
        const user = await getUserFromToken(token);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' }); 
        const mascotas = await getMascotasByUsuarioId(user.usuario_id);
        return res.json({ mascotas });
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Token inválido' });
    }
  } 
    static async createMascota(req: Request, res: Response) {   
    try {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
        if (!token) {
        return res.status(401).json({ error: 'Sin token' });
        }
        await verifyToken(token);
        const user = await getUserFromToken(token);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' }); 
        const { nombre, especie, descripcion, fecha_nacimiento } = req.body;
        const nuevaMascota = await crearMascotaParaUsuario(user, nombre, especie, descripcion, fecha_nacimiento);
        return res.json({ mascota: nuevaMascota });
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Token inválido' });
    }
    }
    static async deleteMascota(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
        if (!token) {
        return res.status(401).json({ error: 'Sin token' });
        }
        await verifyToken(token);
        const user = await getUserFromToken(token);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' }); 
        const mascotaId = parseInt(req.params.id, 10);
        const success = await deleteMascota(mascotaId);
        if (success) {
            return res.json({ message: 'Mascota eliminada' });
        } else {
            return res.status(404).json({ error: 'Mascota no encontrada' });
        }
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Token inválido' });
    }
    }
    static async updateMascota(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
        if (!token) {
        return res.status(401).json({ error: 'Sin token' });
        }
        await verifyToken(token);
        const user = await getUserFromToken(token);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' }); 
        const mascotaId = parseInt(req.params.id, 10);
        const data = req.body;
        const updatedMascota = await updateMascota(mascotaId, data);
        if (updatedMascota) {
            return res.json({ mascota: updatedMascota });
        } else {
            return res.status(404).json({ error: 'Mascota no encontrada' });
        }
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Token inválido' });
    }
    }
    static async getMascota(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
        if (!token) {
        return res.status(401).json({ error: 'Sin token' });
        }
        await verifyToken(token);
        const user = await getUserFromToken(token);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' }); 
        const mascotaId = parseInt(req.params.id, 10);
        const mascota = await getMascotaById(mascotaId);
        if (mascota) {
            return res.json({ mascota });
        } else {
            return res.status(404).json({ error: 'Mascota no encontrada' });
        }
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Token inválido' });
    }
    }
    static async getPublicaciones(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
        if (!token) {
        return res.status(401).json({ error: 'Sin token' });
        }
        await verifyToken(token);
        const user = await getUserFromToken(token);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' }); 
        const publicaciones = await getAllPublicacionesByUsuarioId(user.usuario_id);
        return res.json({ publicaciones });
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Token inválido' });
    }
    }
}