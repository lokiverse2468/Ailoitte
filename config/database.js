const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    define: {
      underscored: true,
      underscoredAll: true
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 1000
    }
  });
} else {
  const dbPassword = String(process.env.DB_PASSWORD || '');

  if (!process.env.DB_NAME || !process.env.DB_USER || !dbPassword) {
    process.exit(1);
  }

  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    dbPassword,
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      dialect: 'postgres',
      logging: false,
      define: {
        underscored: true,
        underscoredAll: true
      },
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
        evict: 1000
      }
    }
  );
}

module.exports = sequelize;

