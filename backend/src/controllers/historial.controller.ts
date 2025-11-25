import { Request, Response } from 'express';
import {
  crearHistorial,
  listaHistorialPorMascota,
  listHistorialByUsuario,
  updateHistorialIfFuture,
  removeHistorial,
  cambiarEstadoHistorial,
  ESTADOS_HISTORIAL,
} from '../services/historial.service';
import { obtenerGruposTiposEventoParaUI } from '../config/historial_categorias';

function parseFechaHora(body: any): Date | null {
  if (body.fecha && body.hora) return new Date(`${body.fecha}T${body.hora}:00`);
  if (body.fecha) return new Date(`${body.fecha}T00:00:00`);
  if (body.fechaHora) return new Date(body.fechaHora);
  return null;
}

export class HistorialController {
  static async crear(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'No autorizado' });
      const mascotaId = Number(req.params.id);
      if (!Number.isInteger(mascotaId)) return res.status(400).json({ message: 'MascotaId inválido' });

      const when = parseFechaHora(req.body);
      if (!when || isNaN(+when)) return res.status(400).json({ message: 'Fecha/hora inválida' });

      const item = await crearHistorial({
        mascotaId,
        propietarioId: req.user.usuario_id,
        categoria: String(req.body.categoria || ''),
        fecha: when,
        titulo: req.body.titulo,
        descripcion: req.body.descripcion,
        estado: req.body.estado,
        lat: req.body.lat !== undefined ? (req.body.lat === null ? null : Number(req.body.lat)) : null,
        lon: req.body.lon !== undefined ? (req.body.lon === null ? null : Number(req.body.lon)) : null
      });
      return res.status(201).json(item);
    } catch (e: any) {
      const msg = e?.message || 'Error al crear';
      return res.status(msg === 'No autorizado' ? 403 : 400).json({ message: msg });
    }
  }

  static async listaPorMascota(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'No autorizado' });
      const mascotaId = Number(req.params.id);
      if (!Number.isInteger(mascotaId)) return res.status(400).json({ message: 'MascotaId inválido' });
      const items = await listaHistorialPorMascota(mascotaId, req.user.usuario_id);
      return res.json(items);
    } catch (e: any) {
      return res.status(e?.message === 'No autorizado' ? 403 : 400).json({ message: e?.message || 'Error' });
    }
  }

  static async listMine(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'No autorizado' });
      const offset = Number(req.query.offset) || 0;
      const limit = Number(req.query.limit) || 50;
      const data = await listHistorialByUsuario(req.user.usuario_id, offset, limit);
      return res.json(data);
    } catch (e: any) {
      return res.status(400).json({ message: e?.message || 'Error' });
    }
  }

  static async getCategorias(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'No autorizado' });
      const data = obtenerGruposTiposEventoParaUI();
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ message: e?.message || 'Error' });
    }
  }

  static async update(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'No autorizado' });
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID inválido' });

      const fecha = parseFechaHora(req.body) || undefined;
      const patch = {
        fecha,
        categoria: req.body.categoria,
        titulo: req.body.titulo,
        descripcion: req.body.descripcion,
        estado: req.body.estado,
        lat: req.body.lat === undefined ? undefined : (req.body.lat === null ? null : Number(req.body.lat)),
        lon: req.body.lon === undefined ? undefined : (req.body.lon === null ? null : Number(req.body.lon))
      };

      const updated = await updateHistorialIfFuture(id, req.user.usuario_id, patch);
      return res.json(updated);
    } catch (e: any) {
      const msg = e?.message || 'Error';
      const code = msg.includes('futuro') ? 409 : (msg === 'No autorizado' ? 403 : 400);
      return res.status(code).json({ message: msg });
    }
  }

  static async remove(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'No autorizado' });
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID inválido' });
      await removeHistorial(id, req.user.usuario_id);
      return res.status(204).send();
    } catch (e: any) {
      const msg = e?.message || 'Error';
      return res.status(msg === 'No autorizado' ? 403 : 400).json({ message: msg });
    }
  }

  static async cambiarEstado(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'No autorizado' });

      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const estado = String(req.body.estado ?? '').trim();
      if (!ESTADOS_HISTORIAL.includes(estado as any)) {
        return res
          .status(400)
          .json({ message: `Estado inválido. Permitidos: ${ESTADOS_HISTORIAL.join(', ')}` });
      }

      const updated = await cambiarEstadoHistorial(
        id,
        req.user.usuario_id,
        estado as any,
      );

      return res.json(updated);
    } catch (e: any) {
      const msg = e?.message || 'Error';
      const code =
        msg === 'No autorizado' ? 403 :
        msg === 'Evento no encontrado' ? 404 : 400;
      return res.status(code).json({ message: msg });
    }
  }

  //  diccionario de estados permitidos
  static async getEstados(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ message: 'No autorizado' });
      return res.json(ESTADOS_HISTORIAL);
    } catch (e: any) {
      return res.status(500).json({ message: e?.message || 'Error' });
    }
  }
}