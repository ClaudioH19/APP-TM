const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la conexión a PostgreSQL (Neon)
const sequelize = new Sequelize(
  process.env.DB_NAME || 'tm_database',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false // Para Neon y otras plataformas cloud
      } : false
    },
    pool: {
      max: 5,          // máximo de conexiones en el pool
      min: 0,          // mínimo de conexiones en el pool
      acquire: 30000,  // tiempo máximo en ms que el pool intentará obtener conexión antes de lanzar error
      idle: 10000      // tiempo máximo en ms que una conexión puede estar inactiva antes de ser liberada
    },
    define: {
      timestamps: true,      // agrega createdAt y updatedAt automáticamente
      underscored: true,     // usa snake_case para nombres de columnas
      freezeTableName: true  // usa el nombre de modelo exacto como nombre de tabla
    }
  }
);

// Función para testear la conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('🔗 Conexión a PostgreSQL establecida correctamente.');
    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
};