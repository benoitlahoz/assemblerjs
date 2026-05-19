# DTO E2E Logs

The `dto-package.full-e2e.spec.ts` e2e test generates a single consolidated Markdown file: `dto-e2e.md`.

The file groups each REST + Fetch scenario step with:
- the request payload
- the expected and observed HTTP status
- a response excerpt
- the boot step and the dispose step

The summary section lists every step and the global verdict.

This folder is regenerated on every test run, but the `README.md` documentation file is preserved.
