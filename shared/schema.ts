import { pgTable, text, serial, integer, boolean, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatarColor: text("avatar_color").notNull().default("#000000"),
  createdAt: timestamp("created_at").defaultNow(),
  lastSeen: timestamp("last_seen"),
  isOnline: boolean("is_online").default(false),
  socketId: text("socket_id"),
});

export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  callerId: integer("caller_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),
  recordingPath: text("recording_path"),
});

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
export type LoginRequest = { username: string; password: string };
export type AuthResponse = User;
