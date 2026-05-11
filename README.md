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
- Customer quote request submission
- Automatic client creation and deduplication
- Job creation pipeline
- Service selection support
- Automated business email notifications

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

## Deployment
- Render (Backend Hosting)
- Vercel (Frontend Hosting)
- Cloudflare DNS

---

# Core Business Workflow

1. Customer submits quote request
2. System creates or updates client record
3. Job is created with pending quote status
4. Selected services are attached to job
5. Business receives email notification
6. Admin manages workflow through dashboard
7. Completed jobs trigger review requests
8. Customer submits review securely

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

# Admin Bootstrap
ALLOW_ADMIN_BOOTSTRAP=false