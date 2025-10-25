import 'reflect-metadata';
import express from 'express';
import { AppDataSource } from './data-source';
import { env } from './config/env';

// Importar la función de sincronización de Cloudinary
import { syncCloudinary } from '../utils/cloud_sync.js';

// Importar rutas
import routes from './routes/index';
import authRouter from './routes/auth';

const app = express();

// Middleware
app.use(express.json());
app.use('/media', express.static(__dirname + '/../media_local'));
app.set('dataSource', AppDataSource);

// Usar rutas
app.use('/api', routes);

// Nota: La conexión ahora usa env.DB_URL vía data-source.ts

async function bootstrap() {
  // Sincronizar archivos de Cloudinary antes de iniciar el servidor
  await syncCloudinary();
  try {
    await AppDataSource.initialize();

    const safeUrl = env.DB_URL
      ? env.DB_URL.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@')
      : 'desconocida';

    console.log(`Conectado a la base de datos (${safeUrl})`);
    const port = Number(env.PORT);
    app.listen(port, () => {
      console.log(`Servidor iniciado en puerto ${port}`);
    });
  } catch (err) {
    console.error('Error inicializando:', err);
    process.exit(1);
  }
}

bootstrap();
