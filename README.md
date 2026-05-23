# DoDoNow Web App

Mobile-first React/Vite web app that recreates the DoDoNow iOS SwiftUI prototype as a usable browser experience.

## Features

- DoDoNow-style mobile canvas with orange shell, light/dark theme, date picker, category tabs, member cards, task totals, and bottom navigation.
- Work, chores, and fitness task modes with the original avatars and task data.
- API-backed interactions for task checkoff, add/edit/delete, comments, poke notifications, task copy/take, theme switching, and layout switching.
- Fastify + Prisma + SQLite backend with email/password login and seeded DoDoNow users.

## Run

```bash
npm install
npm run prisma:generate
npm run dev:full
```

The backend listens on `http://127.0.0.1:3001`; Vite proxies `/api` from the web app. The local SQLite database is created automatically at `dev.db` and seeded on first server start.

Seed login:

- Email: `olivia@example.com`
- Password: `dodonow123`

## Build

```bash
npm run build
```

## Test

```bash
npm run test:server
npm run test:frontend
```

Reference screenshots and copied iOS assets live in `public/assets`.
