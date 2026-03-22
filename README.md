# Chavez Tree Service - Backend (Fullstack Project)

This is the **backend** for the Chavez Tree Service fullstack web application, built as a mini CRM with future SaaS potential. It provides all the server-side logic, database models, authentication, workflow automation, and file handling needed to manage jobs, clients, services, employees, feedback, and more.

---

## 🛠 Technology Stack

- **Backend:** Node.js + Express  
- **API:** GraphQL  
- **Database:** PostgreSQL  
- **Authentication:** JWT with password hashing (bcrypt)  
- **File Uploads:** Multer + Sharp (WebP image optimization)  
- **Security:** Rate-limiting, input validation, admin-only protected routes  
- **Other:** Helmet, CORS, dotenv

---

## 🔑 Features

### User Roles

**Admin Users** (family team):
- Manage clients, jobs, services, employees, and feedback
- Assign employees and services to jobs
- Update job statuses (with workflow validation)
- Upload before/after job photos
- Automatic feedback creation when jobs are completed
- Admin-only access with JWT protection

**Public Users** (future frontend):
- Submit quote requests (creates Client + Job)
- Receive feedback prompts (rating-based routing)
- Future integration for viewing services and testimonials

### Job Workflow

| Current Status   | Allowed Next Statuses         |
|-----------------|-------------------------------|
| pending_quote    | quote_scheduled, cancelled   |
| quote_scheduled  | scheduled, cancelled         |
| scheduled        | in_progress, cancelled       |
| in_progress      | completed, cancelled         |
| completed        | paid                          |
| paid             | –                             |
| cancelled        | –                             |

### Core Entities

- Clients  
- Jobs (with address fields and status workflow)  
- Services (many-to-many with jobs)  
- Employees (many-to-many with jobs)  
- Job_Photos (before/after images, optimized WebP)  
- Feedback (rating-based automation)

---

## ⚡ Quick Start

### 1️⃣ Clone the repo

```bash
git clone https://github.com/<your-username>/chavez-tree-backend.git
cd chavez-tree-backend