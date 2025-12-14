import { Request, Response } from 'express';
import { verifyToken, getUserFromToken } from '../services/token_service';
import { createUser, generateToken } from '../services/token_service';
import { AppDataSource } from '../data-source';
import { Usuario } from '../entities/Usuario';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

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

     
      const { contrasena, avatar, ...safeUser } = (user as any);
      
      // Si tiene avatar, convertirlo a base64
      let avatarData = null;
      if (avatar && user.avatar_mime_type) {
        avatarData = {
          data: avatar.toString('base64'),
          mimeType: user.avatar_mime_type
        };
      }
      
      return res.json({ user: { ...safeUser, avatar: avatarData } });
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Token inválido' });
    }
  }

  static async uploadAvatar(req: MulterRequest, res: Response) {
    try {
      console.log('uploadAvatar: Request recibida');
      console.log('uploadAvatar: Headers:', req.headers['content-type']);
      console.log('uploadAvatar: File:', req.file ? { size: req.file.size, mimetype: req.file.mimetype } : 'No file');
      
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

      if (!token) {
        return res.status(401).json({ error: 'Sin token' });
      }

      const user = await getUserFromToken(token);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó imagen' });
      }

      console.log('uploadAvatar: Guardando avatar para usuario:', user.usuario_id);

      // Guardar avatar como bytea
      const usuarioRepo = AppDataSource.getRepository(Usuario);
      await usuarioRepo.update(user.usuario_id, {
        avatar: req.file.buffer,
        avatar_mime_type: req.file.mimetype
      });

      console.log('uploadAvatar: Avatar guardado exitosamente');

      return res.json({ 
        message: 'Avatar actualizado',
        avatar: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype
        }
      });
    } catch (err: any) {
      console.error('uploadAvatar error:', err);
      return res.status(500).json({ error: err.message || 'Error al subir avatar' });
    }
  }

  static async deleteAvatar(req: Request, res: Response) {
    try {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

      if (!token) {
        return res.status(401).json({ error: 'Sin token' });
      }

      const user = await getUserFromToken(token);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      // Eliminar avatar
      const usuarioRepo = AppDataSource.getRepository(Usuario);
      await usuarioRepo.update(user.usuario_id, {
        avatar: null,
        avatar_mime_type: null
      });

      return res.json({ message: 'Avatar eliminado' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Error al eliminar avatar' });
    }
  }
}
