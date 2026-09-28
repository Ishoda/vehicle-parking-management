# Git Contribution Rules

## 1. Branch Rules

- `main` is the stable branch.
- Do not directly push to `main`.
- Create a separate branch for each feature or task.
- Use meaningful branch names.

Examples:
- `feature/monthly-contract`
- `feature/monthly-payment`
- `feature/parking-customer`
- `fix/space-availability`

## 2. Commit Rules

- Make small and meaningful commits.
- Write a clear commit message.
- Do not use messages such as `update`, `changes`, or `test`.

Examples:

- `Add monthly contract stored procedure`
- `Add monthly customer API`
- `Fix parking space availability`
- `Update monthly payment validation`

## 3. Before Pushing

Before pushing your changes:

1. Pull the latest changes.
2. Check for conflicts.
3. Test your changes.
4. Make sure unnecessary files are not included.
5. Commit and push.

Example:

```bash
git pull origin main
git status
git add .
git commit -m "Add monthly contract procedure"
git push origin feature/monthly-contract
