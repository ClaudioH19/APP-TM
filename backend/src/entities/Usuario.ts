import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { Mascota } from './Mascota';
import { Recorrido } from './Recorrido';
import { Publicacion } from './Publicacion';
import { Comentario } from './Comentario';
import { Resena } from './Resena';
import { PuntoDeInteres } from './PuntoDeInteres';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  usuario_id!: number;

  @Column({ type: 'text', nullable: false })
  nombre!: string;

  @Column({ type: 'text', nullable: false })
  apellido!: string;

  @Column({ type: 'text', nullable: false })
  contrasena!: string;

  @Column({ type: 'text', unique: true, nullable: false })
  usuario!: string;

  @Index({ unique: true })
  @Column({ type: 'text', nullable: false })
  email!: string;

  @Column({ type: 'bytea', nullable: true })
  avatar!: Buffer | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  avatar_mime_type!: string | null;

  // Relaciones
  @OneToMany(() => Mascota, (m: Mascota) => m.usuario)
  mascotas!: Mascota[];

  @OneToMany(() => Recorrido, (r: Recorrido) => r.usuario)
  recorridos!: Recorrido[];

  @OneToMany(() => Publicacion, (p: Publicacion) => p.usuario)
  publicaciones!: Publicacion[];

  @OneToMany(() => Comentario, (c: Comentario) => c.usuario)
  comentarios!: Comentario[];

  @OneToMany(() => Resena, (r: Resena) => r.usuario)
  resenas!: Resena[];

  @OneToMany(() => PuntoDeInteres, (pdi) => pdi.usuario)
  puntosDeInteresCreados!: PuntoDeInteres[];
}
