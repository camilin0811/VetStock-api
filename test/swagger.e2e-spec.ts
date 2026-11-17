import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppPrueba, crearAppPrueba } from './app-prueba';

describe('Swagger (e2e)', () => {
  let contexto: AppPrueba;

  beforeEach(async () => {
    contexto = await crearAppPrueba();
  });

  afterEach(async () => {
    await contexto.cerrar();
  });

  it('documenta todos los metodos HTTP con autenticacion Bearer y etiquetas', () => {
    const documento = SwaggerModule.createDocument(
      contexto.app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const metodos = new Set<string>();
    for (const ruta of Object.values(documento.paths)) {
      Object.keys(ruta).forEach((m) => metodos.add(m));
    }
    expect([...metodos].sort()).toEqual([
      'delete',
      'get',
      'patch',
      'post',
      'put',
    ]);
    expect(documento.paths['/usuarios/{id}/rol']?.patch).toBeDefined();
    expect(documento.components?.securitySchemes).toHaveProperty('bearer');
    expect(documento.paths['/medicamentos']?.get?.tags).toEqual([
      'Medicamentos',
    ]);
  });
});
