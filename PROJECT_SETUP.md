# Freelance Approval - Fullstack Deliverable & Client Approval Platform

A modern, frictionless tool for freelancers to share deliverables, set expiration links, collect client feedback, and secure formal client approvals.  
Created by **Lokesh Singh Tanwar**

---

## 🚀 Features

- **Instant Workspace Creation**: No login/signup required. Simply enter a project name.
- **Admin Dashboard**: Upload deliverable files (Images, PDFs), configure link expiration (3, 7, 30, 90 days), and copy the client link.
- **Client Review View**: Clients can view the deliverable, download it, and either click **"Approve"** or **"Request Changes"** with direct feedback.
- **Audit Trail & Timestamps**: Tracks views, decisions, and uploads with IP and user-agent logging.
- **Real-Time Synchronization**: Built-in WebSockets instantly sync dashboard status and file changes without page refresh.
- **Supabase Powered**: Integrated PostgreSQL database and Supabase Storage with local zero-config fallback.

---

## 🛠️ Quick Start

### 1. Run the Entire App (Frontend + Backend)
Run the following single command from the project root:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8080/api](http://localhost:8080/api)

---

## 🗄️ Setting Up Supabase

The backend works out-of-the-box in **Local Fallback Mode** (persisting files and database locally). To connect your own Supabase project:

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project.

### Step 2: Run the Database Schema
1. In your Supabase Dashboard, click on **SQL Editor** -> **New Query**.
2. Open [`supabase_schema.sql`](./supabase_schema.sql), copy all contents, paste it into the editor, and click **Run**.
   - This creates tables: `projects`, `files`, `audit_logs`, `approval_decisions`, and the `deliverables` storage bucket.

### Step 3: Copy Supabase API Credentials
1. In Supabase Dashboard, go to **Project Settings** -> **API**.
2. Copy:
   - **Project URL**
   - **Project API Keys**: `anon` (public) and `service_role` (secret)

### Step 4: Add to `server/.env`
Open [`server/.env`](./server/.env) and paste your credentials:

```env
PORT=8080
SERVER_URL=http://localhost:8080
CLIENT_URL=http://localhost:5173

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_BUCKET=deliverables
```

Restart your server (`npm run dev`), and you will see:
```
⚡ Supabase Mode: CONNECTED
```

---

## 📁 Project Architecture

```
├── package.json           # Root scripts (runs client & server together)
├── .env                   # Frontend env (VITE_API_BASE_URL)
├── supabase_schema.sql    # Complete Supabase SQL migration script
├── src/                   # React + Vite Frontend
│   ├── pages/
│   │   ├── landing/       # Project creation landing page
│   │   ├── dashboard/     # Admin dashboard & file management
│   │   └── clientView/    # Public client view & decision modal
│   ├── hooks/useProject/  # TanStack Query hooks & API mutations
│   └── lib/api/           # Axios instance
└── server/                # Express + Supabase + WebSockets Backend
    ├── package.json
    ├── .env
    └── src/
        ├── index.ts       # Express server & CORS
        ├── supabase.ts    # Supabase client initializer
        ├── db.ts          # Unified database (Supabase + Local fallback)
        ├── storage.ts     # Storage manager (Supabase Storage + Local disk)
        ├── socket.ts      # Socket.io real-time room manager
        └── routes/
            ├── projects.ts# /api/projects routes
            └── storage.ts # /api/storage upload & download routes
```
