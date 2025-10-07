import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { env } from './config/env';

// Importar la función de sincronización de Cloudinary
import { syncCloudinary } from '../utils/cloud_sync.js';

// Nota: La conexión ahora usa env.DB_URL vía data-source.ts

async function bootstrap() {
  // Sincronizar archivos de Drive antes de iniciar el servidor
  // Sincronizar archivos de Cloudinary antes de iniciar el servidor
  await syncCloudinary();
  try {
    await AppDataSource.initialize();

    const safeUrl = env.DB_URL
      ? env.DB_URL.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@')
      : 'desconocida';

    console.log(`Conectado a la base de datos (${safeUrl})`);
    const port = Number(env.PORT);
    console.log(`Servidor iniciado en puerto ${port}`);
  } catch (err) {
    console.error('Error inicializando:', err);
    process.exit(1);
  }
}

bootstrap();
