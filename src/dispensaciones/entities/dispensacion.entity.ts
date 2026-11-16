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
import { Usuario } from '../../auth/entities/usuario.entity';
import { TIPO_FECHA_HORA } from '../../common/columnas';
import { numeroDecimal } from '../../common/transformadores';
import { Medicamento } from '../../medicamentos/entities/medicamento.entity';
import type { EstadoDispensacion, LoteUsadoDto } from '../dispensacion.dto';

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

  // Quien registro la dispensacion (del token); null si el usuario se elimino
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario> | null;

  @Column({ type: 'int', name: 'usuario_id', nullable: true })
  usuarioId: number | null;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'varchar', length: 100 })
  mascota: string;

  @Column({ type: 'varchar', length: 255 })
  veterinario: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  formula: string | null;

  @Column({ type: 'date' })
  fecha: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numeroDecimal,
  })
  total: number;

  @Column({ type: 'varchar', length: 10, default: 'ACTIVA' })
  estado: EstadoDispensacion;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'motivo_anulacion',
    nullable: true,
  })
  motivoAnulacion: string | null;

  @Column({ type: 'simple-json', name: 'lotes_usados' })
  lotesUsados: LoteUsadoDto[];

  @CreateDateColumn({ type: TIPO_FECHA_HORA, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: TIPO_FECHA_HORA, name: 'updated_at' })
  updatedAt: Date;
}
