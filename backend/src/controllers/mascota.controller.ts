import { Request, Response } from 'express';
import { MascotaService } from '../services/mascota_service'; 

const mascotaService = new MascotaService();

export class MascotaController {
    static async registrar(req: Request, res: Response) {
        try {
            const usuario_id = (req as any).user?.usuario_id;
            if (!usuario_id) {
                return res.status(401).json({ error: 'No autenticado' });
            }

            const { nombre, especie, fecha_nacimiento, descripcion } = req.body;

            if (!nombre || !especie || !fecha_nacimiento) {
                return res.status(400).json({ error: 'Campos obligatorios: nombre, especie, fecha_nacimiento' });
            }

            const mascota = await mascotaService.registrarMascota({
                nombre,
                especie,
                fecha_nacimiento,
                descripcion,
                usuario_id
            });

            return res.status(201).json({
                message: 'Mascota registrada correctamente',
                mascota: {
                    nombre: mascota.nombre,
                    especie: mascota.especie,
                    fecha_nacimiento: mascota.fecha_nacimiento,
                    descripcion: mascota.descripcion
                }
            });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    static async obtenerMismascotas(req: Request, res: Response) {
        try {
            const usuario_id = (req as any).user?.usuario_id;
            if (!usuario_id) {
                return res.status(401).json({ error: 'No autenticado' });
            }

            const mascotas = await mascotaService.obtenerMascotasPorUsuario(usuario_id);
            return res.json({ mascotas });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async obtenerPorId(req: Request, res: Response) {
        try {
            const usuario_id = (req as any).user?.usuario_id;
            if (!usuario_id) {
                return res.status(401).json({ error: 'No autenticado' });
            }
            const mascota_id = parseInt(req.params.id);

            const mascota = await mascotaService.obtenerMascotaPorId(mascota_id);
            if (!mascota) {
                return res.status(404).json({ error: 'Mascota no encontrada' });
            }

            // Validar propiedad (evita acceso a mascotas de otros usuarios)
            if ((mascota as any).usuario?.usuario_id !== usuario_id) {
                return res.status(404).json({ error: 'Mascota no encontrada' });
            }

            return res.json({
                mascota: {
                    mascota_id: mascota.mascota_id,
                    nombre: mascota.nombre,
                    especie: (mascota as any).especie,
                    fecha_nacimiento: (mascota as any).fecha_nacimiento,
                    descripcion: mascota.descripcion
                }
            });
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    }

    static async actualizar(req: Request, res: Response) {
        try {
            const usuario_id = (req as any).user?.usuario_id;
            if (!usuario_id) return res.status(401).json({ error: 'No autenticado' });

            const mascota_id = parseInt(req.params.id);
            if (Number.isNaN(mascota_id)) return res.status(400).json({ error: 'ID inválido' });

            const { nombre, especie, fecha_nacimiento, descripcion } = req.body;

            const mascota = await mascotaService.actualizarMascota({
                mascota_id,
                usuario_id,
                nombre,
                especie,
                fecha_nacimiento,
                descripcion
            });

            return res.json({
                message: 'Mascota actualizada',
                mascota: {
                    mascota_id: mascota.mascota_id,
                    nombre: mascota.nombre,
                    especie: (mascota as any).especie ?? null,
                    fecha_nacimiento: (mascota as any).fecha_nacimiento ?? null,
                    descripcion: mascota.descripcion ?? null
                }
            });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    static async listarEspecies(_req: Request, res: Response) {
        try {
            const especies = mascotaService.getAllowedSpeciesDisplay();
            return res.json({ especies });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async eliminar(req: Request, res: Response) {
        try {
            const usuario_id = (req as any).user?.usuario_id;
            if (!usuario_id) return res.status(401).json({ error: 'No autenticado' });

            const mascota_id = parseInt(req.params.id);
            if (Number.isNaN(mascota_id)) return res.status(400).json({ error: 'ID inválido' });

            await mascotaService.eliminarMascota({ mascota_id, usuario_id });

            return res.json({ message: 'Mascota eliminada' });
        } catch (error: any) {
            // 404 si no es del usuario o no existe
            const status = /no encontrada/i.test(error.message) ? 404 : 400;
            return res.status(status).json({ error: error.message });
        }
    }
}
