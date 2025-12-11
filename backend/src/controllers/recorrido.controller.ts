import { Request, Response } from 'express';
import { verifyToken, getUserFromToken } from '../services/token_service';
import { createRecorrido, getRecorridosByUsuario } from '../services/recorrido.service';

export class RecorridoController {
    static async create(req: Request, res: Response) {
        try {
            const auth = req.headers.authorization || '';
            const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
            if (!token) return res.status(401).json({ error: 'Sin token' });
            
            await verifyToken(token);
            const user = await getUserFromToken(token);
            if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

            const { mascotaId, pasos, puntos } = req.body;
            
            if (!mascotaId || !puntos || puntos.length === 0) {
                return res.status(400).json({ error: 'Faltan datos requeridos' });
            }

            const recorrido = await createRecorrido(user.usuario_id, mascotaId, pasos, puntos);
            return res.json({ recorrido });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getHistory(req: Request, res: Response) {
        try {
            const auth = req.headers.authorization || '';
            const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
            if (!token) return res.status(401).json({ error: 'Sin token' });
            
            await verifyToken(token);
            const user = await getUserFromToken(token);
            if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

            const recorridos = await getRecorridosByUsuario(user.usuario_id);
            return res.json({ recorridos });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }
}
