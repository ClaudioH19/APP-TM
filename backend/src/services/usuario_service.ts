import { Usuario } from "entities";
import { AppDataSource } from "data-source";
import { rsaEncrypt } from "../security/rsa";

export async function createUser(nombre: string, apellido: string, contrasena: string, email: string, usuario: string): Promise<Usuario> {
   const usuarioRepository = AppDataSource.getRepository(Usuario);

  // Verificaciones de unicidad
  const [existingEmail, existingUsername] = await Promise.all([
    usuarioRepository.findOneBy({ email }),
    usuarioRepository.findOneBy({ usuario }),
  ]);
  if (existingEmail) throw new Error("Email ya está en uso");
  if (existingUsername) throw new Error("Nombre de usuario ya está en uso");

  // Cifrar contraseña con la clave pública (base64)
  const contrasenaCifrada = rsaEncrypt(contrasena);

  const nuevoUsuario = usuarioRepository.create({
    nombre,
    apellido,
    contrasena: contrasenaCifrada,
    email,
    usuario,
  });

  return await usuarioRepository.save(nuevoUsuario);
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
