import { Usuario } from "../entities";
import { Mascota } from "../entities"; 
import { AppDataSource } from "../data-source";

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
export async function getPetsByUserId(userId: number): Promise<Mascota[]> {
  const mascotaRepository = AppDataSource.getRepository(Mascota);
  const userRepository = AppDataSource.getRepository(Usuario);
  
  const user = await userRepository.findOneBy({ usuario_id: userId });
  if (!user) {
    throw new Error("Usuario no encontrado");
  }
  
  const mascotas = await mascotaRepository.find({
    where: { usuario: user },
  });
  
  if (!mascotas || mascotas.length === 0) {
    throw new Error("No hay mascotas para este usuario");
  }
  
  return mascotas;
}
