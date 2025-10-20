import {Router} from 'express';
import {PublicationController} from '../controllers/publication.controller';
import { getLocationName } from '../controllers/getLocationName';

const router = Router();

router.get('/', PublicationController.getPublications);
router.get('/location', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Faltan parámetros lat y lon' });
  const name = await getLocationName(Number(lat), Number(lon));
  res.json({ name });
});

export default router;
