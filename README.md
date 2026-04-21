# ChavezTree Backend API

This is the backend service for the ChavezTree Tree Service application. It is built using Node.js, Express, GraphQL, and Sequelize with PostgreSQL.

The backend handles all business logic, database management, authentication, job tracking, and customer feedback collection.

---

##  Features

- GraphQL API for all data operations
- Admin authentication (JWT-based)
- Job management system (quotes, status updates, assignments)
- Client management
- Service management
- Employee assignment system
- Customer review system
- Email notifications for:
  - Job updates
  - Review requests
  - Low-rating feedback alerts

---

## Core Business Flow

1. Admin creates a quote request (job)
2. Job is assigned services and employees
3. Job status is updated through lifecycle (pending → in progress → completed)
4. When job is completed, a review request email is sent to the client
5. Client submits feedback via frontend review page
6. Low ratings trigger internal email notification to business

---

## Tech Stack

- Node.js
- Express
- GraphQL
- Sequelize ORM
- PostgreSQL
- JWT Authentication
- Nodemailer (email service)

---

## Project Structure
- src/
- models/
- graphql/
- types/
- mutations/
- queries/
- services/
- utils/
- config/

---

## Environment Variables

Create a `.env` file:
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=

JWT_SECRET=
REVIEW_SECRET=

EMAIL_USER=
EMAIL_PASS=

FRONTEND_URL=

---

## ▶️ Running the Server

```bash
npm install
npm run dev

http://localhost:4000/graphql