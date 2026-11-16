import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { TIPO_FECHA_HORA } from '../../common/columnas';
import { Medicamento } from '../../medicamentos/entities/medicamento.entity';
import type { LoteUsadoDto } from '../dispensacion.dto';

@Entity({ name: 'dispensacion' })
export class Dispensacion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Medicamento, (medicamento) => medicamento.dispensaciones, {
    nullable: false,
  })
  @JoinColumn({ name: 'medicamento_id' })
  medicamento: Relation<Medicamento>;

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

  @CreateDateColumn({ type: TIPO_FECHA_HORA, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: TIPO_FECHA_HORA, name: 'updated_at' })
  updatedAt: Date;
}
