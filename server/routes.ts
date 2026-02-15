import type { Express } from "express";
import type { Server } from "http";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import MemoryStore from "memorystore";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePassword(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedPasswordBuf = Buffer.from(hashed, "hex");
  const suppliedPasswordBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const SessionStore = MemoryStore(session);
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "replit-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 },
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePassword(password, user.password))) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        avatarColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        return res.status(201).json(user);
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // User Routes
  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getAllUsers();
    // Don't send passwords
    const safeUsers = users.map(({ password, ...u }) => u);
    res.json(safeUsers);
  });

  app.get(api.users.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.sendStatus(404);
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // Call Routes
  app.get(api.calls.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const calls = await storage.getUserCalls((req.user as any).id);
    res.json(calls);
  });

  app.post(api.calls.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const call = await storage.createCall(req.body);
      res.status(201).json(call);
    } catch (err) {
      res.status(500).json({ message: "Failed to create call record" });
    }
  });


  // WebSocket Signaling
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Map socket ID to user ID for easy lookup
  const socketUserMap = new Map<string, number>();

  io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id);

    socket.on("register", async (userId: number) => {
      socketUserMap.set(socket.id, userId);
      await storage.updateUserStatus(userId, true, socket.id);
      socket.broadcast.emit("user-status", { userId, isOnline: true });
    });

    socket.on("call-user", ({ userToCall, signalData, from }) => {
      io.to(userToCall).emit("call-made", { signal: signalData, from });
    });

    socket.on("answer-call", ({ to, signal }) => {
      io.to(to).emit("call-answered", { signal, to });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("end-call", ({ to }) => {
      io.to(to).emit("call-ended");
    });

    socket.on("disconnect", async () => {
      const userId = socketUserMap.get(socket.id);
      if (userId) {
        await storage.updateUserStatus(userId, false);
        socket.broadcast.emit("user-status", { userId, isOnline: false });
        socketUserMap.delete(socket.id);
      }
    });
  });

  return httpServer;
}

// Seed function
async function seedDatabase() {
  const users = await storage.getAllUsers();
  if (users.length === 0) {
    const hashedPassword = await hashPassword("password123");
    await storage.createUser({
      username: "alice",
      password: hashedPassword,
      avatarColor: "hsl(120, 70%, 50%)",
    });
    await storage.createUser({
      username: "bob",
      password: hashedPassword,
      avatarColor: "hsl(200, 70%, 50%)",
    });
    await storage.createUser({
      username: "charlie",
      password: hashedPassword,
      avatarColor: "hsl(300, 70%, 50%)",
    });
  }
}

// Run seed
seedDatabase().catch(console.error);
