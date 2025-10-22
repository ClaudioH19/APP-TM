import { AppDataSource } from '../data-source';
import { PuntoDeInteres } from '../entities/PuntoDeInteres';

// Opcional: Definir un DTO (Data Transfer Object) para la creación
interface CreateInterestPointDTO {
  latitud: number;
  longitud: number;
  descripcion?: string | null;
}

export class InterestPointService {
  
  /**
   * Obtiene el repositorio de PuntoDeInteres
   */
  private static getRepository() {
    return AppDataSource.getRepository(PuntoDeInteres);
  }

  /**
   * Lógica de negocio para crear un nuevo Punto de Interés.
   */
  static async create(data: CreateInterestPointDTO): Promise<PuntoDeInteres> {
    
    if (data.latitud == null || data.longitud == null) {
      throw new Error('Latitud y longitud son obligatorias');
    }

    const poiRepository = this.getRepository();
    
    const nuevoPunto = poiRepository.create({
      latitud: Number(data.latitud),
      longitud: Number(data.longitud),
      descripcion: data.descripcion || null,
      fecha_creacion: new Date()
    });

    await poiRepository.save(nuevoPunto);
    return nuevoPunto;
  }

  static async getAll(): Promise<PuntoDeInteres[]> {
    const poiRepository = this.getRepository();
    return poiRepository.find();
  }
}