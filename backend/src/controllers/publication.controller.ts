import { Request, Response } from 'express';
import { Publicacion} from '../entities/Publicacion';

export class PublicationController {
    static async getPublications(req: Request, res: Response) {
        try {
            //obtener todas las publicaciones ordenadas por fecha
            const publicationRepo = req.app.get('dataSource').getRepository(Publicacion);
            const publications = await publicationRepo.find({
                order: { fecha: 'DESC' },
                relations: ['usuario', 'mascota'],
            });
            res.json(publications);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching publications' });
        }
    }
}