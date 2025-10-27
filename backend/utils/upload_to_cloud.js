const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno desde la raíz del proyecto
const dotenvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: dotenvPath });

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Depuración mínima
console.log('[upload_to_cloud] .env path:', dotenvPath);
console.log('[upload_to_cloud] cloud name present:', !!process.env.CLOUDINARY_CLOUD_NAME);

// Helper para detectar resource_type según extensión
function detectResourceType(filePath) {
    const ext = path.extname(filePath || '').toLowerCase();
    const videoExts = ['.mp4', '.mov', '.m4v', '.avi', '.webm', '.3gp'];
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (videoExts.includes(ext)) return 'video';
    if (imageExts.includes(ext)) return 'image';
    return 'auto';
}

// Función para subir un archivo a Cloudinary (exportada)
async function uploadToCloud(filePath, publicId) {
    if (!filePath || !fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const resource_type = detectResourceType(filePath);
    const options = { public_id: publicId };
    if (resource_type !== 'auto') options.resource_type = resource_type;

    try {
        console.log(`[upload_to_cloud] uploading ${filePath} as ${resource_type}`);
        const result = await cloudinary.uploader.upload(filePath, options);
        console.log('[upload_to_cloud] Upload result:', result && result.public_id);
        return result;
    } catch (error) {
        console.error('[upload_to_cloud] Error uploading to Cloudinary:', error && error.message ? error.message : error);
        throw error;
    }
}

// Exportar la función
module.exports = { uploadToCloud };

// Ejecutar prueba si se llama directamente (node upload_to_cloud.js)
if (require.main === module) {
    (async function testUpload() {
        const testFilePath = path.resolve(__dirname, './pruebaUP.png');
        const publicId = 'pruebaUP';

        try {
            console.log(`[Test Upload] Subiendo archivo de prueba: ${testFilePath}`);
            const result = await uploadToCloud(testFilePath, publicId);
            console.log(`[Test Upload] Resultado:`, result);
        } catch (error) {
            console.error(`[Test Upload] Error durante la prueba de subida:`, error && error.message ? error.message : error);
        }
    })();
}