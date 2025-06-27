import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupEventHandlers();
    logger.info('WebSocket service initialized');
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Cliente conectado: ${socket.id}`);

      // Registra usuário
      socket.on('register', (data) => {
        const { userId } = data;
        if (userId) {
          this.connectedUsers.set(userId, socket.id);
          socket.userId = userId;
          logger.info(`Usuário ${userId} registrado no socket ${socket.id}`);
          
          // Envia confirmação
          socket.emit('registered', { success: true, userId });
        }
      });

      // Marca notificação como lida via WebSocket
      socket.on('mark_read', (data) => {
        const { notificationId } = data;
        // Aqui você pode chamar o serviço para marcar como lida
        logger.info(`Notificação ${notificationId} marcada como lida via WebSocket`);
      });

      // Desconexão
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          logger.info(`Usuário ${socket.userId} desconectado`);
        } else {
          logger.info(`Cliente ${socket.id} desconectado`);
        }
      });
    });
  }

  /**
   * Envia notificação para um usuário específico
   */
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(event, data);
        logger.info(`Notificação enviada para usuário ${userId}`, { event, data });
        return true;
      }
    }
    
    logger.warn(`Usuário ${userId} não está conectado`);
    return false;
  }

  /**
   * Envia notificação de report processado
   */
  sendReportProcessedNotification(userId, notificationData) {
    return this.sendToUser(userId, 'report_processed', {
      id: notificationData.id,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      createdAt: notificationData.createdAt,
    });
  }

  /**
   * Envia notificação genérica
   */
  sendGenericNotification(userId, notificationData) {
    return this.sendToUser(userId, 'notification', {
      id: notificationData.id,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data,
      createdAt: notificationData.createdAt,
    });
  }

  /**
   * Envia broadcast para todos os usuários conectados
   */
  broadcast(event, data) {
    this.io.emit(event, data);
    logger.info(`Broadcast enviado`, { event, connectedUsers: this.connectedUsers.size });
  }

  /**
   * Obtém estatísticas dos usuários conectados
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalSockets: this.io.sockets.sockets.size,
      users: Array.from(this.connectedUsers.keys()),
    };
  }
}

export default new WebSocketService();
