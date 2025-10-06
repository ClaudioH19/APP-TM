import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Mascota } from './Mascota';
import { Recorrido } from './Recorrido';

@Entity('realizado_por')
export class RealizadoPor {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Mascota, (m: Mascota) => m.realizados, { nullable: false, onDelete: 'CASCADE' })
  mascota!: Mascota;
  @ManyToOne(() => Recorrido, (r: Recorrido) => r.realizados, { nullable: false, onDelete: 'CASCADE' })
  recorrido!: Recorrido;
}

