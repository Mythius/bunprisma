import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { createCRUD } from "./tools/createCRUD.ts";
import { expose } from "./tools/listEndpoints.ts";
import Redis from "ioredis";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const app = new Hono();
expose(app);

// API routes
app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/api", (c) => c.json({ message: "Welcome to the API" }));

app.use("/api/*", async (c, next) => {
  await next();
});

createCRUD(app, "/api/user", prisma.user);

// Serve static files from public/
app.use("/*", serveStatic({ root: "./public" }));

export default {
  port: 3000,
  fetch: app.fetch,
};
