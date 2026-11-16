import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TIPO_FECHA_HORA } from '../../common/columnas';
import { Rol } from '../rol.enum';

@Entity({ name: 'usuario' })
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  correo: string;

  // select: false evita que la clave viaje en consultas y respuestas
  @Column({ type: 'varchar', length: 255, select: false })
  clave: string;

  // varchar en vez de enum nativo para que funcione igual en sqlite (tests)
  @Column({ type: 'varchar', length: 20, default: Rol.Farmaceutico })
  rol: Rol;

  @CreateDateColumn({ type: TIPO_FECHA_HORA, name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: TIPO_FECHA_HORA, name: 'updated_at' })
  updatedAt: Date;
}
