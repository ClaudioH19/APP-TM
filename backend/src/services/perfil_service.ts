import { get } from "http";
import { AppDataSource } from "../data-source";
import { Mascota, Publicacion, Usuario} from "../entities";

export async function crearMascotaParaUsuario(usuario: Usuario, nombre: string, tipo: string, raza: string, edad: number): Promise<Mascota> {
    const mascotaRepository = AppDataSource.getRepository(Mascota);
    const nuevaMascota = mascotaRepository.create({
        nombre,
        descripcion: null,
        fecha_nacimiento: null,
        especie: tipo,
        usuario,
        recorridos: [],
        historial: [],
        publicaciones: [],
        realizados: []
    });
    return mascotaRepository.save(nuevaMascota);
}

export async function getMascotasByUsuarioId(usuarioId: number): Promise<Mascota[]> {
    const mascotaRepository = AppDataSource.getRepository(Mascota);
    return await mascotaRepository.find({
        where: {
            usuario: { usuario_id: usuarioId }
        }
    });
}

export async function deleteMascota(id: number): Promise<boolean> {
    const mascotaRepository = AppDataSource.getRepository(Mascota);
    const result = await mascotaRepository.delete(id);
    return result.affected !== 0;
}

export async function getAllPublicacionesByUsuarioId(usuarioId: number): Promise<Publicacion[]> {
    const publicacionRepository = AppDataSource.getRepository(Publicacion);
    return await publicacionRepository.find({
        where: {
            usuario: { usuario_id: usuarioId }
        }
    });
}
export async function updateMascota(id: number, data: Partial<Mascota>): Promise<Mascota | null> {
    const mascotaRepository = AppDataSource.getRepository(Mascota);
    await mascotaRepository.update(id, data);
    return await mascotaRepository.findOneBy({ mascota_id: id });
}

export async function getMascotaById(id: number): Promise<Mascota | null> {
    const mascotaRepository = AppDataSource.getRepository(Mascota);
    return await mascotaRepository.findOneBy({ mascota_id: id });
}

