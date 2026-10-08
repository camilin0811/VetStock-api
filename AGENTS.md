# AGENTS.md - VetStock API (Inventario y Farmacia Veterinaria)

API REST en NestJS para el inventario y la farmacia de una clinica veterinaria: registra medicamentos, vacunas e insumos por lote y fecha de vencimiento, descuenta stock al dispensar con formula del veterinario y genera alertas de stock bajo y productos por vencer.

## Git (obligatorio)

- ANTES de cualquier cambio: `git pull` sobre `develop` para evitar conflictos. Si hay cambios sin commitear, resolver o preguntar antes de continuar.
- Rama por defecto: `develop`. No trabajar directo sobre ella; crear `feature/<nombre>` desde `develop`.
- Reglas de ramas, commits y plantilla de PR: `.agents/workflow.md`. Todo PR lleva el banner de la cooperativa al inicio del cuerpo.

## Alcance actual (respetar)

- Arquitectura por capas: Controller (solo HTTP y mapeo request/response), Service (toda la logica), DTOs.
- Datos en memoria (mock) dentro de cada Service. Los lotes viven en `InventarioService`; dispensaciones, alertas y reportes lo reutilizan por inyeccion. NO implementar todavia: base de datos, ORM (TypeORM/Prisma), repositorios, migraciones, JWT/BCrypt real. Agregarlos solo si se pide.
- Nombres de clases, DTOs y rutas en espanol. No renombrar.
- Simplicidad: seguir el estilo de `IvonneBarco/book-nestjs-5b` (DTOs con class-validator, excepciones de Nest con mensajes en espanol, respuestas `{ message, data }` o `{ msg }`).
- Excepciones: lanzarlas en los Services con las clases de Nest (`NotFoundException`, `ConflictException`, `BadRequestException`, `UnauthorizedException`) y mensajes en espanol. Los controllers no validan a mano: el `ValidationPipe` global responde 400.

## Estructura (capas)

- Una carpeta por recurso en `src/`: `auth/`, `medicamentos/`, `proveedores/`, `inventario/`, `dispensaciones/`, `reportes/`.
- Archivos por recurso: `<recurso>.controller.ts`, `<recurso>.service.ts`, `<singular>.dto.ts` (todas las clases Dto del recurso en ese unico archivo).
- Sin archivo `<recurso>.module.ts`: registrar controllers y providers directo en `src/app.module.ts` (como la profe).
- `src/main.ts` usa `ValidationPipe` global.

| Controller | Endpoints | Service |
|---|---|---|
| AuthController | POST /auth/registro, POST /auth/login, POST /auth/refresh | AuthService |
| MedicamentoController | GET /medicamentos, GET /medicamentos/{id}, POST /medicamentos, PUT /medicamentos/{id} | MedicamentoService |
| ProveedorController | GET /proveedores, GET /proveedores/{id}, POST /proveedores | ProveedorService |
| InventarioController | POST /lotes, GET /lotes, GET /inventario/{medicamentoId}, GET /alertas | InventarioService + AlertaService |
| DispensacionController | POST /dispensaciones, GET /dispensaciones, GET /dispensaciones/{id} | DispensacionService |
| ReporteController | GET /reportes/consumo, GET /reportes/vencimientos | ReporteService |

DTOs clave:

- `MedicamentoDto`: nombre, presentacion, especie, precio, stockMinimo, requiereFormula.
- `LoteRequestDto`: medicamentoId, proveedorId, numeroLote, cantidad, fechaVencimiento.
- `AlertaDto`: tipo (`STOCK_BAJO`, `POR_VENCER`, `VENCIDO`), medicamento + mensaje.
- `DispensacionRequestDto`: medicamentoId, cantidad, mascota, veterinario, formula. `DispensacionDto`: dispensacion + lotes usados. Siempre incluir los lotes usados.
- Regla FEFO: al dispensar se descuenta primero del lote que vence antes. Nunca dispensar de un lote vencido.

## Comandos

- Instalar: `npm install`
- Dev: `npm run start:dev` (http://localhost:3000)
- Build: `npm run build`
- Lint: `npm run lint` (revisa `src/` y `test/`)
- Tests: `npm test` (solo `src/**/*.spec.ts`)
- Un solo test: `npm test -- auth`
- E2E: `npm run test:e2e`
- Nota tests: jest corre en modo ESM (`NODE_OPTIONS=--experimental-vm-modules` ya incluido en los scripts) porque Nest 12 (`@nestjs/common`) es ESM puro. No quitar `tsconfig.spec.json` ni el override de transforms en `jest.config.ts` y `test/jest-e2e.json`.
