# Admin Dashboard — Implementation Plan

## What Already Exists

The file `src/screens/admin/AdminScreens.js` already has a basic `AdminDashboardScreen` with:
- 6 stat cards (Total Users, Skilled, Homeowners, Open Jobs, Active Orders, Reviews)
- Quick-nav rows to Users / Posts / Orders / Reviews management screens

The four management sub-screens (Users, Posts, Orders, Reviews) are also built — read-only lists with delete actions.

This plan describes what to **add and improve** to make the dashboard production-quality.

---

## Current Structure (reference)

```
AdminTabs  (bottom tab navigator)
├── AdminHome  →  AdminStack (nested stack)
│   ├── AdminDashboard          ← lives here
│   ├── AdminUsers
│   ├── AdminPosts
│   ├── AdminOrders
│   └── AdminReviews
└── AdminProfile
```

All admin service calls live in the relevant service files:
- `getAllUsers()` / `deleteUser()` — `profileService.js`
- `getAllPosts()` / `deletePost()` — `postService.js`
- `getAllOffers()` / `deleteOffer()` — `offerService.js`
- `getAllOrders()` / `deleteOrder()` / `updateOrderStatus()` — `orderService.js`
- `getAllReviews()` / `deleteReview()` — `reviewService.js`

---

## Phase 1 — Improve the Stat Cards (Dashboard Home)

### Goal
Replace the raw count tiles with richer analytics: breakdowns by status, growth hints, and a "recent activity" feed.

### New Stats to Show

| Stat | Source | Query |
|---|---|---|
| Total Users | `profiles` count | `getAllUsers()` already done |
| New Users (last 7 days) | `profiles.created_at` | filter `created_at >= now() - interval '7 days'` |
| Skilled / Normal breakdown | `profiles.role` | already done |
| Open Posts | `posts.status = 'open'` | `getPosts({ status: 'open' })` |
| Posts In Progress | `posts.status = 'in_progress'` | filter |
| Completed Posts | `posts.status = 'completed'` | filter |
| Pending Orders | `orders.status = 'pending'` | filter |
| Accepted Orders | `orders.status = 'accepted'` | filter |
| Completed Orders | `orders.status = 'completed'` | filter |
| Total Reviews | `reviews` count | already done |
| Avg Platform Rating | avg of `reviews.rating` | new query |

### UI Layout

```
┌─────────────────────────────────────────┐
│  Admin Dashboard                        │
├──────────┬──────────┬────────────────── ┤
│ 👥 Users │ 🔧 Pros  │ 🏠 Homeowners     │
│   42     │   18     │   24              │
│ +3 today │          │                   │
├──────────┴──────────┴───────────────────┤
│  Posts by Status                        │
│  Open ██████░░░░  12   (48%)            │
│  In Progress ███  6    (24%)            │
│  Completed ██████ 7    (28%)            │
├─────────────────────────────────────────┤
│  Orders by Status                       │
│  Pending   ●  5                         │
│  Accepted  ●  8                         │
│  Completed ●  30                        │
├─────────────────────────────────────────┤
│  ⭐ Avg Rating:  4.3 / 5  (56 reviews)  │
├─────────────────────────────────────────┤
│  Recent Activity (last 10 events)       │
│  [user avatar] Ali placed an order      │
│  [user avatar] Ahmed left a review ★5  │
│  ...                                    │
└─────────────────────────────────────────┘
```

### Steps to Build

1. **Add `getDashboardStats()` to a new `src/services/adminService.js`**

```js
// src/services/adminService.js
import { supabase } from '../lib/supabase';

export const getDashboardStats = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [users, posts, orders, reviews, newUsers] = await Promise.all([
    supabase.from('profiles').select('id, role, created_at').neq('role', 'admin'),
    supabase.from('posts').select('id, status'),
    supabase.from('orders').select('id, status'),
    supabase.from('reviews').select('id, rating'),
    supabase.from('profiles').select('id').neq('role', 'admin').gte('created_at', sevenDaysAgo),
  ]);

  return {
    users:    users.data    || [],
    posts:    posts.data    || [],
    orders:   orders.data   || [],
    reviews:  reviews.data  || [],
    newUsers: newUsers.data || [],
  };
};
```

2. **Add `getRecentActivity()` to `adminService.js`**

```js
export const getRecentActivity = async () => {
  const [orders, reviews] = await Promise.all([
    supabase
      .from('orders')
      .select('id, created_at, status, normal_user:profiles!orders_normal_user_id_fkey(full_name, avatar_url), posts(title)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('reviews')
      .select('id, created_at, rating, reviewer:profiles!reviews_normal_user_id_fkey(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Merge and sort by date, take top 10
  const events = [
    ...(orders.data || []).map(o => ({ type: 'order',  date: o.created_at, data: o })),
    ...(reviews.data || []).map(r => ({ type: 'review', date: r.created_at, data: r })),
  ];
  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events.slice(0, 10);
};
```

3. **Rewrite `AdminDashboardScreen`** to use `getDashboardStats()` and show the new layout.

4. **Add a `MiniProgressBar` component** inside `AdminScreens.js` (local to admin) to render the post-status bars — no library needed, just a `View` with `flex`.

---

## Phase 2 — Improve Management Sub-Screens

### 2A — AdminUsersScreen

**Missing:** Filter by role (All / Normal / Skilled), search by name, view skilled user skills and rating.

**Steps:**
1. Add a `FilterBar` (3 pills: All / Normal / Skilled) at the top.
2. Add a `TextInput` search box that filters `full_name` locally (no extra query).
3. Show `skilled_profiles.skills` as small pill badges under skilled users.
4. Keep the existing delete action.

```
┌────────────────────────────────────────┐
│ 🔍 Search users...                     │
│ [ All ] [ Normal ] [ Skilled ]         │
├──────────────────────────────┬─────────┤
│ [Avatar] Ali Hassan          │ Normal  │
│          +370 612 xxxxx      │ 🗑       │
├──────────────────────────────┬─────────┤
│ [Avatar] Mohamed K.          │ Skilled │
│          Plumber · ★4.8      │ 🗑       │
│          Electrician         │         │
└──────────────────────────────┴─────────┘
```

### 2B — AdminPostsScreen

**Missing:** Filter by status, view post owner, navigate to PostDetail.

**Steps:**
1. Add status filter pills: All / Open / In Progress / Completed / Cancelled.
2. Make each card tappable → navigate to `PostDetail` (already registered in MainStack).
3. Show owner name and creation date.

### 2C — AdminOrdersScreen

**Missing:** Filter by status, change order status (admin override), show scheduled date clearly.

**Steps:**
1. Add status filter pills.
2. Add a context menu (long press or "…" button) with status override options: Accept / Decline / Complete / Cancel.
3. Call `updateOrderStatus(orderId, newStatus)` from `orderService.js`.

```js
// Already exists in orderService.js — just call it:
await updateOrderStatus(orderId, 'completed');
```

### 2D — AdminReviewsScreen

**Missing:** Filter by rating (1–5 stars), search by skilled user name, show related post.

**Steps:**
1. Add star filter buttons (show only ★1, ★2, ★3, ★4, ★5 reviews).
2. Show the post title the order was for (need to join: `reviews → orders → posts`).
3. Update `getAllReviews()` in `reviewService.js` to include the post title:

```js
// reviewService.js — update getAllReviews
export const getAllReviews = async () => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviews_normal_user_id_fkey(full_name, avatar_url),
      skilled_user:profiles!reviews_skilled_user_id_fkey(full_name),
      orders(posts(title))
    `)
    .order('created_at', { ascending: false });
  return { data, error };
};
```

---

## Phase 3 — Add Missing Admin Features

### 3A — Edit Post Status (Admin Override)

Admins can cancel or reopen any post from AdminPostsScreen.

**Add to `postService.js`:**
```js
export const adminUpdatePostStatus = async (postId, status) => {
  const { data, error } = await supabase
    .from('posts')
    .update({ status })
    .eq('id', postId)
    .select()
    .single();
  return { data, error };
};
```

**In AdminPostsScreen:** Add a long-press menu with status options.

### 3B — View Full Order Detail (Admin)

Currently AdminOrdersScreen only shows a card. Add a drill-down screen.

**New screen: `AdminOrderDetailScreen`** (add inside `AdminScreens.js`)

Shows:
- Post title
- Homeowner info (name, phone)
- Skilled pro info (name, phone, rating)
- Schedule (date, time, location)
- Status + status change buttons
- Offer price

**Add to AdminStack in `RootNavigator.js`:**
```js
<Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} options={{ title: 'Order Detail' }} />
```

### 3C — Admin Notification Badge

Show unread count badges on the bottom tab for pending orders.

In `AdminTabs` in `RootNavigator.js`, add `tabBarBadge` to the AdminHome tab:
```js
options={{
  headerShown: false,
  title: t('nav.dashboard'),
  tabBarBadge: pendingOrdersCount || undefined,
}}
```

Fetch `pendingOrdersCount` in a context or pass it down from the dashboard.

---

## Phase 4 — Service Functions Checklist

All admin queries must live in service files. Here is a full checklist:

| Function | File | Status |
|---|---|---|
| `getAllUsers()` | `profileService.js` | ✅ exists |
| `deleteUser()` | `profileService.js` | ✅ exists |
| `getAllPosts()` | `postService.js` | ✅ exists |
| `deletePost()` | `postService.js` | ✅ exists |
| `adminUpdatePostStatus()` | `postService.js` | ❌ add in Phase 3A |
| `getAllOffers()` | `offerService.js` | ✅ exists |
| `deleteOffer()` | `offerService.js` | ✅ exists |
| `getAllOrders()` | `orderService.js` | ✅ exists |
| `deleteOrder()` | `orderService.js` | ✅ exists |
| `updateOrderStatus()` | `orderService.js` | ✅ exists |
| `getAllReviews()` | `reviewService.js` | ✅ exists (update join) |
| `deleteReview()` | `reviewService.js` | ✅ exists |
| `getDashboardStats()` | `adminService.js` | ❌ add in Phase 1 |
| `getRecentActivity()` | `adminService.js` | ❌ add in Phase 1 |

---

## Phase 5 — i18n Keys to Add

Any new strings must be added to both `src/locales/en.js` and `src/locales/lt.js`.

New keys needed:

```js
// en.js additions
admin: {
  // existing keys stay as-is, add:
  newUsersThisWeek: 'New this week',
  postsByStatus:    'Posts by Status',
  ordersByStatus:   'Orders by Status',
  avgRating:        'Avg Platform Rating',
  recentActivity:   'Recent Activity',
  placedOrder:      '{{name}} placed an order',
  leftReview:       '{{name}} left a {{rating}}★ review',
  filterAll:        'All',
  filterNormal:     'Normal',
  filterSkilled:    'Skilled',
  searchUsers:      'Search users...',
  orderDetail:      'Order Detail',
  changeStatus:     'Change Status',
  noActivity:       'No recent activity',
}
```

---

## Implementation Order (recommended)

| Step | Task | File(s) |
|---|---|---|
| 1 | Create `adminService.js` with `getDashboardStats` and `getRecentActivity` | `src/services/adminService.js` |
| 2 | Update `getAllReviews` to join post title | `src/services/reviewService.js` |
| 3 | Add `adminUpdatePostStatus` | `src/services/postService.js` |
| 4 | Rewrite `AdminDashboardScreen` with new stats + activity feed | `src/screens/admin/AdminScreens.js` |
| 5 | Add filter/search to `AdminUsersScreen` | same file |
| 6 | Add filter + tap-to-detail to `AdminPostsScreen` | same file |
| 7 | Add filter + status override to `AdminOrdersScreen` | same file |
| 8 | Add star filter + post title to `AdminReviewsScreen` | same file |
| 9 | Add `AdminOrderDetailScreen` | same file |
| 10 | Register new screen in navigation | `src/navigation/RootNavigator.js` |
| 11 | Add i18n keys | `src/locales/en.js`, `src/locales/lt.js` |

---

## Architecture Reminders

- Never import `supabase` directly inside a screen — all queries go through service functions.
- Never add business logic in `AdminDashboardScreen` — compute derived values (averages, filters) from the raw data returned by services.
- The `is_admin()` RLS helper in Supabase already grants admins access to all rows — no need for special `service_role` key on the frontend.
- All new screens must follow the existing dark theme: `colors.bg` (#0D0E14) background, `colors.bgCard` (#1A1D2B) cards, `colors.primary` (#FF6B2B) accents.
