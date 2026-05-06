# CLAUDE.md — FixBook Project Guide

## Project Overview

FixBook is a React Native mobile marketplace application built with Expo and Supabase. It connects homeowners (normal users) who post home repair jobs with skilled tradespeople who submit price offers. A third role — admin — manages the platform.

---

## Tech Stack

- **Frontend:** React Native + Expo (managed workflow)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Navigation:** React Navigation (native stack + bottom tabs)
- **Language:** JavaScript

---

## Commands

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

---

## Environment Variables

Create a `.env` file at the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in Supabase Dashboard → Settings → API.

---

## Project Structure

```
src/
├── lib/supabase.js              # Supabase client init with AsyncStorage adapter
├── context/AuthContext.js       # Global auth state: user, profile, signIn, signUp, signOut
├── theme/
│   ├── colors.js                # All color tokens (orange #FF6B2B, teal #4ECDC4, etc.)
│   └── index.js                 # Spacing, typography, radius, shadows
├── services/                    # ALL Supabase queries go here — never in screens
│   ├── profileService.js
│   ├── postService.js
│   ├── offerService.js
│   ├── orderService.js
│   ├── chatService.js
│   └── reviewService.js
├── components/
│   ├── common/index.js          # Button, Input, Card, Badge, Avatar, StarRating,
│   │                            # LoadingSpinner, EmptyState, SectionHeader, ErrorBanner
│   ├── posts/PostCard.js
│   ├── offers/OfferCard.js
│   ├── orders/OrderCard.js
│   └── chat/index.js            # MessageBubble, ChatListItem
├── screens/
│   ├── auth/AuthScreens.js      # LoginScreen, RegisterScreen
│   ├── normal/                  # Shared by normal AND skilled users
│   │   ├── PostScreens.js       # PostsListScreen, PostDetailScreen, CreatePostScreen
│   │   ├── CreateOrderScreen.js
│   │   ├── OrdersListScreen.js  # Active / History tabs, works for both roles
│   │   ├── ChatScreens.js       # ChatListScreen, ChatDetailScreen
│   │   ├── ProfileScreen.js     # Role-aware profile view/edit
│   │   └── LeaveReviewScreen.js
│   └── admin/AdminScreens.js    # Dashboard, Users, Posts, Orders, Reviews
└── navigation/RootNavigator.js  # Auth stack + role-based tab navigator
```

---

## Architecture Rules

### Service Layer Pattern
**Never import Supabase directly in screen components.** All database operations go through `src/services/`. Services export named async functions that return `{ data, error }`.

### Auth Context
All screens access the current user and profile through `AuthContext`. Never query the profiles table inside a screen on mount.

### Navigation
`RootNavigator` checks auth state and user role on every render:
- No session → `AuthStack` (Login, Register)
- Role `normal` → `NormalTabs`
- Role `skilled` → `SkilledTabs`
- Role `admin` → `AdminTabs`
- Shared modal screens (PostDetail, CreatePost, ChatDetail, CreateOrder, LeaveReview) registered at `MainStack` level — accessible from all roles.

---

## Database — 8 Tables

| Table | Purpose |
|---|---|
| `profiles` | All users: id, role, full_name, phone, address, avatar_url |
| `skilled_profiles` | Skilled users only: bio, skills[], rating, review_count |
| `posts` | Job requests from homeowners |
| `offers` | Price bids from skilled users |
| `orders` | Confirmed bookings with schedule and location |
| `chats` | Chat sessions between user pairs |
| `messages` | Individual messages |
| `reviews` | Post-completion ratings and text |

### Key Constraints
- `UNIQUE (post_id, skilled_user_id)` on `offers` — one offer per user per post
- Partial unique index on `orders(post_id) WHERE status NOT IN ('declined','cancelled')` — one active order per post

### Custom Enum Types
- `user_role`: normal, skilled, admin
- `post_status`: open, in_progress, completed, cancelled
- `offer_status`: pending, ordered, declined
- `order_status`: pending, accepted, declined, completed, cancelled

---

## Database Triggers (6 total)

| Trigger | Fires on | Action |
|---|---|---|
| `on_auth_user_created` | INSERT on auth.users | Creates profiles row; creates skilled_profiles if role = skilled |
| `trg_set_updated_at` | BEFORE UPDATE all tables | Sets updated_at = now() |
| `trg_sync_offers_count` | INSERT/DELETE on offers | Updates posts.offers_count |
| `trg_order_status_change` | UPDATE on orders | Drives post and offer status state machine |
| `trg_recalculate_rating` | INSERT on reviews | Recalculates skilled_profiles.rating and review_count |
| `trg_update_last_message` | INSERT on messages | Updates chats.last_message_at |

---

## Security — Row Level Security

RLS is enabled on all 8 tables. Two helper functions:
- `is_admin()` — returns true if current user role = admin (SECURITY DEFINER)
- `is_skilled()` — returns true if current user role = skilled (SECURITY DEFINER)

Key rules enforced at database level:
- Only normal users can insert posts
- Only skilled users can insert offers
- Only normal users can insert chats
- Skilled users only see their own orders
- Reviews only allowed after order.status = completed and review_left = false
- Storage paths follow `{user_id}/filename` — enforced by storage.foldername()

---

## User Roles and Permissions

| Action | Normal | Skilled | Admin |
|---|---|---|---|
| Browse posts | ✅ | ✅ | ✅ |
| Create/edit/delete post | ✅ | ❌ | ✅ |
| Make offer | ❌ | ✅ (1 per post) | ✅ |
| Edit/delete offer | ❌ | ✅ (pending only) | ✅ |
| Create order | ✅ | ❌ | ✅ |
| Accept/decline order | ❌ | ✅ | ✅ |
| Mark order complete | ❌ | ✅ | ✅ |
| Leave review | ✅ (after completion) | ❌ | ✅ |
| Start chat | ✅ | ❌ | — |
| Reply in chat | ✅ | ✅ | — |
| Admin CRUD all data | ❌ | ❌ | ✅ |

---

## Real-Time Chat

Chat uses Supabase Realtime WebSocket subscriptions. Key implementation details:

- Subscribe to INSERT events on `messages` filtered by `chat_id`
- Always return a cleanup function from `useEffect` calling `supabase.removeChannel(channel)` on unmount — failure to do this causes memory leaks
- `getOrCreateChat()` checks for existing session before inserting to prevent duplicates

---

## Order State Machine

```
PENDING → ACCEPTED → COMPLETED → (review button appears)
PENDING → DECLINED → (post reopens if no other active orders)
```

All transitions are driven by the `trg_order_status_change` trigger. No application code needed.

---

## Common Issues and Fixes

| Issue | Fix |
|---|---|
| Registration fails silently, no profile created | `on_auth_user_created` trigger missing GRANT permissions. Run: `GRANT USAGE ON SCHEMA public TO supabase_auth_admin; GRANT ALL ON public.profiles TO supabase_auth_admin;` |
| Email confirmation link opens "Not Found" on phone | Site URL set to localhost. Disable email confirmation in Supabase Auth Settings for development |
| PGRST200 error on offers query | No direct FK from offers to skilled_profiles. Use nested join: `offers → profiles → skilled_profiles` |
| Partial unique index not enforcing | Syntax error in WHERE clause. Drop and recreate: `CREATE UNIQUE INDEX ON orders(post_id) WHERE status NOT IN ('declined','cancelled')` |
| Realtime chat not working | Go to Supabase Dashboard → Database → Replication and enable the messages table |
| Order button still showing after order placed | Check that the partial unique index was created correctly |
| Images not loading | Make sure storage buckets are set to public: true and storage policies are applied |

---

## Making a User an Admin

Run this in Supabase SQL Editor only — never expose to frontend:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'paste-user-uuid-here';
```

---

## Supabase Backend Setup Order

1. Create enum types
2. Create all 8 tables
3. Create functions and triggers
4. Enable RLS and add all policies
5. Create storage buckets (avatars, post-images)
6. Enable Realtime on messages, orders, offers tables
