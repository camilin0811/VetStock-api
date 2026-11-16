# AGENTS.md - VetStock API (Inventario y Farmacia Veterinaria)

API REST en NestJS para el inventario y la farmacia de una clinica veterinaria: registra medicamentos, vacunas e insumos por lote y fecha de vencimiento, descuenta stock al dispensar con formula del veterinario y genera alertas de stock bajo y productos por vencer.

## Git (obligatorio)

- ANTES de cualquier cambio: `git pull` sobre `develop` para evitar conflictos. Si hay cambios sin commitear, resolver o preguntar antes de continuar.
- Rama por defecto: `develop`. No trabajar directo sobre ella; crear `feature/<nombre>` desde `develop`.
- Reglas de ramas, commits y plantilla de PR: `.agents/workflow.md`. Todo PR lleva el banner de la cooperativa al inicio del cuerpo.

## Alcance actual (respetar)

- Arquitectura por capas: Controller (solo HTTP y mapeo request/response), Service (toda la logica), DTOs, entidades TypeORM en `src/<recurso>/entities/`.
- Persistencia en PostgreSQL con TypeORM. Los repositorios se inyectan en los Services; no hay datos mock en memoria. Relaciones TypeORM explicitas (ver Relaciones). Configuracion de BD por variables de entorno (`.env`, ver `.env.example`) y `docker compose up -d`.
- IDs numericos en la BD y en las rutas; los controllers los validan con `ParseIntPipe`.
- Nombres de clases, DTOs y rutas en espanol. No renombrar.
- Simplicidad: seguir el estilo de `IvonneBarco/book-nestjs-5b` (DTOs con class-validator, excepciones de Nest con mensajes en espanol). Respuestas: crear/actualizar `{ message, data }`, listas `{ message, data, count }`, eliminar `{ message }`, GET por id devuelve la entidad.
- Excepciones: lanzarlas en los Services con las clases de Nest (`NotFoundException`, `ConflictException`, `BadRequestException`, `UnauthorizedException`) y mensajes en espanol. Los controllers no validan a mano: el `ValidationPipe` global responde 400.

## Estructura (capas)

- Una carpeta por recurso en `src/`: `auth/`, `categorias/`, `medicamentos/`, `proveedores/`, `inventario/`, `dispensaciones/`, `reportes/`.
- Archivos por recurso: `<recurso>.module.ts` (uno por carpeta, con `TypeOrmModule.forFeature([...])`, controllers, providers y `exports` de los services que usan otros modulos), `<recurso>.controller.ts`, `<recurso>.service.ts`, `<singular>.dto.ts` (todas las clases Dto del recurso en ese unico archivo) y `entities/<singular>.entity.ts`.
- `src/app.module.ts` solo tiene `ConfigModule.forRoot({ isGlobal: true })`, `TypeOrmModule.forRootAsync` e `imports` de los modulos. Un modulo que necesita otro service lo importa (no re-registra el service); `forFeature` de una entidad ajena solo si basta el repositorio.
- `src/main.ts`: `ValidationPipe({ transform: true, whitelist: true })` global y CORS con origen `WEB_ORIGIN` (por defecto `http://localhost:5173`). Variables `PORT` y `WEB_ORIGIN` en `.env.example`.
- Helpers en `src/common/`: `fechas.ts`, `columnas.ts` (`TIPO_FECHA_HORA`: `timestamptz` en Postgres, `datetime` si `NODE_ENV=test` por sqlite) y `transformadores.ts` (`numeroDecimal` para columnas `decimal`).

## Relaciones y columnas

- `Lote` ManyToOne `Medicamento` (`medicamento_id`) y `Proveedor` (`proveedor_id`); `Dispensacion` ManyToOne `Medicamento` (`medicamento_id`). Inversos `@OneToMany` en `lotes`/`dispensaciones`. Se conservan las columnas `medicamentoId`/`proveedorId` junto a la relacion: el contrato sigue exponiendo esos ids.
- `Medicamento` ManyToMany `Categoria` con `@JoinTable` `medicamento_categorias` (`medicamento_id`, `categoria_id`); `Medicamento` es el dueno.
- En entidades, el tipo de las propiedades de relacion va con `Relation<T>` (evita referencias circulares en ESM).
- Para guardar relaciones desde un DTO: `{ ...dto, medicamento: { id: dto.medicamentoId } }`; `categoriaIds` se resuelve con `CategoriaService.obtenerPorIds` (404 si falta alguna).
- Columnas en snake_case con `name:` (`stock_minimo`, `numero_lote`, `created_at`, ...). `precio` y `total` son `decimal(12,2)` con transformer a `number`.
- DTOs de actualizacion: `Actualizar<X>Dto extends PartialType(<X>Dto)` de `@nestjs/mapped-types`.

| Controller | Endpoints | Service |
|---|---|---|
| AuthController | POST /auth/registro, POST /auth/login, POST /auth/refresh | AuthService |
| CategoriaController | GET /categorias, GET /categorias/{id}, POST /categorias, PUT /categorias/{id}, DELETE /categorias/{id} | CategoriaService |
| MedicamentoController | GET /medicamentos, GET /medicamentos/{id}, POST /medicamentos, PUT /medicamentos/{id} | MedicamentoService |
| ProveedorController | GET /proveedores, GET /proveedores/{id}, POST /proveedores | ProveedorService |
| InventarioController | POST /lotes, GET /lotes, GET /inventario/{medicamentoId}, GET /alertas | InventarioService + AlertaService |
| DispensacionController | POST /dispensaciones, GET /dispensaciones, GET /dispensaciones/{id} | DispensacionService |
| ReporteController | GET /reportes/consumo, GET /reportes/vencimientos | ReporteService |

DTOs clave:

- `CategoriaDto`: nombre (unico, 409 si se repite), descripcion opcional. `ActualizarCategoriaDto` es parcial.
- `MedicamentoDto`: nombre, presentacion, especie, precio, stockMinimo, requiereFormula, categoriaIds opcional (reemplaza las categorias; `[]` las quita). Las respuestas de medicamento incluyen `categorias`.
- `LoteRequestDto`: medicamentoId, proveedorId, numeroLote, cantidad, fechaVencimiento.
- `AlertaDto`: tipo (`STOCK_BAJO`, `POR_VENCER`, `VENCIDO`), medicamento + mensaje.
- `DispensacionRequestDto`: medicamentoId, cantidad, mascota, veterinario, formula. `DispensacionDto`: dispensacion + lotes usados. Siempre incluir los lotes usados.
- Regla FEFO: al dispensar se descuenta primero del lote que vence antes. Nunca dispensar de un lote vencido.

## Comandos

- Instalar: `npm install`
- BD: `cp .env.example .env` y `docker compose up -d`
- Dev: `npm run start:dev` (http://localhost:3000)
- Build: `npm run build`
- Lint: `npm run lint` (revisa `src/` y `test/`)
- Tests: `npm test` (solo `src/**/*.spec.ts`)
- Un solo test: `npm test -- auth`
- E2E: `npm run test:e2e`
- Nota tests: jest corre en modo ESM (`NODE_OPTIONS=--experimental-vm-modules` ya incluido en los scripts) porque Nest 12 (`@nestjs/common`) es ESM puro. No quitar `tsconfig.spec.json` ni el override de transforms en `jest.config.ts` y `test/jest-e2e.json`.
