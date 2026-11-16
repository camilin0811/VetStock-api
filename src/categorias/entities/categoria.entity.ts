import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { TIPO_FECHA_HORA } from '../../common/columnas';
import { Medicamento } from '../../medicamentos/entities/medicamento.entity';

@Entity({ name: 'categoria' })
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;

  @ManyToMany(() => Medicamento, (medicamento) => medicamento.categorias)
  medicamentos: Relation<Medicamento[]>;

  @CreateDateColumn({ type: TIPO_FECHA_HORA, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: TIPO_FECHA_HORA, name: 'updated_at' })
  updatedAt: Date;
}
