import { DataSourceOptions } from 'typeorm';
import { env } from './env';
import { Usuario, Mascota, HistorialMedico, Recorrido, PuntosRecorrido, Publicacion, Comentario, PuntoDeInteres, Resena, RealizadoPor } from '../entities'; // ajusta ruta si tus entidades están en otra carpeta

export type DatabaseConfig = DataSourceOptions;

export const databaseConfig: DatabaseConfig = env.DB_URL
  ? {
      type: 'postgres',
      url: env.DB_URL, 
      entities: [
        Usuario,
        Mascota,
        HistorialMedico,
        Recorrido,
        PuntosRecorrido,
        Publicacion,
        Comentario,
        PuntoDeInteres,
        Resena,
        RealizadoPor
      ],
      synchronize: env.DB_SYNCHRONIZE,
      logging: env.DB_LOGGING
    }
  : {
      type: 'postgres',
      entities: [
        Usuario,
        Mascota,
        HistorialMedico,
        Recorrido,
        PuntosRecorrido,
        Publicacion,
        Comentario,
        PuntoDeInteres,
        Resena,
        RealizadoPor
      ],
      synchronize: env.DB_SYNCHRONIZE,
      logging: env.DB_LOGGING
    };
