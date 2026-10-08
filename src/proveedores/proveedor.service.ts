import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProveedorDto, ProveedorResponseDto } from './proveedor.dto';

@Injectable()
export class ProveedorService {
  private proveedores: ProveedorResponseDto[] = [
    {
      id: '1',
      nombre: 'Distribuidora Agrovet Narino',
      nit: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Pasto',
    },
    {
      id: '2',
      nombre: 'Laboratorios Pet Salud',
      nit: '800987654-2',
      telefono: '3109876543',
      ciudad: 'Cali',
    },
  ];

  listar() {
    return this.proveedores;
  }

  obtener(id: string) {
    const proveedor = this.proveedores.find((proveedor) => proveedor.id === id);
    if (proveedor === undefined) {
      throw new NotFoundException(`Proveedor con ID ${id} no existe`);
    }

    return proveedor;
  }

  crear(datos: ProveedorDto) {
    const existente = this.proveedores.find(
      (proveedor) => proveedor.nit === datos.nit,
    );
    if (existente !== undefined) {
      throw new ConflictException(
        `El proveedor con NIT ${datos.nit} ya esta registrado`,
      );
    }

    const nuevoProveedor: ProveedorResponseDto = {
      id: `${new Date().getTime()}`,
      ...datos,
    };
    this.proveedores.push(nuevoProveedor);

    return {
      message: 'Proveedor registrado correctamente',
      data: nuevoProveedor,
    };
  }
}
