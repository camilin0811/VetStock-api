import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ type: 'int' })
  precio: number;

  @Column({ type: 'int', name: 'stock_minimo' })
  stockMinimo: number;

  @Column({ type: 'boolean', name: 'requiere_formula' })
  requiereFormula: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
