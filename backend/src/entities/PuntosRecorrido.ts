import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Recorrido } from './Recorrido';

@Index('idx_puntos_recorrido', ['recorrido'])
@Entity('puntos_recorrido')
export class PuntosRecorrido {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'float', nullable: true })
  longitud!: number | null;

  @Column({ type: 'float', nullable: true })
  latitud!: number | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_hora!: Date | null;

  @ManyToOne(() => Recorrido, (r: Recorrido) => r.puntos, { nullable: false, onDelete: 'CASCADE' })
  recorrido!: Recorrido;
}
