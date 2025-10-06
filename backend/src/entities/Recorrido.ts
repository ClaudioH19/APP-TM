import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { Usuario } from './Usuario';
import { Mascota } from './Mascota';
import { PuntosRecorrido } from './PuntosRecorrido';
import { RealizadoPor } from './RealizadoPor';

@Index('idx_recorrido_usuario', ['usuario'])
@Index('idx_recorrido_mascota', ['mascota'])
@Entity('recorrido')
export class Recorrido {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: 'timestamp' })
  fecha!: Date;

  @ManyToOne(() => Usuario, (u: Usuario) => u.recorridos, { nullable: false, onDelete: 'CASCADE' })
  usuario!: Usuario;
  @ManyToOne(() => Mascota, (m: Mascota) => m.recorridos, { nullable: false, onDelete: 'CASCADE' })
  mascota!: Mascota;

  @Column({ type: 'int', nullable: true })
  pasos!: number | null;

  @OneToMany(() => PuntosRecorrido, (p: PuntosRecorrido) => p.recorrido)
  puntos!: PuntosRecorrido[];
  @OneToMany(() => RealizadoPor, (rp: RealizadoPor) => rp.recorrido)
  realizados!: RealizadoPor[];
}

