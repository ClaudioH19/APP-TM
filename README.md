# APP-TM

aplicación para gestión de mascotas con red social, historial médico y mapas.

## contenido

- [funcionalidades](#funcionalidades)
- [stack](#stack)
- [requisitos](#requisitos)
- [instalación](#instalación)
- [configuración](#configuración)
- [uso](#uso)
- [api](#api)
- [comandos](#comandos)

## funcionalidades

### autenticación
- login/registro con JWT
- gestión de perfil y avatares

### mascotas
- CRUD de mascotas
- soporte para perro, gato, conejo, hámster, ave, etc.

### publicaciones
- crear posts con fotos/videos
- likes y comentarios
- geolocalización

### historial médico
- registro de vacunas, controles, etc.
- estados: pendiente, completado, cancelado, vencido
- filtros y paginación

### puntos de interés
- veterinarias, tiendas, parques
- reseñas
- visualización en mapa

### mapas
- integración con mapas
- reverse geocoding

### recorridos
- tracking GPS de paseos

## stack

### frontend
- React Native + Expo
- NativeWind (TailwindCSS)
- React Navigation
- AsyncStorage

### backend
- Node.js + Express + TypeScript
- TypeORM + PostgreSQL
- JWT
- Argon2
- Multer + Cloudinary

## requisitos

- Node.js v16+
- npm
- PostgreSQL

## instalación

```bash
git clone <repo>
cd APP-TM

# backend
npm install

# frontend
cd App
npm install
```

### variables de entorno

crear `.env` en la raíz:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=app_tm

JWT_SECRET=secret

CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret

PORT=3001
```

### migraciones

```bash
npm run migration:run
```

### datos de prueba

```bash
cd backend
npm run seeds
```

## configuración

### IP del backend

editar `App/config/api.js`:

```javascript
export const API_URL = 'http://IP:3001';
```

## uso

### backend

```bash
npm run dev  # desarrollo
npm start    # producción
```

### frontend

```bash
cd App
npx expo start  # expo
npm run web     # web
```

## api

### `/api/auth`
- POST `/login` - login
- POST `/register` - registro
- GET `/me` - usuario actual (auth)
- POST `/avatar` - subir avatar (auth)
- DELETE `/avatar` - eliminar avatar (auth)

### `/api/usuarios`
- GET `/avatar/:id` - avatar de usuario

### `/api/mascotas`
- GET `/` - listar (auth)
- POST `/` - crear (auth)
- GET `/:id` - obtener (auth)
- PATCH `/:id` - actualizar (auth)
- DELETE `/:id` - eliminar (auth)
- GET `/especies` - especies disponibles

### `/api/publications`
- GET `/` - listar
- POST `/` - crear (auth)
- GET `/:id` - obtener
- POST `/:id/interaccion` - like/comentar (auth)
- GET `/:id/user-interactions` - interacciones (auth)

### `/api/comments`
- POST `/` - crear (auth)
- GET `/?publicacion_id=X` - obtener

### `/api/historial`
- GET `/` - listar (auth)
- GET `/categorias` - categorías (auth)
- GET `/estados` - estados (auth)
- GET `/contar-por-estado` - contar por estado (auth)
- GET `/por-estado/:estado` - filtrar por estado (auth)
- PATCH `/:id` - actualizar (auth)
- PATCH `/:id/estado` - cambiar estado (auth)
- DELETE `/:id` - eliminar (auth)

### `/api/mascotas/:id/historial`
- GET `/` - historial (auth)
- POST `/` - crear evento (auth)

### `/api/interest_points`
- GET `/` - listar
- POST `/` - crear (auth)

### `/api/reviews`
- POST `/` - crear (auth)
- GET `/?poi_id=X` - obtener

### `/api/recorridos`
- POST `/` - guardar (auth)
- GET `/` - obtener (auth)

## comandos

### raíz
```bash
npm run dev
npm run build
npm start
npm run migration:generate
npm run migration:run
npm run migration:revert
```

### backend
```bash
npm run dev
npm run build
npm start
npm run seeds
```

### frontend
```bash
npx expo start
npm run web
npm run android
npm run ios
```

## estructura

```
APP-TM/
├── App/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── config/
│   └── App.js
├── backend/
│   └── src/
│       ├── controllers/
│       ├── entities/
│       ├── routes/
│       ├── services/
│       ├── middleware/
│       └── migrations/
└── .env
```

## base de datos

```
Usuario (1) ──── (N) Mascota
Usuario (1) ──── (N) Publicacion
Mascota (1) ──── (N) HistorialMedico
Publicacion (1) ──── (N) Interaccion
PuntoDeInteres (1) ──── (N) Review
```

## errores comunes

### conexión BD
```bash
npm run db:test
```

### módulos
```bash
rm -rf node_modules package-lock.json
npm install
```

### expo no conecta
- verificar IP en `App/config/api.js`
- usar IP local, no localhost
- verificar backend corriendo
