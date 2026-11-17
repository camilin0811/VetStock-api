import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ExcepcionesFiltro } from './common/filtros/excepciones.filtro';

// Configuracion HTTP compartida por main.ts y las pruebas e2e, para que
// las pruebas ejerciten exactamente los mismos pipes y filtros que produccion
export function configurarApp(app: INestApplication) {
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new ExcepcionesFiltro());
}
