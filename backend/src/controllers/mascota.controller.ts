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
            const mascota_id = parseInt(req.params.id);
            const mascota = await mascotaService.obtenerMascotaPorId(mascota_id);
            
            return res.json({ mascota });
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    }
}
