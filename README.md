# War Dogs

Simple private Discord-style chat for the crew.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

- Demo account: `demo` / `demo123`
- Invite code to join: `WARDOGS`

## What you get

- Sign in / join with invite code (friends only)
- Pack channels: announcements, general, ops, barracks, clips, music
- Real-time messages over Socket.io
- Online / idle / DND presence
- Typing indicators
- Message history persisted on the server
- Mobile-friendly channel / chat / pack tabs

## Stack

Vite, React, TypeScript, Tailwind CSS, Express, Socket.io

## Deploy

`render.yaml` is set up for a single Node web service (`npm run build` then `npm start`).
Set `JWT_SECRET` and optionally `INVITE_CODE` in the environment.
