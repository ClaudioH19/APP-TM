export * from "../services/token_service";
import * as argon2 from "argon2";
import * as jwt from "jsonwebtoken";
import { Usuario } from "../entities/Usuario";
import { AppDataSource } from "../data-source";
import { Response } from "express";

export async function createUser(
    request: { nombre: string; contrasena: string; ubicacion: string },
    response: Response
  ): Promise<Usuario | void> {
    if (!request.nombre || !request.contrasena || !request.ubicacion) {
      response.status(400).json({ message: "Faltan datos obligatorios" });
      return;
    }
    else if(request.contrasena.length < 6){
      response.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }
    try {
        const userRepository = AppDataSource.getRepository(Usuario);
        const existingUser = await userRepository.findOneBy({ nombre: request.nombre });
        if (existingUser) {
            throw new Error("Usuario ya existe");
        }
        const hashedPassword = await argon2.hash(request.contrasena);
        const newUser = userRepository.create({
            nombre: request.nombre,
            contrasena: hashedPassword,
            ubicacion: request.ubicacion
        });
        await userRepository.save(newUser);
        response.status(201).json(newUser);
        return newUser;
    } catch (error: any) {
        if (error.message === "Usuario ya existe") {
            response.status(409).json({ message: error.message });
        } else {
            response.status(500).json({ message: "Error al crear el usuario" });
        }
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
 