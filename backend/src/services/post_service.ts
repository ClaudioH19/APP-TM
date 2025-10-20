import { AppDataSource } from "data-source";
import { Publicacion } from "entities";

export async function createPost(fecha: Date, ubicacion_lon: number, ubicacion_lat: number, descripcion: string, id: number, mascota: string): Promise<void> {
    const postRepository = AppDataSource.getRepository(Publicacion);
    const newPost = postRepository.create({ id, fecha, ubicacion_lon, ubicacion_lat, descripcion, mascota });
    await postRepository.save(newPost);
}
      