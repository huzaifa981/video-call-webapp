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

class MemoryStorage implements IStorage {
  private users: User[] = [];
  private calls: Call[] = [];
  private nextUserId = 1;
  private nextCallId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.nextUserId++,
      isOnline: false,
      socketId: null,
      lastSeen: new Date(),
      createdAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async updateUserStatus(userId: number, isOnline: boolean, socketId?: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.isOnline = isOnline;
      user.socketId = isOnline ? socketId || null : null;
      user.lastSeen = new Date();
    }
  }

  async getOnlineUsers(): Promise<User[]> {
    return this.users.filter(u => u.isOnline);
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async createCall(call: InsertCall): Promise<Call> {
    const newCall: Call = {
      ...call,
      id: this.nextCallId++,
      startedAt: new Date(),
      endedAt: null,
      durationSeconds: null,
      recordingPath: null
    };
    this.calls.push(newCall);
    return newCall;
  }

  async endCall(id: number, duration: number, recordingPath?: string): Promise<void> {
    const call = this.calls.find(c => c.id === id);
    if (call) {
      call.endedAt = new Date();
      call.durationSeconds = duration;
      call.recordingPath = recordingPath || null;
    }
  }

  async getUserCalls(userId: number): Promise<Call[]> {
    return this.calls.filter(c => c.callerId === userId || c.receiverId === userId);
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db!.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserStatus(userId: number, isOnline: boolean, socketId?: string): Promise<void> {
    await db!.update(users)
      .set({ 
        isOnline, 
        socketId: isOnline ? socketId : null,
        lastSeen: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async getOnlineUsers(): Promise<User[]> {
    return await db!.select().from(users).where(eq(users.isOnline, true));
  }

  async getAllUsers(): Promise<User[]> {
    return await db!.select().from(users);
  }

  async createCall(call: InsertCall): Promise<Call> {
    const [newCall] = await db!.insert(calls).values(call).returning();
    return newCall;
  }

  async endCall(id: number, duration: number, recordingPath?: string): Promise<void> {
    await db!.update(calls)
      .set({ 
        endedAt: new Date(),
        durationSeconds: duration,
        recordingPath 
      })
      .where(eq(calls.id, id));
  }

  async getUserCalls(userId: number): Promise<Call[]> {
    return await db!.select()
      .from(calls)
      .where(or(eq(calls.callerId, userId), eq(calls.receiverId, userId)));
  }
}

export const storage = db ? new DatabaseStorage() : new MemoryStorage();
