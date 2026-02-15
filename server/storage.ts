import { db } from "./db";
import { users, calls, type User, type InsertUser, type Call, type InsertCall } from "@shared/schema";
import { eq, or } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(userId: number, isOnline: boolean, socketId?: string): Promise<void>;
  getOnlineUsers(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
  createCall(call: InsertCall): Promise<Call>;
  endCall(id: number, duration: number, recordingPath?: string): Promise<void>;
  getUserCalls(userId: number): Promise<Call[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserStatus(userId: number, isOnline: boolean, socketId?: string): Promise<void> {
    await db.update(users)
      .set({ 
        isOnline, 
        socketId: isOnline ? socketId : null,
        lastSeen: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async getOnlineUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isOnline, true));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createCall(call: InsertCall): Promise<Call> {
    const [newCall] = await db.insert(calls).values(call).returning();
    return newCall;
  }

  async endCall(id: number, duration: number, recordingPath?: string): Promise<void> {
    await db.update(calls)
      .set({ 
        endedAt: new Date(),
        durationSeconds: duration,
        recordingPath 
      })
      .where(eq(calls.id, id));
  }

  async getUserCalls(userId: number): Promise<Call[]> {
    return await db.select()
      .from(calls)
      .where(or(eq(calls.callerId, userId), eq(calls.receiverId, userId)));
  }
}

export const storage = new DatabaseStorage();
