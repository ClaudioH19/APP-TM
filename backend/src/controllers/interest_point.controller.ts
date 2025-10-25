import { Request, Response } from 'express';
import { InterestPointService } from '../services/interest_point.service'; 

export class InterestPointController {
  
  static async crearPuntoInteres(req: Request, res: Response) {
    try {
      const { latitud, longitud, descripcion, nombre, categoria } = req.body;

      const usuarioId = (req as any).user.usuario_id;

      // Validar los datos de entrada
        if (!nombre || !categoria) {
          return res.status(400).json({ error: 'Nombre y categoría son obligatorios' });
        }

        if (!latitud || !longitud) {
          return res.status(400).json({ error: 'Latitud y longitud son obligatorios' });
        }

        if (!descripcion) { 
          return res.status(400).json({ error: 'Descripción es obligatoria' });
        }

        

      // llama al servicio para crear el punto de interés
      const nuevoPunto = await InterestPointService.create({ 
        latitud, 
        longitud, 
        descripcion,
        nombre,
        categoria,
        usuarioId,
      });

      return res.status(201).json(nuevoPunto);

    } catch (error: any) {
      console.error('Error al crear Punto de Interés:', error);
      
      if (error.message.includes('obligatorio') || error.message.includes('inválida')) {
         return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ message: 'Error interno al crear el punto de interés' });
    }
  }


  static async obtenerPuntosInteres(req: Request, res: Response) {
    try {
      const puntos = await InterestPointService.getAll();
      return res.json(puntos);

    } catch (error) {
      console.error('Error al obtener Puntos de Interés:', error);
      return res.status(500).json({ message: 'Error interno al obtener puntos' });
    }
  }
}