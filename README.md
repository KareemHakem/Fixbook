# 🔧 FixBook— Home Repair Marketplace

A full-featured React Native mobile app connecting homeowners with skilled tradespeople. Built with **Expo** and **Supabase**.

---

## 📱 Features

### Three User Roles

| Feature | Normal User | Skilled User | Admin |
|---|---|---|---|
| Browse all posts | ✅ | ✅ | ✅ |
| Create / Edit / Delete post | ✅ | ❌ | ✅ |
| Make an offer on a post | ❌ | ✅ (1 per post) | ✅ |
| Edit / Delete own offer | ❌ | ✅ (pending only) | ✅ |
| Create an order from an offer | ✅ | ❌ | ✅ |
| Accept / Decline order | ❌ | ✅ | ✅ |
| Mark order as completed | ❌ | ✅ | ✅ |
| Leave a review | ✅ (after completion) | ❌ | ✅ |
| Start a chat | ✅ | ❌ | — |
| Reply in chat | ✅ | ✅ | — |
| Edit own profile | ✅ | ✅ | ✅ |
| Admin CRUD on all data | ❌ | ❌ | ✅ |

---

## 🗂️ Project Structure

```
fixit-app/
├── App.js                          # Root entry point
├── app.json                        # Expo config
├── babel.config.js
├── package.json
├── .env.example                    # Copy to .env and fill in values
│
└── src/
    ├── lib/
    │   └── supabase.js             # Supabase client initialisation
    │
    ├── context/
    │   └── AuthContext.js          # Global auth state + signIn/signUp/signOut
    │
    ├── theme/
    │   ├── colors.js               # All color tokens
    │   └── index.js                # Spacing, typography, radius, shadows
    │
    ├── services/                   # All Supabase API calls
    │   ├── profileService.js       # profiles + skilled_profiles CRUD
    │   ├── postService.js          # posts CRUD + image upload
    │   ├── offerService.js         # offers CRUD
    │   ├── orderService.js         # orders CRUD + status updates
    │   ├── chatService.js          # chats + messages + realtime subscription
    │   └── reviewService.js        # reviews CRUD
    │
    ├── components/
    │   ├── common/
    │   │   └── index.js            # Button, Input, Card, Badge, Avatar,
    │   │                           #   StarRating, LoadingSpinner, EmptyState,
    │   │                           #   SectionHeader, Divider, ErrorBanner
    │   ├── posts/
    │   │   └── PostCard.js         # Post list item card
    │   ├── offers/
    │   │   └── OfferCard.js        # Offer card with Order + Chat actions
    │   ├── orders/
    │   │   └── OrderCard.js        # Order card with Accept/Decline/Complete/Review
    │   └── chat/
    │       └── index.js            # MessageBubble + ChatListItem
    │
    ├── screens/
    │   ├── auth/
    │   │   └── AuthScreens.js      # LoginScreen + RegisterScreen
    │   │
    │   ├── normal/                 # Used by both normal AND skilled users
    │   │   ├── PostScreens.js      # PostsListScreen, PostDetailScreen, CreatePostScreen
    │   │   ├── CreateOrderScreen.js
    │   │   ├── OrdersListScreen.js # Works for both roles (tabs: Active / History)
    │   │   ├── ChatScreens.js      # ChatListScreen + ChatDetailScreen
    │   │   ├── ProfileScreen.js    # Profile view/edit (role-aware)
    │   │   └── LeaveReviewScreen.js
    │   │
    │   └── admin/
    │       └── AdminScreens.js     # Dashboard, Users, Posts, Orders, Reviews
    │
    └── navigation/
        └── RootNavigator.js        # Auth stack + role-based tab navigator
```

---

## 🚀 Setup & Installation

### 1. Clone & Install

```bash
git clone <your-repo>
cd fixit-app
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase values:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in your Supabase dashboard under **Settings → API**.

### 3. Set Up Supabase Backend

Follow the complete guide in **`FIXIT_Supabase_Backend_Guide.docx`**. The order matters:

1. Create enum types
2. Create all 8 tables
3. Create functions & triggers
4. Enable RLS + add all policies
5. Create storage buckets
6. Enable Realtime on `messages`, `orders`, `offers` tables

### 4. Run the App

```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Database, auth, storage, realtime |
| `@react-navigation/native` | Navigation container |
| `@react-navigation/native-stack` | Stack navigation |
| `@react-navigation/bottom-tabs` | Tab bar navigation |
| `expo-image-picker` | Photo selection for posts & avatars |
| `@react-native-community/datetimepicker` | Date & time selection in orders |
| `@react-native-async-storage/async-storage` | Persist Supabase auth session |
| `react-native-url-polyfill` | Required for Supabase on React Native |
| `react-native-safe-area-context` | Safe area insets |

---

## 🔄 App Flow

### Normal User
```
Register (role: normal)
  → Browse Jobs (PostsList)
      → Tap a Post (PostDetail)
          → See Offers (OfferCard)
              → Tap "Order"  → CreateOrder → (Skilled accepts)
              → Tap "Chat"   → ChatDetail (realtime)
  → Orders Tab
      → Active orders: waiting / in progress
      → Completed orders: tap "Leave Review" → LeaveReview
  → Profile Tab
      → Edit name, phone, address
```

### Skilled User
```
Register (role: skilled)
  → Browse Jobs (PostsList)
      → Tap a Post (PostDetail)
          → Tap "Make an Offer" → fill description + price
          → Edit / Delete own offer
  → Orders Tab
      → Pending: Accept or Decline
      → Accepted: Mark as Completed
  → Chats Tab (receive chats started by homeowners)
  → Profile Tab
      → Edit bio, skills, phone, address
      → View all reviews with star ratings
```

### Admin
```
Login (role: admin)
  → Dashboard (stats: users, posts, orders, reviews)
  → Manage Users   → list all, delete any
  → Manage Posts   → list all, delete any
  → Manage Orders  → list all, delete any
  → Manage Reviews → list all, delete any
  → Profile Tab    → edit own profile
```

---

## 🗄️ Data Model Summary

```
auth.users  (Supabase built-in)
    │
    ├── profiles          (id, role, full_name, phone, address, avatar_url)
    │       │
    │       └── skilled_profiles  (id, bio, skills[], rating, review_count)
    │
    ├── posts             (user_id → normal, title, description, image_url, status)
    │       │
    │       └── offers    (post_id, skilled_user_id, description, price, status)
    │               │
    │               └── orders   (post_id, offer_id, normal_user_id, skilled_user_id,
    │                            scheduled_date, scheduled_time, contact_phone, location, status)
    │                        │
    │                        └── reviews  (order_id, normal_user_id, skilled_user_id, rating, review_text)
    │
    └── chats             (normal_user_id, skilled_user_id, post_id)
            │
            └── messages  (chat_id, sender_id, content, is_read)
```

---

## 🔐 Security Model

All rules are enforced at the **Supabase database layer** via Row Level Security. The app cannot bypass them even if there is a bug in the frontend.

| Rule | How it's enforced |
|---|---|
| One offer per skilled user per post | `UNIQUE (post_id, skilled_user_id)` constraint |
| Only one active order per post | Partial unique index on `orders` |
| Only normal users can start chats | RLS INSERT policy on `chats` |
| Reviews only after completed order | RLS INSERT policy checks `orders.status = 'completed'` |
| Only order owner can review | RLS checks `normal_user_id = auth.uid()` |
| Skilled user can only accept their own orders | RLS UPDATE checks `skilled_user_id = auth.uid()` |

---

## 🏗️ Making a User an Admin

Run this in the Supabase SQL Editor (never expose this to the frontend):

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'paste-user-uuid-here';
```

---

## 🛠️ Common Issues

**"Cannot read property of null" on profile**
→ The `handle_new_user` trigger may not have fired. Check Supabase logs under Database → Logs.

**Images not loading**
→ Make sure storage buckets are set to `public: true` and the storage policies are applied.

**Realtime chat not working**
→ Go to Supabase Dashboard → Database → Replication and enable the `messages` table.

**Order button still showing after order placed**
→ Check that the partial unique index `one_active_order_per_post` was created correctly.

**Date picker not showing on Android**
→ This is a known issue on some Android versions with `@react-native-community/datetimepicker`. Run `expo install @react-native-community/datetimepicker` to get the Expo-compatible version.

---

## 📝 License

MIT
