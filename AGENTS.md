# FixBook — Agent Notes

## Layout
- Root: React Native / Expo mobile app (Supabase client, `src/services/*`)
- `backend/`: Laravel 13 REST API (PHP 8.4, Sanctum) that replaces Supabase
- `docker-compose.yml` (dev) / `docker-compose.prod.yml` (prod) at repo root

## Commands
- Backend tests: `docker compose exec app php artisan test` (37 feature tests)
- Lint: `docker compose exec app vendor/bin/pint`
- Local PHP alternative: `docker run --rm -v "$PWD/backend":/app -w /app composer:2 php artisan test`
- Boot stack: `docker compose up -d --build` then `migrate --seed`, `storage:link`
- Seeded admin: admin@fixbook.test / password

## Conventions
- Supabase triggers are reimplemented as Eloquent observers in `backend/app/Observers`
- Authorization in `backend/app/Policies`; validation in `app/Http/Requests`
- Statuses are PHP backed enums in `backend/app/Enums`
- Active order = pending|accepted (aligned with the Postgres partial unique index)
- CI: `.github/workflows/ci.yml` — backend (Pint + PHPUnit on Postgres), frontend babel check, Docker build
- GitGuardian scans this repo: never commit password-looking literals, even placeholders

## Gotchas
- Root `.gitignore` has `*.lock` — `backend/composer.lock` is explicitly un-ignored; keep it tracked
- composer image runs PHP 8.5; runtime images must be PHP >= 8.4
- Laravel factories: dependent attribute closures must come AFTER the attribute they reference
