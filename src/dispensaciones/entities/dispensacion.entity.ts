import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { LoteUsadoDto } from '../dispensacion.dto';

@Entity({ name: 'dispensacion' })
export class Dispensacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'medicamento_id' })
  medicamentoId: number;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'varchar', length: 100 })
  mascota: string;

  @Column({ type: 'varchar', length: 255 })
  veterinario: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  formula: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'int' })
  total: number;

  @Column({ type: 'simple-json', name: 'lotes_usados' })
  lotesUsados: LoteUsadoDto[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
