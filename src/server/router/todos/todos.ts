import { createRouter } from '../context';
import { z } from 'zod';

export const todosRouter = createRouter()
  .query('all', {
    async resolve({ ctx }) {
      return await ctx.prisma.todo.findMany({
        where: {
          done: false,
        },
        orderBy: {
          dueDate: 'asc',
        },
      });
    },
  })
  .mutation('add', {
    input: z.object({
      content: z.string(),
      dueDate: z.date().nullish(),
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.todo.create({
        data: {
          content: input.content,
          dueDate: input.dueDate,
        },
      });
    },
  })
  .mutation('complete', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.todo.update({
        where: {
          id: input.id,
        },
        data: {
          done: true,
          modifiedAt: new Date(),
          doneAt: new Date(),
        },
      });
    },
  })
  .mutation('undo', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.todo.update({
        where: {
          id: input.id,
        },
        data: {
          done: false,
          modifiedAt: new Date(),
          doneAt: null,
        },
      });
    },
  })
  .mutation('update', {
    input: z.object({
      id: z.string(),
      content: z.string(),
      dueDate: z.date().nullish(),
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.todo.update({
        where: {
          id: input.id,
        },
        data: {
          content: input.content,
          modifiedAt: new Date(),
          dueDate: input.dueDate,
        },
      });
    },
  });
