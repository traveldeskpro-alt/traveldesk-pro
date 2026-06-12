# TravelDesk Pro — Zero-Code Deployment Guide

## What You Need (3 Free Accounts)
1. **GitHub** — to store your code
2. **Vercel** — to host your website on the internet
3. **Supabase** — your cloud database (free)

You will NOT write code. You will only copy-paste.

---

## Step 1: Buy Your Domain (10 minutes)
Buy **traveldeskpro.app** from Namecheap or GoDaddy. 
Cost: ~12 USD/year (~4.5 OMR).

You will connect this domain to Vercel in Step 5.

---

## Step 2: Create a Supabase Project (10 minutes)
1. Go to [https://supabase.com](https://supabase.com) and click "Start your project"
2. Sign up with your email (free)
3. Create a new project. Name it: **traveldesk-pro**
4. Choose a region close to your customers: **Middle East (me-central1)** or **Frankfurt**
5. Click "Create new project" and wait 1–2 minutes

### Get Your Keys
1. In your Supabase project, click the green button "Connect"
2. Choose "App Frameworks" → "Next.js"
3. You will see two values:
   - `NEXT_PUBLIC_SUPABASE_URL` (looks like `https://xxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (a long random string)
4. **Copy both and save them in a notepad** — you will paste them in Vercel later

### Run the Database Schema
1. In Supabase, go to the left menu → **SQL Editor**
2. Click **New query**
3. Open the file `supabase_schema.sql` from your computer (inside the `traveldesk-pro` folder)
4. Copy ALL of the SQL text
5. Paste it into the SQL Editor
6. Click **RUN**
7. You will see a green checkmark. Done.

This creates all your tables: agencies, users, customers, bookings, invoices, agents, payments. It also turns on **Row Level Security** so each agency only sees its own data.

### Important: Turn off Email Confirmation (for now)
1. In Supabase, go to left menu → **Authentication** → **Providers** → **Email**
2. Turn OFF **Confirm email** (toggle it off)
3. Click **Save**
Why? So when a new agency signs up, they are logged in immediately without checking their email.

---

## Step 3: Upload Your Code to GitHub (10 minutes)
1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: **traveldesk-pro**
3. Choose **Private** (so nobody sees your code)
4. Click **Create repository**
5. You will see instructions. Follow the "…or push an existing repository from the command line" section:

```bash
cd traveldesk-pro
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/traveldesk-pro.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

> **Note:** If you don't have `git` on your computer, download GitHub Desktop and drag the `traveldesk-pro` folder into it, then publish to GitHub.

---

## Step 4: Deploy to Vercel (5 minutes)
1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Sign up with your GitHub account
3. You will see your `traveldesk-pro` repository. Click **Import**.
4. In the settings screen:
   - **Framework Preset**: Next.js (should be auto-selected)
   - **Environment Variables**: Click **Add** and add these two:
     - Name: `NEXT_PUBLIC_SUPABASE_URL` → Value: paste your Supabase URL
     - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Value: paste your Supabase Anon Key
5. Click **Deploy**
6. Wait 2–3 minutes. Vercel will build and deploy your website.

Your website is now live on the internet.

---

## Step 5: Connect Your Domain (5 minutes)
1. In Vercel dashboard, go to your project → **Settings** → **Domains**
2. Type `traveldeskpro.app` and click **Add**
3. Vercel will show you DNS records (2 lines). Copy them.
4. Go to Namecheap (or wherever you bought the domain) → **Advanced DNS**
5. Add two **CNAME Records** exactly as Vercel shows you:
   - Type: CNAME, Host: `www`, Value: `cname.vercel-dns.com`
   - Type: A, Host: `@`, Value: `76.76.21.21` (or whatever Vercel gives you)
6. Save. Wait 5–10 minutes. Then click **Verify** in Vercel.

Done. Now `https://traveldeskpro.app` opens your software.

---

## Step 6: Test Your Live App
1. Open `https://traveldeskpro.app` in your browser
2. Click **Explore Demo Workspace** → it should work the same as before
3. Click **Get Started** → fill the signup form → it should create a real account in Supabase
4. Go back to Supabase → **Table Editor** → `agencies` table. You should see a new row. That means your database is connected.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails on Vercel | Make sure you added the two Supabase environment variables |
| Signup shows error | In Supabase, go to Auth → Email → turn OFF "Confirm email" |
| No data shows | Check Supabase SQL Editor → make sure you ran the schema |
| Domain not working | Wait 10 minutes for DNS to update, then verify again in Vercel |

---

## You Are Done
Your software is now a real SaaS running on the internet with a real database.

Next: Read `BUSINESS.md` to get your first customer.
