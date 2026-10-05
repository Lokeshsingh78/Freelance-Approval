# Freelance Approval

**The Instant Deliverable Handover & Client Approval Platform.**  
Created by **Lokesh Singh Tanwar**

A secure, professional, zero-friction tool for freelancers to share deliverables, prevent scope creep, and get binding approvals from clients.

---

## 💡 The Problem Solved

Freelancers often send work via Email, WhatsApp, or Google Drive. Clients reply with a casual *"Looks good!"*, only to come back weeks later asking for major layout revisions.

**Freelance Approval** solves this by creating a formal **"Approval Event"**:

1. **Upload Work**: Drag & drop your deliverable (images, design mockups, PDFs).
2. **Share Secure Link**: The client receives a dedicated, time-sensitive review link (3, 7, 30, or 90 days).
3. **Binding Decision**: The client must click **"Approve"** (locking the project) or **"Request Changes"** (with actionable revision notes).
4. **Audit Trail**: Every view and decision is immutably logged with timestamps, IP address, and user-agent.

---

## ✨ Key Features

- **Zero-Friction Review**: Clients review and approve deliverables instantly without needing an account.
- **Real-Time WebSockets**: Dashboards instantly sync when the client views, requests revisions, or approves.
- **Secure Deliverable Storage**: Integrated with **Supabase Storage** for cloud assets, with a built-in local disk fallback.
- **Time-Sensitive Expiration**: Set flexible link expiration periods (3, 7, 30, 90 days).
- **Comprehensive Audit Trail**: Real-time activity logs tracking every client interaction.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Lucide React
- **State Management**: Zustand + TanStack React Query
- **Networking**: Axios + Socket.io Client
- **Notifications**: Sonner

### Backend (`/server`)
- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase) + Local JSON/Memory fallback
- **Storage**: Supabase Storage (`deliverables` bucket) + Local disk fallback
- **Realtime**: Socket.io Server (room-based status broadcasting)

---

## 🚀 Running the Project

Start both Frontend and Backend concurrently with a single command:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8080/api](http://localhost:8080/api)

---

## 🗄️ Supabase Configuration

1. Run the database migration script in your Supabase SQL Editor:
   [`supabase_schema.sql`](./supabase_schema.sql)
2. Add your credentials to `server/.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_BUCKET=deliverables
   ```
3. Restart `npm run dev` and your app will automatically connect to Supabase PostgreSQL & Storage!

---

## 👤 Author

**Lokesh Singh Tanwar**  
*Freelance Approval — Fast, seamless approvals for modern freelancers.*
