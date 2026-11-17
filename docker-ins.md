# Levantar VetStock en Windows

Guía corta para dejar corriendo en un PC con Windows la base de datos, la API de NestJS y el frontend, con datos demo, autenticación y verificación incluidas.

> **Resumen de la arquitectura:** `docker compose` levanta **PostgreSQL 15** (y, si lo pides, pgAdmin). La API y el frontend corren con Node directamente en Windows: la API en el puerto **3000** y el frontend en el **5173**. El `Dockerfile` existe para quien quiera correr también la API en contenedor (ver la sección 11), pero no es necesario para el flujo normal.

## Resumen express

Si ya tienes Node, Git y Docker Desktop instalados, es esta secuencia (una terminal para la API y otra para el frontend):

```powershell
git clone <url-del-repositorio> VetStock-api
cd VetStock-api
Copy-Item .env.example .env
docker compose up -d
npm install
npm run seed
npm run start:dev
```

En una segunda terminal:

```powershell
cd VetStock-api\web
Copy-Item .env.example .env
npm install
npm run dev
```

Al final: API en <http://localhost:3000>, frontend en <http://localhost:5173> y PostgreSQL en `localhost:5432` (o el puerto que definas en `POSTGRES_PORT`).

## 1. Requisitos

| Herramienta | Versión recomendada | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org/) | 24 LTS | Correr la API y las pruebas. El frontend necesita 20 o superior |
| npm | Viene con Node | Instalar dependencias |
| [Git](https://git-scm.com/download/win) | Última | Clonar el repo |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Última | Levantar PostgreSQL y pgAdmin |

Verifica que todo quedó instalado (PowerShell o Git Bash):

```powershell
node -v      # v24.x.x
npm -v       # 11.x.x
git -v
docker -v
docker compose version
```

### Configurar Docker Desktop

1. Instala Docker Desktop y ábrelo.
2. En **Settings → General** deja activo **Use the WSL 2 based engine** (Windows 10/11 con WSL2 instalado).
3. Aplica y reinicia Docker Desktop.
4. Esquina inferior izquierda debe decir **Engine running** (ballena verde).

Prueba rápida de Docker:

```powershell
docker run --rm hello-world
```

Si eso imprime `Hello from Docker!`, ya puedes seguir.

## 2. Clonar el repositorio

```powershell
git clone <url-del-repositorio> VetStock-api
cd VetStock-api
git checkout develop
git pull
```

La rama de trabajo es **`develop`**.

## 3. Crear el archivo `.env`

El proyecto lee la configuración de un `.env` en la raíz. Este archivo no se sube a GitHub, por eso hay que crearlo.

**PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Git Bash / CMD:**

```bash
cp .env.example .env
```

Contenido de `.env.example` (los valores por defecto sirven para desarrollo local):

```env
PORT=3000
WEB_ORIGIN=http://localhost:5173
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=vetstock_db
POSTGRES_USER=vetstock_user
POSTGRES_PASSWORD=vetstock_password
# Cambiar los secretos en cualquier entorno compartido (ej. openssl rand -hex 32)
JWT_SECRET=cambia-este-secreto-de-acceso
JWT_REFRESH_SECRET=cambia-este-secreto-de-refresh
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
# Zona horaria de la clinica (define el cambio de dia en fechas); por defecto America/Bogota
TZ_CLINICA=America/Bogota

# Solo para el servicio pgadmin de docker compose (http://localhost:5050)
PGADMIN_DEFAULT_EMAIL=admin@vetstock.com
PGADMIN_DEFAULT_PASSWORD=admin
```

| Variable | Valor por defecto | Nota |
|---|---|---|
| `PORT` | `3000` | Puerto de la API |
| `WEB_ORIGIN` | `http://localhost:5173` | Origen permitido por CORS. Debe coincidir con la URL del frontend |
| `POSTGRES_HOST` | `localhost` | La API corre en Windows, la BD en Docker |
| `POSTGRES_PORT` | `5432` | Puerto del host donde se publica PostgreSQL (ver sección 7) |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | `vetstock_db`, `vetstock_user`, `vetstock_password` | Los mismos que usa el contenedor |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Valores de ejemplo | Firman los tokens. Cámbialos si el entorno es compartido |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | `15m`, `7d` | Duración del access token y del refresh token |
| `TZ_CLINICA` | `America/Bogota` | Zona horaria que define "hoy" para vencimientos, dispensaciones y reportes. Cámbiala solo si la clínica está en otra zona |
| `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` | `admin@vetstock.com`, `admin` | Login de pgAdmin |

> Si cambias un usuario, clave o base en `.env`, el contenedor de PostgreSQL usa esos mismos valores solo la primera vez que se crea su volumen. Si ya existía, revisa la sección 11.

## 4. Levantar PostgreSQL

Desde la raíz del proyecto:

```powershell
docker compose up -d
```

La primera vez descarga la imagen `postgres:15-alpine` (puede tardar un poco).

Comprueba que está arriba:

```powershell
docker compose ps
```

Debes ver el servicio `postgres` en estado **Up** (o **healthy**) y el puerto `0.0.0.0:5432->5432/tcp`.

Revisa los logs hasta que aparezca `database system is ready to accept connections`:

```powershell
docker compose logs -f postgres
```

Salir de los logs con `Ctrl + C` (el contenedor sigue corriendo).

## 5. Instalar dependencias, cargar datos demo y arrancar la API

```powershell
npm install
npm run seed
npm run start:dev
```

- `npm run seed` compila el proyecto, crea las tablas (si no existen) y carga datos demo: usuarios, categorías, proveedores, medicamentos, lotes, dispensaciones y movimientos del kardex.
- **Ojo:** el seed **borra todos los datos** que haya en la base antes de cargar los demo. Ejecútalo solo cuando quieras empezar de cero.

Salida esperada del arranque de la API:

```
[Nest] ... Starting Nest application...
[Nest] ... Nest application successfully started
```

> Las tablas se crean solas al arrancar (`synchronize: true` en `src/app.module.ts`). No hay que correr migraciones ni scripts SQL.

### Usuarios demo

Todos usan la clave `VetStock123*`.

| Correo | Rol |
|---|---|
| `admin@vetstock.com` | admin |
| `vet@vetstock.com` | veterinario |
| `farmacia@vetstock.com` | farmaceutico |

## 6. Autenticación con JWT

Casi todas las rutas exigen un token. El flujo es:

1. Haz login con `POST /auth/login` (correo y clave).
2. La respuesta trae `accessToken` y `refreshToken` dentro de `data`.
3. Envía el `accessToken` en el header `Authorization: Bearer <token>`.

En PowerShell:

```powershell
$body = '{"correo":"admin@vetstock.com","clave":"VetStock123*"}'
$login = Invoke-RestMethod -Uri http://localhost:3000/auth/login -Method Post -ContentType "application/json" -Body $body
$token = $login.data.accessToken
$headers = @{ Authorization = "Bearer $token" }

Invoke-RestMethod http://localhost:3000/medicamentos -Headers $headers
```

Si pides una ruta sin token, la API responde `401`. Si el token venció (el access token dura 15 minutos por defecto), vuelve a hacer login o renuévalo con `POST /auth/refresh` enviando `{"refreshToken": "..."}`. El frontend lo hace solo.

Si el rol no alcanza para la ruta, la API responde `403` con `No tienes permisos para realizar esta accion`.

## 7. Frontend

En una **segunda** terminal, desde la raíz del proyecto:

```powershell
cd web
Copy-Item .env.example .env
npm install
npm run dev
```

`web/.env` trae `VITE_API_URL=http://localhost:3000`. Si cambias el puerto de la API, cámbialo aquí también y reinicia `npm run dev`.

Abre <http://localhost:5173> e inicia sesión con uno de los usuarios demo de la sección 5.

Para revisar que el frontend compila y pasa el linter:

```powershell
npm run build
npm run lint
```

## 8. Comprobar que quedó levantado

Con la API corriendo, en **otra** terminal (o en la misma, después de hacer login como en la sección 6):

```powershell
Invoke-RestMethod http://localhost:3000/medicamentos -Headers $headers
```

La respuesta es una lista con los medicamentos demo (`{ message, data, count }`).

Crear un medicamento de prueba (requiere rol admin o farmaceutico, el usuario `admin@vetstock.com` sirve):

```powershell
$nuevo = '{
  "nombre": "Amoxicilina 250 mg",
  "presentacion": "Tabletas x 10",
  "especie": "canino",
  "precio": 18000,
  "stockMinimo": 20,
  "requiereFormula": true
}'
Invoke-RestMethod -Uri http://localhost:3000/medicamentos -Method Post -ContentType "application/json" -Headers $headers -Body $nuevo
```

Si ves el medicamento creado, **todo está levantado**: API + PostgreSQL + tablas + autenticación.

## 9. Puertos

| Puerto | Servicio | Dónde se configura |
|---|---|---|
| **3000** | API NestJS | `.env` → `PORT` |
| **5173** | Frontend (Vite) | `npm run dev` (ver `web/.env` para `VITE_API_URL`) |
| **5432** | PostgreSQL | `.env` → `POSTGRES_PORT` |
| 5050 | pgAdmin (opcional, sección 10) | `docker-compose.yml` |

### Cambiar el puerto de la API

En `.env`:

```env
PORT=3001
```

Y en `web/.env`, `VITE_API_URL=http://localhost:3001`. Además, `WEB_ORIGIN` no cambia, porque sigue siendo la URL del frontend.

### Cambiar el puerto de PostgreSQL

Si el `5432` ya está ocupado en tu PC (por ejemplo por un PostgreSQL instalado en Windows), **solo** cambia `.env`. El `docker-compose.yml` lee `POSTGRES_PORT` y la API local usa el mismo valor:

```env
POSTGRES_PORT=55432
```

Luego vuelve a levantar la base:

```powershell
docker compose up -d
```

## 10. Opcional: pgAdmin en el puerto 5050

pgAdmin ya está definido en `docker-compose.yml` bajo el perfil `pgadmin` (también incluido en el perfil `full`). Para levantarlo:

```powershell
docker compose --profile pgadmin up -d
```

Abre <http://localhost:5050> y entra con `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` de tu `.env` (por defecto `admin@vetstock.com` / `admin`). Después registra el servidor así:

| Campo | Valor |
|---|---|
| Host | `postgres` |
| Port | `5432` |
| Database | `vetstock_db` |
| Username | `vetstock_user` |
| Password | `vetstock_password` |

> El host es `postgres` (nombre del servicio), **no** `localhost`, porque pgAdmin está dentro de la red de Docker. El puerto es `5432` aunque hayas publicado PostgreSQL en `55432` en tu PC.

## 11. Opcional: todo en contenedores

Si prefieres no correr la API con Node, el perfil `full` levanta PostgreSQL, pgAdmin y la API (construida con el `Dockerfile`):

```powershell
docker compose --profile full up -d --build
docker compose --profile full exec -e SEED_FORCE=true api node dist/seed/seed.js
```

- Requiere que exista `.env` (el servicio `api` lo usa como `env_file`).
- La API queda en <http://localhost:3000>, con la misma configuración del `.env`.
- La imagen corre con `NODE_ENV=production`. El seed se niega a borrar datos en ese modo, por eso se pasa `SEED_FORCE=true` en el comando.
- El frontend sigue corriendo en local (`cd web` y `npm run dev`).

## 12. Endpoints útiles

Los roles son `admin`, `veterinario` y `farmaceutico`. "Autenticado" significa cualquier rol. Todas las rutas van con `Authorization: Bearer <token>` salvo las públicas. La lista completa está en el README.

| Método | Ruta | Acceso | Qué hace |
|---|---|---|---|
| POST | `/auth/registro` | Público | Registra usuario (`nombre`, `correo`, `clave`, `rol` opcional) |
| POST | `/auth/login` | Público | Login (`correo`, `clave`) → `accessToken` y `refreshToken` |
| POST | `/auth/refresh` | Público | Renueva tokens (`refreshToken`) |
| GET | `/auth/perfil` | Autenticado | Datos del usuario del token |
| POST | `/usuarios` | Admin | Crea usuario (`nombre`, `correo`, `clave`, `rol`) |
| GET | `/usuarios` | Admin | Lista usuarios |
| GET | `/medicamentos` | Autenticado | Lista medicamentos (filtros `q`, `especie`, `categoriaId`) |
| POST | `/medicamentos` | Admin, farmaceutico | Crea medicamento |
| PUT | `/medicamentos/{id}` | Admin, farmaceutico | Actualiza medicamento |
| GET | `/categorias` | Autenticado | Lista categorías |
| GET | `/proveedores` | Autenticado | Lista proveedores |
| POST | `/proveedores` | Admin, farmaceutico | Crea proveedor |
| POST | `/lotes` | Admin, farmaceutico | Registra lote (`medicamentoId`, `proveedorId`, `numeroLote`, `cantidad`, `fechaVencimiento`) |
| GET | `/lotes` | Autenticado | Lista lotes (filtro `?medicamentoId=1`) |
| POST | `/lotes/{id}/ajustes` | Admin, farmaceutico | Ajuste de stock (`cantidad`, `motivo`, `observacion` opcional) |
| GET | `/inventario` | Autenticado | Stock de todos los medicamentos |
| GET | `/inventario/{medicamentoId}` | Autenticado | Stock de un medicamento |
| GET | `/alertas` | Autenticado | Alertas de stock bajo, por vencer y vencidos (`?tipo=`, `?dias=`) |
| GET | `/movimientos` | Autenticado | Kardex (filtros `medicamentoId`, `tipo`) |
| POST | `/dispensaciones` | Autenticado | Dispensa con regla FEFO |
| GET | `/dispensaciones` | Autenticado | Lista dispensaciones |
| POST | `/dispensaciones/{id}/anular` | Admin, farmaceutico | Anula dispensación y devuelve el stock |
| GET | `/reportes/consumo` | Autenticado | Reporte de consumo |
| GET | `/reportes/vencimientos` | Autenticado | Reporte de vencimientos |
| GET | `/reportes/stock` | Autenticado | Reporte de stock |
| GET | `/reportes/proveedores` | Autenticado | Reporte de proveedores |
| GET | `/reportes/resumen` | Autenticado | Resumen para el dashboard |

Ejemplo de alertas (con `$headers` del paso 6):

```powershell
Invoke-RestMethod "http://localhost:3000/alertas" -Headers $headers
```

## 13. Comandos del día a día

| Acción | Comando |
|---|---|
| Levantar la BD | `docker compose up -d` |
| Levantar la BD y pgAdmin | `docker compose --profile pgadmin up -d` |
| Ver estado | `docker compose ps` |
| Ver logs | `docker compose logs -f postgres` |
| Detener la BD (conserva datos) | `docker compose stop` |
| Apagar y quitar contenedores (conserva datos) | `docker compose down` |
| **Borrar todo, incluidos los datos** | `docker compose down -v` |
| Entrar a psql | `docker compose exec postgres psql -U vetstock_user -d vetstock_db` |
| Recargar datos demo (borra los actuales) | `npm run seed` |
| Arrancar la API | `npm run start:dev` |
| Arrancar el frontend | `cd web` y luego `npm run dev` |
| Compilar la API | `npm run build` |
| Lint | `npm run lint` (en la raíz y en `web/`) |
| Tests | `npm test` |
| Tests e2e | `npm run test:e2e` |

> `docker compose down -v` **borra la base de datos**. Úsalo solo si quieres empezar de cero.

> `npm test` y `npm run test:e2e` usan variables de entorno al estilo POSIX dentro del script. No lo hemos verificado en PowerShell o CMD; si fallan ahí, ejecútalos desde Git Bash.

## 14. Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| `docker: command not found` o `error during connect` | Docker Desktop está cerrado. Ábrelo y espera a **Engine running** |
| `Bind for 0.0.0.0:5432 failed: port is already allocated` | Otro PostgreSQL usa el 5432. Pon `POSTGRES_PORT=55432` en `.env` (sección 9) y ejecuta `docker compose up -d` |
| `ECONNREFUSED 127.0.0.1:5432` al arrancar la API o el seed | PostgreSQL aún no terminó de arrancar. Espera 10-15 s y reintenta |
| `password authentication failed for user "vetstock_user"` | El volumen tiene credenciales de una ejecución anterior. `docker compose down -v` y `docker compose up -d` (borra datos) |
| `database "vetstock_db" does not exist` | El `.env` no coincide con el compose, o el volumen es de otra BD: revisa la sección 3 |
| `EADDRINUSE: address already in use :::3000` | El puerto 3000 está ocupado: `netstat -ano \| findstr :3000`, cierra el proceso o cambia `PORT` en `.env` (y `VITE_API_URL` en `web/.env`) |
| 401 `Token invalido o expirado` | El access token venció (15 min por defecto). Vuelve a hacer login o usa `POST /auth/refresh`. En el frontend se renueva solo |
| 403 `No tienes permisos para realizar esta accion` | El rol del usuario no permite la ruta. Usa `admin@vetstock.com` para probar |
| Error de CORS en el navegador | `WEB_ORIGIN` en `.env` no coincide con la URL del frontend. Si Vite abrió otro puerto (por ejemplo 5174), ajusta `WEB_ORIGIN` y reinicia la API |
| El seed responde `Con NODE_ENV=production se exige SEED_FORCE=true` | Tienes `NODE_ENV=production` en el entorno. Quítalo para el seed local, o usa `SEED_FORCE=true` si de verdad quieres borrar los datos |
| `npm install` falla en `better-sqlite3` / `node-gyp` | Es una dependencia solo de tests. Usa Node 24 LTS (tiene binarios precompilados) o instala **Visual Studio Build Tools** con la carga "Desktop development with C++" |
| `.env` con caracteres raros o error al leer variables | El archivo se guardó con BOM o extensión `.env.txt`. Créalo de nuevo con `Copy-Item .env.example .env` y verifica en el Explorador que se llame exactamente `.env` |
| La API arranca pero las tablas no aparecen | Revisa que `docker compose ps` muestre `postgres` arriba y que `POSTGRES_HOST=localhost` |
| `docker compose --profile full up` falla por `.env` | El servicio `api` usa `env_file: .env`. Crea el archivo antes con `Copy-Item .env.example .env` |

Si algo falla, la secuencia de diagnóstico es siempre:

```powershell
docker compose ps
docker compose logs --tail 50 postgres
```

## 15. Checklist final

- [ ] `node -v` y `docker -v` responden
- [ ] Docker Desktop en **Engine running**
- [ ] `docker compose ps` muestra `postgres` en **Up**
- [ ] Existe el archivo `.env` en la raíz del proyecto
- [ ] `npm install` terminó sin errores
- [ ] `npm run seed` terminó con `Seed listo`
- [ ] `npm run start:dev` muestra `Nest application successfully started`
- [ ] Login con `admin@vetstock.com` devuelve `accessToken`
- [ ] `web/` tiene `.env`, `npm install` terminó y `npm run dev` abre http://localhost:5173

Con eso la API queda en <http://localhost:3000>, el frontend en <http://localhost:5173> y la base de datos en `localhost:5432` (o en el `POSTGRES_PORT` que hayas definido).
