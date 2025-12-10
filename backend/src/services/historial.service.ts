import { esTipoEventoPermitido, normalizarTipoEvento } from '../config/historial_categorias';
import { HistorialMedico } from '../entities/HistorialMedico';
import { AppDataSource } from '../data-source';
import { Mascota } from '../entities/Mascota';

export const ESTADOS_HISTORIAL = [
  'pendiente',
  'completado',
  'cancelado',
  'vencido',
] as const;
export type EstadoHistorial = (typeof ESTADOS_HISTORIAL)[number];

export async function crearHistorial(params: {
  mascotaId: number;
  propietarioId: number;
  categoria: string;
  fecha: Date;
  titulo?: string | null;
  descripcion?: string | null;
  estado?: 'pendiente' | 'completado' | 'cancelado' | 'vencido';
  lat?: number | null;
  lon?: number | null;
}): Promise<any> {
  const mascotaRepo = AppDataSource.getRepository(Mascota);
  const historialRepo = AppDataSource.getRepository(HistorialMedico);

  const mascota = await mascotaRepo.findOne({
    where: { mascota_id: params.mascotaId } as any,
    relations: { usuario: true }
  });
  if (!mascota) throw new Error('Mascota no encontrada');
  const ownerId = (mascota as any).usuario?.usuario_id;
  if (!ownerId || ownerId !== params.propietarioId) throw new Error('No autorizado');

  const fecha = new Date(params.fecha);
  if (isNaN(+fecha)) throw new Error('Fecha inválida');

  const lat = params.lat ?? null;
  const lon = params.lon ?? null;
  if (lat !== null && !Number.isFinite(lat)) throw new Error('Latitud inválida');
  if (lon !== null && !Number.isFinite(lon)) throw new Error('Longitud inválida');

  // se valida la categoria
  const catNorm = normalizarTipoEvento(params.categoria);
  if (!catNorm) throw new Error('La categoría es obligatoria');
  if (!esTipoEventoPermitido(catNorm)) throw new Error('Categoría inválida');

  const entity = historialRepo.create({
    mascota,
    fecha,
    categoria: catNorm,
    titulo: params.titulo ?? null,
    descripcion: params.descripcion ?? null,
    estado: params.estado ?? 'pendiente',
    ubicacion_clinica_lat: lat,
    ubicacion_clinica_lon: lon,
  });

  const saved = await historialRepo.save(entity);


  return {
    id: saved.id,
    fecha: saved.fecha,
    categoria: saved.categoria,
    estado: saved.estado,
    titulo: saved.titulo,
    descripcion: saved.descripcion,
    ubicacion_clinica_lat: saved.ubicacion_clinica_lat,
    ubicacion_clinica_lon: saved.ubicacion_clinica_lon,
    mascota: {
      mascota_id: mascota.mascota_id,
      nombre: mascota.nombre,
      descripcion: mascota.descripcion,
      fecha_nacimiento: mascota.fecha_nacimiento,
      especie: mascota.especie,
    },
  };
}

export async function listaHistorialPorMascota(mascotaId: number, propietarioId: number) {
  const mascotaRepo = AppDataSource.getRepository(Mascota);
  const repo = AppDataSource.getRepository(HistorialMedico);

  const mascota = await mascotaRepo.findOne({
    where: { mascota_id: mascotaId } as any,
    relations: { usuario: true }
  });
  if (!mascota) throw new Error('Mascota no encontrada');
  const ownerId = (mascota as any).usuario?.usuario_id;
  if (ownerId !== propietarioId) throw new Error('No autorizado');

  return repo.find({
    where: { mascota: { mascota_id: mascotaId } as any },
    order: { fecha: 'ASC' }
  });
}

export async function listHistorialByUsuario(propietarioId: number, offset = 0, limit = 50) {
  const repo = AppDataSource.getRepository(HistorialMedico);
  const safeOff = Math.max(0, Math.floor(Number(offset) || 0));
  const safeLim = Math.max(1, Math.min(100, Math.floor(Number(limit) || 50)));

  const [itemsRaw, total] = await repo.findAndCount({
    where: { mascota: { usuario: { usuario_id: propietarioId } as any } as any },
    relations: { mascota: true },
  });

  const now = new Date();

  const eventosVencidos = itemsRaw.filter(i => 
    i.estado === 'pendiente' && i.fecha < now
  );

  if (eventosVencidos.length > 0) {
    const idsVencidos = eventosVencidos.map(i => i.id);

    // actualización de estado a 'vencido' para eventos pasados
    await repo.update(idsVencidos, { estado: 'vencido' });

    // se actualiza en memoria también
    eventosVencidos.forEach(evento => {
      evento.estado = 'vencido';
    });
  }
  // ordenar: futuros primero ascendente, luego pasados descendente
  const futuros = itemsRaw
    .filter(i => i.fecha >= now)
    .sort((a, b) => +a.fecha - +b.fecha); 

  const pasados = itemsRaw
    .filter(i => i.fecha < now)
    .sort((a, b) => +b.fecha - +a.fecha); 

  const ordered = [...futuros, ...pasados];

  // aplicar paginación después de ordenar
  const items = ordered.slice(safeOff, safeOff + safeLim);

  // mapeao para evitar exponer datos innecesarios
  const sanitized = items.map(i => ({
    id: i.id,
    fecha: i.fecha,
    categoria: i.categoria,
    estado: i.estado,
    titulo: i.titulo,
    descripcion: i.descripcion,
    ubicacion_clinica_lat: i.ubicacion_clinica_lat,
    ubicacion_clinica_lon: i.ubicacion_clinica_lon,
    mascota: {
      mascota_id: i.mascota.mascota_id,
      nombre: i.mascota.nombre,
      descripcion: i.mascota.descripcion,
      fecha_nacimiento: i.mascota.fecha_nacimiento,
      especie: i.mascota.especie,
    },
  }));

  return { items: sanitized, total };
}

export async function updateHistorialIfFuture(id: number, propietarioId: number, patch: {
  fecha?: Date;
  categoria?: string | null;
  titulo?: string | null;
  descripcion?: string | null;
  estado?: 'pendiente' | 'completado' | 'cancelado' | 'vencido';
  lat?: number | null;
  lon?: number | null;
}) {
  const repo = AppDataSource.getRepository(HistorialMedico);
  const item = await repo.findOne({ where: { id }, relations: { mascota: { usuario: true } } as any });
  if (!item) throw new Error('Evento no encontrado');
  const ownerId = (item.mascota as any).usuario?.usuario_id;
  if (ownerId !== propietarioId) throw new Error('No autorizado');
  if (item.fecha <= new Date()) throw new Error('Solo se puede editar un evento futuro');

  if (patch.fecha) {
    const f = new Date(patch.fecha);
    if (isNaN(+f)) throw new Error('Fecha inválida');
    item.fecha = f;
  }
  if (patch.categoria !== undefined) {
    if (patch.categoria === null) {
      item.categoria = null;
    } else {
      const catNorm = normalizarTipoEvento(patch.categoria);
      if (!catNorm) {
        // cadena vacía => limpiar categoría
        item.categoria = null;
      } else {
        if (!esTipoEventoPermitido(catNorm)) throw new Error('Categoría inválida');
        item.categoria = catNorm;
      }
    }
  }
  if (patch.titulo !== undefined) item.titulo = patch.titulo ?? null;
  if (patch.descripcion !== undefined) item.descripcion = patch.descripcion ?? null;
  if (patch.estado !== undefined) {
      const validos = ['pendiente', 'completado', 'cancelado', 'vencido'];
      if (!validos.includes(patch.estado)) {
          throw new Error('Estado inválido');
      }
      item.estado = patch.estado;
  }
  if (patch.lat !== undefined) {
    if (patch.lat !== null && !Number.isFinite(patch.lat)) throw new Error('Latitud inválida');
    item.ubicacion_clinica_lat = patch.lat ?? null;
  }
  if (patch.lon !== undefined) {
    if (patch.lon !== null && !Number.isFinite(patch.lon)) throw new Error('Longitud inválida');
    item.ubicacion_clinica_lon = patch.lon ?? null;
  }

  const saved = await repo.save(item);

  return {
    id: saved.id,
    fecha: saved.fecha,
    categoria: saved.categoria,
    titulo: saved.titulo,
    descripcion: saved.descripcion,
    estado: saved.estado,
    ubicacion_clinica_lat: saved.ubicacion_clinica_lat,
    ubicacion_clinica_lon: saved.ubicacion_clinica_lon,
    mascota: {
      mascota_id: item.mascota.mascota_id,
      nombre: item.mascota.nombre,
      descripcion: item.mascota.descripcion,
      fecha_nacimiento: item.mascota.fecha_nacimiento,
      especie: item.mascota.especie,
    },
  };
}

export async function removeHistorial(id: number, propietarioId: number) {
  const repo = AppDataSource.getRepository(HistorialMedico);
  const item = await repo.findOne({ where: { id }, relations: { mascota: { usuario: true } } as any });
  if (!item) throw new Error('Evento no encontrado');
  const ownerId = (item.mascota as any).usuario?.usuario_id;
  if (ownerId !== propietarioId) throw new Error('No autorizado');
  await repo.remove(item);
}

export async function cambiarEstadoHistorial(
  id: number,
  propietarioId: number,
  estado: EstadoHistorial,
) {
  if (!ESTADOS_HISTORIAL.includes(estado)) {
    throw new Error('Estado inválido');
  }

  const repo = AppDataSource.getRepository(HistorialMedico);
  const item = await repo.findOne({
    where: { id },
    relations: { mascota: { usuario: true } } as any,
  });

  if (!item) throw new Error('Evento no encontrado');

  const ownerId = (item.mascota as any).usuario?.usuario_id;
  if (ownerId !== propietarioId) {
    throw new Error('No autorizado');
  }

  
  item.estado = estado;
  const saved = await repo.save(item);

  return {
    id: saved.id,
    fecha: saved.fecha,
    categoria: saved.categoria,
    titulo: saved.titulo,
    descripcion: saved.descripcion,
    estado: saved.estado,
    ubicacion_clinica_lat: saved.ubicacion_clinica_lat,
    ubicacion_clinica_lon: saved.ubicacion_clinica_lon,
    mascota: {
      mascota_id: item.mascota.mascota_id,
      nombre: item.mascota.nombre,
      descripcion: item.mascota.descripcion,
      fecha_nacimiento: item.mascota.fecha_nacimiento,
      especie: item.mascota.especie,
    },
  };
}

// obtener la cantidad de eventos agrupados por estado para un usuario
export async function contarEventosPorEstado(propietarioId: number): Promise<Record<EstadoHistorial, number>> {
  const repo = AppDataSource.getRepository(HistorialMedico);

  // obtener todos los eventos del usuario
  const items = await repo.find({
    where: { mascota: { usuario: { usuario_id: propietarioId } as any } as any },
  });

  // inicializar contadores en 0
  const contadores: Record<string, number> = {
    pendiente: 0,
    completado: 0,
    cancelado: 0,
    vencido: 0,
  };

  // contar eventos por estado
  items.forEach(item => {
    if (contadores[item.estado] !== undefined) {
      contadores[item.estado]++;
    }
  });

  return contadores as Record<EstadoHistorial, number>;
}

// obtener eventos filtrados por estado con paginación
export async function obtenerEventosPorEstado(
  propietarioId: number,
  estado: EstadoHistorial,
  offset = 0,
  limit = 50
) {
  if (!ESTADOS_HISTORIAL.includes(estado)) {
    throw new Error('Estado inválido');
  }

  const repo = AppDataSource.getRepository(HistorialMedico);
  const safeOff = Math.max(0, Math.floor(Number(offset) || 0));
  const safeLim = Math.max(1, Math.min(100, Math.floor(Number(limit) || 50)));

  // obtener eventos con el estado especificado
  const [items, total] = await repo.findAndCount({
    where: { 
      mascota: { usuario: { usuario_id: propietarioId } as any } as any,
      estado: estado,
    },
    relations: { mascota: true },
    order: { fecha: 'DESC' },
    skip: safeOff,
    take: safeLim,
  });

  // mapear para evitar exponer datos innecesarios
  const sanitized = items.map(i => ({
    id: i.id,
    fecha: i.fecha,
    categoria: i.categoria,
    estado: i.estado,
    titulo: i.titulo,
    descripcion: i.descripcion,
    ubicacion_clinica_lat: i.ubicacion_clinica_lat,
    ubicacion_clinica_lon: i.ubicacion_clinica_lon,
    mascota: {
      mascota_id: i.mascota.mascota_id,
      nombre: i.mascota.nombre,
      descripcion: i.mascota.descripcion,
      fecha_nacimiento: i.mascota.fecha_nacimiento,
      especie: i.mascota.especie,
    },
  }));

  return { items: sanitized, total };
}