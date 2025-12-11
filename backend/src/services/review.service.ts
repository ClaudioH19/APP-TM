import { AppDataSource } from '../data-source';
import { PuntoDeInteres } from '../entities/PuntoDeInteres';
import { Resena } from '../entities/Resena';
import { Usuario } from '../entities/Usuario';


interface CreateReviewDTO {
  puntoInteresId: number;
  usuarioId: number; 
  descripcion?: string | null;
  valoracion: number;
}

export class ReviewService {
  
  
  static async create(data: CreateReviewDTO): Promise<Resena> {
    
    const valoracion = Number(data.valoracion);
    if (isNaN(valoracion) || valoracion < 1 || valoracion > 5) {
      throw new Error('La valoración debe ser un número entre 1 y 5');
    }

    return AppDataSource.manager.transaction(async (transactionalEntityManager) => {
      
      
      const puntoInteres = await transactionalEntityManager.findOneBy(PuntoDeInteres, { id: data.puntoInteresId });
      if (!puntoInteres) throw new Error('Punto de interés no encontrado');

      const usuario = await transactionalEntityManager.findOneBy(Usuario, { usuario_id: data.usuarioId });
      if (!usuario) throw new Error('Usuario no encontrado');
      
      // valida que el usuario no haya dejado ya una reseña para este punto de interés
      const existeResena = await transactionalEntityManager.findOneBy(Resena, {
        puntoInteres: { id: data.puntoInteresId },
        usuario: { usuario_id: data.usuarioId }
      });
        if (existeResena) {
            throw new Error('El usuario ya ha dejado una reseña para este punto de interés');
        }

      // se crea la reseña
      const nuevaResena = transactionalEntityManager.create(Resena, {
        puntoInteres: puntoInteres,
        usuario: usuario,
        descripcion: data.descripcion || null,
        valoracion: valoracion,
        fecha_creacion: new Date()
      });
      await transactionalEntityManager.save(nuevaResena);

      // se actualizan los campos de suma_valoraciones y cantidad_resenas en PuntoDeInteres
      await transactionalEntityManager.update(PuntoDeInteres, 
        { id: data.puntoInteresId },
        {
          suma_valoraciones: () => `suma_valoraciones + ${valoracion}`,
          cantidad_resenas: () => 'cantidad_resenas + 1'
        }
      );

      return nuevaResena;
    });
  }

  // obtiene reseñas por punto con paginación (devuelve items + total)
  static async getByPointId(pointId: number, offset = 0, limit = 10): Promise<{ items: Resena[], total: number }> {
    // normalizar/validar inputs
    const pid = Number(pointId);
    if (!Number.isInteger(pid) || pid <= 0) {
      throw new Error('ID de punto inválido');
    }

    let off = Number(offset);
    let lim = Number(limit);

    if (!Number.isFinite(off) || off < 0) off = 0;
    off = Math.floor(off);

    if (!Number.isFinite(lim) || lim <= 0) lim = 10;
    lim = Math.floor(lim);

    const MAX_LIMIT = 100;
    if (lim > MAX_LIMIT) lim = MAX_LIMIT;

    const reviewRepository = AppDataSource.getRepository(Resena);

    const [items, total] = await reviewRepository.findAndCount({
      select: {
        id: true,
        fecha_creacion: true,
        descripcion: true,
        valoracion: true,
        usuario: { 
          usuario: true, 
          nombre: true,
        }
      },
      where: { puntoInteres: { id: pid } },
      relations: { usuario: true },
      order: { fecha_creacion: 'DESC' },
      skip: off,
      take: lim
    });

    return { items, total };
  }
}