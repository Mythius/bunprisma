import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const app = new Hono();

// API routes
app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/users", async (c) => {
  const users = await prisma.user.findMany();
  return c.json(users);
});

app.post("/users", async (c) => {
  const body = await c.req.json<{ email: string; name?: string }>();
  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
    },
  });
  return c.json(user, 201);
});

app.get("/users/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }
  return c.json(user);
});

// Serve static files from public/
app.use("/*", serveStatic({ root: "./public" }));

export default {
  port: 3000,
  fetch: app.fetch,
};
