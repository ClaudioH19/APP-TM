import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { Usuario } from "../entities/Usuario";
import { AppDataSource } from "../data-source";

export async function createUser(params: { email: string; contrasena: string }) {
  const hashedPassword = await argon2.hash(params.contrasena, {
    type: argon2.argon2id,
  });
  const usuario = new Usuario();
  usuario.nombre = params.email; // Usar email como nombre por defecto, o ajustar si hay campo nombre separado
  usuario.email = params.email;
  usuario.contrasena = hashedPassword;

  const usuarioRepository = AppDataSource.getRepository(Usuario);
  return await usuarioRepository.save(usuario);
}
export async function authenticateUser(email: string, contrasena: string) {
  const usuarioRepository = AppDataSource.getRepository(Usuario);
  const user = await usuarioRepository.findOneBy({ email });
  if (!user) {
    throw new Error("Usuario no encontrado");
  }
  const isValid = await argon2.verify(user.contrasena, contrasena);
  if (!isValid) {
    throw new Error("Contraseña incorrecta");
  }
  return user;
}

export async function generateToken(email: string, contrasena: string) {
  const user = await authenticateUser(email, contrasena);
  const token = jwt.sign({ usuario_id: user.usuario_id, email: user.email }, process.env.JWT_SECRET || "default_secret", {
    expiresIn: "1h",
  });
  return token;
}
export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    return decoded;
  } catch (err) {
    throw new Error("Token inválido");
  } 
}
export async function getUserFromToken(token: string) {
  const decoded: any = await verifyToken(token);
  const usuarioRepository = AppDataSource.getRepository(Usuario);
  const user = await usuarioRepository.findOneBy({ usuario_id: decoded.usuario_id });
  return user;
}
export async function hashPassword(contrasena: string): Promise<string> {
  return await argon2.hash(contrasena);
}
export async function verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
  return await argon2.verify(hashedPassword, plainPassword);
}   
export async function changePassword(usuario_id: number, newPassword: string): Promise<void> {
  const usuarioRepository = AppDataSource.getRepository(Usuario);
  const user = await usuarioRepository.findOneBy({ usuario_id });
  if (!user) {
    throw new Error("Usuario no encontrado");
  }
  user.contrasena = await hashPassword(newPassword);
  await usuarioRepository.save(user);
}
