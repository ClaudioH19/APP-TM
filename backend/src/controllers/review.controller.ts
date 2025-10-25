import { Request, Response } from 'express';
import { ReviewService } from '../services/review.service';
import { Usuario } from 'entities/Usuario';

export class ReviewController {
  
  static async createReview(req: Request, res: Response) {
    try {

      const { puntoInteresId, descripcion, valoracion } = req.body;
      
      // obtiene el ID del usuario del token autenticado
      const usuarioId = (req as any).user.usuario_id;

      // valida los campos obligatorios
      if (!puntoInteresId || valoracion == null) {
        return res.status(400).json({ error: 'Faltan campos (puntoInteresId, valoracion)' });
      }
    
      // crea la reseña usando el servicio
      const nuevaResena = await ReviewService.create({
        puntoInteresId: Number(puntoInteresId),
        usuarioId: Number(usuarioId),
        descripcion,
        valoracion: Number(valoracion)
      });

      return res.status(201).json(nuevaResena);

    } catch (error: any) {
      console.error('Error al crear reseña:', error);
      return res.status(400).json({ message: error.message || 'Error interno al crear la reseña' });
    }
  }

  static async getReviewsForPoint(req: Request, res: Response) {
   try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Falta el ID del punto de interés' });
      }
      const reseñas = await ReviewService.getByPointId(Number(id));
      return res.json(reseñas); 

    } catch (error: any) {
      console.error('Error al obtener reseñas:', error);
      return res.status(500).json({ message: error.message || 'Error interno' });
    }
         
  }
}