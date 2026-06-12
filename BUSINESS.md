# TravelDesk Pro — Business Guide (How You Make Money)

## The Simple Version
You sell a monthly subscription to travel agencies. They pay you every month to use your software. You don't need to visit them every month — the software is on the internet, they just log in and use it.

## Your Plans (Prices)
- **Starter**: 30 OMR/month (~78 USD)
- **Professional**: 40 OMR/month (~104 USD)
- **Enterprise**: 150 OMR/month (~390 USD)

For your first customer, sell the **Professional** plan (40 OMR/month). It is the middle plan — not too cheap, not too expensive.

---

## How a Travel Agency Uses Your System (The Customer Journey)

### 1. Agency Owner Visits Your Website
They open `https://traveldeskpro.app` on their phone or laptop.

### 2. They Explore the Demo
They click "Explore Demo Workspace" and play with the software for 5 minutes. They see:
- How easy it is to add a customer
- How to create a booking
- How to print an invoice
- How to track agent commissions

### 3. They Want to Buy
They click "Get Started" and fill the signup form:
- Agency name
- Email
- Phone
- Password
- Plan choice

If Supabase is connected, this creates their real account instantly.

### 4. They Pay You
Since you don't have Stripe yet, you collect payment manually for the first few customers:
- **Bank transfer** to your Omani bank account
- **Cash** in person
- **Check**

They pay 40 OMR. You give them a receipt (you can create an invoice inside your own system for them).

### 5. They Start Working
They log in and immediately start adding:
- Their customers
- Their bookings (air tickets, visas, hotels)
- Their agents (staff who sell tickets)
- Their invoices

All their data is safe in the cloud. Only they can see it. Other agencies cannot see their data.

### 6. Every Month They Pay Again
After 30 days, you send them a WhatsApp message:
> "Hi [Name], your TravelDesk Pro subscription is due. Please transfer 40 OMR to [your bank account]. Thank you!"

If they don't pay, you can suspend their account from the Admin panel (or just change their password temporarily).

---

## What Happens Behind the Scenes (Multi-Tenant)

When Agency A logs in:
- They see Agency A customers, bookings, invoices
- They do NOT see Agency B data
- They do NOT see Agency C data

This is called **multi-tenant isolation**. It is automatic because of the database design (Row Level Security).

---

## Your Role as the Business Owner

| Task | How Often | Time |
|------|-----------|------|
| Meet new agencies | 1–2 per week | 1 hour each |
| Demo the software | Every meeting | 15 minutes |
| Collect payments | Monthly per agency | 5 minutes (WhatsApp) |
| Create accounts | Once per agency | 2 minutes |
| Answer support questions | Daily | 30 minutes total |

---

## How to Get Your First Customer (This Week)

### Step 1: Make a List
Open your phone contacts. Write down every travel agency owner or manager you know in Oman. Also search Google Maps for:
- "Travel agency Muscat"
- "Travel agency Seeb"
- "Travel agency Salalah"
- "Umrah travel agency Oman"

Make a list of 20 agencies.

### Step 2: Send a WhatsApp Message (Template)

> "Hi [Name], I hope you are well. I built a software called TravelDesk Pro for travel agencies. It replaces paper, Excel, and messy notebooks. You can manage customers, bookings, invoices, and agent commissions in one place. Can I show you a 15-minute demo this week? I am offering the first month free."

Send this to 20 people. 3–5 will reply. 1 will say yes to a meeting.

### Step 3: The Demo Meeting
Bring your laptop. Do NOT talk about technology. Talk about THEIR problems:
- "Do you lose customer details sometimes?"
- "Do you calculate agent commissions manually?"
- "Do you have to search WhatsApp for old booking details?"

Then show them the solution:
1. Open your live website
2. Click **Explore Demo**
3. Add a customer in 10 seconds
4. Create a booking in 20 seconds
5. Print an invoice in 10 seconds
6. Show the agent commission report

Ask: "Would this save your team time every day?"

### Step 4: Close the Sale
If they say yes:
- "Great. The Professional plan is 40 OMR per month. I will give you the first month free to try it. If you like it, you pay month 2. If you don't like it, you stop — no contract."
- This is called a **30-day free trial**. It removes their fear.

### Step 5: Set Them Up
Option A: They sign up themselves on your website.
Option B: You create their account manually in Supabase (see `FIRST_CUSTOMER.md`).

Give them their login email and password. Write it on a paper or send via WhatsApp.

### Step 6: Follow Up After 3 Days
Send a WhatsApp:
> "Hi [Name], how is the system working for you? Any questions?"

Help them with any small issue. If they are happy, they will pay and stay forever.

---

## Monthly Revenue Math

| Customers | Plan | Monthly Revenue |
|-----------|------|-----------------|
| 1 agency | 40 OMR | 40 OMR |
| 5 agencies | 40 OMR | 200 OMR |
| 10 agencies | 40 OMR | 400 OMR |
| 20 agencies | 40 OMR | 800 OMR |
| 50 agencies | 40 OMR | 2,000 OMR |

**2,000 OMR per month = 24,000 OMR per year.** This is a real business.

---

## What You Should NOT Do Right Now

| Don't | Why |
|-------|-----|
| Don't add more features | You have enough to sell. Stop building. |
| Don't integrate Stripe yet | Collect manually for the first 10 customers. |
| Don't hire a developer | You don't need one. The system is done. |
| Don't redesign the UI again | It is good enough. Agencies care about function, not beauty. |
| Don't lower your price | 40 OMR is cheap for a business tool. |

---

## Next Step
Read `FIRST_CUSTOMER.md` for the exact steps to create an agency account and collect the first payment.
