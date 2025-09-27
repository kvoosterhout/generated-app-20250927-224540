import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { jwt, sign } from 'hono/jwt'
import type { Env } from './core-utils';
import { CustomerEntity, ProjectEntity, TimeEntryEntity, UserEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
// Schemas
const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
});
const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  customerId: z.string().nullable(),
  budgetHours: z.coerce.number().positive().nullable(),
});
const timeEntrySchema = z.object({
    projectId: z.string().min(1, "Project is required"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in Y-M-D format"),
    duration: z.number().int().positive("Duration must be a positive number of minutes"),
    description: z.string().min(1, "Description is required"),
    invoiceable: z.boolean(),
    wbso: z.boolean(),
});
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
// Hashing utility
async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // AUTH ROUTES (PUBLIC)
  app.post('/api/auth/register', zValidator('json', registerSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const user = new UserEntity(c.env, email);
    if (await user.exists()) {
      return bad(c, 'User with this email already exists.');
    }
    const hashedPassword = await hashPassword(password);
    const newUser = { id: crypto.randomUUID(), email, hashedPassword, createdAt: new Date().toISOString() };
    await UserEntity.create(c.env, newUser);
    return ok(c, { id: newUser.id, email: newUser.email });
  });
  app.post('/api/auth/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const userEntity = new UserEntity(c.env, email);
    if (!await userEntity.exists()) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    const user = await userEntity.getState();
    const hashedPassword = await hashPassword(password);
    if (user.hashedPassword !== hashedPassword) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    const payload = { sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }; // 7 days
    const secret = c.env.JWT_SECRET || 'a-secure-secret-for-dev';
    const token = await sign(payload, secret);
    return ok(c, { user: { id: user.id, email: user.email, createdAt: user.createdAt }, token });
  });
  // AUTH MIDDLEWARE
  app.use('/api/*', async (c, next) => {
    if (c.req.path.startsWith('/api/auth/')) {
      return next();
    }
    const auth = jwt({ secret: c.env.JWT_SECRET || 'a-secure-secret-for-dev' });
    return auth(c, next);
  });
  // PROTECTED ROUTES
  // CUSTOMERS
  app.get('/api/customers', async (c) => {
    const payload = c.get('jwtPayload');
    const { items } = await CustomerEntity.list(c.env);
    const userItems = items.filter(item => item.userId === payload.sub);
    return ok(c, userItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });
  app.post('/api/customers', zValidator('json', customerSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const { name } = c.req.valid('json');
    const customer = { id: crypto.randomUUID(), name, userId: payload.sub, createdAt: new Date().toISOString() };
    return ok(c, await CustomerEntity.create(c.env, customer));
  });
  app.put('/api/customers/:id', zValidator('json', customerSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const { id } = c.req.param();
    const { name } = c.req.valid('json');
    const customer = new CustomerEntity(c.env, id);
    if (!await customer.exists()) return notFound(c);
    const state = await customer.getState();
    if (state.userId !== payload.sub) return c.json({ success: false, error: 'Forbidden' }, 403);
    await customer.patch({ name });
    return ok(c, await customer.getState());
  });
  app.delete('/api/customers/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const { id } = c.req.param();
    const customer = new CustomerEntity(c.env, id);
    if (!await customer.exists()) return notFound(c);
    const state = await customer.getState();
    if (state.userId !== payload.sub) return c.json({ success: false, error: 'Forbidden' }, 403);
    const deleted = await CustomerEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // PROJECTS
  app.get('/api/projects', async (c) => {
    const payload = c.get('jwtPayload');
    const { items } = await ProjectEntity.list(c.env);
    const userItems = items.filter(item => item.userId === payload.sub);
    return ok(c, userItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });
  app.post('/api/projects', zValidator('json', projectSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const { name, customerId, budgetHours } = c.req.valid('json');
    const project = { id: crypto.randomUUID(), name, customerId, budgetHours, userId: payload.sub, createdAt: new Date().toISOString() };
    return ok(c, await ProjectEntity.create(c.env, project));
  });
  app.put('/api/projects/:id', zValidator('json', projectSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const { id } = c.req.param();
    const { name, customerId, budgetHours } = c.req.valid('json');
    const project = new ProjectEntity(c.env, id);
    if (!await project.exists()) return notFound(c);
    const state = await project.getState();
    if (state.userId !== payload.sub) return c.json({ success: false, error: 'Forbidden' }, 403);
    await project.patch({ name, customerId, budgetHours });
    return ok(c, await project.getState());
  });
  app.delete('/api/projects/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const { id } = c.req.param();
    const project = new ProjectEntity(c.env, id);
    if (!await project.exists()) return notFound(c);
    const state = await project.getState();
    if (state.userId !== payload.sub) return c.json({ success: false, error: 'Forbidden' }, 403);
    const deleted = await ProjectEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
  // TIME ENTRIES
  app.get('/api/time-entries', async (c) => {
    const payload = c.get('jwtPayload');
    const { startDate, endDate, projectId, customerId, invoiceable, wbso } = c.req.query();
    let { items: timeEntries } = await TimeEntryEntity.list(c.env);
    timeEntries = timeEntries.filter(e => e.userId === payload.sub);
    if (startDate) timeEntries = timeEntries.filter(e => e.date >= startDate);
    if (endDate) timeEntries = timeEntries.filter(e => e.date <= endDate);
    if (projectId) timeEntries = timeEntries.filter(e => e.projectId === projectId);
    if (invoiceable) timeEntries = timeEntries.filter(e => e.invoiceable === (invoiceable === 'true'));
    if (wbso) timeEntries = timeEntries.filter(e => e.wbso === (wbso === 'true'));
    if (customerId) {
      const { items: allProjects } = await ProjectEntity.list(c.env);
      const projectsForCustomer = allProjects.filter(p => p.customerId === customerId && p.userId === payload.sub).map(p => p.id);
      const projectSet = new Set(projectsForCustomer);
      timeEntries = timeEntries.filter(e => projectSet.has(e.projectId));
    }
    return ok(c, timeEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });
  app.post('/api/time-entries', zValidator('json', timeEntrySchema), async (c) => {
    const payload = c.get('jwtPayload');
    const body = c.req.valid('json');
    const timeEntry = { ...body, id: crypto.randomUUID(), userId: payload.sub, createdAt: new Date().toISOString() };
    return ok(c, await TimeEntryEntity.create(c.env, timeEntry));
  });
  app.put('/api/time-entries/:id', zValidator('json', timeEntrySchema), async (c) => {
    const payload = c.get('jwtPayload');
    const { id } = c.req.param();
    const body = c.req.valid('json');
    const timeEntry = new TimeEntryEntity(c.env, id);
    if (!await timeEntry.exists()) return notFound(c);
    const state = await timeEntry.getState();
    if (state.userId !== payload.sub) return c.json({ success: false, error: 'Forbidden' }, 403);
    await timeEntry.patch(body);
    return ok(c, await timeEntry.getState());
  });
  app.delete('/api/time-entries/:id', async (c) => {
    const payload = c.get('jwtPayload');
    const { id } = c.req.param();
    const timeEntry = new TimeEntryEntity(c.env, id);
    if (!await timeEntry.exists()) return notFound(c);
    const state = await timeEntry.getState();
    if (state.userId !== payload.sub) return c.json({ success: false, error: 'Forbidden' }, 403);
    const deleted = await TimeEntryEntity.delete(c.env, id);
    return ok(c, { id, deleted });
  });
}