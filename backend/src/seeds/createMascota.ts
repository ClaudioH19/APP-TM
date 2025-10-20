import { AppDataSource } from '../data-source';
import { Usuario } from '../entities/Usuario';
import { Mascota } from '../entities/Mascota';

async function createMascota() {
  try {
    await AppDataSource.initialize();
    console.log('DataSource initialized');

    // Buscar usuario de prueba
    const userRepo = AppDataSource.getRepository(Usuario);
    const user = await userRepo.findOneBy({ email: 'test@example.com' });
    if (!user) {
      throw new Error('Usuario de prueba no encontrado');
    }

    // Crear mascota asociada al usuario
    const mascotaRepo = AppDataSource.getRepository(Mascota);
    const mascota = mascotaRepo.create({
      descripcion: 'Mascota de prueba',
      usuario: user
    });
    await mascotaRepo.save(mascota);
    console.log('Mascota de prueba creada exitosamente');
  } catch (error) {
    console.error('Error en createMascota:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

createMascota();
