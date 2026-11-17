import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { TIPO_FECHA_HORA } from '../../common/columnas';
import { Medicamento } from '../../medicamentos/entities/medicamento.entity';
import { Proveedor } from '../../proveedores/entities/proveedor.entity';

@Entity({ name: 'lote' })
@Index(['medicamentoId', 'numeroLote'], { unique: true })
export class Lote {
  @PrimaryGeneratedColumn()
  id: number;

  // Relation<> evita el error de referencia circular en modulos ESM
  @ManyToOne(() => Medicamento, (medicamento) => medicamento.lotes, {
    nullable: false,
  })
  @JoinColumn({ name: 'medicamento_id' })
  medicamento: Relation<Medicamento>;

  // Columna FK expuesta para filtrar y responder medicamentoId sin cargar la relacion
  @Column({ type: 'int', name: 'medicamento_id' })
  medicamentoId: number;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.lotes, {
    nullable: false,
  })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Relation<Proveedor>;

  @Column({ type: 'int', name: 'proveedor_id' })
  proveedorId: number;

  @Column({ type: 'varchar', length: 100, name: 'numero_lote' })
  numeroLote: string;

  @Column({ type: 'int', name: 'cantidad_inicial' })
  cantidadInicial: number;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'date', name: 'fecha_ingreso' })
  fechaIngreso: string;

  @Column({ type: 'date', name: 'fecha_vencimiento' })
  fechaVencimiento: string;

  @CreateDateColumn({ type: TIPO_FECHA_HORA, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: TIPO_FECHA_HORA, name: 'updated_at' })
  updatedAt: Date;
}
