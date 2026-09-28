-- ============================================================================
-- Migration 008: Create Import Jobs & File Metadata Tracking
-- System: BAO-CAO-KHANG-THUOC (Khoa Vi sinh Bệnh viện)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,                -- xlsx, xls, csv, pdf, text
    file_size BIGINT,
    storage_path TEXT,                       -- Đường dẫn Supabase Storage trong bucket 'import-files'
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    record_count INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    warning_records INTEGER DEFAULT 0,
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
    column_mapping JSONB,                   -- Lưu thông tin mapping cột Excel -> Cột hệ thống
    error_log JSONB,                        -- Báo cáo chi tiết các dòng bị lỗi để tải Excel lỗi
    file_fingerprint TEXT,                  -- Hash nội dung file phát hiện upload lặp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_import_jobs_updated_at ON public.import_jobs;
CREATE TRIGGER set_import_jobs_updated_at
    BEFORE UPDATE ON public.import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(processing_status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created ON public.import_jobs(created_at DESC);

COMMENT ON TABLE public.import_jobs IS 'Quản lý lịch sử và trạng thái xử lý các file dữ liệu nhập vào hệ thống';
