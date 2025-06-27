import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import { logger } from './utils/logger.js';
import notificationRoutes from './routes/notifications.js';
import webSocketService from './services/webSocketService.js';
import rabbitMQConsumer from './services/rabbitMQConsumer.js';
import notificationService from './services/notificationService.js';
import { swaggerUi, specs } from './config/swagger.js';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela
  message: {
    success: false,
    message: 'Muitas requisições, tente novamente em 15 minutos',
  },
});

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/notifications', notificationRoutes);

// Rota de health check
app.get('/health', async (req, res) => {
  try {
    // Verifica conexão com o banco
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      message: 'Notification service is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      websocketStats: webSocketService.getStats(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Service unhealthy',
      error: error.message,
    });
  }
});

// Rota para informações do serviço
app.get('/', (req, res) => {
  res.json({
    service: 'AdotaAi Notification Service',
    version: '1.0.0',
    description: 'Microserviço de notificações em tempo real',
    endpoints: {
      notifications: '/api/notifications',
      health: '/health',
      websocket: 'ws://localhost:3003',
      documentation: '/swagger',
    },
  });
});

// Swagger documentation (deve vir antes do middleware 404)
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AdotaAi Notification Service API',
}));

// Middleware de erro global
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl,
  });
});

// Inicialização do servidor
async function startServer() {
  try {
    const PORT = process.env.PORT || 3003;

    // Inicializa WebSocket
    webSocketService.initialize(server);

    // Conecta ao banco de dados
    await prisma.$connect();
    logger.info('Connected to database');

    // Cria templates padrão
    await notificationService.seedTemplates();

    // Inicia consumer do RabbitMQ
    await rabbitMQConsumer.start();

    // Inicia o servidor
    server.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`);
      logger.info(`WebSocket endpoint: ws://localhost:${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  await rabbitMQConsumer.stop();
  await prisma.$disconnect();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  await rabbitMQConsumer.stop();
  await prisma.$disconnect();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Trata erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Inicia o servidor
startServer();
