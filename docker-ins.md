# Levantar VetStock API en Windows

Guía corta y directa para dejar la API corriendo en un PC con Windows, con puertos y verificación incluidos.

> **Importante:** el repo **no** trae `Dockerfile`. El `docker-compose.yml` solo levanta **PostgreSQL 15**. La API de NestJS corre con Node directamente en Windows, en el puerto **3000**.

## Resumen express

Si ya tienes Node, Git y Docker Desktop instalados, es esta secuencia:

```powershell
git clone https://github.com/camilin0811/VetStock-api.git
cd VetStock-api
git checkout develop
Copy-Item .env.example .env
docker compose up -d
npm install
npm run start:dev
```

Al final: API en <http://localhost:3000> y PostgreSQL en `localhost:5432`.

## 1. Requisitos

| Herramienta | Versión recomendada | Para qué |
|---|---|---|
| [Node.js](https://nodejs.org/) | 24 LTS (o 22 LTS) | Correr la API (NestJS 12) |
| npm | Viene con Node | Instalar dependencias |
| [Git](https://git-scm.com/download/win) | Última | Clonar el repo |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Última | Levantar PostgreSQL |

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
git clone https://github.com/camilin0811/VetStock-api.git
cd VetStock-api
git checkout develop
git pull
```

La rama de trabajo es **`develop`**.

## 3. Crear el archivo `.env`

El proyecto lee la configuración de un `.env` en la raíz (no se sube a GitHub, por eso hay que crearlo).

**PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Git Bash / CMD:**

```bash
cp .env.example .env
```

Contenido esperado:

```env
PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=vetstock_db
POSTGRES_USER=vetstock_user
POSTGRES_PASSWORD=vetstock_password
```

| Variable | Valor | Nota |
|---|---|---|
| `PORT` | `3000` | Puerto de la API |
| `POSTGRES_HOST` | `localhost` | La API corre en Windows, la BD en Docker |
| `POSTGRES_PORT` | `5432` | Debe coincidir con el mapeo del compose |
| `POSTGRES_DB` | `vetstock_db` | Igual que `POSTGRES_DB` del compose |
| `POSTGRES_USER` | `vetstock_user` | Igual que el compose |
| `POSTGRES_PASSWORD` | `vetstock_password` | Igual que el compose |

> Si cambias un usuario, clave o base en `docker-compose.yml`, cámbialo también aquí o la API no podrá conectarse.

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

Debes ver el servicio `postgres` en estado **Up** y el puerto `0.0.0.0:5432->5432/tcp`.

Revisa los logs hasta que aparezca `database system is ready to accept connections`:

```powershell
docker compose logs -f postgres
```

Salir de los logs con `Ctrl + C` (el contenedor sigue corriendo).

## 5. Instalar dependencias y arrancar la API

```powershell
npm install
npm run start:dev
```

Salida esperada:

```
[Nest] ... Starting Nest application...
[Nest] ... Nest application successfully started
```

> Las tablas se crean solas al arrancar (`synchronize: true` en `src/app.module.ts`), no hay que correr migraciones ni scripts SQL.

## 6. Comprobar que quedó levantado

Con la API corriendo, en **otra** terminal:

```powershell
Invoke-RestMethod http://localhost:3000/medicamentos
```

Respuesta esperada la primera vez: una lista vacía `[]` (o los medicamentos que ya hayas creado).

Crear un medicamento de prueba:

```powershell
Invoke-RestMethod -Uri http://localhost:3000/medicamentos -Method Post -ContentType "application/json" -Body '{
  "nombre": "Amoxicilina 250 mg",
  "presentacion": "Tabletas x 10",
  "especie": "canino",
  "precio": 18000,
  "stockMinimo": 20,
  "requiereFormula": true
}'
```

Y volver a listar:

```powershell
Invoke-RestMethod http://localhost:3000/medicamentos
```

Si ves el medicamento creado, **todo está levantado**: API + PostgreSQL + tablas.

## 7. Puertos

| Puerto | Servicio | Dónde se configura |
|---|---|---|
| **3000** | API NestJS | `.env` → `PORT` (o `src/main.ts`) |
| **5432** | PostgreSQL | `docker-compose.yml` → `ports` y `.env` → `POSTGRES_PORT` |
| 5050 | pgAdmin (opcional, ver sección 10) | `docker-compose.yml` |

### Cambiar el puerto de la API

En `.env`:

```env
PORT=3001
```

### Cambiar el puerto de PostgreSQL

Si el `5432` ya está ocupado en tu PC (por ejemplo por un PostgreSQL instalado en Windows), usa `5433` en **los dos lados**:

`docker-compose.yml`:

```yaml
ports:
  - "5433:5432"
```

`.env`:

```env
POSTGRES_PORT=5433
```

Luego recrea el contenedor:

```powershell
docker compose down
docker compose up -d
```

## 8. Endpoints útiles

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/auth/registro` | Registra usuario (`nombre`, `correo`, `clave`) |
| POST | `/auth/login` | Login (`correo`, `clave`) → tokens |
| GET | `/medicamentos` | Lista medicamentos |
| GET | `/medicamentos/{id}` | Consulta uno |
| POST | `/medicamentos` | Crea medicamento |
| PUT | `/medicamentos/{id}` | Actualiza medicamento |
| GET | `/proveedores` | Lista proveedores |
| POST | `/proveedores` | Crea proveedor |
| POST | `/lotes` | Registra lote (`medicamentoId`, `proveedorId`, `numeroLote`, `cantidad`, `fechaVencimiento`) |
| GET | `/lotes` | Lista lotes (filtro `?medicamentoId=1`) |
| GET | `/inventario/{medicamentoId}` | Stock por medicamento |
| GET | `/alertas` | Alertas de stock bajo / por vencer / vencido |
| POST | `/dispensaciones` | Dispensa con regla FEFO |
| GET | `/dispensaciones` | Lista dispensaciones |
| GET | `/reportes/consumo` | Reporte de consumo |
| GET | `/reportes/vencimientos` | Reporte de vencimientos |

Ejemplo de alertas:

```powershell
Invoke-RestMethod http://localhost:3000/alertas
```

## 9. Comandos del día a día

| Acción | Comando |
|---|---|
| Levantar la BD | `docker compose up -d` |
| Ver estado | `docker compose ps` |
| Ver logs | `docker compose logs -f postgres` |
| Detener la BD (conserva datos) | `docker compose stop` |
| Apagar y quitar contenedores (conserva datos) | `docker compose down` |
| **Borrar todo, incluidos los datos** | `docker compose down -v` |
| Entrar a psql | `docker exec -it vetstock-api-postgres-1 psql -U vetstock_user -d vetstock_db` |
| Arrancar la API | `npm run start:dev` |
| Compilar | `npm run build` |
| Lint | `npm run lint` |
| Tests | `npm test` |
| Tests e2e | `npm run test:e2e` |

> El nombre del contenedor puede variar; confírmalo con `docker compose ps` (columna `NAME`).

> `docker compose down -v` **borra la base de datos**. Úsalo solo si quieres empezar de cero.

## 10. Opcional: pgAdmin en el puerto 5050

El repo no incluye pgAdmin. Si lo quieres (como en `IvonneBarco/book-nestjs-5a`), agrega este servicio al `docker-compose.yml`:

```yaml
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@vetstock.com
      PGADMIN_DEFAULT_PASSWORD: admin_password
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres
```

Y añade el volumen al final del archivo:

```yaml
volumes:
  postgres_data:
  pgadmin_data:
```

Luego:

```powershell
docker compose up -d
```

Abre <http://localhost:5050>, entra con `admin@vetstock.com` / `admin_password` y registra el servidor así:

| Campo | Valor |
|---|---|
| Host | `postgres` |
| Port | `5432` |
| Database | `vetstock_db` |
| Username | `vetstock_user` |
| Password | `vetstock_password` |

> El host es `postgres` (nombre del servicio), **no** `localhost`, porque pgAdmin está dentro de la red de Docker.

## 11. Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| `docker: command not found` o `error during connect` | Docker Desktop está cerrado. Ábrelo y espera a **Engine running**. |
| `Bind for 0.0.0.0:5432 failed: port is already allocated` | Otro PostgreSQL usa el 5432. Cambia a `5433` en el compose y en `.env` (sección 7) o detén el servicio de Windows (`services.msc`). |
| `ECONNREFUSED 127.0.0.1:5432` al arrancar la API | PostgreSQL aún no terminó de arrancar. Espera 10-15 s y vuelve a correr `npm run start:dev`. |
| `password authentication failed for user "vetstock_user"` | El volumen tiene credenciales viejas. `docker compose down -v` y `docker compose up -d` (borra datos). |
| `database "vetstock_db" does not exist` | El `.env` no coincide con el compose, o el volumen es de otra BD: revisa la sección 3. |
| `EADDRINUSE: address already in use :::3000` | El puerto 3000 está ocupado: `netstat -ano \| findstr :3000`, cierra el proceso o cambia `PORT` en `.env`. |
| `npm install` falla en `better-sqlite3` / `node-gyp` | Es una dependencia solo de tests. Usa Node 24 LTS (tiene binarios precompilados) o instala **Visual Studio Build Tools** con la carga "Desktop development with C++". |
| `.env` con caracteres raros o error al leer variables | El archivo se guardó con BOM o extensión `.env.txt`. Créalo de nuevo con `Copy-Item .env.example .env` y verifica en el Explorador que se llame exactamente `.env`. |
| La API arranca pero las tablas no aparecen | Revisa que `docker compose ps` muestre `postgres` arriba y que `POSTGRES_HOST=localhost`. |

Si algo falla, la secuencia de diagnóstico es siempre:

```powershell
docker compose ps
docker compose logs --tail 50 postgres
```

## 12. Checklist final

- [ ] `node -v` y `docker -v` responden
- [ ] Docker Desktop en **Engine running**
- [ ] `docker compose ps` muestra `postgres` en **Up**
- [ ] Existe el archivo `.env` en la raíz del proyecto
- [ ] `npm install` terminó sin errores
- [ ] `npm run start:dev` muestra `Nest application successfully started`
- [ ] `Invoke-RestMethod http://localhost:3000/medicamentos` responde sin error

Con eso la API queda levantada en <http://localhost:3000> y la base de datos en `localhost:5432`.
