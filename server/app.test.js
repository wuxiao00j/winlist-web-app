import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createApp } from './app.js';
import { createTestDatabase, resetTestDatabase } from './testUtils.js';

let app;
let db;

async function login(email = 'olivia@example.com', password = 'winlist123') {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password }
  });
  expect(response.statusCode).toBe(200);
  const cookie = response.cookies.find((item) => item.name === 'winlist_session');
  expect(cookie?.value).toBeTruthy();
  return `${cookie.name}=${cookie.value}`;
}

async function firstTask(category, memberId, cookie) {
  const state = await app.inject({
    method: 'GET',
    url: `/api/app-state?category=${category}`,
    cookies: { winlist_session: cookie.split('=')[1] }
  });
  expect(state.statusCode).toBe(200);
  const body = state.json();
  return body.tasks[memberId][0];
}

async function register(email, displayName = 'New User') {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password: 'long-enough', displayName }
  });
  expect(response.statusCode).toBe(201);
  const cookie = response.cookies.find((item) => item.name === 'winlist_session');
  expect(cookie?.value).toBeTruthy();
  return { cookie: `${cookie.name}=${cookie.value}`, user: response.json().user };
}

beforeEach(async () => {
  db = await createTestDatabase();
  await resetTestDatabase(db.prisma);
  app = await createApp({ prisma: db.prisma, jwtSecret: 'test-secret', uploadDir: db.uploadDir });
});

afterEach(async () => {
  await app?.close();
  await db?.cleanup();
});

describe('auth routes', () => {
  test('register rejects short passwords and duplicate emails', async () => {
    const shortPassword = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'new@example.com', password: 'short', displayName: 'New User' }
    });
    expect(shortPassword.statusCode).toBe(400);

    const created = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'new@example.com', password: 'long-enough', displayName: 'New User' }
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().user.email).toBe('new@example.com');

    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'new@example.com', password: 'long-enough', displayName: 'New User' }
    });
    expect(duplicate.statusCode).toBe(409);
  });

  test('login sets a cookie and /api/me requires authentication', async () => {
    const anonymous = await app.inject({ method: 'GET', url: '/api/me' });
    expect(anonymous.statusCode).toBe(401);

    const cookie = await login();
    const me = await app.inject({
      method: 'GET',
      url: '/api/me',
      cookies: { winlist_session: cookie.split('=')[1] }
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.displayName).toBe('Olivia Vivas');
  });

  test('register generates unique member ids for duplicate display names', async () => {
    const first = await register('same-one@example.com', 'Same Name');
    const second = await register('same-two@example.com', 'Same Name');

    expect(first.user.memberId).toBe('same-name');
    expect(second.user.memberId).toMatch(/^same-name-\d+$/);
  });
});

describe('app state and task routes', () => {
  test('app-state returns the current user and accepted friends by category', async () => {
    const cookie = await login();
    const response = await app.inject({
      method: 'GET',
      url: '/api/app-state?category=work',
      cookies: { winlist_session: cookie.split('=')[1] }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.currentUser.memberId).toBe('olivia');
    expect(body.members.map((member) => member.memberId)).toEqual(['olivia', 'barry', 'dexter', 'lorelai']);
    expect(body.tasks.barry.map((task) => task.title)).toContain('部署公司下季度任务');
  });

  test('users can mutate own tasks but not friend tasks', async () => {
    const cookie = await login();
    const ownTask = await firstTask('chores', 'olivia', cookie);
    const friendTask = await firstTask('chores', 'eric', cookie);

    const ownUpdate = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${ownTask.id}`,
      cookies: { winlist_session: cookie.split('=')[1] },
      payload: { title: '做饭升级版', minutes: 95, subtasks: ['备菜'], note: '别忘了电话' }
    });
    expect(ownUpdate.statusCode).toBe(200);
    expect(ownUpdate.json().task.title).toBe('做饭升级版');

    const friendUpdate = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${friendTask.id}`,
      cookies: { winlist_session: cookie.split('=')[1] },
      payload: { title: '不能改好友任务' }
    });
    expect(friendUpdate.statusCode).toBe(403);
  });

  test('comments, pokes, copy-to-me, and take-to-me work on accepted friend tasks', async () => {
    const cookie = await login();
    const friendTask = await firstTask('chores', 'eric', cookie);

    const comment = await app.inject({
      method: 'POST',
      url: `/api/tasks/${friendTask.id}/comments`,
      cookies: { winlist_session: cookie.split('=')[1] },
      payload: { text: '我来帮忙', emoji: '👍' }
    });
    expect(comment.statusCode).toBe(201);
    expect(comment.json().comment.author.displayName).toBe('Olivia Vivas');

    const poke = await app.inject({
      method: 'POST',
      url: `/api/tasks/${friendTask.id}/pokes`,
      cookies: { winlist_session: cookie.split('=')[1] }
    });
    expect(poke.statusCode).toBe(201);
    expect(poke.json().poke.actor.displayName).toBe('Olivia Vivas');

    const copied = await app.inject({
      method: 'POST',
      url: `/api/tasks/${friendTask.id}/copy-to-me`,
      cookies: { winlist_session: cookie.split('=')[1] }
    });
    expect(copied.statusCode).toBe(201);
    expect(copied.json().task.owner.memberId).toBe('olivia');
    expect(copied.json().task.checked).toBe(false);

    const taken = await app.inject({
      method: 'POST',
      url: `/api/tasks/${friendTask.id}/take-to-me`,
      cookies: { winlist_session: cookie.split('=')[1] }
    });
    expect(taken.statusCode).toBe(200);
    expect(taken.json().task.owner.memberId).toBe('olivia');
  });

  test('new accepted friends with category tasks appear in app-state', async () => {
    const oliviaCookie = await login();
    const { cookie: newCookie, user } = await register('chores-friend@example.com', 'Chores Friend');

    await app.inject({
      method: 'POST',
      url: '/api/tasks',
      cookies: { winlist_session: newCookie.split('=')[1] },
      payload: { category: 'chores', title: '擦窗户', minutes: 25 }
    });

    const request = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      cookies: { winlist_session: oliviaCookie.split('=')[1] },
      payload: { email: 'chores-friend@example.com' }
    });
    expect(request.statusCode).toBe(201);

    const accepted = await app.inject({
      method: 'POST',
      url: `/api/friends/${request.json().friendship.id}/accept`,
      cookies: { winlist_session: newCookie.split('=')[1] }
    });
    expect(accepted.statusCode).toBe(200);

    const state = await app.inject({
      method: 'GET',
      url: '/api/app-state?category=chores',
      cookies: { winlist_session: oliviaCookie.split('=')[1] }
    });
    expect(state.statusCode).toBe(200);
    expect(state.json().members.map((member) => member.memberId)).toContain(user.memberId);
    expect(state.json().tasks[user.memberId].map((task) => task.title)).toContain('擦窗户');
  });
});

describe('friend routes', () => {
  test('friend requests are idempotent across duplicate and reverse requests', async () => {
    const oliviaCookie = await login();
    const ericCookie = await login('eric@example.com');

    await db.prisma.friendship.deleteMany({
      where: {
        OR: [
          { requester: { email: 'olivia@example.com' }, addressee: { email: 'eric@example.com' } },
          { requester: { email: 'eric@example.com' }, addressee: { email: 'olivia@example.com' } }
        ]
      }
    });

    const first = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      cookies: { winlist_session: oliviaCookie.split('=')[1] },
      payload: { email: 'eric@example.com' }
    });
    expect(first.statusCode).toBe(201);
    expect(first.json().friendship.status).toBe('pending');

    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      cookies: { winlist_session: oliviaCookie.split('=')[1] },
      payload: { email: 'eric@example.com' }
    });
    expect(duplicate.statusCode).toBe(200);
    expect(duplicate.json().friendship.id).toBe(first.json().friendship.id);

    const reverse = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      cookies: { winlist_session: ericCookie.split('=')[1] },
      payload: { email: 'olivia@example.com' }
    });
    expect(reverse.statusCode).toBe(200);
    expect(reverse.json().friendship.status).toBe('accepted');
  });

  test('pending requests can be rejected and accepted friendships can be removed', async () => {
    const oliviaCookie = await login();
    const { cookie: newCookie } = await register('reject-me@example.com', 'Reject Me');

    const request = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      cookies: { winlist_session: oliviaCookie.split('=')[1] },
      payload: { email: 'reject-me@example.com' }
    });
    expect(request.statusCode).toBe(201);

    const rejected = await app.inject({
      method: 'POST',
      url: `/api/friends/${request.json().friendship.id}/reject`,
      cookies: { winlist_session: newCookie.split('=')[1] }
    });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json().friendship.status).toBe('rejected');

    const secondRequest = await app.inject({
      method: 'POST',
      url: '/api/friends/request',
      cookies: { winlist_session: oliviaCookie.split('=')[1] },
      payload: { email: 'reject-me@example.com' }
    });
    expect(secondRequest.statusCode).toBe(201);

    const accepted = await app.inject({
      method: 'POST',
      url: `/api/friends/${secondRequest.json().friendship.id}/accept`,
      cookies: { winlist_session: newCookie.split('=')[1] }
    });
    expect(accepted.statusCode).toBe(200);

    const removed = await app.inject({
      method: 'DELETE',
      url: `/api/friends/${accepted.json().friendship.id}`,
      cookies: { winlist_session: oliviaCookie.split('=')[1] }
    });
    expect(removed.statusCode).toBe(200);
    expect(removed.json().ok).toBe(true);
  });
});

describe('security and upload routes', () => {
  test('createApp requires an explicit JWT secret in production', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    try {
      await expect(createApp({ prisma: db.prisma })).rejects.toThrow('JWT_SECRET');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalSecret) {
        process.env.JWT_SECRET = originalSecret;
      } else {
        delete process.env.JWT_SECRET;
      }
    }
  });

  test('uploads data URLs and returns a readable API URL', async () => {
    const cookie = await login();
    const uploaded = await app.inject({
      method: 'POST',
      url: '/api/uploads',
      cookies: { winlist_session: cookie.split('=')[1] },
      payload: {
        fileName: 'note.txt',
        dataUrl: `data:text/plain;base64,${Buffer.from('hello upload').toString('base64')}`
      }
    });
    expect(uploaded.statusCode).toBe(201);
    expect(uploaded.json().url).toMatch(/^\/api\/uploads\//);

    const fetched = await app.inject({
      method: 'GET',
      url: uploaded.json().url,
      cookies: { winlist_session: cookie.split('=')[1] }
    });
    expect(fetched.statusCode).toBe(200);
    expect(fetched.body).toBe('hello upload');
  });
});
