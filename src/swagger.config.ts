import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Documentacion OpenAPI en /docs. Los esquemas de los DTOs los genera el
// plugin de @nestjs/swagger (nest-cli.json) a partir de las clases y sus comentarios.
export function configurarSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('VetStock API')
    .setDescription(
      'Inventario y farmacia veterinaria: medicamentos, lotes (FEFO), kardex, dispensaciones y reportes.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documento = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documento, {
    swaggerOptions: { persistAuthorization: true },
  });
}
