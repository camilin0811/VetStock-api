# Flujo de trabajo - ramas, commits y PR

## Autoria (obligatorio)

- Proyecto individual: el unico integrante es Andres Camilo Muñoz Bolaños (GitHub `camilin0811`).
- Todos los commits van a su nombre: `git config user.name "Andres Camilo Muñoz Bolaños"` y `git config user.email "cammb1004@gmail.com"` en este repo.
- Todo push y PR se hace con la cuenta `camilin0811` (`gh auth switch --user camilin0811`; verificar con `gh auth status`).
- Prohibido agregar co-autores o atribuciones de herramientas: nada de `Co-Authored-By`, "Generated with ..." ni firmas similares en commits o PRs.

## Ramas

- Base: `develop` (rama por defecto; no commitear directo).
- Trabajo: crear `feature/<nombre>` desde `develop` actualizado (`git pull` primero).
- Cada rama se sube con la cuenta `camilin0811`.
- Al mergear el PR se puede borrar la rama.

## Commits

- Estilo convencional: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:` + descripcion corta en espanol.
- Ejemplo: `feat: agregar capa auth con registro y login`
- Minimo 1 commit por rama.

## Pull Requests

- Base siempre `develop`.
- Al ser un proyecto individual no hay aprobaciones: el PR se mergea directo a `develop` (merge commit) cuando lint, tests y build pasan, en el orden en que se crearon las ramas.
- Plantilla obligatoria del cuerpo del PR:

~~~md
<img width="671" height="201" alt="image" src="https://github.com/user-attachments/assets/689ab860-f8d0-4235-ac19-f6f0b341c8ac" />

:construction_worker: Dev: Andres Camilo Muñoz Bolaños

## Cambios (clases, archivos, etc)
* `ruta/archivo.ts:` Descripcion corta del cambio.

## Detalles
* Detalle tecnico 1.
* Detalle tecnico 2.

De branches:

feature/<nombre>

De commits:

feat: mensaje del commit
~~~

- El banner de la cooperativa va al inicio del cuerpo de todo PR.
- En `## Cambios` listar las clases y archivos tocados, con ruta y descripcion.
