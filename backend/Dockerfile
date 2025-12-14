FROM node:18-alpine

# Instalamos herramientas necesarias para compilar dependencias nativas si las hay
RUN apk add --no-cache python3 make g++ bash

WORKDIR /usr/src/app

# Copiar package.json y package-lock.json (si existe) para aprovechar cache de capas
COPY package*.json ./

# Instalar dependencias incluidas devDependencies (necesarias para ejecutar migraciones en TS)
RUN npm ci --prefer-offline --no-audit --progress=false

# Copiar el resto del código
COPY . .

# Crear carpeta para medios locales si se usa
RUN mkdir -p /usr/src/app/media_local

EXPOSE 3000

# Comando por defecto (modo desarrollo con hot-reload)
CMD ["npm", "run", "dev"]
