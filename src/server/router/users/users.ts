import { createRouter } from '../context';
import { z } from 'zod';

export const usersRouter = createRouter().mutation('create', {
  input: z.object({
    email: z.string(),
    password: z.string(),
  }),
  async resolve({ input, ctx }) {
    return await ctx.prisma.user.create({
      data: {
        email: input.email,
        password: input.password,
      },
    });
  },
});
