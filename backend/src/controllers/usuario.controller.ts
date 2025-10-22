import { Request, Response } from 'express';
import { verifyToken, getUserFromToken } from '../services/token_service';
import { getUserById,updateUser,deleteUser,getPetsByUserId,changePassword} from '../services/usuario_service';

export class UsuarioController {
  static async getUser(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: "Token no proporcionado" });
      }
      const userFromToken = await getUserFromToken(token);
      if (!userFromToken) {
        return res.status(401).json({ message: "Token inválido" });
      }
      const user = await getUserById(userFromToken.usuario_id);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: "Error al obtener el usuario" });
  } 
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: "Token no proporcionado" });
      }
      const userFromToken = await getUserFromToken(token);
      if (!userFromToken) {
        return res.status(401).json({ message: "Token inválido" });
      }
      const updatedUser = await updateUser(userFromToken.usuario_id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      return res.json(updatedUser);
    } catch (error) {
      return res.status(500).json({ message: "Error al actualizar el usuario" });
    }
  }
    static async deleteUser(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
        return res.status(401).json({ message: "Token no proporcionado" });
        }   
        const userFromToken = await getUserFromToken(token);
        if (!userFromToken) {
        return res.status(401).json({ message: "Token inválido" });
        }
        const success = await deleteUser(userFromToken.usuario_id);
        if (!success) {
        return res.status(404).json({ message: "Usuario no encontrado" });
        }
        return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Error al eliminar el usuario" });
    }
  }
  static async getPets(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: "Token no proporcionado" });
      }
      const userFromToken = await getUserFromToken(token); 
        if (!userFromToken) {
        return res.status(401).json({ message: "Token inválido" });
        }
        const pets =  await getPetsByUserId(userFromToken.usuario_id);
        //debug
        console.log(pets);
        return res.json(pets);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ message: error.message || "Error al obtener las mascotas" });
    }
    }
    static async changePassword(req: Request, res: Response) {
    try {
      const userFromToken = await getUserFromToken(req.body.token);
        if (!userFromToken) {
        return res.status(401).json({ message: "Token inválido" });
        }
        const { newPassword } = req.body;
        await changePassword(userFromToken.usuario_id, newPassword);
        return res.json({ message: "Contraseña actualizada" });
    } catch (error) {
      return res.status(500).json({ message: "Error al cambiar la contraseña" });
    }
    }
}