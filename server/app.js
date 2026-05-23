import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import Fastify from 'fastify';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { z } from 'zod';
import { categoryMembers } from './seedData.js';

const sessionCookieName = 'winlist_session';
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
const categories = ['work', 'chores', 'fitness'];

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  displayName: z.string().min(1).max(80)
});

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1)
});

const taskSchema = z.object({
  category: z.enum(categories).optional(),
  title: z.string().min(1).max(160).optional(),
  minutes: z.number().int().min(1).max(1440).optional(),
  checked: z.boolean().optional(),
  note: z.string().max(2000).optional(),
  subtasks: z.array(z.string().max(200)).optional()
});

const createTaskSchema = taskSchema.extend({
  category: z.enum(categories),
  title: z.string().min(1).max(160),
  minutes: z.number().int().min(1).max(1440)
});

const commentSchema = z.object({
  text: z.string().min(1).max(1000),
  emoji: z.string().min(1).max(16).default('🙂'),
  imagePath: z.string().max(500).optional()
});

const uploadSchema = z.object({
  fileName: z.string().min(1).max(180),
  dataUrl: z.string().min(1).max(5_500_000)
});

function cookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: sessionMaxAgeSeconds
  };
}

function memberIdBase(email, displayName) {
  const base = (displayName || email.split('@')[0])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  return base;
}

async function uniqueMemberId(prisma, email, displayName) {
  const base = memberIdBase(email, displayName) || `user-${Date.now()}`;
  for (let index = 0; index < 1000; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const existing = await prisma.user.findUnique({ where: { memberId: candidate } });
    if (!existing) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || '');
  } catch {
    return fallback;
  }
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    memberId: user.memberId,
    avatar: user.avatar,
    statusId: user.statusId
  };
}

function taskDto(task) {
  const meta = parseJson(task.metaJson, {});
  return {
    ...meta,
    id: task.id,
    category: task.category,
    title: task.title,
    minutes: task.minutes,
    checked: task.checked,
    note: task.note,
    subtasks: parseJson(task.subtasksJson, []),
    sortOrder: task.sortOrder,
    commentCount: task._count?.comments || 0,
    pokeCount: task._count?.pokes || 0,
    owner: task.owner ? publicUser(task.owner) : undefined
  };
}

async function acceptedFriendIds(prisma, userId) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'accepted',
      OR: [{ requesterId: userId }, { addresseeId: userId }]
    }
  });
  return friendships.map((friendship) => (
    friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId
  ));
}

async function friendshipBetween(prisma, firstUserId, secondUserId) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: firstUserId, addresseeId: secondUserId },
        { requesterId: secondUserId, addresseeId: firstUserId }
      ]
    }
  });
}

async function canSeeTask(prisma, userId, taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { owner: true }
  });
  if (!task) return { ok: false, statusCode: 404 };
  if (task.ownerId === userId) return { ok: true, task };
  const friendIds = await acceptedFriendIds(prisma, userId);
  if (friendIds.includes(task.ownerId)) return { ok: true, task };
  return { ok: false, statusCode: 403 };
}

async function nextSortOrder(prisma, ownerId, category) {
  const latest = await prisma.task.findFirst({
    where: { ownerId, category },
    orderBy: { sortOrder: 'desc' }
  });
  return (latest?.sortOrder ?? -1) + 1;
}

function validate(schema, value, reply) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    reply.code(400).send({ error: 'Invalid request', details: parsed.error.flatten() });
    return null;
  }
  return parsed.data;
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;,]+);base64,([a-zA-Z0-9+/=\s]+)$/);
  if (!match) return null;
  try {
    return {
      mimeType: match[1],
      buffer: Buffer.from(match[2].replace(/\s/g, ''), 'base64')
    };
  } catch {
    return null;
  }
}

function safeUploadName(fileName) {
  const extension = extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 12);
  const stem = basename(fileName, extname(fileName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'upload';
  return `${stem}-${randomUUID()}${extension}`;
}

function contentTypeFor(fileName, fallback = 'application/octet-stream') {
  const types = {
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.txt': 'text/plain; charset=utf-8',
    '.webp': 'image/webp'
  };
  return types[extname(fileName).toLowerCase()] || fallback;
}

export async function createApp({
  prisma,
  jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'winlist-dev-secret'),
  uploadDir = join(process.cwd(), '.winlist-uploads')
}) {
  if (!jwtSecret) throw new Error('JWT_SECRET is required in production');

  const app = Fastify({ logger: process.env.NODE_ENV === 'test' ? false : true });

  await app.register(cookie);
  await app.register(jwt, { secret: jwtSecret });

  app.decorate('authenticate', async (request, reply) => {
    const token = request.cookies[sessionCookieName];
    if (!token) return reply.code(401).send({ error: 'Authentication required' });
    try {
      const payload = app.jwt.verify(token);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) return reply.code(401).send({ error: 'Authentication required' });
      request.user = user;
    } catch {
      return reply.code(401).send({ error: 'Authentication required' });
    }
  });

  app.get('/api/health', async () => ({ ok: true }));

  app.post('/api/auth/register', async (request, reply) => {
    const body = validate(registerSchema, request.body, reply);
    if (!body) return reply;

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return reply.code(409).send({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        displayName: body.displayName,
        memberId: await uniqueMemberId(prisma, body.email, body.displayName),
        avatar: 'olivia-avatar.jpeg',
        statusId: 'busy'
      }
    });
    const token = app.jwt.sign({ userId: user.id }, { expiresIn: sessionMaxAgeSeconds });
    return reply.code(201).setCookie(sessionCookieName, token, cookieOptions()).send({ user: publicUser(user) });
  });

  app.post('/api/auth/login', async (request, reply) => {
    const body = validate(loginSchema, request.body, reply);
    if (!body) return reply;

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }
    const token = app.jwt.sign({ userId: user.id }, { expiresIn: sessionMaxAgeSeconds });
    return reply.setCookie(sessionCookieName, token, cookieOptions()).send({ user: publicUser(user) });
  });

  app.post('/api/auth/logout', async (_request, reply) => {
    return reply.clearCookie(sessionCookieName, { path: '/' }).send({ ok: true });
  });

  app.get('/api/me', { preHandler: app.authenticate }, async (request) => ({ user: publicUser(request.user) }));

  app.patch('/api/me/status', { preHandler: app.authenticate }, async (request, reply) => {
    const body = validate(z.object({ statusId: z.string().min(1).max(40) }), request.body, reply);
    if (!body) return reply;
    const user = await prisma.user.update({ where: { id: request.user.id }, data: { statusId: body.statusId } });
    return { user: publicUser(user) };
  });

  app.get('/api/app-state', { preHandler: app.authenticate }, async (request, reply) => {
    const category = z.enum(categories).safeParse(request.query?.category || 'chores');
    if (!category.success) return reply.code(400).send({ error: 'Invalid category' });

    const friendIds = await acceptedFriendIds(prisma, request.user.id);
    const users = await prisma.user.findMany({ where: { id: { in: [request.user.id, ...friendIds] } } });
    const membersById = Object.fromEntries(users.map((user) => [user.memberId, user]));
    const usersById = Object.fromEntries(users.map((user) => [user.id, user]));
    const preferredOrder = categoryMembers[category.data] || [];
    const dynamicTasks = await prisma.task.findMany({
      where: { category: category.data, ownerId: { in: friendIds } },
      select: { ownerId: true },
      distinct: ['ownerId']
    });
    const seenMemberIds = new Set([request.user.memberId]);
    const orderedMembers = [
      request.user,
      ...preferredOrder
        .filter((memberId) => memberId !== request.user.memberId)
        .map((memberId) => membersById[memberId])
        .filter(Boolean)
        .filter((user) => {
          if (seenMemberIds.has(user.memberId)) return false;
          seenMemberIds.add(user.memberId);
          return true;
        }),
      ...dynamicTasks
        .map((task) => usersById[task.ownerId])
        .filter(Boolean)
        .filter((user) => {
          if (seenMemberIds.has(user.memberId)) return false;
          seenMemberIds.add(user.memberId);
          return true;
        })
    ];

    const tasks = await prisma.task.findMany({
      where: { category: category.data, ownerId: { in: orderedMembers.map((user) => user.id) } },
      include: { owner: true, _count: { select: { comments: true, pokes: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });
    const tasksByMember = Object.fromEntries(orderedMembers.map((user) => [user.memberId, []]));
    for (const task of tasks) tasksByMember[task.owner.memberId].push(taskDto(task));

    return {
      currentUser: publicUser(request.user),
      members: orderedMembers.map(publicUser),
      tasks: tasksByMember
    };
  });

  app.post('/api/tasks', { preHandler: app.authenticate }, async (request, reply) => {
    const body = validate(createTaskSchema, request.body, reply);
    if (!body) return reply;
    const task = await prisma.task.create({
      data: {
        ownerId: request.user.id,
        category: body.category,
        title: body.title.trim(),
        minutes: body.minutes,
        checked: body.checked || false,
        note: body.note || '',
        subtasksJson: JSON.stringify(body.subtasks || []),
        sortOrder: await nextSortOrder(prisma, request.user.id, body.category)
      },
      include: { owner: true, _count: { select: { comments: true, pokes: true } } }
    });
    return reply.code(201).send({ task: taskDto(task) });
  });

  app.patch('/api/tasks/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const visible = await canSeeTask(prisma, request.user.id, request.params.id);
    if (!visible.ok) return reply.code(visible.statusCode).send({ error: 'Task unavailable' });
    if (visible.task.ownerId !== request.user.id) return reply.code(403).send({ error: 'Only task owners can edit tasks' });
    const body = validate(taskSchema, request.body, reply);
    if (!body) return reply;
    const data = {};
    if (body.category) data.category = body.category;
    if (body.title) data.title = body.title.trim();
    if (body.minutes) data.minutes = body.minutes;
    if (typeof body.checked === 'boolean') data.checked = body.checked;
    if (typeof body.note === 'string') data.note = body.note;
    if (body.subtasks) data.subtasksJson = JSON.stringify(body.subtasks);
    const task = await prisma.task.update({
      where: { id: visible.task.id },
      data,
      include: { owner: true, _count: { select: { comments: true, pokes: true } } }
    });
    return { task: taskDto(task) };
  });

  app.delete('/api/tasks/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const visible = await canSeeTask(prisma, request.user.id, request.params.id);
    if (!visible.ok) return reply.code(visible.statusCode).send({ error: 'Task unavailable' });
    if (visible.task.ownerId !== request.user.id) return reply.code(403).send({ error: 'Only task owners can delete tasks' });
    await prisma.task.delete({ where: { id: visible.task.id } });
    return { ok: true };
  });

  app.post('/api/tasks/:id/toggle', { preHandler: app.authenticate }, async (request, reply) => {
    const visible = await canSeeTask(prisma, request.user.id, request.params.id);
    if (!visible.ok) return reply.code(visible.statusCode).send({ error: 'Task unavailable' });
    if (visible.task.ownerId !== request.user.id) return reply.code(403).send({ error: 'Only task owners can toggle tasks' });
    const task = await prisma.task.update({
      where: { id: visible.task.id },
      data: { checked: !visible.task.checked },
      include: { owner: true, _count: { select: { comments: true, pokes: true } } }
    });
    return { task: taskDto(task) };
  });

  app.post('/api/tasks/reorder', { preHandler: app.authenticate }, async (request, reply) => {
    const body = validate(z.object({ category: z.enum(categories), taskIds: z.array(z.string()) }), request.body, reply);
    if (!body) return reply;
    const ownTasks = await prisma.task.findMany({
      where: { ownerId: request.user.id, category: body.category, id: { in: body.taskIds } }
    });
    if (ownTasks.length !== body.taskIds.length) return reply.code(403).send({ error: 'Can only reorder own tasks' });
    await prisma.$transaction(body.taskIds.map((id, index) => prisma.task.update({ where: { id }, data: { sortOrder: index } })));
    return { ok: true };
  });

  app.post('/api/tasks/:id/copy-to-me', { preHandler: app.authenticate }, async (request, reply) => {
    const visible = await canSeeTask(prisma, request.user.id, request.params.id);
    if (!visible.ok) return reply.code(visible.statusCode).send({ error: 'Task unavailable' });
    const task = await prisma.task.create({
      data: {
        ownerId: request.user.id,
        category: visible.task.category,
        title: visible.task.title,
        minutes: visible.task.minutes,
        checked: false,
        note: visible.task.note,
        subtasksJson: visible.task.subtasksJson,
        metaJson: visible.task.metaJson,
        sortOrder: await nextSortOrder(prisma, request.user.id, visible.task.category)
      },
      include: { owner: true, _count: { select: { comments: true, pokes: true } } }
    });
    return reply.code(201).send({ task: taskDto(task) });
  });

  app.post('/api/tasks/:id/take-to-me', { preHandler: app.authenticate }, async (request, reply) => {
    const visible = await canSeeTask(prisma, request.user.id, request.params.id);
    if (!visible.ok) return reply.code(visible.statusCode).send({ error: 'Task unavailable' });
    if (visible.task.ownerId === request.user.id) return reply.code(409).send({ error: 'Task already belongs to you' });
    const task = await prisma.task.update({
      where: { id: visible.task.id },
      data: {
        ownerId: request.user.id,
        checked: false,
        sortOrder: await nextSortOrder(prisma, request.user.id, visible.task.category)
      },
      include: { owner: true, _count: { select: { comments: true, pokes: true } } }
    });
    return { task: taskDto(task) };
  });

  app.post('/api/tasks/:id/comments', { preHandler: app.authenticate }, async (request, reply) => {
    const visible = await canSeeTask(prisma, request.user.id, request.params.id);
    if (!visible.ok) return reply.code(visible.statusCode).send({ error: 'Task unavailable' });
    const body = validate(commentSchema, request.body, reply);
    if (!body) return reply;
    const comment = await prisma.comment.create({
      data: { taskId: visible.task.id, authorId: request.user.id, text: body.text, emoji: body.emoji, imagePath: body.imagePath },
      include: { author: true }
    });
    return reply.code(201).send({ comment: { ...comment, author: publicUser(comment.author) } });
  });

  app.get('/api/tasks/:id/comments', { preHandler: app.authenticate }, async (request, reply) => {
    const visible = await canSeeTask(prisma, request.user.id, request.params.id);
    if (!visible.ok) return reply.code(visible.statusCode).send({ error: 'Task unavailable' });
    const comments = await prisma.comment.findMany({
      where: { taskId: visible.task.id },
      include: { author: true },
      orderBy: { createdAt: 'desc' }
    });
    return { comments: comments.map((comment) => ({ ...comment, author: publicUser(comment.author) })) };
  });

  app.delete('/api/comments/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const comment = await prisma.comment.findUnique({ where: { id: request.params.id }, include: { task: true } });
    if (!comment) return reply.code(404).send({ error: 'Comment unavailable' });
    if (comment.authorId !== request.user.id && comment.task.ownerId !== request.user.id) {
      return reply.code(403).send({ error: 'Can only delete your comment or comments on your task' });
    }
    await prisma.comment.delete({ where: { id: comment.id } });
    return { ok: true };
  });

  app.post('/api/tasks/:id/pokes', { preHandler: app.authenticate }, async (request, reply) => {
    const visible = await canSeeTask(prisma, request.user.id, request.params.id);
    if (!visible.ok) return reply.code(visible.statusCode).send({ error: 'Task unavailable' });
    const poke = await prisma.poke.create({
      data: { taskId: visible.task.id, actorId: request.user.id },
      include: { actor: true }
    });
    return reply.code(201).send({ poke: { ...poke, actor: publicUser(poke.actor) } });
  });

  app.get('/api/tasks/:id/pokes', { preHandler: app.authenticate }, async (request, reply) => {
    const visible = await canSeeTask(prisma, request.user.id, request.params.id);
    if (!visible.ok) return reply.code(visible.statusCode).send({ error: 'Task unavailable' });
    const pokes = await prisma.poke.findMany({
      where: { taskId: visible.task.id },
      include: { actor: true },
      orderBy: { createdAt: 'desc' }
    });
    return { pokes: pokes.map((poke) => ({ ...poke, actor: publicUser(poke.actor) })) };
  });

  app.get('/api/friends', { preHandler: app.authenticate }, async (request) => {
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ requesterId: request.user.id }, { addresseeId: request.user.id }] },
      include: { requester: true, addressee: true },
      orderBy: { createdAt: 'desc' }
    });
    return {
      friends: friendships.map((friendship) => ({
        id: friendship.id,
        status: friendship.status,
        user: publicUser(friendship.requesterId === request.user.id ? friendship.addressee : friendship.requester)
      }))
    };
  });

  app.post('/api/friends/request', { preHandler: app.authenticate }, async (request, reply) => {
    const body = validate(z.object({ email: z.string().email().transform((value) => value.toLowerCase()) }), request.body, reply);
    if (!body) return reply;
    const addressee = await prisma.user.findUnique({ where: { email: body.email } });
    if (!addressee) return reply.code(404).send({ error: 'User not found' });
    if (addressee.id === request.user.id) return reply.code(409).send({ error: 'Cannot friend yourself' });
    const existing = await friendshipBetween(prisma, request.user.id, addressee.id);
    if (existing?.status === 'accepted') return { friendship: existing };
    if (existing?.status === 'pending' && existing.requesterId === request.user.id) return { friendship: existing };
    if (existing?.status === 'pending' && existing.addresseeId === request.user.id) {
      const accepted = await prisma.friendship.update({ where: { id: existing.id }, data: { status: 'accepted' } });
      return { friendship: accepted };
    }
    if (existing?.status === 'rejected') {
      const friendship = await prisma.friendship.update({
        where: { id: existing.id },
        data: { requesterId: request.user.id, addresseeId: addressee.id, status: 'pending' }
      });
      return reply.code(201).send({ friendship });
    }
    const friendship = await prisma.friendship.create({
      data: { requesterId: request.user.id, addresseeId: addressee.id, status: 'pending' }
    });
    return reply.code(201).send({ friendship });
  });

  app.post('/api/friends/:id/accept', { preHandler: app.authenticate }, async (request, reply) => {
    const friendship = await prisma.friendship.findUnique({ where: { id: request.params.id } });
    if (!friendship) return reply.code(404).send({ error: 'Friend request unavailable' });
    if (friendship.addresseeId !== request.user.id) return reply.code(403).send({ error: 'Only addressee can accept' });
    const accepted = await prisma.friendship.update({ where: { id: friendship.id }, data: { status: 'accepted' } });
    return { friendship: accepted };
  });

  app.post('/api/friends/:id/reject', { preHandler: app.authenticate }, async (request, reply) => {
    const friendship = await prisma.friendship.findUnique({ where: { id: request.params.id } });
    if (!friendship) return reply.code(404).send({ error: 'Friend request unavailable' });
    if (friendship.addresseeId !== request.user.id) return reply.code(403).send({ error: 'Only addressee can reject' });
    if (friendship.status !== 'pending') return reply.code(409).send({ error: 'Only pending requests can be rejected' });
    const rejected = await prisma.friendship.update({ where: { id: friendship.id }, data: { status: 'rejected' } });
    return { friendship: rejected };
  });

  app.delete('/api/friends/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const friendship = await prisma.friendship.findUnique({ where: { id: request.params.id } });
    if (!friendship) return reply.code(404).send({ error: 'Friendship unavailable' });
    if (friendship.requesterId !== request.user.id && friendship.addresseeId !== request.user.id) {
      return reply.code(403).send({ error: 'Can only remove your own friendships' });
    }
    await prisma.friendship.delete({ where: { id: friendship.id } });
    return { ok: true };
  });

  app.post('/api/uploads', { preHandler: app.authenticate }, async (request, reply) => {
    const body = validate(uploadSchema, request.body, reply);
    if (!body) return reply;
    const parsed = parseDataUrl(body.dataUrl);
    if (!parsed || parsed.buffer.length === 0) return reply.code(400).send({ error: 'Invalid upload data' });
    if (parsed.buffer.length > 4 * 1024 * 1024) return reply.code(413).send({ error: 'Upload too large' });

    const storedName = safeUploadName(body.fileName);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, storedName), parsed.buffer);
    return reply.code(201).send({
      url: `/api/uploads/${storedName}`,
      contentType: parsed.mimeType,
      size: parsed.buffer.length
    });
  });

  app.get('/api/uploads/:name', { preHandler: app.authenticate }, async (request, reply) => {
    const storedName = basename(request.params.name);
    try {
      const buffer = await readFile(join(uploadDir, storedName));
      return reply.type(contentTypeFor(storedName)).send(buffer);
    } catch {
      return reply.code(404).send({ error: 'Upload unavailable' });
    }
  });

  return app;
}
