const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP cada 15 minutos
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.'
});

// Middleware
app.use(limiter);
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Importar y usar rutas aquí cuando las crees
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo salió mal!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
});

// Manejador 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Conexión a la base de datos y inicio del servidor
const startServer = async () => {
  try {
    // Importar la configuración de la base de datos
    const { sequelize } = require('./config/database');
    
    // Testear la conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    
    // Sincronizar la base de datos (crear tablas si no existen)
    await sequelize.sync({ force: false });
    console.log('✅ Base de datos sincronizada correctamente.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;