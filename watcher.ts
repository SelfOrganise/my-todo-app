import * as OneSignal from 'onesignal-node';
import { prisma } from './src/server/db/client';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const signal = new OneSignal.Client(process.env.ONE_SIGNAL_APP!, process.env.ONE_SIGNAL_KEY!);

async function sendNotification(todo: Awaited<ReturnType<typeof getTodos>>[number]) {
  await signal
    .createNotification({
      chrome_web_icon: 'https://todo.3pounds.cyou/favicon.ico',
      contents: {
        en: todo.content,
      },
      include_external_user_ids: [todo.user.id],
      web_buttons: [
        { id: `snooze@${todo.id}`, text: 'Snooze' },
        { id: `complete@${todo.id}`, text: 'Complete' },
      ],
    })
    .then(async () => {
      console.log(`Notified: ${todo.user.email} - ${todo.id}`);
    })
    .catch(console.error);
}

async function getTodos() {
  const lastRunTime = await getLastRunTime();
  return await prisma.todo.findMany({
    where: {
      dueDate: {
        lte: new Date(),
        gte: lastRunTime,
      },
    },
    select: {
      id: true,
      content: true,
      user: true,
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
  const todos = await getTodos();
  if (!todos || todos.length === 0) return;

  for (const todo of todos) {
    await sendNotification(todo);
  }

  await updateLastRunTime();
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
}, parseInt(process.env.NOTIFICATION_CHECK_INTERVAL!) || 60 * 1000);
