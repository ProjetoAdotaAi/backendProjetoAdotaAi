import notificationService from '../services/notificationService.js';
import webSocketService from '../services/webSocketService.js';
import { logger } from '../utils/logger.js';

class NotificationController {

  /**
   * Lista notificações do usuário
   * GET /notifications
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id; // Vem do middleware de autenticação
      const { page = 1, limit = 20, onlyUnread = false } = req.query;

      const result = await notificationService.getUserNotifications(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        onlyUnread: onlyUnread === 'true',
      });

      res.json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
      });

    } catch (error) {
      logger.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar notificações',
        error: error.message,
      });
    }
  }

  /**
   * Marca notificação como lida
   * PATCH /notifications/:id/read
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await notificationService.markAsRead(id, userId);

      res.json({
        success: true,
        message: 'Notificação marcada como lida',
      });

    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao marcar notificação como lida',
        error: error.message,
      });
    }
  }

  /**
   * Marca todas as notificações como lidas
   * PATCH /notifications/read-all
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `${result.count} notificações marcadas como lidas`,
        data: { updatedCount: result.count },
      });

    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao marcar todas as notificações como lidas',
        error: error.message,
      });
    }
  }

  /**
   * Deleta uma notificação
   * DELETE /notifications/:id
   */
  async deleteNotification(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await notificationService.deleteNotification(id, userId);

      res.json({
        success: true,
        message: 'Notificação deletada com sucesso',
      });

    } catch (error) {
      logger.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao deletar notificação',
        error: error.message,
      });
    }
  }

  /**
   * Conta notificações não lidas
   * GET /notifications/unread-count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count },
      });

    } catch (error) {
      logger.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao contar notificações não lidas',
        error: error.message,
      });
    }
  }

  /**
   * Cria uma notificação (para testes ou uso interno)
   * POST /notifications
   */
  async createNotification(req, res) {
    try {
      const { userId, type, title, message, data } = req.body;

      const notification = await notificationService.createNotification({
        userId,
        type,
        title,
        message,
        data,
      });

      // Envia via WebSocket
      webSocketService.sendGenericNotification(userId, notification);

      res.status(201).json({
        success: true,
        message: 'Notificação criada com sucesso',
        data: notification,
      });

    } catch (error) {
      logger.error('Error creating notification:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao criar notificação',
        error: error.message,
      });
    }
  }

  /**
   * Estatísticas do WebSocket (para admin)
   * GET /notifications/stats
   */
  async getWebSocketStats(req, res) {
    try {
      const stats = webSocketService.getStats();

      res.json({
        success: true,
        data: stats,
      });

    } catch (error) {
      logger.error('Error getting WebSocket stats:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: error.message,
      });
    }
  }

  /**
   * Envia notificação de teste via WebSocket
   * POST /notifications/test
   */
  async sendTestNotification(req, res) {
    try {
      const { userId, title = 'Teste', message = 'Notificação de teste' } = req.body;

      // Cria a notificação no banco
      const notification = await notificationService.createNotification({
        userId,
        type: 'USER_MESSAGE',
        title,
        message,
        data: { test: true },
      });

      // Envia via WebSocket
      const sent = webSocketService.sendGenericNotification(userId, notification);

      res.json({
        success: true,
        message: 'Notificação de teste enviada',
        data: {
          notification,
          websocketSent: sent,
        },
      });

    } catch (error) {
      logger.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar notificação de teste',
        error: error.message,
      });
    }
  }
}

export default new NotificationController();
