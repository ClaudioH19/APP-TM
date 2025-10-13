import { Usuario } from "entities";
import { AppDataSource } from "data-source";

export async function createUser(nombre: string, contrasena: string, ubicacion: string): Promise<Usuario> {
  const usuarioRepository = AppDataSource.getRepository(Usuario);
  const newUser = usuarioRepository.create({ nombre, contrasena, ubicacion });
  const existingUser = await usuarioRepository.findOneBy({ nombre });
  if (existingUser) {
    throw new Error("Usuario ya existe");
  }
  return await usuarioRepository.save(newUser);
}

export async function getUserById(id: number): Promise<Usuario | null> {
  const usuarioRepository = AppDataSource.getRepository(Usuario);
  return await usuarioRepository.findOneBy({ usuario_id: id });
}

export async function updateUser(id: number, data: Partial<Usuario>): Promise<Usuario | null> {
  const usuarioRepository = AppDataSource.getRepository(Usuario);
  await usuarioRepository.update(id, data);
  return await usuarioRepository.findOneBy({ usuario_id: id });
}

export async function deleteUser(id: number): Promise<boolean> {
  const usuarioRepository = AppDataSource.getRepository(Usuario);
  const result = await usuarioRepository.delete(id);
  return result.affected !== 0;
}
export async function changePassword(id: number, newPassword: string): Promise<void> {
  const usuarioRepository = AppDataSource.getRepository(Usuario);
  const user = await usuarioRepository.findOneBy({ usuario_id: id });
  if (!user) {
    throw new Error("Usuario no encontrado");
  }
  user.contrasena = newPassword;
  await usuarioRepository.save(user);
}
