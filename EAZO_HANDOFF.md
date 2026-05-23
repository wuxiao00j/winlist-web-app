# Eazo Rebuild Handoff

This repository contains the full reproducible DoDoNow/WINlist web app source.

## Repository

- GitHub: https://github.com/wuxiao00j/winlist-web-app
- Branch: `main`

## What To Recreate

Recreate this app from the repository source. Preserve:

- React + Vite mobile-first frontend.
- Fastify backend with Prisma + SQLite.
- Email/password login with HTTP-only cookie sessions.
- Seeded users, friendships, and tasks.
- Friend task visibility, own-task editing, comments, pokes, copy/take task, reorder, and uploads.
- All visual assets in `public/assets`.
- The existing mobile UI, onboarding, login overlay, task cards, modals, status menus, and layout modes.

## Run Locally

```bash
git clone https://github.com/wuxiao00j/winlist-web-app.git
cd winlist-web-app
npm install
npm run prisma:generate
npm run dev:full
```

Open the Vite local URL shown in the terminal.

## Seed Login

- Email: `olivia@example.com`
- Password: `dodonow123`

The backend creates the SQLite schema automatically and seeds data on first start when the database is empty.

## Useful Commands

```bash
npm run test:server
npm run test:frontend
npm run build
```

## Notes For Eazo

Do not replace the image assets with generic placeholders. The required app assets are already in `public/assets`.
