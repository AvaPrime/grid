## Git hooks

Hooks live in `.githooks` (not `.git/hooks`) so they ship with the repo.

```bash
npm run hooks:install   # or: npm install  (runs prepare)
```

| Hook         | What it does                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------- |
| `pre-commit` | Blocks secret-like files / >2MB blobs, then `lint-staged` (ESLint + Prettier on staged files) |
| `commit-msg` | Requires a subject of at least 10 characters                                                  |
| `pre-push`   | `npm run typecheck` and `npm test`                                                            |

Skip once with `git commit --no-verify` / `git push --no-verify` if you must.
