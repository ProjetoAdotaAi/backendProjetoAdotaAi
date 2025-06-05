import amqp from 'amqplib';

const RABBIT_URL = process.env.RABBIT_URL;
const queue = 'reportQueue';

export async function consumeReports(callback) {
  const conn = await amqp.connect(RABBIT_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(queue, { durable: true });
  channel.consume(queue, async (msg) => {
    if (msg !== null) {
      const report = JSON.parse(msg.content.toString());
      await callback(report);
      channel.ack(msg);
    }
  });
  console.log('Consumer conectado à fila:', queue);
}