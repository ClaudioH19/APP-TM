import { AppDataSource } from "../data-source";
import { Mascota, Publicacion } from "../entities";

export async function createPost(ubicacion_lon: number, ubicacion_lat: number, descripcion: string, id: number, mascota: Mascota, id_video: string, mime_type: string, size_bytes: string): Promise<void> {
    const postRepository = AppDataSource.getRepository(Publicacion);
    const contador_likes=0;
    const fecha=new Date();
    const provider="cloudinary";
    const contador_compartidos=0;
    const contador_comentarios=0;
    const newPost = postRepository.create({ id, ubicacion_lon, ubicacion_lat, descripcion, mascota, id_video, mime_type, size_bytes, contador_likes, fecha, provider, contador_compartidos, contador_comentarios });
    await postRepository.save(newPost);
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