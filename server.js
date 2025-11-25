require('dotenv').config();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production_min_32_chars';
}

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { sequelize } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { swaggerUi, specs } = require('./swagger/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }'
}));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();

    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
      });
    }
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
} else {
  sequelize.authenticate().catch(() => {});
}

module.exports = app;

