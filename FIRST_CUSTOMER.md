# TravelDesk Pro — First Customer Guide

This guide shows you EXACTLY what to do when a travel agency says "Yes, I want to use your system."

You have two options:

**Option A: Agency signs up themselves** (automatic — they go to your website and create their account)
**Option B: You create their account manually** (takes 2 minutes, good if they are standing in front of you)

Both options work. Use whichever is easier.

---

## Option A: Agency Signs Up Themselves (Recommended)

1. Give them your website link: `https://traveldeskpro.app`
2. They click **Get Started**
3. They choose a plan (Starter / Professional / Enterprise)
4. They fill their agency name, email, phone, password
5. They fill address, CR number, currency (OMR), language
6. They click **Create Account**
7. They are logged in automatically and start working

### What Happens Behind the Scenes
- Their agency is saved in the `agencies` table in Supabase
- Their owner user is saved in the `users` table
- They are assigned a unique `agency_id`
- All their data is automatically separated from other agencies
- You can see them in your Supabase dashboard → **Table Editor** → `agencies`

### How You Get Paid
Since you don't have automatic payment yet, send them a WhatsApp after signup:

> "Welcome to TravelDesk Pro! Your account is active. Please send your first month's payment (40 OMR) to:
> [Your Bank Name]
> Account: [Your Account Number]
> IBAN: [Your IBAN]
> Thank you!"

---

## Option B: You Create Their Account Manually (2 Minutes)

Use this when you are meeting the agency owner in person and want to set them up immediately.

### Step 1: Get Their Details
Write down:
- Agency Name (e.g., "Al Baraka Travel")
- Owner Email (e.g., "owner@albaraka.com")
- Owner Phone (e.g., "+968 9123 4567")
- Password (make a simple one, e.g., "Baraka2024!")
- Address (e.g., "Ruwi, Muscat")
- CR Number (e.g., "CR-987654")
- Plan they want: starter, professional, or enterprise

### Step 2: Create Their Auth Account in Supabase

1. Go to your Supabase project dashboard
2. Left menu → **Authentication** → **Users**
3. Click **Add user** → **Create new user**
4. Fill:
   - Email: their email
   - Password: the password you chose
   - Auto-confirm user: YES (tick the box)
5. Click **Create user**
6. You will see a new user with a **UUID** (long string like `a1b2c3d4...`). Copy this UUID.

### Step 3: Create Their Agency in SQL Editor

1. Left menu → **SQL Editor** → **New query**
2. Paste this (replace everything in [brackets] with their real info):

```sql
INSERT INTO agencies (name, email, phone, cr_number, address, currency, language, status, plan)
VALUES (
  '[Agency Name]',
  '[Owner Email]',
  '[Owner Phone]',
  '[CR Number]',
  '[Address]',
  'OMR',
  'en',
  'active',
  'professional'
)
RETURNING id;
```

3. Click **RUN**
4. You will see one row with an `id` (a UUID). Copy this `id`.

### Step 4: Link the User to the Agency

Run this second query (replace the two UUIDs you copied):

```sql
INSERT INTO users (id, agency_id, email, name, role, active)
VALUES (
  '[USER_UUID_FROM_STEP_2]',
  '[AGENCY_UUID_FROM_STEP_3]',
  '[Owner Email]',
  '[Owner Name]',
  'owner',
  true
);
```

Click **RUN**.

Done. Their account is ready.

### Step 5: Give Them Their Login

Write this on a paper or send WhatsApp:

> **Your TravelDesk Pro Login**
> Website: https://traveldeskpro.app
> Email: [their email]
> Password: [the password you created]
> 
> Please change your password after you log in (Settings → Security).

---

## How to Add More Staff Members for the Agency

If the agency owner wants to add a staff member (e.g., an accountant or agent), you can do it in two ways:

### Way 1: Self-Service (Future)
The agency owner can add users in their Settings page (this is already built in the app, but needs to be connected to Supabase in a future update).

### Way 2: You Create Them Manually (Now)
1. Go to Supabase → **Authentication** → **Users** → **Add user**
2. Create the new user with their email and password
3. Copy their User UUID
4. Run this SQL query:

```sql
INSERT INTO users (id, agency_id, email, name, role, active)
VALUES (
  '[NEW_USER_UUID]',
  '[AGENCY_UUID]',
  '[Staff Email]',
  '[Staff Name]',
  'agent',  -- can be 'owner', 'admin', 'manager', 'agent', 'accountant', 'viewer'
  true
);
```

Roles explained:
- **owner**: Full access, billing, can delete everything
- **admin**: Full access, but cannot delete the agency
- **manager**: Can create bookings, customers, view reports
- **agent**: Can create bookings and customers
- **accountant**: Can view invoices and reports, mark payments
- **viewer**: Can only view data, cannot create or edit

---

## How to Suspend an Agency (If They Don't Pay)

If an agency stops paying after 2 months, you can suspend them:

1. Go to Supabase → **Table Editor** → **agencies**
2. Find their agency
3. Click the row
4. Change `status` from `active` to `suspended`
5. Click **Save**

When they log in, the app will still work but you can later add a check to block suspended agencies. For now, simply change their password or tell them their account is paused.

---

## Summary Checklist for First Customer

- [ ] Agency owner said YES
- [ ] Collected their details (name, email, phone, CR, address)
- [ ] Created their Supabase auth user
- [ ] Ran the SQL to create their agency
- [ ] Ran the SQL to link their user to the agency
- [ ] Gave them login credentials (website + email + password)
- [ ] Collected payment (cash or bank transfer)
- [ ] Sent them a receipt (you can create an invoice inside your own system)
- [ ] Followed up after 3 days to ask how it's going
- [ ] Asked for a testimonial (e.g., "Can I write a short review on my website?")

---

## You Are Ready

Go to the next agency. Repeat. Every new agency = 40 OMR per month.

Don't add more features until 5 agencies are paying you.
