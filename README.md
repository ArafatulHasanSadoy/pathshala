# Pathshala

Offline-first coaching desk for any Bangladesh coaching centre. Advance Educare is **sample data only** — start your own centre from Setup.

Fees, routine (constraint solver), attendance, teacher pay (class / hourly guide / monthly), question papers (type, paste, or photo), printables, Bangla + English. Rooms are a **shared pool**, not locked to one class: batches with the same share name may sit together (Class 3–5 already combined; Class 6 and 7 share `mid` in the demo).

## Run

```bash
npm install
npm run dev
```

Preview is a PWA. On Android Chrome: menu → **Add to Home screen / Install app**. That is the installable Android app (no separate `.apk` until a Play Store TWA wrap). Data stays on the phone; export Backup JSON from Settings to move it.

## Stack

TanStack Start, React 19, Tailwind v4, Zustand (`pathshala-v4` in localStorage). Auth and a server database are off by design.

## Tests

```bash
npm test
npm run typecheck
```
