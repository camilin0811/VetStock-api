# VetStock

Sistema de inventario y farmacia para una clínica veterinaria. Registra medicamentos, vacunas e insumos por lote y fecha de vencimiento, descuenta el stock al dispensar (regla FEFO: primero el lote que vence antes), lleva el kardex de cada movimiento y genera alertas de stock bajo, productos por vencer y vencidos.

El repositorio contiene dos piezas:

- **API REST** (raíz del repo): NestJS 12, TypeORM y PostgreSQL 15, con autenticación JWT.
- **Frontend** (carpeta `web/`): React 19, Vite 8, TypeScript, React Router, TanStack Query, GSAP y Three.js (react-three-fiber).

## Stack

| Capa | Tecnologías |
| --- | --- |
| API | NestJS 12, TypeORM 1, PostgreSQL 15, `@nestjs/jwt`, bcrypt, class-validator |
| Frontend | React 19, Vite 8, TypeScript, React Router 7, TanStack Query, GSAP, Three.js |
| Infraestructura | Docker Compose (PostgreSQL, pgAdmin y, opcionalmente, la API) |

## Arquitectura

Cada recurso vive en su carpeta dentro de `src/` y sigue la misma estructura: controller (solo HTTP), service (toda la lógica), DTOs con validación y entidades TypeORM.

| Módulo | Carpeta | Responsabilidad |
| --- | --- | --- |
| auth | `src/auth/` | Registro, login, renovación de tokens y perfil. Registra los guards globales de JWT y roles |
| usuarios | `src/usuarios/` | Administración de usuarios (solo admin) |
| categorias | `src/categorias/` | Categorías de medicamentos |
| medicamentos | `src/medicamentos/` | Catálogo de medicamentos, con relación muchos a muchos con categorías |
| proveedores | `src/proveedores/` | Proveedores de los lotes |
| inventario | `src/inventario/` | Lotes, stock por medicamento, alertas, ajustes y movimientos (kardex) |
| dispensaciones | `src/dispensaciones/` | Dispensación con regla FEFO y anulación con devolución de stock |
| reportes | `src/reportes/` | Consumo, vencimientos, stock, proveedores y resumen |
| seed | `src/seed/` | Datos demo; borra y recrea la base |

Reglas generales:

- Todas las rutas exigen un token Bearer, salvo las marcadas con `@Publico()` (registro, login y refresh).
- Los roles se controlan con `@Roles()`. Sin ese decorador, cualquier usuario autenticado puede llamar la ruta.
- `ValidationPipe` global con `whitelist` y `transform`: los datos que no están en el DTO se descartan y los inválidos responden 400.
- `synchronize: true`: las tablas se crean solas al arrancar. No hay migraciones (es un atajo válido para el curso, pero no para producción).

## Requisitos

- **Node.js 24 LTS** para la API y las pruebas. El frontend requiere Node 20 o superior.
- **npm** (viene con Node).
- **Docker** con Compose v2: Docker Desktop en Windows y macOS, o Docker Engine con el plugin `docker compose` en Linux.
- **Git**.

## Inicio rápido

### 1. Base de datos y API

```bash
git clone <url-del-repositorio> VetStock-api
cd VetStock-api
cp .env.example .env
docker compose up -d        # PostgreSQL 15 en localhost:5432
npm install
npm run seed                # crea las tablas y carga los datos demo
npm run start:dev           # API en http://localhost:3000
```

### 2. Frontend (en una segunda terminal)

```bash
cd web
cp .env.example .env        # VITE_API_URL=http://localhost:3000
npm install
npm run dev                 # http://localhost:5173
```

Abre <http://localhost:5173> e inicia sesión con uno de los usuarios demo.

## Usuarios demo

Los crea `npm run seed`. Todos comparten la misma clave.

| Correo | Clave | Rol |
| --- | --- | --- |
| admin@vetstock.com | VetStock123* | admin |
| vet@vetstock.com | VetStock123* | veterinario |
| farmacia@vetstock.com | VetStock123* | farmaceutico |

> `npm run seed` **borra todos los datos** antes de recrearlos.

## Puertos

| Puerto | Servicio | Dónde se configura |
| --- | --- | --- |
| 3000 | API NestJS | `PORT` en `.env` |
| 5173 | Frontend (Vite) | Vite (`npm run dev`) |
| 5432 | PostgreSQL | `POSTGRES_PORT` en `.env` |
| 5050 | pgAdmin (perfil `pgadmin` o `full`) | `docker-compose.yml` |

## Todo en Docker

Alternativa para levantar la base, pgAdmin y la API en contenedores. Requiere que exista `.env`, porque el servicio `api` lo usa como `env_file`.

```bash
docker compose --profile full up -d --build
docker compose --profile full exec -e SEED_FORCE=true api node dist/seed/seed.js
```

La imagen de la API corre con `NODE_ENV=production`, y el seed se niega a borrar datos en ese modo sin `SEED_FORCE=true`. El comando anterior lo activa de forma explícita. El frontend sigue corriendo en local (`cd web && npm run dev`) y apunta a `http://localhost:3000`.

## pgAdmin

Levántalo con el perfil `pgadmin` (o `full`):

```bash
docker compose --profile pgadmin up -d
```

Abre <http://localhost:5050> e inicia sesión con `admin@vetstock.com` / `admin` (valores por defecto de `PGADMIN_DEFAULT_EMAIL` y `PGADMIN_DEFAULT_PASSWORD`). Después registra el servidor manualmente:

| Campo | Valor |
| --- | --- |
| Host | `postgres` |
| Port | `5432` |
| Database | `vetstock_db` |
| Username | `vetstock_user` |
| Password | `vetstock_password` |

> El host es `postgres` (nombre del servicio dentro de la red de Docker), no `localhost`. El puerto es `5432` aunque hayas publicado PostgreSQL en otro puerto del host con `POSTGRES_PORT`.

## Endpoints

Todas las rutas van con `Authorization: Bearer <accessToken>` salvo las públicas. Los roles son `admin`, `veterinario` y `farmaceutico`. "Autenticado" significa cualquier rol.

Las respuestas de creación y actualización son `{ message, data }`, las listas `{ message, data, count }` (salvo las de reportes) y las eliminaciones `{ message }`.

### Auth

| Método | Ruta | Acceso | Notas |
| --- | --- | --- | --- |
| POST | `/auth/registro` | Público | Body: `nombre`, `correo`, `clave`, `rol` (opcional). Por defecto `farmaceutico`. Asignar `admin` requiere un admin autenticado, salvo que sea el primer usuario del sistema |
| POST | `/auth/login` | Público | Body: `correo`, `clave`. Devuelve `accessToken` y `refreshToken` |
| POST | `/auth/refresh` | Público | Body: `refreshToken`. Devuelve un nuevo par de tokens |
| GET | `/auth/perfil` | Autenticado | Datos del usuario del token |

### Usuarios

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/usuarios` | Admin |
| GET | `/usuarios/:id` | Admin |
| PUT | `/usuarios/:id` | Admin |
| DELETE | `/usuarios/:id` | Admin |

Los usuarios se crean con `POST /auth/registro`.

### Categorías

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/categorias` | Autenticado |
| GET | `/categorias/:id` | Autenticado |
| POST | `/categorias` | Admin, farmaceutico |
| PUT | `/categorias/:id` | Admin, farmaceutico |
| DELETE | `/categorias/:id` | Admin, farmaceutico |

### Medicamentos

| Método | Ruta | Acceso | Notas |
| --- | --- | --- | --- |
| GET | `/medicamentos` | Autenticado | Filtros: `q`, `especie`, `categoriaId` |
| GET | `/medicamentos/:id` | Autenticado | Incluye sus `categorias` |
| POST | `/medicamentos` | Admin, farmaceutico | `categoriaIds` opcional |
| PUT | `/medicamentos/:id` | Admin, farmaceutico | `categoriaIds: []` quita las categorías |
| DELETE | `/medicamentos/:id` | Admin, farmaceutico | |

### Proveedores

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/proveedores` | Autenticado |
| GET | `/proveedores/:id` | Autenticado |
| POST | `/proveedores` | Admin, farmaceutico |
| PUT | `/proveedores/:id` | Admin, farmaceutico |
| DELETE | `/proveedores/:id` | Admin, farmaceutico |

### Inventario, lotes, alertas y movimientos

Estas rutas no tienen restricción de rol adicional: cualquier usuario autenticado puede usarlas.

| Método | Ruta | Acceso | Notas |
| --- | --- | --- | --- |
| POST | `/lotes` | Autenticado | Body: `medicamentoId`, `proveedorId`, `numeroLote`, `cantidad`, `fechaVencimiento` |
| GET | `/lotes` | Autenticado | Filtro: `medicamentoId` |
| PUT | `/lotes/:id` | Autenticado | Corrige datos del lote; no cambia cantidades |
| POST | `/lotes/:id/ajustes` | Autenticado | Body: `cantidad`, `motivo` (`PERDIDA`, `DANO`, `VENCIDO`, `OTRO`), `observacion` opcional. Genera un movimiento `AJUSTE` |
| GET | `/inventario` | Autenticado | Stock de todos los medicamentos |
| GET | `/inventario/:medicamentoId` | Autenticado | Stock de un medicamento |
| GET | `/alertas` | Autenticado | Filtros: `tipo` (`STOCK_BAJO`, `POR_VENCER`, `VENCIDO`) y `dias` (ventana para `POR_VENCER`, 30 por defecto) |
| GET | `/movimientos` | Autenticado | Kardex. Filtros: `medicamentoId`, `tipo` (`ENTRADA`, `SALIDA`, `AJUSTE`, `ANULACION`) |

### Dispensaciones

| Método | Ruta | Acceso | Notas |
| --- | --- | --- | --- |
| POST | `/dispensaciones` | Autenticado | Body: `medicamentoId`, `cantidad`, `mascota`, `veterinario`, `formula`. Descuenta por FEFO y devuelve los lotes usados |
| GET | `/dispensaciones` | Autenticado | Filtros: `desde`, `hasta`, `medicamentoId`, `mascota` |
| GET | `/dispensaciones/:id` | Autenticado | Incluye los lotes usados |
| POST | `/dispensaciones/:id/anular` | Admin, farmaceutico | Body: `motivo`. Devuelve el stock a sus lotes |

### Reportes

Todos requieren autenticación y no tienen restricción de rol.

| Método | Ruta | Filtros |
| --- | --- | --- |
| GET | `/reportes/consumo` | `desde`, `hasta` |
| GET | `/reportes/vencimientos` | |
| GET | `/reportes/stock` | |
| GET | `/reportes/proveedores` | `desde`, `hasta` |
| GET | `/reportes/resumen` | |

## Scripts

### Raíz (API)

| Comando | Descripción |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm run start:dev` | API en modo watch, en http://localhost:3000 |
| `npm run start:prod` | Ejecuta `dist/main` (requiere `npm run build`) |
| `npm run build` | Compila a `dist/` |
| `npm run seed` | Compila y ejecuta el seed (borra y recrea los datos demo) |
| `npm run lint` | oxlint sobre `src/` y `test/` |
| `npm test` | Pruebas unitarias (`src/**/*.spec.ts`) |
| `npm run test:e2e` | Pruebas end-to-end |

### `web/` (frontend)

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Chequeo de tipos y build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | oxlint |

## Solución de problemas

| Síntoma | Causa y solución |
| --- | --- |
| `Bind for 0.0.0.0:5432 failed: port is already allocated` | Otro PostgreSQL usa el 5432. Agrega `POSTGRES_PORT=55432` al `.env` y ejecuta `docker compose up -d`. La API local toma el mismo valor |
| `EADDRINUSE: address already in use :::3000` | El puerto 3000 está ocupado. Cambia `PORT` en `.env` y actualiza `VITE_API_URL` en `web/.env` |
| `ECONNREFUSED` al arrancar la API o el seed | PostgreSQL todavía no está listo. Espera unos segundos (`docker compose ps` debe mostrar `healthy` o `Up`) y reintenta |
| 401 `Token invalido o expirado` después de unos minutos | El access token dura 15 minutos (`JWT_EXPIRES_IN`). El frontend lo renueva solo; desde la API llama a `POST /auth/refresh` con el `refreshToken`. Si también expiró (7 días, `JWT_REFRESH_EXPIRES_IN`), inicia sesión de nuevo |
| 403 `No tienes permisos para realizar esta accion` | El rol del usuario no permite la ruta. Revisa la tabla de endpoints |
| Error de CORS en el navegador | `WEB_ORIGIN` no coincide con la URL del frontend. Si Vite usó otro puerto (por ejemplo 5174 porque 5173 estaba ocupado), cambia `WEB_ORIGIN` en `.env` y reinicia la API |
| El seed responde `El seed borra todos los datos. Con NODE_ENV=production se exige SEED_FORCE=true` | Estás en modo producción. Usa `SEED_FORCE=true` solo si de verdad quieres borrar los datos |
| `docker compose --profile full up` falla por `.env` | El servicio `api` usa `env_file: .env`. Crea el archivo con `cp .env.example .env` |
| Cambios en `web/.env` no se aplican | Vite lee las variables al arrancar. Reinicia `npm run dev` |
| Problemas específicos de Windows (PowerShell, Docker Desktop, `better-sqlite3`) | Consulta la guía [docker-ins.md](docker-ins.md) |

## Seguridad

Antes de compartir el entorno, cambia `JWT_SECRET` y `JWT_REFRESH_SECRET` en `.env` (por ejemplo con `openssl rand -hex 32`) y las credenciales de PostgreSQL y pgAdmin. Los valores de `.env.example` son solo para desarrollo local.

## Documentación adicional

- [AGENTS.md](AGENTS.md): reglas de arquitectura, convenciones y comandos para desarrolladores y agentes.
- [docker-ins.md](docker-ins.md): guía paso a paso para Windows.
- [web/README.md](web/README.md): detalles del frontend.
