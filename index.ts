import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // GET /users - List all users
    if (url.pathname === "/users" && req.method === "GET") {
      const users = await prisma.user.findMany();
      return Response.json(users);
    }

    // POST /users - Create a user
    if (url.pathname === "/users" && req.method === "POST") {
      const body = (await req.json()) as { email: string; name?: string };
      const user = await prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
        },
      });
      return Response.json(user, { status: 201 });
    }

    // GET /users/:id - Get a user by ID
    const userMatch = url.pathname.match(/^\/users\/(\d+)$/);
    if (userMatch && req.method === "GET") {
      const id = parseInt(userMatch[1]!);
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }
      return Response.json(user);
    }

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
