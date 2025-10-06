import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { PuntoDeInteres } from './PuntoDeInteres';
import { Usuario } from './Usuario';

@Index('idx_resena_poi', ['puntoInteres'])
@Index('idx_resena_usuario', ['usuario'])
@Entity('resena')
export class Resena {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => PuntoDeInteres, (p: PuntoDeInteres) => p.resenas, { nullable: false, onDelete: 'CASCADE' })
  puntoInteres!: PuntoDeInteres;
  @ManyToOne(() => Usuario, (u: Usuario) => u.resenas, { nullable: false, onDelete: 'CASCADE' })
  usuario!: Usuario;

  @Column({ type: 'timestamp', nullable: true })
  fecha_creacion!: Date | null;
  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;
  @Column({ type: 'int', nullable: true })
  valoracion!: number | null;
}
