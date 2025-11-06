import { get } from "http";
import { AppDataSource } from "../data-source";
import { Mascota, Publicacion, Usuario, Interaccion } from "../entities";
import { getUserFromToken } from "./token_service";

export async function createPost(ubicacion_lon: number, ubicacion_lat: number, descripcion: string, usuario: Usuario, mascota: Mascota, id_video: string, mime_type: string, size_bytes: string): Promise<Publicacion> {
    const postRepository = AppDataSource.getRepository(Publicacion);
    const contador_likes=0;
    const fecha=new Date();
    const provider="cloudinary";
    const contador_compartidos=0;
    const contador_comentarios=0;
    
    // Incluir el usuario y la mascota en la publicación
    const newPost = postRepository.create({ 
        ubicacion_lon, 
        ubicacion_lat, 
        descripcion, 
        usuario, // Agregar el usuario
        mascota, 
        id_video, 
        mime_type, 
        size_bytes, 
        contador_likes, 
        fecha, 
        provider, 
        contador_compartidos, 
        contador_comentarios 
    });
    
    const savedPost = await postRepository.save(newPost);
    return savedPost;
}

export async function getPostById(id: number): Promise<Publicacion | null> {
    const postRepository = AppDataSource.getRepository(Publicacion);
    return await postRepository.findOneBy({ id });
}

export async function getPostsByUserId(userId: number): Promise<Publicacion[]> {
    const postRepository = AppDataSource.getRepository(Publicacion);
    return await postRepository.find({
        where: {
            usuario: { usuario_id: userId }
        },
        relations: ['usuario', 'mascota']
    });
}
export async function deletePost(id: number): Promise<boolean> {
    const postRepository = AppDataSource.getRepository(Publicacion);
    const result = await postRepository.delete(id);
    return result.affected !== 0;
}
export async function crear_interaccion(usuario: Usuario, id: number, interaccion_tipo: number): Promise<void> {
    console.log('crear_interaccion llamada con:', { usuario: usuario.usuario_id, postId: id, interaccion_tipo });
    
    const postRepository = AppDataSource.getRepository(Publicacion);
    const interaccionRepository = AppDataSource.getRepository(Interaccion);
    
    const post = await postRepository.findOneBy({ id });
    if (!post) {
        console.log('Post no encontrado con id:', id);
        throw new Error(`Post con id ${id} no encontrado`);
    }
    
    console.log('Post encontrado:', post.id);
    
    // Verificar si ya existe una interacción del mismo tipo del mismo usuario para este post
    const interaccionExistente = await interaccionRepository.findOne({
        where: {
            publicacion: { id },
            usuario: { usuario_id: usuario.usuario_id },
            interaccion_tipo
        }
    });
    
    if (interaccionExistente) {
        console.log('Interacción ya existe, eliminando...');
        await interaccionRepository.remove(interaccionExistente);
        console.log('Interacción eliminada');
        return;
    }
    
    //crea una nueva interaccion
    const nuevaInteraccion = interaccionRepository.create({
        interaccion_tipo: interaccion_tipo,
        publicacion: post,
        usuario: usuario,
        fecha: new Date()
    });
    
    console.log('Creando nueva interacción:', nuevaInteraccion);
    await interaccionRepository.save(nuevaInteraccion);
    console.log('Interacción guardada exitosamente');
}
export async function eliminar_interaccion(usuario: Usuario, id: number, interaccion_tipo: number): Promise<void> {
    const interaccionRepository = AppDataSource.getRepository(Interaccion);
    const interaccion = await interaccionRepository.findOne({
        where: {
            publicacion: { id },
            usuario: { usuario_id: usuario.usuario_id },
            interaccion_tipo
        }
    });
    if (interaccion) {
        await interaccionRepository.remove(interaccion);
    }
}