import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authMiddleware } from '../middleware/auth.middleware'; 


const router = Router();

// POST /api/reviews
router.post('/', authMiddleware, ReviewController.createReview);
// GET /api/reviews/:id
router.get('/:id', ReviewController.getReviewsForPoint);

export default router;