# AGENTS.md - VetStock (Inventario y Farmacia Veterinaria)

API REST en NestJS para el inventario y la farmacia de una clinica veterinaria: registra medicamentos, vacunas e insumos por lote y fecha de vencimiento, descuenta stock al dispensar con formula del veterinario, lleva el kardex (Movimiento) de cada cambio de stock y genera alertas de stock bajo y productos por vencer. Incluye un frontend React en `web/`.

## Git (obligatorio)

- ANTES de cualquier cambio: `git pull` sobre `develop` para evitar conflictos. Si hay cambios sin commitear, resolver o preguntar antes de continuar.
- Rama por defecto: `develop`. No trabajar directo sobre ella; crear `feature/<nombre>` desde `develop`.
- Reglas de ramas, commits y plantilla de PR: `.agents/workflow.md`. Todo PR lleva el banner de la cooperativa al inicio del cuerpo.

## Alcance actual (respetar)

- Arquitectura por capas: Controller (solo HTTP y mapeo request/response), Service (toda la logica), DTOs, entidades TypeORM en `src/<recurso>/entities/`.
- Persistencia en PostgreSQL con TypeORM. Los repositorios se inyectan en los Services; no hay datos mock en memoria. Relaciones TypeORM explicitas (ver Relaciones). Configuracion de BD por variables de entorno (`.env`, ver `.env.example`) y `docker compose up -d`.
- IDs numericos en la BD y en las rutas; los controllers los validan con `ParseIntPipe`.
- Nombres de clases, DTOs y rutas en espanol. No renombrar.
- Simplicidad: seguir el estilo de `IvonneBarco/book-nestjs-5b` (DTOs con class-validator, excepciones de Nest con mensajes en espanol). Respuestas: crear/actualizar `{ message, data }`, listas `{ message, data, count }`, eliminar `{ message }`, GET por id devuelve la entidad. Los reportes devuelven `{ message, data }`.
- Excepciones: lanzarlas en los Services con las clases de Nest (`NotFoundException`, `ConflictException`, `BadRequestException`, `UnauthorizedException`, `ForbiddenException`) y mensajes en espanol. Los controllers no validan a mano: el `ValidationPipe` global responde 400.

## Estructura (capas)

- Una carpeta por recurso en `src/`: `auth/`, `usuarios/`, `categorias/`, `medicamentos/`, `proveedores/`, `inventario/`, `dispensaciones/`, `reportes/`. Ademas `seed/` (datos demo, ver Seed).
- Archivos por recurso: `<recurso>.module.ts` (uno por carpeta, con `TypeOrmModule.forFeature([...])`, controllers, providers y `exports` de los services que usan otros modulos), `<recurso>.controller.ts`, `<recurso>.service.ts`, `<singular>.dto.ts` (todas las clases Dto del recurso en ese unico archivo) y `entities/<singular>.entity.ts`.
- `src/app.module.ts` solo tiene `ConfigModule.forRoot({ isGlobal: true })`, `TypeOrmModule.forRootAsync` (con `autoLoadEntities` y `synchronize: true`) e `imports` de los modulos. Un modulo que necesita otro service lo importa (no re-registra el service); `forFeature` de una entidad ajena solo si basta el repositorio.
- `src/main.ts`: `ValidationPipe({ transform: true, whitelist: true })` global y CORS con origen `WEB_ORIGIN` (por defecto `http://localhost:5173`). Variables `PORT` y `WEB_ORIGIN` en `.env.example`.
- Helpers en `src/common/`: `fechas.ts`, `columnas.ts` (`TIPO_FECHA_HORA`: `timestamptz` en Postgres, `datetime` si `NODE_ENV=test` por sqlite) y `transformadores.ts` (`numeroDecimal` para columnas `decimal`).
- `src/env.model.ts`: interfaz `Env` con las variables tipadas que usa `ConfigService` (incluye `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `TZ_CLINICA` opcional).
- `src/common/fechas.ts`: `hoy()`, `diasDesdeHoy()` y `diasHasta()` calculan el dia en la zona de la clinica (`TZ_CLINICA`, por defecto `America/Bogota`) con `Intl.DateTimeFormat('en-CA')`, no en UTC. Aceptan un `ahora` opcional para tests deterministas; no pasarlos directo a `.map()`.

## Auth, guards y roles

- Roles (`src/auth/rol.enum.ts`): `admin`, `veterinario`, `farmaceutico`.
- Dos guards globales se registran como `APP_GUARD` en `AuthModule`; basta con importar el modulo en `AppModule`:
  - `AuthGuard`: exige Bearer token (JWT firmado con `JWT_SECRET`) y carga `usuario` en la request. Consulta el usuario en cada llamada, asi que un usuario borrado o un cambio de rol aplican de inmediato.
  - `RolesGuard`: corre despues. Sin `@Roles()` deja pasar a cualquier autenticado; con `@Roles(...)` exige que el rol del usuario este en la lista, si no responde 403.
- `@Publico()` marca una ruta (o controller) sin token. Si llega un token valido igual se carga `usuario` (lo usa el registro para saber si quien llama es admin).
- `@Roles(...)` restringe una ruta o controller (ej. `UsuarioController` completo es solo admin).
- `@UsuarioActual()` inyecta el usuario autenticado en el controller (para auditoria: dispensaciones, ajustes, movimientos).
- Login y refresh: `POST /auth/login` y `POST /auth/refresh` devuelven `{ message, data: { accessToken, refreshToken, usuario } }`. El access token dura `JWT_EXPIRES_IN` (15m) y el refresh `JWT_REFRESH_EXPIRES_IN` (7d). Las claves se guardan con bcrypt.
- Alta de usuarios: `POST /usuarios` (solo admin, `{ nombre, correo, clave, rol }`, devuelve `{ message, data }` sin la clave). El frontend usa esta ruta.
- Registro: `POST /auth/registro` asigna `farmaceutico` por defecto. Asignar `admin` requiere un admin autenticado, salvo que el sistema no tenga usuarios todavia.

## Relaciones y columnas

- `Lote` ManyToOne `Medicamento` (`medicamento_id`) y `Proveedor` (`proveedor_id`); `Dispensacion` ManyToOne `Medicamento` (`medicamento_id`). Inversos `@OneToMany` en `lotes`/`dispensaciones`. Se conservan las columnas `medicamentoId`/`proveedorId` junto a la relacion: el contrato sigue exponiendo esos ids.
- `Movimiento` (kardex, `src/inventario/entities/movimiento.entity.ts`) ManyToOne `Lote`, `Medicamento` y `Usuario` (quien hizo el cambio), mas `tipo`, `cantidad` y `detalle`.
- `Medicamento` ManyToMany `Categoria` con `@JoinTable` `medicamento_categorias` (`medicamento_id`, `categoria_id`); `Medicamento` es el dueno.
- En entidades, el tipo de las propiedades de relacion va con `Relation<T>` (evita referencias circulares en ESM).
- Para guardar relaciones desde un DTO: `{ ...dto, medicamento: { id: dto.medicamentoId } }`; `categoriaIds` se resuelve con `CategoriaService.obtenerPorIds` (404 si falta alguna).
- Columnas en snake_case con `name:` (`stock_minimo`, `numero_lote`, `created_at`, ...). `precio` y `total` son `decimal(12,2)` con transformer a `number`.
- DTOs de actualizacion: `Actualizar<X>Dto extends PartialType(<X>Dto)` de `@nestjs/mapped-types`.

## Endpoints

Todas las rutas exigen Bearer token salvo las `Publico`. "Autenticado" = cualquier rol. Los roles con permiso de escritura en catalogos son `admin` y `farmaceutico`.

| Controller | Ruta | Acceso | Service |
|---|---|---|---|
| AuthController | POST /auth/registro | Publico | AuthService |
| AuthController | POST /auth/login | Publico | AuthService |
| AuthController | POST /auth/refresh | Publico | AuthService |
| AuthController | GET /auth/perfil | Autenticado | AuthService |
| UsuarioController | POST /usuarios (alta por admin, 409 si el correo existe), GET /usuarios, GET /usuarios/{id}, PUT /usuarios/{id}, DELETE /usuarios/{id} | Admin | UsuarioService |
| CategoriaController | GET /categorias, GET /categorias/{id} | Autenticado | CategoriaService |
| CategoriaController | POST /categorias, PUT /categorias/{id}, DELETE /categorias/{id} | Admin, farmaceutico | CategoriaService |
| MedicamentoController | GET /medicamentos (?q, ?especie, ?categoriaId), GET /medicamentos/{id} | Autenticado | MedicamentoService |
| MedicamentoController | POST /medicamentos, PUT /medicamentos/{id}, DELETE /medicamentos/{id} | Admin, farmaceutico | MedicamentoService |
| ProveedorController | GET /proveedores, GET /proveedores/{id} | Autenticado | ProveedorService |
| ProveedorController | POST /proveedores, PUT /proveedores/{id}, DELETE /proveedores/{id} | Admin, farmaceutico | ProveedorService |
| InventarioController | GET /lotes (?medicamentoId) | Autenticado | InventarioService |
| InventarioController | POST /lotes, PUT /lotes/{id}, POST /lotes/{id}/ajustes | Admin, farmaceutico | InventarioService |
| InventarioController | GET /inventario, GET /inventario/{medicamentoId} | Autenticado | InventarioService |
| InventarioController | GET /alertas (?tipo, ?dias) | Autenticado | AlertaService |
| InventarioController | GET /movimientos (?medicamentoId, ?tipo) | Autenticado | MovimientoService |
| DispensacionController | POST /dispensaciones, GET /dispensaciones (?desde, ?hasta, ?medicamentoId, ?mascota), GET /dispensaciones/{id} | Autenticado | DispensacionService |
| DispensacionController | POST /dispensaciones/{id}/anular | Admin, farmaceutico | DispensacionService |
| ReporteController | GET /reportes/consumo, GET /reportes/vencimientos, GET /reportes/stock, GET /reportes/proveedores, GET /reportes/resumen | Autenticado | ReporteService |

Nota: las lecturas de inventario, dispensaciones y reportes no tienen restriccion de rol adicional; la escritura de lotes y ajustes lleva `@Roles(Rol.Admin, Rol.Farmaceutico)` en el controller (no en el service). `GET /dispensaciones` ordena de la mas reciente a la mas antigua y `GET /reportes/proveedores` usa los ultimos 30 dias si faltan `desde` y `hasta` (igual que consumo).

DTOs clave:

- `CategoriaDto`: nombre (unico, 409 si se repite), descripcion opcional. `ActualizarCategoriaDto` es parcial.
- `MedicamentoDto`: nombre, presentacion, especie (`canino`, `felino`, `equino`, `bovino`, `general`), precio, stockMinimo, requiereFormula, categoriaIds opcional (reemplaza las categorias; `[]` las quita). Las respuestas de medicamento incluyen `categorias`.
- `LoteRequestDto`: medicamentoId, proveedorId, numeroLote, cantidad, fechaVencimiento. `ActualizarLoteDto` corrige datos del lote y no cambia cantidades.
- `AjusteDto`: cantidad, motivo (`PERDIDA`, `DANO`, `VENCIDO`, `OTRO`), observacion opcional. Genera un `Movimiento` de tipo `AJUSTE`.
- `AlertaQueryDto`: tipo opcional y dias (ventana para `POR_VENCER`, 30 por defecto, maximo 3650). `AlertaDto`: tipo (`STOCK_BAJO`, `POR_VENCER`, `VENCIDO`), medicamento + mensaje.
- `MovimientoQueryDto`: medicamentoId y tipo (`ENTRADA`, `SALIDA`, `AJUSTE`, `ANULACION`).
- `DispensacionRequestDto`: medicamentoId, cantidad, mascota, veterinario, formula. `DispensacionDto`: dispensacion + lotes usados. Siempre incluir los lotes usados.
- `AnularDispensacionDto`: motivo (obligatorio). Anular devuelve el stock a sus lotes y deja movimientos `ANULACION`.
- `ActualizarUsuarioDto` (nombre, correo, rol), solo para admin. No hay POST: los usuarios se crean con `/auth/registro`.
- Regla FEFO: al dispensar se descuenta primero del lote que vence antes. Nunca dispensar de un lote vencido.

## Kardex (Movimiento)

- Cada cambio de stock de un lote deja un `Movimiento`: `ENTRADA` (registro de lote), `SALIDA` (dispensacion, una por lote usado), `AJUSTE` (ajuste manual) y `ANULACION` (devolucion al anular una dispensacion).
- `detalle` describe el origen del cambio; `usuario` es quien lo hizo cuando la request estaba autenticada.
- `GET /movimientos` es la vista del kardex. Filtros: `medicamentoId`, `tipo`.
- Todo cambio de stock debe ir dentro de una transaccion y con bloqueo pesimista sobre el lote (ver `ajustarLote` en `InventarioService`), y debe registrar su movimiento en la misma transaccion.

## Seed (datos demo)

- `src/seed/seed.ts` (con `datos.ts` y `seed.spec.ts`) borra todos los datos y recrea usuarios, categorias, proveedores, medicamentos, lotes, dispensaciones (con anulaciones) y movimientos del kardex. Es idempotente y usa semilla fija.
- Usuarios demo (clave `VetStock123*`): `admin@vetstock.com` (admin), `vet@vetstock.com` (veterinario), `farmacia@vetstock.com` (farmaceutico).
- Con `NODE_ENV=production` el seed se niega, salvo que se pase `SEED_FORCE=true`.
- Dentro del contenedor de la API (imagen de produccion, sin `@nestjs/cli`): `docker compose --profile full exec -e SEED_FORCE=true api node dist/seed/seed.js`.

## Estructura de datos de Postgres

- Tablas creadas con `synchronize: true`. No hay migraciones todavia; no usar `synchronize` en produccion (ver comentario en `app.module.ts`).

## Comandos

- Instalar: `npm install`
- BD: `cp .env.example .env` y `docker compose up -d` (solo PostgreSQL). Con pgAdmin: `docker compose --profile pgadmin up -d` (http://localhost:5050). Todo en contenedores: `docker compose --profile full up -d --build`.
- Puerto de PostgreSQL ocupado: definir `POSTGRES_PORT=55432` en `.env` y volver a ejecutar `docker compose up -d`.
- Datos demo: `npm run seed` (borra y recrea los datos).
- Dev: `npm run start:dev` (http://localhost:3000)
- Build: `npm run build`
- Lint: `npm run lint` (revisa `src/` y `test/`)
- Tests: `npm test` (solo `src/**/*.spec.ts`)
- Un solo test: `npm test -- auth`
- E2E: `npm run test:e2e`
- Nota tests: jest corre en modo ESM (`NODE_OPTIONS=--experimental-vm-modules` ya incluido en los scripts) porque Nest 12 (`@nestjs/common`) es ESM puro. No quitar `tsconfig.spec.json` ni el override de transforms en `jest.config.ts` y `test/jest-e2e.json`.

## Frontend (`web/`)

- React 19 + Vite 8 + TypeScript, React Router, TanStack Query, GSAP y Three.js (react-three-fiber). Es un proyecto independiente con su propio `package.json`.
- Configuracion: `web/.env` con `VITE_API_URL` (por defecto `http://localhost:3000`); ver `web/.env.example`.
- Comandos (dentro de `web/`): `npm install`, `npm run dev` (http://localhost:5173), `npm run build` (tsc + build de produccion), `npm run lint` (oxlint), `npm run preview`.
- Auth en el frontend: access token en memoria, refresh token en `localStorage`. Ante un 401 intenta renovar una vez y, si falla, vuelve a `/login`.
- Para que el frontend funcione, `WEB_ORIGIN` de la API debe ser el origen de Vite (por defecto `http://localhost:5173`).
- Documentacion del frontend: `web/README.md`. Documentacion general: `README.md` (raiz) y `docker-ins.md` (Windows).
