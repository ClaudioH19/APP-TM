export * from "../services/token_service";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { Usuario } from "../entities/Usuario";
import { AppDataSource } from "../data-source";
import { Response } from "express";
import { rsaEncrypt } from "../security/rsa";

export async function registerUser(req: Request, res: Response) {
  const { nombre, apellido, contrasena, email, usuario } = req.body as any;
  if (!nombre || !apellido || !contrasena || !email || !usuario) {
    return res.status(400).json({ error: "Faltan campos" });
  }

  try {
    const repo = AppDataSource.getRepository(Usuario);

    // verificaciones de unicidad
    if (await repo.findOneBy({ email })) {
      return res.status(409).json({ error: "Email ya está en uso" });
    }
    if (await repo.findOneBy({ usuario })) {
      return res.status(409).json({ error: "Nombre de usuario ya está en uso" });
    }

    // crea y guarda el usuario
    const nuevo = repo.create({
      nombre,
      apellido,
      email,
      usuario,
      contrasena: rsaEncrypt(contrasena), // cifra la contraseña con la clave pública (base64)
    });

    const saved = await repo.save(nuevo);
    const { contrasena: _omit, ...safe } = saved as any;
    return res.status(201).json(safe);
  } catch (e: any) {
    return res.status(500).json({ error: "No se pudo registrar" });
  }
}
  

export async function getUserById(id: number, response: Response): Promise<Usuario | void> {
  try {
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepository.findOneBy({ usuario_id: id });
    if (!usuario) {
      response.status(404).json({ message: "Usuario no encontrado" });
      return;
    }
    response.status(200).json(usuario);
    return usuario;
  } catch (error: any) {
    response.status(500).json({ message: "Error al obtener el usuario" });
  }
}

export async function updateUser(id: number, data: Partial<Usuario>, response: Response): Promise<Usuario | void> {
  try {
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    if (data.contrasena) {
      data.contrasena = await argon2.hash(data.contrasena);
    }
    await usuarioRepository.update(id, data);
    const updatedUser = await usuarioRepository.findOneBy({ usuario_id: id });
    if (!updatedUser) {
      response.status(404).json({ message: "Usuario no encontrado" });
      return;
    }
    response.status(200).json(updatedUser);
    return updatedUser;
  } catch (error: any) {
    response.status(500).json({ message: "Error al actualizar el usuario" });
  }
}
export async function deleteUser(id: number, response: Response): Promise<void> {
  try {
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    await usuarioRepository.delete(id);
    response.status(204).send();
  } catch (error: any) {
    response.status(500).json({ message: "Error al eliminar el usuario" });
  }
}
export async function changePassword(usuario_id: number, newPassword: string, response: Response): Promise<void> {
  if (newPassword.length < 6) {
    response.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    return;
  }
    try {
        const usuarioRepository = AppDataSource.getRepository(Usuario);
        const user = await usuarioRepository.findOneBy({ usuario_id });
        if (!user) {
            response.status(404).json({ message: "Usuario no encontrado" });
            return;
        }
        user.contrasena = await argon2.hash(newPassword);
        await usuarioRepository.save(user);
        response.status(200).json({ message: "Contraseña actualizada con éxito" });
    } catch (error: any) {
        response.status(500).json({ message: "Error al cambiar la contraseña" });
    }
}
 