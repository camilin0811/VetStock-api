import request from 'supertest';
import { AppPrueba, crearAppPrueba } from './app-prueba';

// PUT reemplaza el recurso completo (DTO completo); PATCH cambia solo lo enviado
describe('PUT y PATCH (e2e)', () => {
  let contexto: AppPrueba;

  beforeEach(async () => {
    contexto = await crearAppPrueba();
  });

  afterEach(async () => {
    await contexto.cerrar();
  });

  it('responde 401 sin token en PUT y PATCH', async () => {
    const http = () => request(contexto.app.getHttpServer());
    await http().put('/categorias/1').send({}).expect(401);
    await http().patch('/usuarios/1/rol').send({}).expect(401);
  });

  describe('categorias', () => {
    it('PUT reemplaza y borra la descripcion omitida', async () => {
      const respuesta = await contexto
        .api()
        .put('/categorias/1')
        .send({ nombre: 'Antibioticos B' })
        .expect(200);
      expect(respuesta.body.data).toMatchObject({
        nombre: 'Antibioticos B',
        descripcion: null,
      });
    });

    it('PUT exige el cuerpo completo (400 sin nombre)', async () => {
      await contexto
        .api()
        .put('/categorias/1')
        .send({ descripcion: 'x' })
        .expect(400);
    });

    it('PATCH conserva los campos no enviados', async () => {
      const respuesta = await contexto
        .api()
        .patch('/categorias/1')
        .send({ descripcion: 'Nueva' })
        .expect(200);
      expect(respuesta.body.data).toMatchObject({
        nombre: 'Antibioticos',
        descripcion: 'Nueva',
      });
    });
  });

  describe('medicamentos', () => {
    const completo = {
      nombre: 'Amoxicilina 500 mg',
      presentacion: 'Tabletas x 20',
      especie: 'canino',
      precio: 20000,
      stockMinimo: 10,
      requiereFormula: true,
    };

    it('PUT reemplaza todo y quita categorias si se omiten', async () => {
      const respuesta = await contexto
        .api()
        .put('/medicamentos/1')
        .send(completo)
        .expect(200);
      expect(respuesta.body.data).toMatchObject(completo);
      expect(respuesta.body.data.categorias).toEqual([]);
    });

    it('PUT con cuerpo parcial responde 400', async () => {
      await contexto
        .api()
        .put('/medicamentos/1')
        .send({ stockMinimo: 5 })
        .expect(400);
    });

    it('PATCH solo cambia lo enviado', async () => {
      const respuesta = await contexto
        .api()
        .patch('/medicamentos/1')
        .send({ stockMinimo: 5 })
        .expect(200);
      expect(respuesta.body.data).toMatchObject({
        nombre: 'Amoxicilina 250 mg',
        stockMinimo: 5,
      });
      expect(respuesta.body.data.categorias).toHaveLength(1);
    });
  });

  describe('proveedores', () => {
    it('PUT reemplaza y borra el correo omitido', async () => {
      await contexto
        .api()
        .patch('/proveedores/1')
        .send({ correo: 'info@agrovet.com' })
        .expect(200);
      const respuesta = await contexto
        .api()
        .put('/proveedores/1')
        .send({
          nombre: 'Agrovet',
          nit: '900123456-1',
          telefono: '3001112233',
          ciudad: 'Pasto',
        })
        .expect(200);
      expect(respuesta.body.data).toMatchObject({
        nombre: 'Agrovet',
        correo: null,
      });
    });

    it('PUT parcial responde 400', async () => {
      await contexto
        .api()
        .put('/proveedores/1')
        .send({ ciudad: 'Pasto' })
        .expect(400);
    });
  });

  describe('lotes', () => {
    it('PUT exige proveedorId, numeroLote y fechaVencimiento', async () => {
      await contexto
        .api()
        .put('/lotes/1')
        .send({ numeroLote: 'NUEVO-1' })
        .expect(400);
      const respuesta = await contexto
        .api()
        .put('/lotes/1')
        .send({
          proveedorId: 2,
          numeroLote: 'NUEVO-1',
          fechaVencimiento: '2099-01-01',
        })
        .expect(200);
      expect(respuesta.body.data).toMatchObject({
        proveedorId: 2,
        numeroLote: 'NUEVO-1',
        cantidad: 15,
      });
    });
  });

  describe('usuarios', () => {
    it('PUT exige nombre, correo y rol y conserva la clave si no se envia', async () => {
      await contexto
        .api()
        .put('/usuarios/3')
        .send({ nombre: 'Solo nombre' })
        .expect(400);
      const respuesta = await contexto
        .api()
        .put('/usuarios/3')
        .send({
          nombre: 'Camila P',
          correo: 'camila.nueva@vetstock.com',
          rol: 'veterinario',
        })
        .expect(200);
      expect(respuesta.body.data).toMatchObject({
        nombre: 'Camila P',
        rol: 'veterinario',
      });
    });

    it('PATCH /usuarios/:id/rol cambia solo el rol (admin)', async () => {
      const respuesta = await contexto
        .api()
        .patch('/usuarios/3/rol')
        .send({ rol: 'veterinario' })
        .expect(200);
      expect(respuesta.body.data.rol).toBe('veterinario');
      expect(respuesta.body.data.nombre).toBe('Camila');
    });

    it('PATCH /usuarios/:id/rol valida el rol y exige admin', async () => {
      await contexto
        .api()
        .patch('/usuarios/3/rol')
        .send({ rol: 'x' })
        .expect(400);
      await contexto
        .api('farmaceutico')
        .patch('/usuarios/3/rol')
        .send({ rol: 'admin' })
        .expect(403);
      await contexto
        .api()
        .patch('/usuarios/999/rol')
        .send({ rol: 'admin' })
        .expect(404);
    });

    it('PATCH /usuarios/:id/rol no deja sin admin al sistema', async () => {
      await contexto
        .api()
        .patch('/usuarios/1/rol')
        .send({ rol: 'veterinario' })
        .expect(400);
    });
  });
});
