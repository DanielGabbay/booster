# Contributing

This repo is set up so coding agents can work independently.

## Branching

- Feature work on a branch, then PR into `master`.
- Direct push to `master` is allowed and **creates a release**.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add batch sticker upload
fix: keep selected files after clearing the input
chore: bump dependencies
feat!: change prize cost range
```

On merge/push to `master`, GitHub Actions bumps:

| Commit | Bump |
|---|---|
| `feat:` | minor |
| `feat!:` or `BREAKING CHANGE` | major |
| anything else (`fix:`, `chore:`, …) | patch |

## App notes

- RTL Hebrew UI. Keep labels in Hebrew.
- Game state lives in Zustand + IndexedDB (`src/lib/store.ts`, `src/lib/persist.ts`).
- Screens are in `src/components/app.tsx` (setup, play, shop, catalog, album).
- Custom prize images are JPEG data URLs, cropped square (`src/lib/image.ts`).
- Do not commit `.env`, `node_modules`, `.grok/`, or `screenshots/`.
