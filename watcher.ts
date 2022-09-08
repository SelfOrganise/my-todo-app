import * as OneSignal from 'onesignal-node';
import { prisma } from './src/server/db/client';

const signal = new OneSignal.Client(process.env.ONE_SIGNAL_APP!, process.env.ONE_SIGNAL_KEY!);

async function sendNotification(userIds: Array<string>) {
  await signal
    .createNotification({
      contents: {
        en: 'You have due todos',
      },
      include_external_user_ids: userIds,
    })
    .then(async () => {
      console.log('Notified: ', userIds.join(', '));
      await updateLastRunTime();
    })
    .catch(console.error);
}

async function getUsers() {
  const lastRunTime = await getLastRunTime();
  return await prisma.todo.groupBy({
    by: ['userId'],
    where: {
      dueDate: {
        lte: new Date(),
        gte: lastRunTime,
      },
    },
  });
}

async function getLastRunTime() {
  let first = await prisma.lastNotificationCheck.findFirst();
  if (first) {
    return first.date;
  }

  first = await prisma.lastNotificationCheck.create({
    data: {
      date: new Date(),
    },
  });

  return first.date;
}

async function updateLastRunTime() {
  await prisma.lastNotificationCheck.updateMany({
    data: {
      date: new Date(),
    },
  });
}

console.log('Started watcher 👀');

setInterval(async () => {
  const users = await getUsers();
  if (!users || users.length === 0) return;

  await sendNotification(users.map(u => u.userId));
}, parseInt(process.env.NOTIFICATION_CHECK_INTERVAL!) || 60 * 1000);
