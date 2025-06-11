import amqp from "amqplib";
import { handleNotification } from "../services/notificationService.js";

const QUEUE = "notificationQueue";

export async function startConsumer(rabbitUrl) {
  const conn = await amqp.connect(rabbitUrl);
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });

  channel.consume(QUEUE, async (msg) => {
    // Adicione este log para depuração:
    console.log("Mensagem recebida na fila:", msg?.content?.toString());

    if (msg !== null) {
      const notification = JSON.parse(msg.content.toString());
      try {
        await handleNotification(notification);
        console.log("Notificação enviada e salva:", notification);
      } catch (err) {
        console.error("Erro ao processar notificação:", err);
      }
      channel.ack(msg);
    }
  });

  console.log("Consumidor de notificações iniciado!");
}