import { Request, Response } from 'express';
import { Publicacion} from '../entities/Publicacion';
import { Mascota } from '../entities/Mascota';
import { createPost } from '../services/post_service';
import { getUserFromToken } from '../services/token_service';
import { AppDataSource } from '../data-source';
import * as fs from 'fs';
import * as path from 'path';

// Extender la interfaz Request para incluir file de multer
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export class PublicationController {
    static async getPublications(req: Request, res: Response) {
        try {
            console.log('Fetching all publications from the database...'); // Debug log
            //obtener todas las publicaciones ordenadas por fecha
            const publicationRepo = req.app.get('dataSource').getRepository(Publicacion);
            const publications = await publicationRepo.find({
                order: { fecha: 'DESC' },
                relations: ['usuario', 'mascota'],
            });
            console.log('Publications fetched successfully:', publications);
            res.json(publications);
        } catch (error) {
            console.error('Error fetching publications:', error);
            res.status(500).json({ message: 'Error fetching publications' });
        }
    }
    static async getPublicationById(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        try {
            const publicationRepo = req.app.get('dataSource').getRepository(Publicacion);
            const publication = await publicationRepo.findOne({
                where: { id },
                relations: ['usuario', 'mascota'],
            });
            if (!publication) {
                return res.status(404).json({ message: 'Publication not found' });
            }
            res.json(publication);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching publication' });
        }
    }

    static async createPublication(req: MulterRequest, res: Response) {
        try {
            console.log('Creating publication with data:', req.body);
            console.log('Files received:', req.file);
            
            // Obtener el token del header Authorization
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: "Token no proporcionado" });
            }
            
            // Obtener el usuario del token
            const userFromToken = await getUserFromToken(token);
            if (!userFromToken) {
                return res.status(401).json({ message: "Token inválido" });
            }
            
            // Obtener datos del cuerpo de la petición
            const { ubicacion_lon, ubicacion_lat, descripcion, mascota_id, id_video, mime_type } = req.body;
            
            // Validaciones básicas
            if (!ubicacion_lon || !ubicacion_lat || !descripcion || !mascota_id) {
                return res.status(400).json({ message: "Faltan datos requeridos" });
            }
            
            // Buscar la mascota
            const mascotaRepo = AppDataSource.getRepository(Mascota);
            const mascota = await mascotaRepo.findOne({
                where: { mascota_id: parseInt(mascota_id) },
                relations: ['usuario']
            });
            
            if (!mascota) {
                return res.status(404).json({ message: "Mascota no encontrada" });
            }
            
            // Verificar que la mascota pertenece al usuario
            if (mascota.usuario.usuario_id !== userFromToken.usuario_id) {
                return res.status(403).json({ message: "No tienes permiso para usar esta mascota" });
            }
            
            // Si hay archivo, obtener el tamaño y guardarlo localmente
            let localFilePath = '';
            const size_bytes = req.file ? req.file.size.toString() : "0";
            
            if (req.file && id_video) {
                try {
                    // Crear directorio media_local si no existe
                    const mediaDir = path.join(__dirname, '../../media_local');
                    if (!fs.existsSync(mediaDir)) {
                        fs.mkdirSync(mediaDir, { recursive: true });
                    }

                    // Determinar extensión: preferir originalname, si no usar mime_type
                    const originalName = (req.file.originalname || '').toString();
                    let ext = '';
                    if (originalName) {
                        ext = path.extname(originalName);
                        if (path.extname(originalName).includes('jpeg'))
                            ext='.jpg'
                    }
                    if (!ext && mime_type) {
                        // Inferir por mime_type básico
                        if (mime_type.includes('mp4') || mime_type.includes('video')) ext = '.mp4';
                        else if (mime_type.includes('jpeg') || mime_type.includes('jpg')) ext = '.jpg';
                        else if (mime_type.includes('png')) ext = '.png';
                        else ext = ''; // dejar vacío si no se sabe
                    }

                    // Usar nombre con extensión para que Cloudinary detecte correctamente el tipo
                    const fileName = ext ? `${id_video}${ext}` : id_video;
                    localFilePath = path.join(mediaDir, fileName);

                    // Guardar el archivo localmente
                    fs.writeFileSync(localFilePath, req.file.buffer);
                    console.log('File saved locally at:', localFilePath);

                } catch (saveError) {
                    console.error('Error saving file locally:', saveError);
                    // Continuar sin fallar la creación del post
                }
            }
            
            // Normalizar MIME type y extensión para imágenes JPEG
            let normalizedMimeType = mime_type;
            let ext = path.extname(localFilePath); // Asegurar inicialización de ext

            if (mime_type && mime_type === 'image/jpeg') {
                normalizedMimeType = 'image/jpg'; // Normalizar MIME type
                if (ext === '.jpeg') {
                    ext = '.jpg'; // Normalizar extensión
                }
                // Asegurar que el archivo local se guarde con '.jpg'
                localFilePath = localFilePath.replace(/\.jpeg$/, '.jpg');
            }

            // Asegurar que el archivo local también use la extensión normalizada
            if (ext === '.jpg' || ext === '.jpeg') {
                ext = '.jpg';
                localFilePath = localFilePath.replace(/\.jpeg$/, '.jpg'); // Renombrar archivo local si es necesario
            }
            
            // Subir a Cloudinary antes de crear el post
            if (localFilePath && id_video) {
                try {
                    const { uploadToCloud } = require('../../utils/upload_to_cloud');
                    console.log('Starting Cloudinary upload for:', localFilePath);
                    await uploadToCloud(localFilePath, id_video);
                    console.log('Cloudinary upload completed for:', id_video);
                } catch (uploadError) {
                    console.error('Error uploading to Cloudinary:', uploadError);
                    // Eliminar archivo local si la subida falla
                    if (fs.existsSync(localFilePath)) {
                        fs.unlinkSync(localFilePath);
                    }
                    const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
                    return res.status(500).json({ message: 'Error uploading to Cloudinary', error: errorMessage });
                }
            }
            
            // Crear la publicación usando el servicio
            let newPost;
            try {
                newPost = await createPost(
                    parseFloat(ubicacion_lon),
                    parseFloat(ubicacion_lat),
                    descripcion,
                    mascota.usuario, // Pasar el usuario de la mascota
                    mascota,
                    id_video || `post_${Date.now()}`,
                    normalizedMimeType || 'image/jpeg',
                    size_bytes
                );
            } catch (dbError) {
                console.error('Error creating post in database:', dbError);
                // Eliminar archivo local si la creación en la base de datos falla
                if (fs.existsSync(localFilePath)) {
                    fs.unlinkSync(localFilePath);
                }
                const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
                return res.status(500).json({ message: 'Error creating post in database', error: errorMessage });
            }
            
            // Opcional: eliminar archivo local después de subir a Cloudinary
            // fs.unlinkSync(localFilePath);
            
            res.status(201).json({ 
                message: "Publicación creada exitosamente",
                post: newPost,
                id_video: id_video || `post_${Date.now()}`
            });
            
        } catch (error) {
            console.error('Error creating publication:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error creating publication', error: errorMessage });
        }
    }

    static async deletePublication(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        try {
            const publicationRepo = req.app.get('dataSource').getRepository(Publicacion);
            const result = await publicationRepo.delete(id);
            if (result.affected === 0) {
                return res.status(404).json({ message: 'Publication not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting publication' });
        }
    }

}