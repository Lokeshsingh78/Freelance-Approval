-- ==============================================================================
-- Freelance Approval - Supabase SQL Schema (by Lokesh Singh Tanwar)
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    admin_token TEXT NOT NULL UNIQUE,
    public_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'EXPIRED')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Files Table (for deliverable attached to project)
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size BIGINT NOT NULL,
    storage_key TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Audit Logs Table (audit trail for IP, actions, user agents)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('PROJECT_CREATED', 'FILE_UPLOADED', 'CLIENT_VIEWED', 'CLIENT_APPROVED', 'CLIENT_REQUESTED_CHANGES')),
    actor_role TEXT NOT NULL CHECK (actor_role IN ('ADMIN', 'CLIENT')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Approval Decisions Table (immutable decisions made by clients)
CREATE TABLE IF NOT EXISTS public.approval_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('APPROVED', 'CHANGES_REQUESTED')),
    actor_role TEXT NOT NULL DEFAULT 'CLIENT',
    comment TEXT,
    client_name TEXT,
    client_email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Payments Table (Deliverable upload fees for files >= 100MB)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    cf_order_id TEXT,
    payment_session_id TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    file_name TEXT,
    file_size BIGINT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED')),
    payment_method TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Indexes for High Performance Lookups
CREATE INDEX IF NOT EXISTS idx_projects_admin_token ON public.projects(admin_token);
CREATE INDEX IF NOT EXISTS idx_projects_public_token ON public.projects(public_token);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON public.files(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON public.audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_project_id ON public.approval_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);

-- 6.1 Enable RLS and Permissive Policies for Backend API Access
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on files" ON public.files FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.approval_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on approval_decisions" ON public.approval_decisions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- 7. Storage Bucket Configuration (Run in SQL or create bucket named 'deliverables' in Supabase Storage UI)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deliverables', 'deliverables', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policy to allow public reads and authorized uploads
CREATE POLICY "Public Deliverables Read" ON storage.objects
    FOR SELECT USING (bucket_id = 'deliverables');

CREATE POLICY "Public Deliverables Upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'deliverables');

CREATE POLICY "Public Deliverables Delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'deliverables');

