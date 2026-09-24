# Chavez Tree Service Backend API

Backend API and business logic layer for the Chavez Tree Service platform.

This production-ready backend powers:
- customer quote requests
- admin job management
- review collection
- automated email workflows
- employee/service relationships
- secure authentication

Built with Node.js, Express, GraphQL, Sequelize, PostgreSQL, and Supabase.

---

# Features

## Lead Intake System
- Customer quote request submission (public form)
- Admin-entered jobs for word-of-mouth clients, with an existing-client lookup
  so returning customers don't get duplicate records
- Automatic client creation and deduplication
- Job creation pipeline
- Service selection support
- Automated business email notifications (skipped when admin creates the job themselves)

## Admin Authentication
- JWT-based authentication
- Protected admin routes
- Secure password hashing with bcrypt
- Production-safe admin bootstrap protection

## Job Management
- Job lifecycle tracking
- Status workflow management
- Employee assignments
- Service assignments
- Job photo support

## Customer Review System
- Secure tokenized review links
- One-time review submission protection
- Rating and comment collection
- Automated low-rating alerts

## Payments & Invoicing
- Per-job payment log — jobs are often paid across more than one method
  (check, Zelle, Venmo, Cash App, cash, card), so a job tracks a running
  balance instead of a single paid/unpaid flag
- Admin can log any payment by hand, including backfilling what was already
  collected before a job was entered into the system
- One combined "Send Receipt" email: receipt, balance due, ways to pay
  (including a Pay Online link to the site), and the review request —
  replaces sending two separate emails
- Stripe Checkout for online card payments, via a durable public invoice
  page (`/pay?token=...`) rather than a bare Stripe link — the checkout
  session is created on demand for whatever the balance is at that moment
- Stripe webhook logs the payment and auto-flips a job to "paid" once
  its balance is fully covered, from any combination of methods
- No refund tooling — payments here are for completed tree work, which
  isn't something to reverse

## Security
- Helmet security middleware
- Rate limiting
- CORS protection
- Environment variable protection
- Token validation middleware

## Email Automation
- Quote request notifications
- Review request emails
- Internal low-rating alerts
- Powered by Resend

---

# Tech Stack

## Backend
- Node.js
- Express
- GraphQL
- Sequelize ORM

## Database & Storage
- PostgreSQL (Supabase)
- Supabase Storage

## Authentication & Security
- JWT
- bcryptjs
- Helmet
- express-rate-limit

## Payments
- Stripe (Checkout Sessions + Webhooks)

## Deployment
- Render (Backend Hosting)
- Vercel (Frontend Hosting)
- Cloudflare DNS

---

# Core Business Workflow

1. Customer submits a quote request (public form), or admin enters a
   word-of-mouth job directly
2. System creates or updates the client record (existing clients are
   matched by email, never duplicated)
3. Job is created, tracked through the status workflow
4. Selected services are attached to the job
5. Admin manages the workflow through the dashboard, sets the job total
   once work is done
6. Admin sends the combined receipt + pay + review email
7. Client pays by whatever method works for them — online via the site,
   or Zelle/Venmo/Cash App/check/cash reported back to admin — admin logs
   anything that isn't paid online
8. Job auto-flips to "paid" once its logged payments cover the total
9. Customer submits a review securely

---

# Environment Variables

Create a `.env` file:

```env
# Database
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=

# Authentication
JWT_SECRET=
REVIEW_SECRET=

# Frontend
FRONTEND_URL=

# Resend Email
RESEND_API_KEY=
NEW_QUOTE_EMAIL=
REVIEW_EMAIL=

# Stripe Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Ways to pay shown on the receipt email (Zelle/Venmo/Cash App number)
# Optional — defaults to 404-886-1996 if unset
PAYMENT_CONTACT_NUMBER=

# Admin Bootstrap
ALLOW_ADMIN_BOOTSTRAP=false