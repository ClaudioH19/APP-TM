import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Resena } from './Resena';
import { CategoriaInterestPoint } from './enums/nterest_point_categoria.enum';

@Entity('punto_de_interes')
export class PuntoDeInteres {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: false })
  nombre!: string ;

  @Column({ type: 'float', nullable: true })
  longitud!: number | null;

  @Column({ type: 'float', nullable: true })
  latitud!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_creacion!: Date | null;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @Column({
    type: 'enum',
    enum: CategoriaInterestPoint,
    nullable: false
  })
  categoria!: CategoriaInterestPoint;

  @Column({ type: 'int', default: 0 })
  suma_valoraciones!: number;

  @Column({ type: 'int', default: 0 })
  cantidad_resenas!: number;

  @OneToMany(() => Resena, (r: Resena) => r.puntoInteres)
  resenas!: Resena[];
}
