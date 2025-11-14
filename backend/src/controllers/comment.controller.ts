import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Comentario } from '../entities/Comentario';
import { Publicacion } from '../entities/Publicacion';
import { getUserFromToken } from '../services/token_service';

export class CommentController {
  /**
   * Crea un comentario asociado a una publicación.
   * Body expected: { publicacion_id: number, comentario: string }
   * Header: Authorization: Bearer <token>
   */
  static async createComment(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

      const user = await getUserFromToken(token);
      if (!user) return res.status(401).json({ message: 'Token inválido' });

      const { publicacion_id, comentario } = req.body;
      if (!publicacion_id || !comentario) {
        return res.status(400).json({ message: 'Faltan datos requeridos: publicacion_id y comentario' });
      }

      const postRepo = AppDataSource.getRepository(Publicacion);
      const post = await postRepo.findOneBy({ id: parseInt(publicacion_id, 10) });
      if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });

      // Usar transacción para crear comentario y actualizar contador de forma atómica
      const savedComment = await AppDataSource.manager.transaction(async transactionalEntityManager => {
        const commentRepo = transactionalEntityManager.getRepository(Comentario);

        const newComment = commentRepo.create({
          comentario: comentario,
          publicacion: post,
          usuario: user,
          fecha: new Date(),
        });

        const created = await transactionalEntityManager.save(newComment);

        // Incrementar contador de comentarios en la publicación
        await transactionalEntityManager.increment(Publicacion, { id: post.id }, 'contador_comentarios', 1);

        return created;
      });

      return res.status(201).json({ message: 'Comentario creado', comment: savedComment });
    } catch (err) {
      console.error('Error creando comentario:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ message: 'Error creando comentario', error: errorMessage });
    }
  }

  /**
   * Obtener comentarios de una publicación
   * Query param: publicacion_id (number) OR /comments/:id (if needed)
   */
  static async getComments(req: Request, res: Response) {
    try {
      const publicacionId = req.query.publicacion_id ? parseInt(String(req.query.publicacion_id), 10) : undefined;
      if (!publicacionId) return res.status(400).json({ message: 'publicacion_id es requerido como query param' });

      const commentRepo = AppDataSource.getRepository(Comentario);
      const comments = await commentRepo.find({
        where: { publicacion: { id: publicacionId } },
        relations: ['usuario'],
        order: { fecha: 'DESC' }
      });

      return res.json(comments);
    } catch (err) {
      console.error('Error obteniendo comentarios:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ message: 'Error obteniendo comentarios', error: errorMessage });
    }
  }
}

export default CommentController;
