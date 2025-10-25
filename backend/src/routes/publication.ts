import {Router} from 'express';
import {PublicationController} from '../controllers/publication.controller';
import { getLocationName } from '../controllers/getLocationName';
import multer from 'multer';

// Configurar multer para manejar archivos en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  }
});

const router = Router();

router.get('/', PublicationController.getPublications);
router.get('/location', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Faltan parámetros lat y lon' });
  const name = await getLocationName(Number(lat), Number(lon));
  res.json({ name });
});

// Usar middleware de multer para la creación de publicaciones
router.post('/', upload.single('file'), PublicationController.createPublication);
router.get('/:id', PublicationController.getPublicationById);
router.delete('/:id', PublicationController.deletePublication);

export default router;
