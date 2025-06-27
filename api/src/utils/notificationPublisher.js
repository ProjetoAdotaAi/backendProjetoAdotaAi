import amqp from 'amqplib';

class NotificationPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      if (!this.connection) {
        this.connection = await amqp.connect(process.env.RABBIT_URL);
        this.channel = await this.connection.createChannel();
        
        // Setup de reconexão
        this.connection.on('error', () => {
          this.connection = null;
          this.channel = null;
        });
      }
    } catch (error) {
      console.error('Erro ao conectar no RabbitMQ:', error);
      throw error;
    }
  }

  async publishNotification(data) {
    try {
      await this.connect();
      
      const queueName = 'notifications'; 
      
      await this.channel.assertQueue(queueName, { durable: true });
      
      const message = Buffer.from(JSON.stringify(data));
      
      this.channel.sendToQueue(queueName, message, { persistent: true });
      
      console.log('Notificação enviada para a fila:', data);
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      throw error;
    }
  }

  /**
   * Envia notificação de report processado
   */
  async sendReportProcessedNotification({ userId, reportId, petId, petName, action }) {
    const notification = {
      type: 'report_processed',
      userId,
      reportId,
      petId,
      petName,
      action,
      timestamp: new Date().toISOString(),
    };

    await this.publishNotification(notification);
  }

  /**
   * Envia notificação de pet adotado
   */
  async sendPetAdoptedNotification({ userId, petId, petName, adopter }) {
    const notification = {
      type: 'pet_adopted',
      userId,
      petId,
      petName,
      adopter,
      timestamp: new Date().toISOString(),
    };

    await this.publishNotification(notification);
  }

  /**
   * Envia mensagem personalizada
   */
  async sendUserMessage({ userId, title, message, data = null }) {
    const notification = {
      type: 'user_message',
      userId,
      title,
      message,
      extraData: data,
      timestamp: new Date().toISOString(),
    };

    await this.publishNotification(notification);
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

export default new NotificationPublisher();
