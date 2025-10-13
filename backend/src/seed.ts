import { AppDataSource } from './data-source';
import { Usuario } from './entities/Usuario';
import { hashPassword } from './services/token_service';

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('DataSource initialized');

    const userRepo = AppDataSource.getRepository(Usuario);

    // Verificar si ya existe
    const existing = await userRepo.findOneBy({ email: 'test@example.com' });
    if (existing) {
      console.log('Usuario de prueba ya existe');
      return;
    }

    // Crear usuario de prueba
    const hashedPassword = await hashPassword('password');

    const user = userRepo.create({
      nombre: 'Test',
      apellido: 'User',
      usuario: 'testuser',
      email: 'test@example.com',
      contrasena: hashedPassword,
    });

    await userRepo.save(user);
    console.log('Usuario de prueba creado exitosamente');
  } catch (error) {
    console.error('Error en seed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();