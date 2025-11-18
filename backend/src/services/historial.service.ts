import { AppDataSource } from '../data-source';
import { HistorialMedico } from '../entities/HistorialMedico';
import { Mascota } from '../entities/Mascota';

export async function crearHistorial(params: {
  mascotaId: number;
  propietarioId: number;
  categoria: string;
  fecha: Date;
  titulo?: string | null;
  descripcion?: string | null;
  lat?: number | null;
  lon?: number | null;
}): Promise<HistorialMedico> {
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

  const cat = (params.categoria || '').trim();
  if (!cat) throw new Error('La categoría es obligatoria');

  const item = historialRepo.create({
    mascota,
    fecha,
    categoria: cat,
    titulo: params.titulo ?? null,
    descripcion: params.descripcion ?? null,
    ubicacion_clinica_lat: lat,
    ubicacion_clinica_lon: lon
  });
  return historialRepo.save(item);
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
  const [items, total] = await repo.findAndCount({
    where: { mascota: { usuario: { usuario_id: propietarioId } as any } as any },
    order: { fecha: 'ASC' },
    skip: safeOff,
    take: safeLim,
    relations: { mascota: true }
  });
  return { items, total };
}

export async function updateHistorialIfFuture(id: number, propietarioId: number, patch: {
  fecha?: Date;
  categoria?: string | null;
  titulo?: string | null;
  descripcion?: string | null;
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
  if (patch.categoria !== undefined) item.categoria = patch.categoria?.trim() || null;
  if (patch.titulo !== undefined) item.titulo = patch.titulo ?? null;
  if (patch.descripcion !== undefined) item.descripcion = patch.descripcion ?? null;

  if (patch.lat !== undefined) {
    if (patch.lat !== null && !Number.isFinite(patch.lat)) throw new Error('Latitud inválida');
    item.ubicacion_clinica_lat = patch.lat ?? null;
  }
  if (patch.lon !== undefined) {
    if (patch.lon !== null && !Number.isFinite(patch.lon)) throw new Error('Longitud inválida');
    item.ubicacion_clinica_lon = patch.lon ?? null;
  }

  return repo.save(item);
}

export async function removeHistorial(id: number, propietarioId: number) {
  const repo = AppDataSource.getRepository(HistorialMedico);
  const item = await repo.findOne({ where: { id }, relations: { mascota: { usuario: true } } as any });
  if (!item) throw new Error('Evento no encontrado');
  const ownerId = (item.mascota as any).usuario?.usuario_id;
  if (ownerId !== propietarioId) throw new Error('No autorizado');
  await repo.remove(item);
}