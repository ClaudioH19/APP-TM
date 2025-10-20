import { AppDataSource } from '../data-source';
import { Usuario } from '../entities/Usuario';
import { Mascota } from '../entities/Mascota';
import { Publicacion } from '../entities/Publicacion';

async function createPublications() {
  try {
    await AppDataSource.initialize();
    console.log('DataSource initialized');

    // Buscar usuario de prueba
    const userRepo = AppDataSource.getRepository(Usuario);
    const user = await userRepo.findOneBy({ email: 'test@example.com' });
    if (!user) {
      throw new Error('Usuario de prueba no encontrado');
    }

    // Buscar mascota asociada al usuario
    const mascotaRepo = AppDataSource.getRepository(Mascota);
    const mascota = await mascotaRepo.findOne({ 
      where: { usuario: { usuario_id: user.usuario_id } } 
    });
    if (!mascota) {
      throw new Error('Mascota de prueba no encontrada');
    }

    // Crear publicaciones de ejemplo
    const publicacionRepo = AppDataSource.getRepository(Publicacion);
    const now = new Date();
    const publicaciones = [
      publicacionRepo.create({
        fecha: now,
        ubicacion_lat: -34.9806,
        ubicacion_lon: -71.2335,
        descripcion: 'Primera publicación de prueba',
        contador_likes: 0,
        usuario: user,
        mascota: mascota,
        provider: 'local',
        mime_type: 'image/png',
        id_video: 'pruebaUP.png',
        size_bytes: 'N/A',
      }),
      publicacionRepo.create({
        fecha: new Date(now.getTime() - 86400000), // 1 día antes
        ubicacion_lat: -34.9806,
        ubicacion_lon: -71.2335,
        descripcion: 'Segunda publicación de prueba',
        contador_likes: 0,
        usuario: user,
        mascota: mascota,
        provider: 'local',
        mime_type: 'image/png',
        id_video: 'pruebaUP.png',
        size_bytes: 'N/A',
      })
    ];
    await publicacionRepo.save(publicaciones);
    console.log('Publicaciones de ejemplo creadas exitosamente');
  } catch (error) {
    console.error('Error en createPublications:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

createPublications();
