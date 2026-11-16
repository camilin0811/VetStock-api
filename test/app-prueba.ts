import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { CategoriasModule } from '../src/categorias/categorias.module';
import { DispensacionesModule } from '../src/dispensaciones/dispensaciones.module';
import { InventarioModule } from '../src/inventario/inventario.module';
import { MedicamentosModule } from '../src/medicamentos/medicamentos.module';
import { ProveedoresModule } from '../src/proveedores/proveedores.module';
import { ReportesModule } from '../src/reportes/reportes.module';
import { UsuariosModule } from '../src/usuarios/usuarios.module';
import {
  CLAVE_PRUEBA,
  importacionesBdPrueba,
  sembrarBd,
  USUARIOS_PRUEBA,
} from './bd-prueba';

export type RolPrueba = keyof typeof USUARIOS_PRUEBA;

export interface AppPrueba {
  app: INestApplication<App>;
  tokens: Record<RolPrueba, string>;
  // Cliente HTTP ya autenticado (admin por defecto); sin token: request(app.getHttpServer())
  api: (rol?: RolPrueba) => ReturnType<typeof request.agent>;
  cerrar: () => Promise<void>;
}

// App completa sobre sqlite en memoria; inicia sesion con los 3 usuarios de prueba
export async function crearAppPrueba(): Promise<AppPrueba> {
  const moduleFixture = await Test.createTestingModule({
    imports: [
      ...importacionesBdPrueba(),
      AuthModule,
      UsuariosModule,
      CategoriasModule,
      MedicamentosModule,
      ProveedoresModule,
      InventarioModule,
      DispensacionesModule,
      ReportesModule,
    ],
  }).compile();
  await sembrarBd(moduleFixture.get(DataSource));

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.init();

  const tokens = {} as Record<RolPrueba, string>;
  for (const rol of Object.keys(USUARIOS_PRUEBA) as RolPrueba[]) {
    const respuesta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo: USUARIOS_PRUEBA[rol], clave: CLAVE_PRUEBA })
      .expect(201);
    tokens[rol] = respuesta.body.data.accessToken;
  }

  return {
    app,
    tokens,
    api: (rol = 'admin') =>
      request
        .agent(app.getHttpServer())
        .set('Authorization', `Bearer ${tokens[rol]}`),
    cerrar: () => app.close(),
  };
}
