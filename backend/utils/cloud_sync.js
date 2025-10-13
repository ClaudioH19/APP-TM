const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Readable } = require('stream');

// Cargar variables de entorno desde la raíz del proyecto
const dotenvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: dotenvPath });

console.log('[DEBUG] Archivo .env cargado desde:', dotenvPath);

// Forzar la configuración de Cloudinary después de cargar dotenv
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Depuración: Verificar configuración de Cloudinary después de forzarla
console.log('[DEBUG] Configuración de Cloudinary (forzada):', cloudinary.config());

// Exportar la función de sincronización
async function syncCloudinary() {
    const LOCAL_MEDIA_DIR = path.resolve(__dirname, '..', 'media_local');
    if (!fs.existsSync(LOCAL_MEDIA_DIR)) fs.mkdirSync(LOCAL_MEDIA_DIR, { recursive: true });

    try {
        // Obtener lista de recursos en Cloudinary
        const { resources } = await cloudinary.api.resources({
            type: 'upload',
            max_results: 500
        });

        // Filtrar archivos para ignorar los que contengan 'samples' en su public_id
        const filteredResources = resources.filter(file => !file.public_id.includes('samples'));

        const cloudFiles = new Set(filteredResources.map(file => file.public_id));
        const localFiles = new Set(fs.readdirSync(LOCAL_MEDIA_DIR).map(file => path.parse(file).name));

        // Descargar archivos que no están en media_local o necesitan actualización
        const missingFiles = filteredResources.filter(file => {
            const filePath = path.join(LOCAL_MEDIA_DIR, `${file.public_id}.${file.format}`);
            if (!fs.existsSync(filePath)) {
                return true; // Archivo no existe, necesita ser descargado
            }
            const stats = fs.statSync(filePath);
            const cloudModifiedTime = new Date(file.updated_at).getTime();
            const localModifiedTime = stats.mtime.getTime();
            return cloudModifiedTime > localModifiedTime; // Archivo en Cloudinary es más reciente
        });

        for (const file of missingFiles) {
            const filePath = path.join(LOCAL_MEDIA_DIR, `${file.public_id}.${file.format}`);
            console.log(`[Cloud Sync] Descargando ${file.public_id} ...`);
            const response = await (await import('node-fetch')).default(file.secure_url);
            const readableStream = Readable.from(response.body);
            const writer = fs.createWriteStream(filePath);

            // Crear directorios necesarios antes de guardar el archivo
            const dirPath = path.dirname(filePath);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`[Cloud Sync] Directorio creado: ${dirPath}`);
            }

            readableStream.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            console.log(`[Cloud Sync] Descargado ${file.public_id}`);
        }

        // Eliminar archivos locales que no están en Cloudinary
        const obsoleteFiles = Array.from(localFiles).filter(file => !cloudFiles.has(file));
        for (const file of obsoleteFiles) {
            const filePathPattern = path.join(LOCAL_MEDIA_DIR, `${file}.*`);
            const matchingFiles = fs.readdirSync(LOCAL_MEDIA_DIR).filter(f => f.startsWith(file + '.'));
            for (const matchingFile of matchingFiles) {
                // Verificar si el archivo existe antes de intentar eliminarlo
                const fullPath = path.join(LOCAL_MEDIA_DIR, matchingFile);
                if (!fs.existsSync(fullPath)) {
                    console.warn(`[Cloud Sync] Archivo no encontrado, omitiendo: ${matchingFile}`);
                    continue;
                }

                try {
                    fs.unlinkSync(fullPath);
                    console.log(`[Cloud Sync] Eliminado archivo obsoleto: ${matchingFile}`);
                } catch (err) {
                    if (err.code === 'EPERM') {
                        console.error(`[Cloud Sync] Permisos insuficientes para eliminar: ${matchingFile}`);
                    } else {
                        console.error(`[Cloud Sync] Error eliminando archivo obsoleto ${matchingFile}:`, err.message || err);
                    }
                }
            }
        }

        console.log('[Cloud Sync] Sincronización completa.');
    } catch (error) {
        console.error('[Cloud Sync] Error durante la sincronización:', error.message || error);
    }
}

module.exports = { syncCloudinary };