import { Request, Response } from 'express';
import { Publicacion} from '../entities/Publicacion';

export class PublicationController {
    static async getPublications(req: Request, res: Response) {
        try {
            console.log('Fetching all publications from the database...'); // Debug log
            //obtener todas las publicaciones ordenadas por fecha
            const publicationRepo = req.app.get('dataSource').getRepository(Publicacion);
            const publications = await publicationRepo.find({
                order: { fecha: 'DESC' },
                relations: ['usuario', 'mascota'],
            });
            console.log('Publications fetched successfully:', publications);
            res.json(publications);
        } catch (error) {
            console.error('Error fetching publications:', error);
            res.status(500).json({ message: 'Error fetching publications' });
        }
    }
    static async getPublicationById(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        try {
            const publicationRepo = req.app.get('dataSource').getRepository(Publicacion);
            const publication = await publicationRepo.findOne({
                where: { id },
                relations: ['usuario', 'mascota'],
            });
            if (!publication) {
                return res.status(404).json({ message: 'Publication not found' });
            }
            res.json(publication);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching publication' });
        }
    }

    static async createPublication(req: Request, res: Response) {
        try {
            const publicationRepo = req.app.get('dataSource').getRepository(Publicacion);
            const newPublication = publicationRepo.create(req.body);
            await publicationRepo.save(newPublication);
            res.status(201).json(newPublication);
        } catch (error) {
            res.status(500).json({ message: 'Error creating publication' });
        }
    }

    static async deletePublication(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        try {
            const publicationRepo = req.app.get('dataSource').getRepository(Publicacion);
            const result = await publicationRepo.delete(id);
            if (result.affected === 0) {
                return res.status(404).json({ message: 'Publication not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting publication' });
        }
    }

}