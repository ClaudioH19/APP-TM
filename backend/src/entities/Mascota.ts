import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { Usuario } from './Usuario';
import { HistorialMedico } from './HistorialMedico';
import { Recorrido } from './Recorrido';
import { Publicacion } from './Publicacion';
import { RealizadoPor } from './RealizadoPor';

@Entity('mascota')
export class Mascota {
  @PrimaryGeneratedColumn()
  mascota_id!: number;
  
  @Column({ type: 'text', nullable: true })
  nombre!: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @ManyToOne(() => Usuario, (u: Usuario) => u.mascotas, { nullable: false, onDelete: 'CASCADE' })
  @Index('idx_mascota_usuario')
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @OneToMany(() => HistorialMedico, (h: HistorialMedico) => h.mascota)
  historial!: HistorialMedico[];
  @OneToMany(() => Recorrido, (r: Recorrido) => r.mascota)
  recorridos!: Recorrido[];
  @OneToMany(() => Publicacion, (p: Publicacion) => p.mascota)
  publicaciones!: Publicacion[];
  @OneToMany(() => RealizadoPor, (rp: RealizadoPor) => rp.mascota)
  realizados!: RealizadoPor[];
}
