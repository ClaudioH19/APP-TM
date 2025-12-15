# TM - React Native + Express Full Stack App

Una aplicación full-stack que combina React Native con Expo para el frontend y Express con PostgreSQL para el backend.

## 🏗️ Estructura del Proyecto

```
TM/
├── App/           # Frontend - React Native + Expo
│   ├── components/
│   ├── App.js
│   ├── package.json
│   └── ...
├── backend/       # Backend - Express + PostgreSQL
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
└── README.md
```

## 🚀 Tecnologías Utilizadas

### Frontend (App/)
- **React Native** - Framework para desarrollo móvil
- **Expo** - Plataforma para desarrollo React Native
- **NativeWind** - Tailwind CSS para React Native
- **Expo Camera** - Acceso a la cámara
- **Expo Location** - Servicios de geolocalización
- **Expo Sensors** - Acceso a sensores del dispositivo

### Backend (backend/)
- **Express.js** - Framework web para Node.js
- **Sequelize** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación con tokens
- **bcryptjs** - Hashing de contraseñas
- **Helmet** - Middleware de seguridad
- **CORS** - Control de acceso entre dominios
- **Morgan** - Logger de HTTP requests

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- npm o yarn
- PostgreSQL o cuenta en Neon Database
- Expo CLI global: `npm install -g @expo/cli`

### 1. Clonar el repositorio
```bash
git clone <tu-repo-url>
cd TM
```

### 2. Configurar el Backend
```bash
npm install # en la ruta del proyecto

## Ejecución

### Desarrollo - Backend
```bash
cd backend
npm run dev          # Inicia servidor con nodemon
# o
npm start           # Inicia servidor en modo producción
```

### Desarrollo - Frontend
```bash
cd App
npx run web         # Ejecuta en navegador web
# o
npx expo start      # Inicia servidor Expo (para móvil y web)
```

## 📱 Funcionalidades Principales

### Frontend
- ✅ Interfaz con Tailwind CSS (NativeWind)
- ✅ Acceso a cámara del dispositivo
- ✅ Servicios de geolocalización (GPS)
- ✅ Acceso a sensores (podómetro)
- ✅ Compatibilidad web y móvil

### Backend
- ✅ API RESTful con Express
- ✅ Autenticación JWT
- ✅ Base de datos PostgreSQL con Sequelize
- ✅ Middleware de seguridad (Helmet, CORS, Rate Limiting)
- ✅ Logging de requests
- ✅ Manejo centralizado de errores

## 🔗 Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Perfil del usuario (requiere token)

### Usuarios
- `GET /api/users/` - Listar usuarios (admin)
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario (admin)

### Health Check
- `GET /health` - Estado del servidor

## 🛠️ Scripts Disponibles

### Backend
```bash
npm start      # Iniciar servidor
npm run dev    # Desarrollo con nodemon
```

### Frontend
```bash
npx start      # Iniciar Expo
npx run web    # Ejecutar en web
npx run android # Ejecutar en Android
npx run ios    # Ejecutar en iOS
```

