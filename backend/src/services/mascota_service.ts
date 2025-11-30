import { AppDataSource } from "../data-source";
import { Mascota } from "../entities/Mascota";
import { Usuario } from "../entities/Usuario";
import { estaPermitidaLaEspecie, normalizeSpecies,  getSpeciesDisplayList, obtenerListaEspecies } from "../config/especies";

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

        // Validar especie usando diccionario modular
        const especieNorm = normalizeSpecies(data.especie);
        if (!estaPermitidaLaEspecie(especieNorm)) {
            throw new Error(`Especie no válida. Especies permitidas: ${obtenerListaEspecies().join(', ')}`);
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
            especie: especieNorm,
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

    async actualizarMascota(params: {
        mascota_id: number;
        usuario_id: number;
        nombre?: string;
        especie?: string;
        fecha_nacimiento?: string | Date | null;
        descripcion?: string | null;
    }) {
        const mascota = await this.mascotaRepository.findOne({
            where: { mascota_id: params.mascota_id },
            relations: ['usuario']
        });
        if (!mascota || (mascota as any).usuario.usuario_id !== params.usuario_id) {
            throw new Error('Mascota no encontrada');
        }

        const { nombre, especie, fecha_nacimiento, descripcion } = params;
        if (
            typeof nombre === 'undefined' &&
            typeof especie === 'undefined' &&
            typeof fecha_nacimiento === 'undefined' &&
            typeof descripcion === 'undefined'
        ) {
            throw new Error('No se envió ningún campo para actualizar');
        }

        if (typeof nombre !== 'undefined') mascota.nombre = nombre;
        if (typeof descripcion !== 'undefined') mascota.descripcion = descripcion === '' ? null : descripcion;

        if (typeof especie !== 'undefined') {
            if (especie && especie.trim() !== '') {
                const especieNorm = normalizeSpecies(especie);
                if (!estaPermitidaLaEspecie(especieNorm)) {
                    throw new Error(`Especie no válida. Permitidas: ${obtenerListaEspecies().join(', ')}`);
                }
                (mascota as any).especie = especieNorm;
            } else {
                (mascota as any).especie = null;
            }
        }

        if (typeof fecha_nacimiento !== 'undefined') {
            if (!fecha_nacimiento) {
                (mascota as any).fecha_nacimiento = null;
            } else {
                const f = new Date(fecha_nacimiento);
                if (isNaN(f.getTime())) throw new Error('Fecha de nacimiento inválida');
                if (f > new Date()) throw new Error('La fecha de nacimiento no puede ser futura');
                (mascota as any).fecha_nacimiento = f;
            }
        }

        const actualizada = await this.mascotaRepository.save(mascota);
        return actualizada;
    }

    obtenerEspecies() {
        return obtenerListaEspecies();
    }

    getAllowedSpeciesDisplay() {
        return getSpeciesDisplayList();
    }

    async eliminarMascota(params: { mascota_id: number; usuario_id: number }) {
        const { mascota_id, usuario_id } = params;
        const mascota = await this.mascotaRepository.findOne({
            where: { mascota_id },
            relations: ['usuario'],
        });
        if (!mascota || (mascota as any).usuario.usuario_id !== usuario_id) {
            throw new Error('Mascota no encontrada');
        }
        // Eliminar registro
        const result = await this.mascotaRepository.delete(mascota_id);
        if (!result.affected) {
            throw new Error('No se pudo eliminar la mascota');
        }
        return true;
    }
}