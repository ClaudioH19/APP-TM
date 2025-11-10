import { AppDataSource } from "../data-source";
import { Mascota } from "../entities/Mascota";
import { Usuario } from "../entities/Usuario";

export class MascotaService {
    private mascotaRepository = AppDataSource.getRepository(Mascota);
    private usuarioRepository = AppDataSource.getRepository(Usuario);

    async registrarMascota(data: {
        nombre: string;
        especie: string;
        fecha_nacimiento: string | Date;
        descripcion?: string;
        usuario_id: number;
    }) {
        // Validar datos obligatorios
        if (!data.nombre || !data.especie || !data.fecha_nacimiento) {
            throw new Error('Faltan campos obligatorios: nombre, especie, fecha_nacimiento');
        }

        // Validar que el usuario existe
        const usuario = await this.usuarioRepository.findOneBy({ usuario_id: data.usuario_id });
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        // Validar especie (lista permitida - ajusta según tus necesidades)
        const especiesPermitidas = ['perro', 'gato', 'ave', 'reptil', 'roedor', 'otro'];
        if (!especiesPermitidas.includes(data.especie.toLowerCase())) {
            throw new Error(`Especie no válida. Especies permitidas: ${especiesPermitidas.join(', ')}`);
        }

        // Validar fecha de nacimiento (no puede ser futura)
        const fechaNacimiento = new Date(data.fecha_nacimiento);
        if (isNaN(fechaNacimiento.getTime())) {
            throw new Error('Fecha de nacimiento inválida');
        }
        if (fechaNacimiento > new Date()) {
            throw new Error('La fecha de nacimiento no puede ser futura');
        }

        // Crear mascota
        const mascota = this.mascotaRepository.create({
            nombre: data.nombre,
            especie: data.especie.toLowerCase(),
            fecha_nacimiento: fechaNacimiento,
            descripcion: data.descripcion || null,
            usuario: usuario
        });

        return await this.mascotaRepository.save(mascota);
    }

    async obtenerMascotasPorUsuario(usuario_id: number) {
        return await this.mascotaRepository.find({
            where: { usuario: { usuario_id } },
            relations: ['usuario']
        });
    }

    async obtenerMascotaPorId(mascota_id: number) {
        const mascota = await this.mascotaRepository.findOne({
            where: { mascota_id },
            relations: ['usuario']
        });
        
        if (!mascota) {
            throw new Error('Mascota no encontrada');
        }

        return mascota;
    }
}