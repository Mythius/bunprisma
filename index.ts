import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { createCRUD } from "./tools/createCRUD.ts";
import Redis from "ioredis";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const app = new Hono();

// API routes
app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/api", (c) => c.json({ message: "Welcome to the API" }));

// Example: Store and retrieve an object in Redis
app.post("/api/cache/:key", async (c) => {
  const key = c.req.param("key");
  const body = await c.req.json();
  await redis.set(key, JSON.stringify(body));
  return c.json({ success: true, key });
});

app.get("/api/cache/:key", async (c) => {
  const key = c.req.param("key");
  const data = await redis.get(key);
  if (!data) {
    return c.json({ error: "Key not found" }, 404);
  }
  return c.json(JSON.parse(data));
});



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
