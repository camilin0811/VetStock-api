import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';
import { TIPO_FECHA_HORA } from '../../common/columnas';
import { numeroDecimal } from '../../common/transformadores';
import { Dispensacion } from '../../dispensaciones/entities/dispensacion.entity';
import { Lote } from '../../inventario/entities/lote.entity';

@Entity({ name: 'medicamento' })
export class Medicamento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 255 })
  presentacion: string;

  @Column({ type: 'varchar', length: 30 })
  especie: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numeroDecimal,
  })
  precio: number;

  @Column({ type: 'int', name: 'stock_minimo' })
  stockMinimo: number;

  @Column({ type: 'boolean', name: 'requiere_formula' })
  requiereFormula: boolean;

  @ManyToMany(() => Categoria, (categoria) => categoria.medicamentos)
  @JoinTable({
    name: 'medicamento_categorias',
    joinColumn: { name: 'medicamento_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoria_id', referencedColumnName: 'id' },
  })
  categorias: Relation<Categoria[]>;

  @OneToMany(() => Lote, (lote) => lote.medicamento)
  lotes: Relation<Lote[]>;

  @OneToMany(() => Dispensacion, (dispensacion) => dispensacion.medicamento)
  dispensaciones: Relation<Dispensacion[]>;

  @CreateDateColumn({ type: TIPO_FECHA_HORA, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: TIPO_FECHA_HORA, name: 'updated_at' })
  updatedAt: Date;
}
