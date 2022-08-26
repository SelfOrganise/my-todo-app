import { createRouter } from "../context";
import { z } from "zod";

export const todosRouter = createRouter()
  .query("all", {
    async resolve({ ctx }) {
      return await ctx.prisma.todo.findMany();
    },
  })
  .mutation("add", {
    input: z.object({
      content: z.string(),
      dueDate: z.date().nullish()
    }),
    async resolve({ input, ctx }) {
      return await ctx.prisma.todo.create({
        data: {
          content: input.content,
          dueDate: input.dueDate
        }
      });
    },
  });
