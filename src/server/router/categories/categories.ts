import { z } from 'zod';
import { createProtectedRouter } from '../protected-router';

export const categoriesRouter = createProtectedRouter()
  .query('all', {
    async resolve({ ctx }) {
      return await ctx.prisma.category.findMany({
        where: {
          userId: ctx.session.user.id,
        },
      });
    },
  })
  .mutation('create', {
    input: z.object({
      title: z.string(),
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.category.create({
        data: {
          title: input.title,
          userId: ctx.session.user.id,
        },
      });
    },
  })
  .mutation('update', {
    input: z.object({
      id: z.string(),
      title: z.string(),
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.category.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.title,
          userId: ctx.session.user.id,
        },
      });
    },
  });
