-- ============================================================================
-- Migration 009: Create Audit Logs & Hospital Master Catalogs
-- System: BAO-CAO-KHANG-THUOC (Khoa Vi sinh Bệnh viện)
-- ============================================================================

-- Audit logs table (Section XXXV: Tất cả hành động quan trọng phải được ghi log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,                   -- LOGIN, LOGOUT, UPLOAD, IMPORT, EDIT, DELETE, EXPORT, REPORT
    entity TEXT NOT NULL,                   -- patients, specimens, cultures, ast_results, import_jobs, guidelines
    entity_id TEXT,
    metadata JSONB,                         -- Chi tiết thay đổi, thông số bộ lọc, v.v.
    ip_address TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON public.audit_logs(timestamp DESC);

-- Configurable Hospital Departments Catalog (Section LV: Không hardcode danh sách khoa)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_icu BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configurable MDR/XDR/PDR Definitions (Section XXIV & LV: Không hardcode một định nghĩa duy nhất)
CREATE TABLE IF NOT EXISTS public.mdr_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_name TEXT NOT NULL,          -- MDR (Đa kháng), XDR (Kháng mở rộng), PDR (Toàn kháng)
    version TEXT NOT NULL,                  -- CDC/ECDC 2012, Magiorakos et al., Viện VS DTHƯ 2025
    description TEXT,
    criteria JSONB NOT NULL,                -- Tiêu chí số nhóm kháng sinh bị kháng (>= 3 nhóm, v.v.)
    date_applied DATE DEFAULT CURRENT_DATE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_logs IS 'Nhật ký kiểm toán an ninh và truy vết thao tác y tế';
COMMENT ON TABLE public.departments IS 'Danh mục các khoa phòng bệnh viện';
COMMENT ON TABLE public.mdr_definitions IS 'Cấu hình tiêu chí xác định vi khuẩn đa kháng MDR/XDR/PDR';
