import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'lote' })
@Index(['medicamentoId', 'numeroLote'], { unique: true })
export class Lote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'medicamento_id' })
  medicamentoId: number;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
