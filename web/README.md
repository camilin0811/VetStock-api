# VetStock web

Frontend de VetStock (inventario y farmacia veterinaria). Vite + React + TypeScript, React Router, TanStack Query, GSAP y Three.js (react-three-fiber).

## Requisitos

- Node 20+ y la API de VetStock corriendo (por defecto en `http://localhost:3000`).

## Uso

```bash
cp .env.example .env   # ajusta VITE_API_URL si hace falta
npm install
npm run dev            # http://localhost:5173
```

| Script | Descripcion |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Tipos + build de produccion en `dist/` |
| `npm run preview` | Sirve el build |
| `npm run lint` | oxlint |

## Notas

- Access token en memoria; refresh token en `localStorage`. Ante un 401 se intenta renovar una vez y, si falla, se vuelve a `/login`.
- La escena 3D del dashboard se carga bajo demanda y se pausa fuera de pantalla. Con `prefers-reduced-motion` se desactivan las animaciones y se muestra una imagen estatica.
- Usuarios demo (seed de la API): `admin@vetstock.com`, `vet@vetstock.com`, `farmacia@vetstock.com`, clave `VetStock123*`.
