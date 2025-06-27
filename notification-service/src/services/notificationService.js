import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

class NotificationService {
  
  /**
   * Cria uma nova notificação no banco de dados
   */
  async createNotification({ userId, type, title, message, data = null }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data,
        },
      });

      logger.info(`Notificação criada para usuário ${userId}`, {
        notificationId: notification.id,
        type,
      });

      return notification;
    } catch (error) {
      logger.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  /**
   * Busca notificações de um usuário com paginação
   */
  async getUserNotifications(userId, { page = 1, limit = 20, onlyUnread = false } = {}) {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        userId,
        ...(onlyUnread && { read: false }),
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Erro ao buscar notificações:', error);
      throw error;
    }
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId, // Garante que só pode marcar suas próprias notificações
        },
        data: {
          read: true,
        },
      });

      if (notification.count === 0) {
        throw new Error('Notificação não encontrada');
      }

      logger.info(`Notificação ${notificationId} marcada como lida`);
      return notification;
    } catch (error) {
      logger.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  /**
   * Marca todas as notificações de um usuário como lidas
   */
  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
        },
      });

      logger.info(`${result.count} notificações marcadas como lidas para usuário ${userId}`);
      return result;
    } catch (error) {
      logger.error('Erro ao marcar todas as notificações como lidas:', error);
      throw error;
    }
  }

  /**
   * Deleta uma notificação
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId, // Garante que só pode deletar suas próprias notificações
        },
      });

      if (notification.count === 0) {
        throw new Error('Notificação não encontrada');
      }

      logger.info(`Notificação ${notificationId} deletada`);
      return notification;
    } catch (error) {
      logger.error('Erro ao deletar notificação:', error);
      throw error;
    }
  }

  /**
   * Conta notificações não lidas de um usuário
   */
  async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      });

      return count;
    } catch (error) {
      logger.error('Erro ao contar notificações não lidas:', error);
      throw error;
    }
  }

  /**
   * Processa notificação de report (primeira implementação)
   */
  async processReportNotification(data) {
    const { userId, reportId, petId, petName, action } = data;

    let title, message;
    
    if (action === 'REMOVER') {
      title = 'Pet Removido';
      message = `Obrigado pelo seu report! O pet ${petName} foi removido da plataforma.`;
    } else if (action === 'INATIVAR') {
      title = 'Pet Inativado';
      message = `Obrigado pelo seu report! O pet ${petName} foi marcado como inativo.`;
    } else {
      title = 'Report Processado';
      message = `Seu report sobre o pet ${petName} foi processado.`;
    }

    // Salva a notificação no banco
    const notification = await this.createNotification({
      userId,
      type: 'REPORT_PROCESSED',
      title,
      message,
      data: {
        reportId,
        petId,
        petName,
        action,
      },
    });

    return notification;
  }

  /**
   * Gerencia templates de notificação
   */
  async getTemplate(type) {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { type },
      });
      return template;
    } catch (error) {
      logger.error('Erro ao buscar template:', error);
      throw error;
    }
  }

  /**
   * Cria templates padrão
   */
  async seedTemplates() {
    try {
      const templates = [
        {
          type: 'REPORT_PROCESSED',
          title: 'Report Processado',
          message: 'Obrigado pelo seu report! O pet {petName} foi {action}.',
        },
        {
          type: 'PET_ADOPTED',
          title: 'Pet Adotado',
          message: 'Parabéns! Seu pet {petName} foi adotado!',
        },
        {
          type: 'USER_MESSAGE',
          title: 'Nova Mensagem',
          message: 'Você recebeu uma nova mensagem.',
        },
      ];

      for (const template of templates) {
        await prisma.notificationTemplate.upsert({
          where: { type: template.type },
          update: template,
          create: template,
        });
      }

      logger.info('Templates de notificação criados/atualizados');
    } catch (error) {
      logger.error('Erro ao criar templates:', error);
      throw error;
    }
  }
}

export default new NotificationService();
