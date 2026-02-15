import { mssqlTable, varchar, int, bit, datetime2, text } from "drizzle-orm/mssql-core";
// Commented out due to beta version incompatibility
// import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mssqlTable("users", {
  id: int("id").primaryKey().identity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  avatarColor: varchar("avatar_color", { length: 50 }).notNull().default("#000000"),
  createdAt: datetime2("created_at"),
  lastSeen: datetime2("last_seen"),
  isOnline: bit("is_online").notNull().default(false),
  socketId: varchar("socket_id", { length: 255 }),
});

export const calls = mssqlTable("calls", {
  id: int("id").primaryKey().identity(),
  callerId: int("caller_id").notNull(),
  receiverId: int("receiver_id").notNull(),
  startedAt: datetime2("started_at"),
  endedAt: datetime2("ended_at"),
  durationSeconds: int("duration_seconds"),
  recordingPath: varchar("recording_path", { length: 1024 }),
});

// Relations commented out due to Drizzle beta version incompatibility
/*
export const usersRelations = relations(users, ({ many }) => ({
  callsInitiated: many(calls, { relationName: "caller" }),
  callsReceived: many(calls, { relationName: "receiver" }),
}));

export const callsRelations = relations(calls, ({ one }) => ({
  caller: one(users, {
    fields: [calls.callerId],
    references: [users.id],
    relationName: "caller",
  }),
  receiver: one(users, {
    fields: [calls.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));
*/

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
  isOnline: true,
  socketId: true
});

export const insertCallSchema = createInsertSchema(calls).omit({
  id: true,
  startedAt: true,
  endedAt: true
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;

// API Types
export type LoginRequest = { email: string; password: string };
export type AuthResponse = User;
