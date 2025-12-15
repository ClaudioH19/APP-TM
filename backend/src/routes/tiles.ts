import { Router } from 'express';
const router = Router();

// Proxy simple para tiles de OpenStreetMap
// GET /api/tiles/:z/:x/:y.:ext?
router.get('/:z/:x/:y.:ext?', async (req, res) => {
  const { z, x, y, ext } = req.params as { z: string; x: string; y: string; ext?: string };
  const extension = ext || 'png';
  const tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.${extension}`;

  try {
    // Import dinámico para compatibilidad con node-fetch ESM
    const fetchModule = await import('node-fetch');
    const fetch = fetchModule.default || fetchModule;

    const resp = await fetch(tileUrl, {
      headers: {
        // Identificarse para evitar bloqueos y cumplir TOS
        'User-Agent': 'TM-App/1.0 (+https://example.com)',
        'Accept': '*/*',
      },
      // 10s timeout
    });

    if (!resp.ok) {
      return res.status(resp.status).send(`Tile fetch error: ${resp.statusText}`);
    }

    const contentType = resp.headers.get('content-type') || 'image/png';
    res.setHeader('content-type', contentType);

    // Stream the response body
    const body = resp.body;
    if (!body) return res.status(500).send('No body from tile provider');

    // Pipe node-fetch body to express response
    body.pipe(res);
  } catch (err) {
    console.error('Error proxying tile:', err);
    res.status(500).send('Error proxying tile');
  }
});

export default router;
