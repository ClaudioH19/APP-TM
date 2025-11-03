import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';

const router = Router();

// Crear comentario: header Authorization: Bearer <token>
// body: { publicacion_id, comentario }
router.post('/', CommentController.createComment);
// Obtener comentarios por publicacion_id: GET /comments?publicacion_id=123
router.get('/', CommentController.getComments);

export default router;
