import { AppDataSource } from "../data-source";
import { Recorrido, PuntosRecorrido, Usuario, Mascota } from "../entities";

export async function createRecorrido(usuarioId: number, mascotaId: number, pasos: number, puntos: { latitud: number, longitud: number, timestamp: Date }[]) {
    const recorridoRepository = AppDataSource.getRepository(Recorrido);
    const puntosRepository = AppDataSource.getRepository(PuntosRecorrido);
    const usuarioRepository = AppDataSource.getRepository(Usuario);
    const mascotaRepository = AppDataSource.getRepository(Mascota);

    const usuario = await usuarioRepository.findOneBy({ usuario_id: usuarioId });
    const mascota = await mascotaRepository.findOneBy({ mascota_id: mascotaId });

    if (!usuario || !mascota) {
        throw new Error("Usuario o Mascota no encontrados");
    }

    const recorrido = new Recorrido();
    recorrido.usuario = usuario;
    recorrido.mascota = mascota;
    recorrido.pasos = pasos;
    recorrido.fecha = new Date();

    const savedRecorrido = await recorridoRepository.save(recorrido);

    const puntosEntities = puntos.map(p => {
        const punto = new PuntosRecorrido();
        punto.latitud = p.latitud;
        punto.longitud = p.longitud;
        punto.fecha_hora = p.timestamp;
        punto.recorrido = savedRecorrido;
        return punto;
    });

    await puntosRepository.save(puntosEntities);

    return savedRecorrido;
}

export async function getRecorridosByUsuario(usuarioId: number) {
    const recorridoRepository = AppDataSource.getRepository(Recorrido);
    return await recorridoRepository.find({
        where: { usuario: { usuario_id: usuarioId } },
        relations: ["mascota", "puntos"],
        order: { fecha: "DESC" }
    });
}
