import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './config/env';
import { Usuario } from './entities/Usuario';
import { Mascota } from './entities/Mascota';
import { HistorialMedico } from './entities/HistorialMedico';
import { Recorrido } from './entities/Recorrido';
import { PuntosRecorrido } from './entities/PuntosRecorrido';
import { Publicacion } from './entities/Publicacion';
import { Comentario } from './entities/Comentario';
import { PuntoDeInteres } from './entities/PuntoDeInteres';
import { Resena } from './entities/Resena';
import { RealizadoPor } from './entities/RealizadoPor';

export const AppDataSource = new DataSource({
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
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: env.DB_SYNCHRONIZE,
  logging: env.DB_LOGGING,
  ssl: {
    rejectUnauthorized: false
  }
});
