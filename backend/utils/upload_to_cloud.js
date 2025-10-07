const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde la raíz del proyecto
const dotenvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: dotenvPath });

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Depuración: Verificar si las variables de entorno están cargadas correctamente
console.log('[DEBUG] CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('[DEBUG] CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('[DEBUG] CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET);
console.log('[DEBUG] Archivo .env cargado desde:', dotenvPath);

// Depuración: Verificar configuración de Cloudinary
console.log('[DEBUG] Configuración de Cloudinary:', cloudinary.config());

// Forzar la configuración de Cloudinary después de cargar dotenv
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Depuración: Verificar configuración de Cloudinary después de forzarla
console.log('[DEBUG] Configuración de Cloudinary (forzada):', cloudinary.config());

// Función para subir un archivo a Cloudinary
async function uploadFileToCloudinary(filePath, publicId) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            public_id: publicId,
        });
        console.log(`[Upload] Archivo subido exitosamente:`, result);
        return result;
    } catch (error) {
        console.error(`[Upload] Error al subir archivo:`, error.message || error);
        throw error;
    }
}

// Prueba para subir un archivo
(async function testUpload() {
    const testFilePath = path.resolve(__dirname, './pruebaUP.png');
    const publicId = 'pruebaUP';

    try {
        console.log(`[Test Upload] Subiendo archivo de prueba: ${testFilePath}`);
        const result = await uploadFileToCloudinary(testFilePath, publicId);
        console.log(`[Test Upload] Resultado:`, result);
    } catch (error) {
        console.error(`[Test Upload] Error durante la prueba de subida:`, error.message || error);
    }
})();