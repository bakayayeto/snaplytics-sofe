# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

- **Snaplytics** (Django REST API) — backend on port 8000
- **electron-app** (Electron) — staff desktop admin (requires display; not runnable headless)
- **HeigenKiosk** (Expo/React Native) — customer kiosk, runs on web via `npm start` (port 8090)
- **HeigenKiosk-apk** — standalone variant using Supabase (requires external Supabase project)

### Database

Local PostgreSQL 16 is used for development. The Django settings enforce `sslmode: require`, which works with the default Ubuntu PostgreSQL install (SSL is enabled by default).

- DB: `snaplytics`, user: `postgres`, password: `postgres`
- Start PostgreSQL: `sudo pg_ctlcluster 16 main start`
- The `.env` file at repo root provides `DB_HOST=localhost DB_PORT=5432 DB_NAME=snaplytics DB_USER=postgres DB_PASSWORD=postgres`

### Starting services

```bash
# 1. Start PostgreSQL (if not running)
sudo pg_ctlcluster 16 main start

# 2. Start Django backend
cd Snaplytics && source .venv/bin/activate && python manage.py runserver 0.0.0.0:8000

# 3. Start Kiosk web (separate terminal)
cd HeigenKiosk && npm start
# Serves on http://localhost:8090
```

### Dev account

```bash
cd Snaplytics && source .venv/bin/activate
python manage.py create_dev_account --username zxcdev --password zxcdev
```

Login: `POST /api/auth/login/` with `{"email":"zxcdev","password":"zxcdev"}` → returns token.

### Gotchas

- **No lint config exists** — no ESLint, flake8, pyproject.toml, or other linter configured in this repo.
- **Django test files are empty stubs** — `endpoints/tests.py` and `backend/tests.py` have no tests. Use `python manage.py test` to run (0 tests currently).
- **SMTP errors are non-fatal** — booking creation triggers email sending which fails without SMTP creds. The booking still succeeds (201). Set `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` in `.env` to silence.
- **PySpark JAVA_HOME** — `test.py` at Snaplytics root is a standalone Spark diagnostic (Windows-centric). PySpark functionality works in the recommender module with `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64`.
- **Electron app** requires a display (X11/Wayland). In headless Cloud Agent VMs, test the Django API and HeigenKiosk web instead.
- **Kiosk auto-resets** after successful booking (4-second timeout). This is expected behavior, not an error.
- **Django `system check`** passes clean: `python manage.py check` → "System check identified no issues."
- **Web build**: `cd HeigenKiosk && npx expo export --platform web` produces static bundle in `dist/`.
