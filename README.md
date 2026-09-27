# Ingrain

One small thing to revise, every day.

**Live at: [divi-259.github.io/ingrain](https://divi-259.github.io/ingrain/)**

Ingrain is a simple habit tool for keeping what you've learned fresh. You maintain a list of small things worth revisiting — a concept, a technique, a snippet of knowledge — each doable in about 15–20 minutes. Every day, Ingrain picks **one** of them for you. Things you haven't touched in a while are more likely to come up.

It's a static site — no account, no server. Everything you add is stored in your browser's `localStorage`, on your device only.

## How to use it

1. **Build your list** — under *My items*, add the things you want to keep fresh. Keep each one small enough to finish in one short sitting.
2. **Show up daily** — the *Today* page gives you your one item for the day. Do it, then hit **Done**. Each item shows when you last revised it and how many times.
3. **Not feeling it?** — you get exactly **one skip per day**. Use it and the next pick is final.
4. **Back it up** — since your data lives only in this browser, use **Export data** on *My items* now and then to save a `.json` copy, and **Import data** to restore it (or move it to another browser/device).

That's the whole loop: add small things, trust the daily pick, press Done.

## Development

```
npm install --prefix client
npm run dev
```

Opens at http://localhost:5173. Type-check with `npx tsc -b` in `client/`; build with `npm run build`.

Pushing to `main` deploys automatically to GitHub Pages via `.github/workflows/deploy.yml`.
