import { createServer } from "http";
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
const httpServer = createServer(app);

// Basic middleware matching server/index.ts
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }
            console.log(logLine);
        }
    });

    next();
});

// Register routes
// This function sets up passport, session, API routes, and Socket.IO
// Note: Socket.IO will likely not work in Vercel Serverless environment
await registerRoutes(httpServer, app);

// Export the Express app as the Vercel serverless function
export default app;
