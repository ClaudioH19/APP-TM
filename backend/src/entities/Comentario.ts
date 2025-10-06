import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Publicacion } from './Publicacion';
import { Usuario } from './Usuario';

@Index('idx_com_pub', ['publicacion'])
@Index('idx_com_usuario', ['usuario'])
@Entity('comentario')
export class Comentario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: true })
  comentario!: string | null;

  @ManyToOne(() => Publicacion, (p: Publicacion) => p.comentarios, { nullable: false, onDelete: 'CASCADE' })
  publicacion!: Publicacion;

  @ManyToOne(() => Usuario, (u: Usuario) => u.comentarios, { nullable: false, onDelete: 'CASCADE' })
  usuario!: Usuario;

  @Column({ type: 'timestamp', nullable: true })
  fecha!: Date | null;
}

