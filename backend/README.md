# FixBook API (Laravel Backend)

REST API for the FixBook marketplace, replacing the Supabase backend.
Homeowners post repair jobs, skilled tradespeople make offers, orders are
booked and tracked through a full state machine, and reviews feed a rating
system. An admin role manages the platform.

## Stack

- Laravel 13 / PHP 8.4, Sanctum token auth
- PostgreSQL 16, Redis (cache + queues)
- Docker Compose: nginx + php-fpm + postgres + redis + queue worker

## Quick start

```bash
cp backend/.env.example backend/.env
docker compose up -d --build
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --seed
docker compose exec app php artisan storage:link
```

The API is served at `http://localhost:8080/api`. Seeded admin login:
`admin@fixbook.test` / `password`.

## Tests & lint

```bash
docker compose exec app php artisan test     # 37 feature tests
docker compose exec app vendor/bin/pint      # code style
```

## Domain model

| Entity | Notes |
|---|---|
| User | roles: `normal`, `skilled`, `admin` (admin can never be self-assigned at registration) |
| SkilledProfile | bio, skills[], rating, review_count — auto-created for skilled users |
| Post | job request; `open / in_progress / completed / cancelled` |
| Offer | one per skilled user per post (DB unique); `pending / ordered / declined` |
| Order | one active order per post (partial unique index on Postgres); `pending / accepted / declined / completed / cancelled` |
| Chat / Message | one chat per user pair (unique index, race-safe firstOrCreate) |
| Review | one per order, only after completion; rating recalculated on create AND delete |

Supabase triggers are reimplemented as Eloquent observers
(`app/Observers`): offers_count sync, order status state machine
(post + offer transitions), rating recalculation, chat last_message_at.

Authorization lives in policies (`app/Policies`), validation in form
requests (`app/Http/Requests`), serialization in API resources
(`app/Http/Resources`).

## API overview

```
POST   /api/auth/register|login|logout      GET /api/me
GET    /api/posts (search, status, mine, paginated)
POST   /api/posts                           GET|PUT|DELETE /api/posts/{id}
GET    /api/posts/{id}/offers               POST /api/posts/{id}/offers
GET    /api/my-offers                       PUT|DELETE /api/offers/{id}
GET    /api/orders                          POST /api/orders
GET    /api/orders/{id}
POST   /api/orders/{id}/{accept|decline|complete|cancel}
GET    /api/chats                           POST /api/chats
GET    /api/chats/{id}/messages             POST /api/chats/{id}/messages
POST   /api/chats/{id}/read
GET    /api/users/{id}/reviews              POST /api/reviews
GET    /api/notifications(+ /unread-count, /read-all, /{id}/read)
GET    /api/skilled-users (skill filter, search)
GET|PUT /api/profile (+ avatar upload)      PUT /api/profile/push-token
GET    /api/admin/stats|activity|users|posts|orders|reviews
DELETE /api/admin/users/{id}                DELETE /api/admin/reviews/{id}
```

All list endpoints are paginated (`page`, `per_page`).

## Production

```bash
DB_PASSWORD=... docker compose -f docker-compose.prod.yml up -d --build
```
