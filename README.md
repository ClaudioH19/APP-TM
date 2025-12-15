# 🐾 APP-TM - Aplicación para Gestión de Mascotas

Aplicación full-stack para gestión de mascotas con funcionalidades de red social, historial médico, puntos de interés y geolocalización. Desarrollada con React Native + Expo en el frontend y Node.js + Express + TypeORM en el backend.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación Rápida](#-instalación-rápida)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Configuración](#-configuración)
- [Ejecución](#-ejecución)
- [API Endpoints](#-api-endpoints)
- [Scripts Disponibles](#-scripts-disponibles)

## ✨ Características

### 🔐 Autenticación y Usuarios
- registro e inicio de sesión con JWT
- gestión de perfil de usuario
- subida y gestión de avatares
- autenticación persistente

### 🐕 Gestión de Mascotas
- registro de mascotas con información detallada (nombre, especie, fecha de nacimiento)
- soporte para múltiples especies (perro, gato, conejo, hámster, ave, etc.)
- asociación de mascotas con usuarios
- visualización y edición de datos de mascotas

### 📱 Red Social
- creación de publicaciones con fotos/videos
- sistema de likes y comentarios
- feed de publicaciones con geolocalización
- visualización de publicaciones por usuario
- contador de interacciones en tiempo real

### 🏥 Historial Médico
- registro de eventos médicos (vacunas, controles, paseos, etc.)
- categorización de eventos por tipo
- estados de eventos (pendiente, completado, cancelado, vencido)
- geolocalización de clínicas/eventos
- paginación y filtrado por estado
- visualización de eventos futuros y pasados

### 📍 Puntos de Interés
- creación de puntos de interés (veterinarias, tiendas, parques, etc.)
- categorización (veterinario, tienda, ocio, deporte, otro)
- sistema de reseñas y valoraciones
- visualización en mapa con geolocalización

### 🗺️ Mapas y Geolocalización
- integración con mapas interactivos
- visualización de publicaciones en mapa
- puntos de interés con coordenadas
- reverse geocoding para nombres de ubicación

### 🚶 Recorridos
- seguimiento de recorridos con GPS
- registro de distancia y tiempo
- asociación con mascotas

## 🛠️ Tecnologías

### Frontend (App/)
- **React Native** - framework para desarrollo móvil multiplataforma
- **Expo** - plataforma de desarrollo React Native
- **NativeWind (TailwindCSS)** - estilos utilitarios para React Native
- **React Navigation** - navegación entre pantallas
- **Expo Camera** - acceso a cámara del dispositivo
- **Expo Location** - servicios de GPS y geolocalización
- **Expo Image Picker** - selección de imágenes/videos
- **AsyncStorage** - almacenamiento local persistente

### Backend (backend/)
- **Node.js** - runtime de JavaScript
- **Express.js** - framework web minimalista
- **TypeScript** - superset tipado de JavaScript
- **TypeORM** - ORM para bases de datos relacionales
- **PostgreSQL** - base de datos relacional
- **JWT (jsonwebtoken)** - autenticación basada en tokens
- **Argon2** - hashing seguro de contraseñas
- **Multer** - manejo de uploads de archivos
- **Cloudinary** - almacenamiento de imágenes/videos en la nube
- **Helmet** - seguridad HTTP headers
- **CORS** - control de acceso cross-origin
- **Morgan** - logging de requests HTTP
- **Rate Limiting** - protección contra ataques de fuerza bruta

## 📦 Requisitos Previos

- **Node.js** v16 o superior ([Descargar](https://nodejs.org/))
- **npm** o **yarn** (incluido con Node.js)
- **PostgreSQL** instalado localmente o cuenta en servicio cloud ([Neon](https://neon.tech/), [Supabase](https://supabase.com/), etc.)
- **Expo CLI** (opcional, para desarrollo móvil): `npm install -g @expo/cli`
- **Expo Go** app en tu dispositivo móvil (opcional, para testing)

## 🚀 Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd APP-TM
```

### 2. Instalar dependencias

#### Backend
```bash
# instalar dependencias del proyecto raíz (incluye backend)
npm install
```

#### Frontend
```bash
cd App
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=app_tm

# JWT secret
JWT_SECRET=tu_clave_secreta_muy_segura_aqui

# cloudinary (opcional, para almacenamiento de imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# puerto del servidor
PORT=3001
```

### 4. Ejecutar migraciones de base de datos

```bash
# generar migraciones (si hay cambios en entidades)
npm run migration:generate

# ejecutar migraciones
npm run migration:run
```

### 5. (Opcional) Poblar base de datos con datos de prueba

```bash
cd backend
npm run seeds
```

## 📁 Estructura del Proyecto

```
APP-TM/
├── App/                          # frontend React Native
│   ├── components/              # componentes de UI
│   │   ├── HomeComponent.js     # feed de publicaciones
│   │   ├── MapComponent.js      # mapa con puntos de interés
│   │   ├── Perfil.js           # perfil de usuario
│   │   ├── HealthCenter.js     # historial médico
│   │   ├── Login.js            # autenticación
│   │   └── ...
│   ├── hooks/                   # custom hooks
│   │   ├── usePosts.js         # manejo de publicaciones
│   │   ├── useCachedPosts.js   # caché de publicaciones
│   │   ├── usePets.js          # gestión de mascotas
│   │   └── useComments.js      # sistema de comentarios
│   ├── services/               # servicios de API
│   │   ├── apiClient.js        # cliente HTTP con auth
│   │   ├── postCache.js        # caché de datos
│   │   └── interaccion_service.js
│   ├── config/                 # configuración
│   │   └── api.js              # endpoints de API
│   ├── App.js                  # componente raíz
│   └── package.json
│
├── backend/                     # backend Node.js
│   ├── src/
│   │   ├── controllers/        # lógica de controladores
│   │   ├── entities/           # entidades TypeORM
│   │   │   ├── Usuario.ts
│   │   │   ├── Mascota.ts
│   │   │   ├── Publicacion.ts
│   │   │   ├── HistorialMedico.ts
│   │   │   └── PuntoDeInteres.ts
│   │   ├── routes/             # definición de rutas
│   │   │   ├── auth.ts
│   │   │   ├── mascota.ts
│   │   │   ├── publication.ts
│   │   │   ├── historial.ts
│   │   │   └── interest_point.ts
│   │   ├── services/           # lógica de negocio
│   │   ├── middleware/         # middlewares personalizados
│   │   ├── migrations/         # migraciones de BD
│   │   ├── seeds/              # datos de prueba
│   │   ├── config/             # configuraciones
│   │   ├── data-source.ts      # configuración TypeORM
│   │   └── index.ts            # punto de entrada
│   ├── utils/                  # utilidades
│   └── package.json
│
├── .env                        # variables de entorno
├── package.json               # dependencias raíz
└── README.md
```

## ⚙️ Configuración

### Configurar IP del Backend (Frontend)

Editar `App/config/api.js`:
```javascript
export const API_URL = 'http://TU_IP:3001'; // cambiar por tu IP local o dominio
```

### Configurar Base de Datos

El proyecto usa TypeORM con PostgreSQL. Configurar en `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=app_tm
```

## ▶️ Ejecución

### Modo Desarrollo

#### Backend
```bash
# en la raíz del proyecto
npm run dev
# el servidor estará en http://localhost:3001
```

#### Frontend

**Opción 1: Expo Go (Recomendado para inicio rápido)**
```bash
cd App
npx expo start
# escanear código QR con Expo Go app
```

**Opción 2: Web**
```bash
cd App
npm run web
# abrirá en http://localhost:8081
```

**Opción 3: Android/iOS**
```bash
cd App
npm run android  # para Android
npm run ios      # para iOS (solo en Mac)
```

### Modo Producción

#### Backend
```bash
# compilar TypeScript
npm run build

# iniciar servidor
npm start
```

## 📡 API Endpoints

### Autenticación (`/api/auth`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/login` | iniciar sesión | No |
| POST | `/register` | registrar usuario | No |
| GET | `/me` | obtener usuario actual | Sí |
| POST | `/avatar` | subir avatar | Sí |
| DELETE | `/avatar` | eliminar avatar | Sí |

### Usuarios (`/api/usuarios`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/avatar/:id` | obtener avatar de usuario | No |

### Mascotas (`/api/mascotas`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | listar mascotas del usuario | Sí |
| POST | `/` | registrar nueva mascota | Sí |
| GET | `/:id` | obtener mascota por ID | Sí |
| PATCH | `/:id` | actualizar mascota | Sí |
| DELETE | `/:id` | eliminar mascota | Sí |
| GET | `/especies` | listar especies disponibles | No |

### Publicaciones (`/api/publications`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | listar publicaciones | Opcional |
| POST | `/` | crear publicación | Sí |
| GET | `/:id` | obtener publicación | No |
| POST | `/:id/interaccion` | dar like/comentar | Sí |
| GET | `/:id/user-interactions` | obtener interacciones del usuario | Sí |

### Comentarios (`/api/comments`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | crear comentario | Sí |
| GET | `/?publicacion_id=X` | obtener comentarios | No |

### Historial Médico (`/api/historial`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | listar eventos del usuario | Sí |
| GET | `/categorias` | obtener categorías | Sí |
| GET | `/estados` | obtener estados | Sí |
| GET | `/contar-por-estado` | contar eventos por estado | Sí |
| GET | `/por-estado/:estado` | eventos filtrados por estado | Sí |
| PATCH | `/:id` | actualizar evento | Sí |
| PATCH | `/:id/estado` | cambiar estado de evento | Sí |
| DELETE | `/:id` | eliminar evento | Sí |

### Mascotas Historial (`/api/mascotas/:id/historial`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | historial de mascota | Sí |
| POST | `/` | crear evento médico | Sí |

### Puntos de Interés (`/api/interest_points`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | listar todos los puntos | No |
| POST | `/` | crear punto de interés | Sí |

### Reseñas (`/api/reviews`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | crear reseña | Sí |
| GET | `/?poi_id=X` | obtener reseñas de punto | No |

### Recorridos (`/api/recorridos`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | guardar recorrido | Sí |
| GET | `/` | obtener recorridos | Sí |

## 📜 Scripts Disponibles

### Raíz del Proyecto
```bash
npm run dev              # iniciar backend en modo desarrollo
npm run build            # compilar backend TypeScript
npm start                # iniciar backend en producción
npm run migration:generate  # generar nueva migración
npm run migration:run    # ejecutar migraciones
npm run migration:revert # revertir última migración
npm run db:test          # probar conexión a BD
```

### Backend (`backend/`)
```bash
npm run dev              # desarrollo con ts-node-dev
npm run build            # compilar a JavaScript
npm start                # iniciar servidor compilado
npm run seeds            # ejecutar seeds
npm run sync:drive-oauth # sincronizar con Google Drive (OAuth)
npm run sync:drive-service # sincronizar con Google Drive (Service Account)
```

### Frontend (`App/`)
```bash
npx expo start           # iniciar Expo
npm run web              # ejecutar en navegador
npm run android          # ejecutar en Android
npm run ios              # ejecutar en iOS (solo Mac)
```

## 🔒 Autenticación

La aplicación usa JWT (JSON Web Tokens) para autenticación:

1. el usuario se registra o inicia sesión
2. el backend devuelve un token JWT
3. el frontend almacena el token en AsyncStorage
4. todas las peticiones autenticadas incluyen el header: `Authorization: Bearer <token>`
5. el backend valida el token en cada request protegido

## 🗄️ Base de Datos

### Entidades Principales

- **Usuario**: datos de usuario y autenticación
- **Mascota**: información de mascotas
- **Publicacion**: posts en la red social
- **Interaccion**: likes y comentarios
- **HistorialMedico**: eventos médicos de mascotas
- **PuntoDeInteres**: lugares relevantes para mascotas
- **Review**: reseñas de puntos de interés
- **Recorrido**: tracking de paseos

### Diagrama de Relaciones

```
Usuario (1) ──── (N) Mascota
Usuario (1) ──── (N) Publicacion
Usuario (1) ──── (N) Interaccion
Usuario (1) ──── (N) Review
Mascota (1) ──── (N) HistorialMedico
Mascota (1) ──── (N) Publicacion
Mascota (1) ──── (N) Recorrido
Publicacion (1) ──── (N) Interaccion
PuntoDeInteres (1) ──── (N) Review
```

## 🐛 Solución de Problemas

### Error de conexión a base de datos
```bash
# verificar que PostgreSQL esté corriendo
# verificar credenciales en .env
npm run db:test
```

### Error "Cannot find module"
```bash
# reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Expo no se conecta al backend
- verificar que `API_URL` en `App/config/api.js` tenga la IP correcta
- usar IP local (no localhost) cuando uses dispositivo físico
- verificar que backend esté corriendo y accesible

### Error de migraciones
```bash
# revertir y volver a ejecutar
npm run migration:revert
npm run migration:run
```

## 👥 Contribuir

1. fork del proyecto
2. crear rama feature (`git checkout -b feature/NuevaCaracteristica`)
3. commit cambios (`git commit -m 'feat: agregar nueva característica'`)
4. push a la rama (`git push origin feature/NuevaCaracteristica`)
5. abrir Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

---
