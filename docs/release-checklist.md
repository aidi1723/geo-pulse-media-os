# Release Checklist

- [ ] Confirm branch and working tree with `git status --short --branch`.
- [ ] Install clean dependencies with `npm ci`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Update `CHANGELOG.md`.
- [ ] Update `docs/maintenance-log.md`.
- [ ] Confirm `.env.example` matches the current runtime configuration.
- [ ] Run the `docs/operations-runbook.md` health command.
- [ ] Run the `docs/operations-runbook.md` readiness command.
- [ ] Confirm generated artifacts such as `dist/`, `node_modules/`, screenshots, and temporary files remain ignored.
- [ ] Push the branch.
- [ ] Confirm GitHub Actions CI completes on the pushed branch or pull request.
