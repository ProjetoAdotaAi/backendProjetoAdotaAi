import { PrismaClient } from '@prisma/client';
import admin from '../config/firebase.js'; 

const prisma = new PrismaClient();

export async function saveNotification({ userId, deviceToken, title, body, data }) {
  return await prisma.notification.create({
    data: {
      userId,
      deviceToken,
      title,
      body,
      data,
    },
  });
}

export async function sendNotificationFCM({ deviceToken, title, body, data }) {
  return await admin.messaging().send({
    token: deviceToken,
    notification: { title, body },
    data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
  });
}

export async function handleNotification(notification) {
  await sendNotificationFCM(notification);
  await saveNotification(notification);
}