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

  static async getByPointId(pointId: number): Promise<Resena[]> {
    const reviewRepository = AppDataSource.getRepository(Resena);
    // obtiene todas las reseñas para el punto de interés especificado
    // incluyendo la información del usuario que la creó, y ordenadas por fecha de creación descendente
    // solo incluye campos seguros del usuario
    return reviewRepository.find({
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

      where: {
        puntoInteres: { id: pointId }
      },
      relations: {
        usuario: true
      },
      order: {
        fecha_creacion: 'DESC'
      }
    });
  }
}