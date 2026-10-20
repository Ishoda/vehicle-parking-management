# Git Contribution Rules

## Branches

- `main` is the stable branch.
- Do not push directly to `main`.
- Create a separate branch for each feature or fix.
- Open a pull request into the team's agreed integration branch.

Example branch names:

- `feature/monthly-contract`
- `feature/monthly-payment`
- `fix/space-availability`
- `chore/frontend-cleanup`

## Commits

Keep commits focused and use clear messages.

Examples:

- `Add monthly customer form`
- `Fix parking space availability filter`
- `Consolidate frontend styles`
- `Add offline fallback page`

Avoid vague messages such as `update`, `changes` or `test`.

## Before opening a pull request

1. Check the current branch and working-tree changes.
2. Review the diff and exclude unrelated files.
3. Run the frontend checks from the frontend directory.
4. Check the affected screens in the browser.
5. Commit and push the task branch.
6. Describe the change, validation and any incomplete integration.

```powershell
git status
git diff --check
npm run lint
npm run build
```

Do not commit `node_modules`, `dist`, local environment files,
credentials or editor-generated files.

## Frontend conventions

- Use React with JavaScript.
- Keep code simple and readable.
- Reuse shared components and the existing request layer.
- Keep API paths in `src/constants/Api.js`.
- Keep role definitions in `src/constants/Permissions.js`.
- Follow the existing red, black and white application theme.
- Preserve existing behaviour during formatting-only changes.

## Validation

Lint and build checks verify code quality and compilation.
They do not replace browser checks or backend integration testing.

Document unavailable backend endpoints and untested transaction flows
in the pull request.