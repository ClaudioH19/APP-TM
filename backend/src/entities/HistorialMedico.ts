import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Mascota } from './Mascota';

@Index('idx_hist_med_mascota', ['mascota'])
@Entity('historial_medico')
export class HistorialMedico {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp' })
  fecha!: Date;

  @Column({ type: 'float', nullable: true })
  ubicacion_clinica_lat!: number | null;

  @Column({ type: 'float', nullable: true })
  ubicacion_clinica_lon!: number | null;

  @ManyToOne(() => Mascota, (m: Mascota) => m.historial, { nullable: false, onDelete: 'CASCADE' })
  mascota!: Mascota;
}
