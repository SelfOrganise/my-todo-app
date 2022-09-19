import moment from 'moment';
import { z } from 'zod';
import { createProtectedRouter } from '../protected-router';

export const todosRouter = createProtectedRouter()
  .query('all', {
    input: z.object({
      categoryId: z.string(),
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.todo.findMany({
        where: {
          done: false,
          userId: ctx.session.user.id,
          categoryId: input.categoryId,
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
      categoryId: z.string(),
      dueDate: z.date().nullish(),
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.todo.create({
        data: {
          userId: ctx.session.user.id,
          content: input.content,
          dueDate: input.dueDate,
          categoryId: input.categoryId,
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
  .mutation('snooze', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ input, ctx }) {
      const todo = await ctx.prisma.todo.findUniqueOrThrow({
        where: {
          id: input.id,
        },
      });

      return await ctx.prisma.todo.update({
        where: {
          id: input.id,
        },
        data: {
          dueDate: moment(todo.dueDate).add(1, 'h').toDate(),
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
          dueDate: input.dueDate || null,
        },
      });
    },
  })
  .mutation('updateCategory', {
    input: z.object({
      id: z.string(),
      categoryId: z.string(),
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.todo.update({
        where: {
          id: input.id,
        },
        data: {
          categoryId: input.categoryId,
        },
      });
    },
  });
