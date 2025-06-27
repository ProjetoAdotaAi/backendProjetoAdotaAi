import amqp from 'amqplib';
import { logger } from '../utils/logger.js';
import notificationService from './notificationService.js';
import webSocketService from './webSocketService.js';

class RabbitMQConsumer {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBIT_URL);
      this.channel = await this.connection.createChannel();

      // Setup de reconexão automática
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
        this.reconnect();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed, attempting reconnect...');
        this.isConnected = false;
        this.reconnect();
      });

      this.isConnected = true;
      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ:', error);
      this.reconnect();
    }
  }

  async reconnect() {
    logger.info('Attempting to reconnect to RabbitMQ in 5 seconds...');
    setTimeout(() => {
      this.connect().then(() => {
        this.setupConsumers();
      });
    }, 5000);
  }

  async setupConsumers() {
    try {
      const queueName = process.env.NOTIFICATION_QUEUE || 'notifications';
      
      // Declara a fila
      await this.channel.assertQueue(queueName, { durable: true });
      
      // Configura prefetch
      await this.channel.prefetch(1);

      // Inicia o consumo
      await this.channel.consume(queueName, async (message) => {
        if (message) {
          await this.processMessage(message);
        }
      });

      logger.info(`Started consuming from queue: ${queueName}`);
    } catch (error) {
      logger.error('Error setting up consumers:', error);
    }
  }

  async processMessage(message) {
    try {
      const content = message.content.toString();
      const data = JSON.parse(content);

      logger.info('Processing notification message:', {
        type: data.type,
        userId: data.userId,
      });

      // Processa diferentes tipos de notificação
      let notification;
      
      switch (data.type) {
        case 'report_processed':
          notification = await this.handleReportProcessed(data);
          break;
        case 'pet_adopted':
          notification = await this.handlePetAdopted(data);
          break;
        case 'user_message':
          notification = await this.handleUserMessage(data);
          break;
        default:
          logger.warn(`Unknown notification type: ${data.type}`);
          this.channel.ack(message);
          return;
      }

      // Se a notificação foi criada, envia via WebSocket
      if (notification) {
        this.sendWebSocketNotification(notification, data.type);
      }

      // Confirma o processamento
      this.channel.ack(message);
      logger.info('Message processed successfully');

    } catch (error) {
      logger.error('Error processing message:', error);
      
      // Rejeita a mensagem e a coloca de volta na fila
      this.channel.nack(message, false, true);
    }
  }

  /**
   * Processa notificação de report
   */
  async handleReportProcessed(data) {
    try {
      const notification = await notificationService.processReportNotification(data);
      return notification;
    } catch (error) {
      logger.error('Error handling report processed notification:', error);
      throw error;
    }
  }

  /**
   * Processa notificação de pet adotado
   */
  async handlePetAdopted(data) {
    try {
      const { userId, petId, petName, adopter } = data;

      const notification = await notificationService.createNotification({
        userId,
        type: 'PET_ADOPTED',
        title: 'Pet Adotado!',
        message: `Parabéns! Seu pet ${petName} foi adotado!`,
        data: {
          petId,
          petName,
          adopter,
        },
      });

      return notification;
    } catch (error) {
      logger.error('Error handling pet adopted notification:', error);
      throw error;
    }
  }

  /**
   * Processa mensagem do usuário
   */
  async handleUserMessage(data) {
    try {
      const { userId, title, message, extraData } = data;

      const notification = await notificationService.createNotification({
        userId,
        type: 'USER_MESSAGE',
        title,
        message,
        data: extraData,
      });

      return notification;
    } catch (error) {
      logger.error('Error handling user message notification:', error);
      throw error;
    }
  }

  /**
   * Envia notificação via WebSocket
   */
  sendWebSocketNotification(notification, originalType) {
    switch (originalType) {
      case 'report_processed':
        webSocketService.sendReportProcessedNotification(
          notification.userId, 
          notification
        );
        break;
      default:
        webSocketService.sendGenericNotification(
          notification.userId, 
          notification
        );
    }
  }

  async start() {
    await this.connect();
    await this.setupConsumers();
  }

  async stop() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.isConnected = false;
    logger.info('RabbitMQ consumer stopped');
  }
}

export default new RabbitMQConsumer();
