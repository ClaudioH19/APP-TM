import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { Publicacion } from './Publicacion';
import { Usuario } from './Usuario';

@Index('idx_com_pub', ['publicacion'])
@Index('idx_com_usuario', ['usuario'])
@Entity('interaccion')
export class Interaccion {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Publicacion, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publicacion_id' })
  publicacion!: Publicacion;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column({ type: 'timestamp', nullable: true })
  fecha!: Date | null;
  
  @Column({ type: 'int', nullable: true })
  interaccion_tipo!: number | null;
  // 1: like, 2: comentario, 3: compartir
}