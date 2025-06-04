import amqp from 'amqplib';

const RABBIT_URL = process.env.RABBIT_URL || 'amqp://user:password@rabbitmq:5672';

export async function sendReportToQueue(report) {
  const conn = await amqp.connect(RABBIT_URL);
  const channel = await conn.createChannel();
  const queue = 'reportQueue';

  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(report)), { persistent: true });

  setTimeout(() => {
    channel.close();
    conn.close();
  }, 500);
}