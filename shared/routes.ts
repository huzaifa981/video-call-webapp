import { z } from "zod";
import { insertUserSchema, insertCallSchema, users, calls } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: "POST",
      path: "/api/register",
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: "POST",
      path: "/api/login",
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: "POST",
      path: "/api/logout",
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: "GET",
      path: "/api/user",
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  users: {
    list: {
      method: "GET",
      path: "/api/users",
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    get: {
      method: "GET",
      path: "/api/users/:id",
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  calls: {
    list: {
      method: "GET",
      path: "/api/calls",
      responses: {
        200: z.array(z.custom<typeof calls.$inferSelect>()),
      },
    },
    create: {
      method: "POST",
      path: "/api/calls",
      input: insertCallSchema,
      responses: {
        201: z.custom<typeof calls.$inferSelect>(),
      },
    },
  },
} as const;
