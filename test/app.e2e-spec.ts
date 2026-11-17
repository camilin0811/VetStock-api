import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AuthModule } from './../src/auth/auth.module';
import { DispensacionesModule } from './../src/dispensaciones/dispensaciones.module';
import { InventarioModule } from './../src/inventario/inventario.module';
import { MedicamentosModule } from './../src/medicamentos/medicamentos.module';
import { ProveedoresModule } from './../src/proveedores/proveedores.module';
import { ReportesModule } from './../src/reportes/reportes.module';
import { importacionesBdPrueba, sembrarBd } from './bd-prueba';

describe('VetStock API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ...importacionesBdPrueba(),
        AuthModule,
        MedicamentosModule,
        ProveedoresModule,
        InventarioModule,
        DispensacionesModule,
        ReportesModule,
      ],
    }).compile();
    await sembrarBd(moduleFixture.get(DataSource));

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  it('POST /auth/registro registra un usuario', () => {
    return request(app.getHttpServer())
      .post('/auth/registro')
      .send({ nombre: 'Laura', correo: 'laura@vetstock.com', clave: '123456' })
      .expect(201)
      .expect((respuesta) => {
        expect(respuesta.body.data.accessToken).toBeDefined();
      });
  });

  it('POST /auth/login rechaza credenciales invalidas', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ correo: 'nadie@vetstock.com', clave: 'mala' })
      .expect(401);
  });

  it('GET /medicamentos lista el catalogo', () => {
    return request(app.getHttpServer())
      .get('/medicamentos')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.data.length).toBeGreaterThan(0);
        expect(respuesta.body.count).toBe(respuesta.body.data.length);
      });
  });

  it.each([
    ['/proveedores', 2],
    ['/lotes', 6],
    ['/dispensaciones', 2],
  ])('GET %s devuelve message, data y count', (ruta, total) => {
    return request(app.getHttpServer())
      .get(ruta)
      .expect(200)
      .expect((respuesta) => {
        expect(typeof respuesta.body.message).toBe('string');
        expect(respuesta.body.data).toHaveLength(total);
        expect(respuesta.body.count).toBe(total);
      });
  });

  it('POST /medicamentos rechaza datos invalidos', () => {
    return request(app.getHttpServer())
      .post('/medicamentos')
      .send({ nombre: 'Sin precio', especie: 'dinosaurio' })
      .expect(400);
  });

  it('PUT /medicamentos/:id acepta una actualizacion parcial', () => {
    return request(app.getHttpServer())
      .put('/medicamentos/1')
      .send({ stockMinimo: 30 })
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.data.stockMinimo).toBe(30);
        expect(respuesta.body.data.nombre).toBe('Amoxicilina 250 mg');
      });
  });

  it('PUT /medicamentos/:id valida los campos enviados', () => {
    return request(app.getHttpServer())
      .put('/medicamentos/1')
      .send({ especie: 'dinosaurio' })
      .expect(400);
  });

  it('GET /medicamentos/:id responde 404 si no existe', () => {
    return request(app.getHttpServer()).get('/medicamentos/999').expect(404);
  });

  it('GET /lotes incluye medicamentoId, medicamento y proveedor', () => {
    return request(app.getHttpServer())
      .get('/lotes?medicamentoId=2')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.count).toBe(2);
        for (const lote of respuesta.body.data) {
          expect(lote.medicamentoId).toBe(2);
          expect(lote.proveedorId).toBe(2);
          expect(lote.medicamento.nombre).toBe('Vacuna antirrabica');
          expect(lote.proveedor.nombre).toBe('Laboratorios Pet Salud');
        }
      });
  });

  it('POST /lotes registra un lote nuevo', () => {
    return request(app.getHttpServer())
      .post('/lotes')
      .send({
        medicamentoId: 4,
        proveedorId: 1,
        numeroLote: 'ALB-301',
        cantidad: 10,
        fechaVencimiento: '2099-12-31',
      })
      .expect(201)
      .expect((respuesta) => {
        expect(respuesta.body.data.cantidad).toBe(10);
      });
  });

  it('POST /lotes rechaza un medicamento que no existe', () => {
    return request(app.getHttpServer())
      .post('/lotes')
      .send({
        medicamentoId: 999,
        proveedorId: 1,
        numeroLote: 'X-1',
        cantidad: 1,
        fechaVencimiento: '2099-12-31',
      })
      .expect(404);
  });

  it('GET /inventario/:medicamentoId separa stock disponible y vencido', () => {
    return request(app.getHttpServer())
      .get('/inventario/3')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.stockDisponible).toBe(10);
        expect(respuesta.body.stockVencido).toBe(4);
      });
  });

  it('GET /alertas devuelve las alertas del inventario', () => {
    return request(app.getHttpServer())
      .get('/alertas')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.data.length).toBeGreaterThan(0);
        expect(respuesta.body.count).toBe(respuesta.body.data.length);
      });
  });

  it('POST /dispensaciones descuenta por FEFO y devuelve los lotes usados', () => {
    return request(app.getHttpServer())
      .post('/dispensaciones')
      .send({
        medicamentoId: 2,
        cantidad: 35,
        mascota: 'Toby',
        veterinario: 'Dra. Paola Rosero',
      })
      .expect(201)
      .expect((respuesta) => {
        expect(respuesta.body.data.lotesUsados).toHaveLength(2);
      });
  });

  it('POST /dispensaciones rechaza medicamento con formula sin formula', () => {
    return request(app.getHttpServer())
      .post('/dispensaciones')
      .send({
        medicamentoId: 1,
        cantidad: 1,
        mascota: 'Max',
        veterinario: 'Dra. Paola Rosero',
      })
      .expect(400);
  });

  it('GET /reportes/consumo devuelve el consumo por medicamento', () => {
    return request(app.getHttpServer())
      .get('/reportes/consumo')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.detalle.length).toBeGreaterThan(0);
      });
  });

  it('GET /reportes/consumo rechaza fechas invalidas', () => {
    return request(app.getHttpServer())
      .get('/reportes/consumo?desde=ayer')
      .expect(400);
  });

  it('GET /reportes/vencimientos calcula la perdida', () => {
    return request(app.getHttpServer())
      .get('/reportes/vencimientos')
      .expect(200)
      .expect((respuesta) => {
        expect(respuesta.body.totalPerdida).toBeGreaterThan(0);
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
