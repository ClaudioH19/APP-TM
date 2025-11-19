import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { Mascota } from './Mascota';

@Index('idx_hist_med_mascota', ['mascota'])
@Index('idx_hist_med_fecha', ['fecha'])
@Entity('historial_medico')
export class HistorialMedico {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp' })
  fecha!: Date;

  // categoría del evento (vacuna, control, paseo, etc.)
  @Column({ type: 'varchar', length: 50, nullable: true })
  categoria!: string | null;

  // campos opcionales para mostrar en el UI
  @Column({ type: 'varchar', length: 120, nullable: true })
  titulo!: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  // lat/lon genéricos
  @Column({ type: 'float', nullable: true })
  ubicacion_clinica_lat!: number | null;

  @Column({ type: 'float', nullable: true })
  ubicacion_clinica_lon!: number | null;

  @ManyToOne(() => Mascota, (m: Mascota) => m.historial, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mascotaMascotaId' })
  mascota!: Mascota;
}
