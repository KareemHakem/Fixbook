# Admin Dashboard — User Guide

## How to Access the Dashboard

1. Register or log in with an account that has the `admin` role.
2. To make any account an admin, run this in the **Supabase SQL Editor**:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'paste-user-uuid-here';
```

3. Sign out and sign back in. The app will automatically show the **Admin tab navigator** instead of the normal user tabs.

---

## Dashboard Home

The first screen you see after logging in as admin.

### Users Card
- Shows the **total number of users** (excluding admins).
- The green badge (e.g. `+3 this week`) shows how many new accounts were created in the last 7 days.
- Below it, the card splits into **Skilled Pros** count and **Homeowners** count side by side.

### Posts by Status
- A bar chart showing how many posts are in each state:
  - **Open** (green) — job is waiting for offers
  - **In Progress** (yellow) — an order has been accepted
  - **Completed** (teal) — job is done
  - **Cancelled** (red) — job was cancelled
- The bar length is proportional to the total number of posts.

### Orders by Status + Avg Rating
- Left side shows order counts by status: **Pending**, **Accepted**, **Completed**, with the total at the bottom.
- Right side shows the **platform-wide average star rating** calculated from all reviews.

### Recent Activity
- A live feed of the last 10 events on the platform.
- Each row shows the user's avatar, what they did, and how long ago.
  - Order event: *"Ali placed an order for 'Water pump repair'"*
  - Review event: *"Mohamed rated 5★"*

### Management Links
- Four tap-to-navigate buttons at the bottom:
  - **Manage Users** — view and delete user accounts
  - **Manage Posts** — view, filter, and manage job posts
  - **Manage Orders** — view, filter, and override order status
  - **Manage Reviews** — view and delete reviews
- If there are **pending orders**, a red badge with the count appears on the Manage Orders button.

---

## Manage Users Screen

### How to open
Tap **Manage Users** from the dashboard, or go to **Admin tab → Dashboard → Manage Users**.

### Search
- Type a name or phone number in the search bar at the top.
- Results filter in real time — no need to press enter.
- Tap the X on the right to clear the search.

### Filter by role
Three pills below the search bar:
- **All** — shows every user
- **Normal** — shows only homeowners
- **Skilled** — shows only skilled pros

Each pill shows the count for that group.

### User cards
Each card shows:
- Avatar and full name
- Phone number (or "No phone" if not set)
- Role badge (HOMEOWNER / SKILLED PRO)

For **Skilled Pro** accounts, the card also shows:
- Star rating and review count
- Skills as small tags (e.g. Plumber, Electrician)

### Delete a user
Tap the **trash icon** on the right of any user card.
A confirmation alert appears — tap **Delete** to confirm.
This removes the profile and all their data (cascades via database).

---

## Manage Posts Screen

### How to open
Tap **Manage Posts** from the dashboard.

### Filter by status
A horizontal scrollable row of pills at the top:
- **All**, **Open**, **In Progress**, **Completed**, **Cancelled**
- Each pill shows the count for that status.
- Tap a pill to filter. Tap again or tap **All** to reset.

### Post cards
Each card shows:
- Job title
- Owner name and offer count (e.g. *"by Ali Hassan · 3 offers"*)
- Status badge

### Tap to view detail
Tap anywhere on the card body to open the full **Job Detail** screen (same screen normal users see).

### Change post status (admin override)
Tap the **three-dot (⋮) icon** on a card.
An alert appears with all other available statuses:
- From **Open**: can set to In Progress, Completed, or Cancelled
- From **In Progress**: can set to Open, Completed, or Cancelled
- etc.

This is useful for moderating or manually closing a post.

### Delete a post
Tap the **trash icon** on the right of any post card.
Confirm in the alert. Deletes the post and all its offers/orders (cascade).

---

## Manage Orders Screen

### How to open
Tap **Manage Orders** from the dashboard.

### Filter by status
Horizontal pill row: **All**, **Pending**, **Accepted**, **Completed**, **Declined**, **Cancelled**.
Each shows a live count.

### Order cards
Each card shows:
- Job title
- Homeowner → Skilled Pro names
- Scheduled date and time
- Status badge

### Tap to view full detail
Tap the card to open the **Order Detail** screen (see below).

### Change order status (admin override)
Tap the **three-dot (⋮) icon** on a card.
Available transitions:
- **Pending** → Accepted, Declined, Cancelled
- **Accepted** → Completed, Cancelled
- **Completed / Declined / Cancelled** → no further changes allowed

### Delete an order
Tap the **trash icon**. Confirm in the alert.

---

## Order Detail Screen

Opened by tapping any order card in Manage Orders.

### What it shows
- **Job card** — post title, current status badge, agreed price (€)
- **Homeowner card** — avatar, name, phone
- **Skilled Pro card** — avatar, name, star rating
- **Schedule card** — date, time, contact phone, job location

### Change Status button
Only appears when the order is **Pending** or **Accepted**.
Tap it to get the same status override alert as the list screen.

### Delete button
Red **Delete** button at the bottom.
Deletes the order and goes back to the list.

---

## Manage Reviews Screen

### How to open
Tap **Manage Reviews** from the dashboard.

### Filter by star rating
A horizontal row of pills: **All**, **★★★★★**, **★★★★**, **★★★**, **★★**, **★**.
Each shows how many reviews have that rating.
Tap a star pill to filter; tap it again to go back to All.

### Review cards
Each card shows:
- Reviewer name (homeowner)
- Skilled pro name (with arrow →)
- Job post title (with clipboard icon)
- Star rating (filled stars)
- Written review text (up to 2 lines, if provided)

### Delete a review
Tap the **trash icon** on the right.
Confirm in the alert. After deletion, the skilled pro's average rating is automatically recalculated by the database trigger.

---

## Quick Reference — What Each Role Can Do

| Action | Normal | Skilled | Admin |
|---|---|---|---|
| View dashboard | — | — | Yes |
| Delete any user | — | — | Yes |
| Delete any post | — | — | Yes |
| Override post status | — | — | Yes |
| Override order status | — | — | Yes |
| Delete any order | — | — | Yes |
| Delete any review | — | — | Yes |
| View all data | — | — | Yes |

---

## Common Admin Tasks

### Make a pending order "Accepted" manually
1. Go to **Manage Orders**
2. Filter by **Pending**
3. Tap the three-dot icon on the order → select **Accepted**
4. The database trigger automatically sets the post to "In Progress"

### Cancel a job post
1. Go to **Manage Posts**
2. Find the post (use status filter or scroll)
3. Tap the three-dot icon → select **Cancelled**

### Remove a fake or abusive review
1. Go to **Manage Reviews**
2. Find the review (use star filter to narrow down)
3. Tap the trash icon → confirm
4. The skilled pro's rating recalculates automatically

### Find a specific user
1. Go to **Manage Users**
2. Type their name or phone in the search bar
3. Their card appears immediately

### See how many new users joined this week
Check the green **"+N this week"** badge in the Users card on the Dashboard home.

---

## Data Refresh

Every list screen supports **pull-to-refresh**:
- Drag down on any list to reload the latest data from Supabase.
- The Dashboard home reloads automatically each time you navigate to it.
