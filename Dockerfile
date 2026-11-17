# Imagen de la API en tres etapas: dependencias, compilacion y runtime minimo.

# 1) Dependencias completas (para compilar). --ignore-scripts evita compilar
#    better-sqlite3 (solo se usa en pruebas); bcrypt trae binarios precompilados.
FROM node:24-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# 2) Compila TypeScript a dist/ y deja solo las dependencias de produccion
FROM dependencias AS compilacion
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev --ignore-scripts

# 3) Runtime: solo dist/ y node_modules de produccion, sin usuario root
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=compilacion --chown=node:node /app/package.json ./
COPY --from=compilacion --chown=node:node /app/node_modules ./node_modules
COPY --from=compilacion --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
