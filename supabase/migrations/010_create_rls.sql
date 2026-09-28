-- ============================================================================
-- Migration 010: Row Level Security (RLS) Policies
-- System: BAO-CAO-KHANG-THUOC (Khoa Vi sinh Bệnh viện)
-- Phân quyền: Admin (toàn quyền), Manager (import, phân tích), User (nhập & xem), Viewer (chỉ đọc)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specimens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.antibiotics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ast_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specimen_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mdr_definitions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Allow users to view own profile or admin/manager to view all"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() 
        OR public.get_current_user_role() IN ('admin', 'manager')
    );

CREATE POLICY "Allow users to update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Allow admin to manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.get_current_user_role() = 'admin');

-- 2. Master Catalogs Policies (organisms, antibiotics, specimen_types, departments, guidelines, mdr_definitions)
-- Read: Everyone (authenticated & anon for public dashboard/demo)
CREATE POLICY "Allow read organisms" ON public.organisms FOR SELECT USING (true);
CREATE POLICY "Allow read antibiotics" ON public.antibiotics FOR SELECT USING (true);
CREATE POLICY "Allow read specimen_types" ON public.specimen_types FOR SELECT USING (true);
CREATE POLICY "Allow read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow read guidelines" ON public.guidelines FOR SELECT USING (true);
CREATE POLICY "Allow read mdr_definitions" ON public.mdr_definitions FOR SELECT USING (true);

-- Edit master catalogs: Admin only
CREATE POLICY "Admin manage organisms" ON public.organisms FOR ALL TO authenticated USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Admin manage antibiotics" ON public.antibiotics FOR ALL TO authenticated USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Admin manage specimen_types" ON public.specimen_types FOR ALL TO authenticated USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Admin manage departments" ON public.departments FOR ALL TO authenticated USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Admin manage guidelines" ON public.guidelines FOR ALL TO authenticated USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Admin manage mdr_definitions" ON public.mdr_definitions FOR ALL TO authenticated USING (public.get_current_user_role() = 'admin');

-- 3. Clinical & AST Data Policies (patients, specimens, cultures, ast_results)
-- Read: Authenticated users & Anon (read-only for dashboard view)
CREATE POLICY "Allow read patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Allow read specimens" ON public.specimens FOR SELECT USING (true);
CREATE POLICY "Allow read cultures" ON public.cultures FOR SELECT USING (true);
CREATE POLICY "Allow read ast_results" ON public.ast_results FOR SELECT USING (true);

-- Insert/Update: Admin, Manager, User
CREATE POLICY "Allow insert patients" ON public.patients FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('admin', 'manager', 'user'));
CREATE POLICY "Allow update patients" ON public.patients FOR UPDATE TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'manager'));
CREATE POLICY "Allow delete patients" ON public.patients FOR DELETE TO authenticated
    USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Allow insert specimens" ON public.specimens FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('admin', 'manager', 'user'));
CREATE POLICY "Allow update specimens" ON public.specimens FOR UPDATE TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'manager'));
CREATE POLICY "Allow delete specimens" ON public.specimens FOR DELETE TO authenticated
    USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Allow insert cultures" ON public.cultures FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('admin', 'manager', 'user'));
CREATE POLICY "Allow update cultures" ON public.cultures FOR UPDATE TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'manager'));
CREATE POLICY "Allow delete cultures" ON public.cultures FOR DELETE TO authenticated
    USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Allow insert ast_results" ON public.ast_results FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('admin', 'manager', 'user'));
CREATE POLICY "Allow update ast_results" ON public.ast_results FOR UPDATE TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'manager'));
CREATE POLICY "Allow delete ast_results" ON public.ast_results FOR DELETE TO authenticated
    USING (public.get_current_user_role() = 'admin');

-- 4. Import Jobs Policies
CREATE POLICY "Allow read import jobs" ON public.import_jobs FOR SELECT USING (true);
CREATE POLICY "Allow create import jobs" ON public.import_jobs FOR INSERT TO authenticated
    WITH CHECK (public.get_current_user_role() IN ('admin', 'manager', 'user'));
CREATE POLICY "Allow update import jobs" ON public.import_jobs FOR UPDATE TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'manager'));

-- 5. Audit Logs Policies
CREATE POLICY "Allow view audit logs" ON public.audit_logs FOR SELECT TO authenticated
    USING (public.get_current_user_role() IN ('admin', 'manager'));
CREATE POLICY "Allow insert audit logs" ON public.audit_logs FOR INSERT
    WITH CHECK (true);
