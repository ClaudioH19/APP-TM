import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { Usuario } from './Usuario';
import { Mascota } from './Mascota';
import { Comentario } from './Comentario';

@Entity('publicacion')
export class Publicacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp' })
  fecha!: Date;

  @Column({ type: 'float', nullable: true })
  ubicacion_lat!: number | null;

  @Column({ type: 'float', nullable: true })
  ubicacion_lon!: number | null;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({ type: 'int', nullable: true })
  contador_likes!: number | null;
  @Column({ type: 'int', nullable: true })
  contador_comentarios!: number | null;
  @Column({ type: 'int', nullable: true })
  contador_compartidos!: number | null;

  @Column({ type: 'text', nullable: true })
  id_video!: string | null;

  @Column({ type: 'text', nullable: true })
  provider!: string | null;

  @Column({ type: 'text', nullable: true })
  mime_type!: string | null;

  @Column({ type: 'text', nullable: true })
  size_bytes!: string | null;

  @ManyToOne(() => Usuario, (u: Usuario) => u.publicaciones, { nullable: false, onDelete: 'CASCADE' })
  @Index('idx_pub_usuario')
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @ManyToOne(() => Mascota, (m: Mascota) => m.publicaciones, { nullable: true, onDelete: 'SET NULL' })
  @Index('idx_pub_mascota')
  @JoinColumn({ name: 'mascota_id' })
  mascota!: Mascota | null;

  @OneToMany(() => Comentario, (c: Comentario) => c.publicacion)
  comentarios!: Comentario[];
}
