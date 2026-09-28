# Git Contribution Rules

## 1. Branch Rules

* `main` is the stable branch.
* Do not directly push to `main`.
* Create a separate branch for each feature, fix, or task.
* Use meaningful branch names.

### Branch Name Examples

* `feature/monthly-contract`
* `feature/monthly-payment`
* `feature/parking-customer`
* `fix/space-availability`

---

## 2. Commit Rules

* Make small and meaningful commits.
* Write a clear commit message describing the change.
* Do not use vague commit messages such as `update`, `changes`, or `test`.

### Commit Message Examples

```text
Add monthly contract stored procedure
Add monthly customer API
Fix parking space availability
Update monthly payment validation
```

---

## 3. Before Pushing

Before pushing your changes:

1. Make sure your local `main` branch is up to date.
2. Update your feature branch with the latest changes from `main`.
3. Check for merge conflicts.
4. Test your changes.
5. Make sure unnecessary files are not included.
6. Commit your changes.
7. Push your feature branch.

### Example

```bash
git checkout main
git pull origin main

git checkout feature/monthly-contract
git merge main

git status
git add .
git commit -m "Add monthly contract procedure"
git push origin feature/monthly-contract
```

---

## 4. Pull Requests

* Create a Pull Request from your feature branch to `main`.
* Do not merge your own Pull Request without the required review.
* At least one other developer should approve the Pull Request before merging.
* Resolve any important review comments before merging.

### Pull Request Example

```text
feature/monthly-contract
          ↓
    Pull Request
          ↓
      Code Review
          ↓
     1 Approval
          ↓
       main
```

---

## 5. Database Rules

* Keep database scripts inside the `Database` folder.
* Update the relevant SQL scripts when tables, stored procedures, or other database objects are changed.
* Do not commit database passwords.
* Do not commit connection strings containing passwords.

---

## 6. Configuration and Sensitive Information

Do not commit sensitive configuration files or credentials.

Examples:

* `.env`
* API keys
* Passwords
* Private connection strings
* Secret keys

Use example configuration files such as:

```text
.env.example
appsettings.example.json
```

instead.

---

## 7. Files That Should Not Be Committed

Do not commit unnecessary generated or local files such as:

* `node_modules/`
* `bin/`
* `obj/`
* `.vs/`
* `.env`
* Build output
* IDE-specific temporary files
* Operating-system temporary files
