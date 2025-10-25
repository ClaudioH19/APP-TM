import { AppDataSource } from '../data-source';
import { PuntoDeInteres } from '../entities/PuntoDeInteres';
import { CategoriaInterestPoint } from '../entities/enums/Interest_point_categoria.enum';
import { Usuario } from '../entities/Usuario';

// DTO para la creación de un punto de interés
interface CreateInterestPointDTO {
  latitud: number;
  longitud: number;
  nombre: string;
  categoria: CategoriaInterestPoint;
  usuarioId: number;
  descripcion?: string | null;
}

export class InterestPointService {
  
  private static getRepository() {
    return AppDataSource.getRepository(PuntoDeInteres);
  }

  static async create(data: CreateInterestPointDTO): Promise<PuntoDeInteres> {
    
    // validaciones
    if (!data.nombre) {
      throw new Error('El nombre es obligatorio');
    }
    if (data.latitud == null || data.longitud == null) {
      throw new Error('Latitud y longitud son obligatorias');
    }
    if (!data.categoria || !Object.values(CategoriaInterestPoint).includes(data.categoria)) {
      throw new Error(`Categoría inválida o faltante. Valores válidos: ${Object.values(CategoriaInterestPoint).join(', ')}`);
    }

    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOneBy({ usuario_id: data.usuarioId });
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const poiRepository = this.getRepository();

    // se crea la entidad 
    const nuevoPunto = poiRepository.create({
      nombre: data.nombre,
      latitud: Number(data.latitud),
      longitud: Number(data.longitud),
      categoria: data.categoria,
      descripcion: data.descripcion || null,
      fecha_creacion: new Date(),
      usuario: usuario,
    });

    // --- Guardado en BD ---
    await poiRepository.save(nuevoPunto);
    return nuevoPunto;
  }

  static async getAll(): Promise<PuntoDeInteres[]> {
    const poiRepository = this.getRepository();
    return poiRepository.find({
      // 1. Usamos 'select' para especificar qué columnas traer
      select: {
        id: true,
        nombre: true,
        latitud: true,
        longitud: true,
        fecha_creacion: true,
        descripcion: true,
        categoria: true,
        suma_valoraciones: true,
        cantidad_resenas: true,
        usuario: { 
          usuario: true,
          nombre: true,
        }
      },
      relations: {
        usuario: true 
      }
    });
  }
}