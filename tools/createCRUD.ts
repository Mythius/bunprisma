import { Hono } from "hono";

export interface PrismaDelegate {
  findMany(args?: object): Promise<unknown[]>;
  create(args: { data: unknown }): Promise<unknown>;
  findUnique(args: { where: object }): Promise<unknown | null>;
  update(args: { where: object; data: unknown }): Promise<unknown>;
  delete(args: { where: object }): Promise<unknown>;
}

export function createCRUD(
  app: Hono,
  path: string,
  model: PrismaDelegate
) {
  app.get(path, async (c) => {
    const items = await model.findMany();
    return c.json(items);
  });

  app.post(path, async (c) => {
    const body = await c.req.json();
    const item = await model.create({ data: body });
    return c.json(item, 201);
  });

  app.get(`${path}/:id`, async (c) => {
    const id = parseInt(c.req.param("id"));
    const item = await model.findUnique({ where: { id } });
    if (!item) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(item);
  });

  app.put(`${path}/:id`, async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const item = await model.update({ where: { id }, data: body });
    return c.json(item);
  });

  app.delete(`${path}/:id`, async (c) => {
    const id = parseInt(c.req.param("id"));
    await model.delete({ where: { id } });
    return c.json({ message: "Deleted" });
  });
}
