import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Resena } from './Resena';

@Entity('punto_de_interes')
export class PuntoDeInteres {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'float', nullable: true })
  longitud!: number | null;

  @Column({ type: 'float', nullable: true })
  latitud!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_creacion!: Date | null;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @OneToMany(() => Resena, (r: Resena) => r.puntoInteres)
  resenas!: Resena[];
}
