import 'reflect-metadata';
import { AppDataSource } from './data-source';
import { env } from './config/env';

// Nota: La conexión ahora usa env.DB_URL vía data-source.ts

async function bootstrap() {
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
