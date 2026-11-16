import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity';
import { TIPO_FECHA_HORA } from '../../common/columnas';
import { Medicamento } from '../../medicamentos/entities/medicamento.entity';
import { Lote } from './lote.entity';

export const TIPOS_MOVIMIENTO = [
  'ENTRADA',
  'SALIDA',
  'AJUSTE',
  'ANULACION',
] as const;
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

// Kardex: cada cambio de stock de un lote deja un movimiento
@Entity({ name: 'movimiento' })
export class Movimiento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  tipo: TipoMovimiento;

  // Siempre positiva; el tipo indica si suma (ENTRADA, ANULACION) o resta
  @Column({ type: 'int' })
  cantidad: number;

  @ManyToOne(() => Lote, { nullable: false })
  @JoinColumn({ name: 'lote_id' })
  lote: Relation<Lote>;

  @Column({ type: 'int', name: 'lote_id' })
  loteId: number;

  @ManyToOne(() => Medicamento, { nullable: false })
  @JoinColumn({ name: 'medicamento_id' })
  medicamento: Relation<Medicamento>;

  @Column({ type: 'int', name: 'medicamento_id' })
  medicamentoId: number;

  // Nullable: movimientos de datos antiguos o de usuarios eliminados
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario> | null;

  @Column({ type: 'int', name: 'usuario_id', nullable: true })
  usuarioId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  detalle: string | null;

  @CreateDateColumn({ type: TIPO_FECHA_HORA, name: 'created_at' })
  createdAt: Date;
}
