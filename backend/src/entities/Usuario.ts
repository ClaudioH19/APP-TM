import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { Mascota } from './Mascota';
import { Recorrido } from './Recorrido';
import { Publicacion } from './Publicacion';
import { Comentario } from './Comentario';
import { Resena } from './Resena';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  usuario_id!: number;


  @Column({ type: 'text' })
  nombre!: string;

  @Column({ type: 'text' })
  apellido!: string;

  @Column({ type: 'text', unique: true })
  usuario!: string;

  @Column({ type: 'text', unique: true })
  email!: string;

  @Column({ type: 'text' })
  contrasena!: string;

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
}
