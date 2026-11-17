import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TIPO_FECHA_HORA } from '../../common/columnas';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  correo: string;

  @Column({ type: 'varchar', length: 255 })
  clave: string;

  @CreateDateColumn({ type: TIPO_FECHA_HORA, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: TIPO_FECHA_HORA, name: 'updated_at' })
  updatedAt: Date;
}
