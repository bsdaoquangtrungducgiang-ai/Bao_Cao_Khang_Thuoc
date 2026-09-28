-- ============================================================================
-- Migration 001: Create Profiles Table & Role System
-- System: BAO-CAO-KHANG-THUOC (Khoa Vi sinh Bệnh viện)
-- ============================================================================

-- Enable pgcrypto / uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    department TEXT DEFAULT 'Khoa Vi sinh',
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile upon auth.user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE public.profiles IS 'Thông tin tài khoản người dùng và phân quyền hệ thống (Admin, Manager, User, Viewer)';
-- ============================================================================
-- Migration 002: Create Patients Table
-- System: BAO-CAO-KHANG-THUOC (Khoa Vi sinh Bệnh viện)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_code TEXT NOT NULL UNIQUE,
    patient_name TEXT,
    date_of_birth DATE,
    age INTEGER CHECK (age >= 0 AND age <= 130),
    sex TEXT CHECK (sex IN ('M', 'F', 'O', 'Nam', 'Nữ', 'Khác', 'Unknown')),
    address TEXT,
    department TEXT,
    room TEXT,
    bed TEXT,
    inpatient_outpatient TEXT CHECK (inpatient_outpatient IN ('inpatient', 'outpatient', 'ICU', 'NoiTru', 'NgoaiTru', 'Khac', 'other')),
    insurance_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS set_patients_updated_at ON public.patients;
CREATE TRIGGER set_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indices for rapid lookup & analytics filtering
CREATE INDEX IF NOT EXISTS idx_patients_code ON public.patients(patient_code);
CREATE INDEX IF NOT EXISTS idx_patients_department ON public.patients(department);
CREATE INDEX IF NOT EXISTS idx_patients_age ON public.patients(age);
CREATE INDEX IF NOT EXISTS idx_patients_sex ON public.patients(sex);

COMMENT ON TABLE public.patients IS 'Thông tin hành chính bệnh nhân tuân thủ nguyên tắc data minimization';
-- ============================================================================
-- Migration 003: Create Specimens and Specimen Types Catalog
-- System: BAO-CAO-KHANG-THUOC (Khoa Vi sinh Bệnh viện)
-- ============================================================================

-- Catalog table for configurable specimen types (Section V & LV: No hardcoded lists)
CREATE TABLE IF NOT EXISTS public.specimen_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Lâm sàng',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Specimens table
CREATE TABLE IF NOT EXISTS public.specimens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    specimen_code TEXT,
    specimen_type TEXT NOT NULL,
    collection_date DATE NOT NULL,
    collection_time TIME,
    received_date DATE,
    received_time TIME,
    clinical_diagnosis TEXT,
    requesting_department TEXT,
    test_order TEXT,
    test_code TEXT,
    collector TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_specimens_updated_at ON public.specimens;
CREATE TRIGGER set_specimens_updated_at
    BEFORE UPDATE ON public.specimens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indices
CREATE INDEX IF NOT EXISTS idx_specimens_patient_id ON public.specimens(patient_id);
CREATE INDEX IF NOT EXISTS idx_specimens_code ON public.specimens(specimen_code);
CREATE INDEX IF NOT EXISTS idx_specimens_type ON public.specimens(specimen_type);
CREATE INDEX IF NOT EXISTS idx_specimens_collection_date ON public.specimens(collection_date);
CREATE INDEX IF NOT EXISTS idx_specimens_req_dept ON public.specimens(requesting_department);

COMMENT ON TABLE public.specimens IS 'Thông tin mẫu bệnh phẩm xét nghiệm vi sinh';
COMMENT ON TABLE public.specimen_types IS 'Danh mục loại bệnh phẩm cấu hình động';
-- ============================================================================
-- Migration 004: Create Organisms Table
-- System: BAO-CAO-KHANG-THUOC (Khoa Vi sinh Bệnh viện)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organisms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organism_code TEXT NOT NULL UNIQUE,
    organism_name TEXT NOT NULL,
    vietnamese_name TEXT,
    common_name TEXT,
    gram_stain TEXT CHECK (gram_stain IN ('positive', 'negative', 'acid_fast', 'fungi', 'other', 'indeterminate')),
    family TEXT,
    genus TEXT,
    species TEXT,
    is_target_pathogen BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_organisms_updated_at ON public.organisms;
CREATE TRIGGER set_organisms_updated_at
    BEFORE UPDATE ON public.organisms
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_organisms_code ON public.organisms(organism_code);
CREATE INDEX IF NOT EXISTS idx_organisms_name ON public.organisms(organism_name);
CREATE INDEX IF NOT EXISTS idx_organisms_gram ON public.organisms(gram_stain);

COMMENT ON TABLE public.organisms IS 'Danh mục vi sinh vật gây bệnh và phân loại Gram/Family phục vụ phân tích dịch tễ';
-- ============================================================================
-- Migration 005: Create Antibiotics Table & Classes
-- System: BAO-CAO-KHANG-THUOC (Khoa Vi sinh Bệnh viện)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.antibiotics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    antibiotic_code TEXT NOT NULL UNIQUE,     -- Code chuẩn ví dụ: AMP, AMC, MEM, CTX, CRO, CIP, VAN
    antibiotic_short_name TEXT,
    antibiotic_name TEXT NOT NULL,           -- Tên đầy đủ: Ampicillin, Meropenem, Ceftriaxone
    antibiotic_group TEXT,                   -- Penicillins, Cephalosporins, Carbapenems, Fluoroquinolones, v.v.
    antibiotic_class TEXT,                   -- Beta-lactam, Quinolone, Aminoglycoside, Glycopeptide, v.v.
    route TEXT DEFAULT 'IV/Oral',            -- Đường dùng: IV, Oral, IM, Topical
    gram_positive BOOLEAN DEFAULT false,
    gram_negative BOOLEAN DEFAULT false,
    anaerobic BOOLEAN DEFAULT false,
    urinary BOOLEAN DEFAULT false,
    whonet_code TEXT,                        -- Mã tương thích chuẩn WHONET
    priority INTEGER DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_antibiotics_updated_at ON public.antibiotics;
CREATE TRIGGER set_antibiotics_updated_at
    BEFORE UPDATE ON public.antibiotics
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_antibiotics_code ON public.antibiotics(antibiotic_code);
CREATE INDEX IF NOT EXISTS idx_antibiotics_name ON public.antibiotics(antibiotic_name);
CREATE INDEX IF NOT EXISTS idx_antibiotics_group ON public.antibiotics(antibiotic_group);
CREATE INDEX IF NOT EXISTS idx_antibiotics_class ON public.antibiotics(antibiotic_class);

COMMENT ON TABLE public.antibiotics IS 'Danh mục kháng sinh phục vụ làm kháng sinh đồ và báo cáo AMR';
-- ============================================================================
-- Migration 006: Create Cultures Table (Kết quả Nuôi cấy / Định danh vi khuẩn)
-- System: BAO-CAO-KHANG-THUOC (Khoa Vi sinh Bệnh viện)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cultures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specimen_id UUID REFERENCES public.specimens(id) ON DELETE CASCADE,
    culture_date DATE NOT NULL,
    culture_result TEXT,                     -- Ví dụ: 'Dương tính', 'Âm tính', 'Phát triển vi khuẩn'
    organism_id UUID REFERENCES public.organisms(id) ON DELETE SET NULL,
    organism_name TEXT NOT NULL,             -- Chuẩn hóa tên vi khuẩn (ví dụ: Escherichia coli)
    organism_code TEXT,                      -- Mã vi khuẩn rút gọn (ESCCOL)
    colony_count TEXT,                       -- Số lượng khuẩn lạc (ví dụ: > 10^5 CFU/mL)
    bacterial_load TEXT,
    culture_method TEXT,                     -- Cấy thông thường, cấy máu tự động BACTEC...
    identification_method TEXT,              -- Vitek 2, MALDI-TOF, Sinh hóa thủ công...
    instrument TEXT,                         -- Tên máy xét nghiệm
    is_esbl BOOLEAN DEFAULT false,           -- Chỉ số phát hiện ESBL
    is_mrsa BOOLEAN DEFAULT false,           -- Chỉ số phát hiện MRSA (nếu là S. aureus)
    is_cre BOOLEAN DEFAULT false,            -- Carbapenem-Resistant Enterobacterales
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_cultures_updated_at ON public.cultures;
CREATE TRIGGER set_cultures_updated_at
    BEFORE UPDATE ON public.cultures
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_cultures_specimen ON public.cultures(specimen_id);
CREATE INDEX IF NOT EXISTS idx_cultures_organism ON public.cultures(organism_id);
CREATE INDEX IF NOT EXISTS idx_cultures_organism_name ON public.cultures(organism_name);
CREATE INDEX IF NOT EXISTS idx_cultures_date ON public.cultures(culture_date);

COMMENT ON TABLE public.cultures IS 'Kết quả nuôi cấy và phân lập định danh vi sinh vật';
-- ============================================================================
-- Migration 007: Create AST Results Table (Kháng sinh đồ)
-- System: BAO-CAO-KHANG-THUOC (Khoa Vi sinh Bệnh viện)
-- ============================================================================

-- Guidelines Catalog for configurable guidelines (CLSI, EUCAST)
CREATE TABLE IF NOT EXISTS public.guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,                     -- CLSI, EUCAST
    version_name TEXT NOT NULL,             -- CLSI M100 2025, CLSI M100 2026, EUCAST 2026
    year INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ast_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    culture_id UUID NOT NULL REFERENCES public.cultures(id) ON DELETE CASCADE,
    antibiotic_id UUID REFERENCES public.antibiotics(id) ON DELETE SET NULL,
    antibiotic_code TEXT NOT NULL,          -- AMP, AMC, MEM, CTX, CIP,...
    raw_result TEXT,                        -- Giá trị nguyên bản từ file import/máy xét nghiệm
    normalized_result TEXT NOT NULL CHECK (normalized_result IN ('S', 'I', 'R', 'SD', 'NS', 'NA')),
    mic NUMERIC,                            -- Nồng độ ức chế tối thiểu MIC (ug/mL)
    mic_operator TEXT CHECK (mic_operator IN ('<=', '>=', '<', '>', '=', NULL)),
    disk_zone NUMERIC,                      -- Đường kính vòng vô khuẩn (mm)
    interpretation TEXT NOT NULL CHECK (interpretation IN ('S', 'I', 'R', 'SD', 'NS', 'NA')),
    testing_method TEXT,                    -- Vitek AST, Kirby-Bauer, Broth Microdilution, E-test...
    instrument TEXT,                        -- Tên máy xét nghiệm
    guideline TEXT NOT NULL DEFAULT 'CLSI', -- Tiêu chuẩn phiên giải (CLSI, EUCAST)
    guideline_version TEXT NOT NULL DEFAULT 'M100 2025',
    tested_date DATE,
    fingerprint TEXT,                       -- Hash phát hiện trùng lắp (Section XXXIV)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_ast_results_updated_at ON public.ast_results;
CREATE TRIGGER set_ast_results_updated_at
    BEFORE UPDATE ON public.ast_results
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indices for rapid analytical aggregations
CREATE INDEX IF NOT EXISTS idx_ast_culture_id ON public.ast_results(culture_id);
CREATE INDEX IF NOT EXISTS idx_ast_antibiotic_id ON public.ast_results(antibiotic_id);
CREATE INDEX IF NOT EXISTS idx_ast_code ON public.ast_results(antibiotic_code);
CREATE INDEX IF NOT EXISTS idx_ast_interpretation ON public.ast_results(interpretation);
CREATE INDEX IF NOT EXISTS idx_ast_guideline ON public.ast_results(guideline, guideline_version);
CREATE INDEX IF NOT EXISTS idx_ast_fingerprint ON public.ast_results(fingerprint);

COMMENT ON TABLE public.ast_results IS 'Dữ liệu kết quả kháng sinh đồ AST phục vụ phân tích tính nhạy cảm và kháng thuốc';
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
-- ============================================================================
-- SEED DATA: BAO-CAO-KHANG-THUOC
-- Phù hợp yêu cầu XLIX & L:
-- 100 Bệnh nhân, 150 Bệnh phẩm, 200 Nuôi cấy, 1,000 Kết quả AST
-- Tỷ lệ S ~62%, I ~8%, R ~30%
-- ============================================================================

-- 1. GUIDELINES
INSERT INTO public.guidelines (code, version_name, year, is_default, active) VALUES
('CLSI', 'M100 2025', 2025, true, true),
('CLSI', 'M100 2026', 2026, false, true),
('EUCAST', 'v2026.1', 2026, false, true)
ON CONFLICT DO NOTHING;

-- 2. DEPARTMENTS
INSERT INTO public.departments (code, name, is_icu, active) VALUES
('ICU', 'Khoa Hồi sức tích cực - Chống độc (ICU)', true, true),
('CC', 'Khoa Cấp cứu', false, true),
('NOI_HH', 'Khoa Nội Hô hấp', false, true),
('NOI_TH', 'Khoa Nội Tiêu hóa', false, true),
('NGOAI_TH', 'Khoa Ngoại Tổng hợp', false, true),
('NGOAI_TN', 'Khoa Ngoại Tiết niệu', false, true),
('NHI', 'Khoa Nhi & Sơ sinh', false, true),
('TRUYEN_NHIEM', 'Khoa Bệnh Nhiệt đới / Truyền nhiễm', false, true),
('SAN', 'Khoa Phụ Sản', false, true),
('THAN_NT', 'Khoa Thận - Lọc máu', false, true)
ON CONFLICT (code) DO NOTHING;

-- 3. SPECIMEN TYPES
INSERT INTO public.specimen_types (code, name, category, description) VALUES
('MAU', 'Máu', 'Vô trùng', 'Cấy máu tìm vi khuẩn huyết'),
('NUOC_TIEU', 'Nước tiểu', 'Tiết niệu', 'Nước tiểu giữa dòng, qua sonde'),
('DOM', 'Đờm', 'Hô hấp', 'Đờm khạc buổi sáng hoặc hút sâu'),
('DICH_PQ', 'Dịch phế quản (BAL)', 'Hô hấp', 'Dịch rửa phế quản phế nang'),
('DICH_MP', 'Dịch màng phổi', 'Dịch cơ thể', 'Chọc hút khoang màng phổi'),
('DICH_NT', 'Dịch não tủy (CSF)', 'Vô trùng', 'Chọc dò tủy sống'),
('DICH_OB', 'Dịch ổ bụng (Asites)', 'Dịch cơ thể', 'Chọc dò dịch màng bụng'),
('MU', 'Mủ ổ áp xe', 'Vết thương/Mủ', 'Mủ hút từ ổ nhiễm trùng sâu'),
('DICH_VT', 'Dịch vết thương / Vết loét', 'Vết thương/Mủ', 'Swab dịch tiết bề mặt vết mổ'),
('PHAN', 'Phân', 'Tiêu hóa', 'Cấy phân tìm vi khuẩn đường ruột'),
('SWAB', 'Swab tỵ hầu / họng', 'Hô hấp', 'Dịch quệt tỵ hầu'),
('KHAC', 'Mẫu bệnh phẩm khác', 'Khác', 'Mô sinh thiết, dịch khớp...')
ON CONFLICT (code) DO NOTHING;

-- 4. ORGANISMS
INSERT INTO public.organisms (organism_code, organism_name, vietnamese_name, gram_stain, family, genus, priority, is_target_pathogen) VALUES
('ESCCOL', 'Escherichia coli', 'Trực khuẩn E. coli', 'negative', 'Enterobacteriaceae', 'Escherichia', 1, true),
('KLEPNE', 'Klebsiella pneumoniae', 'Trực khuẩn Klebsiella', 'negative', 'Enterobacteriaceae', 'Klebsiella', 2, true),
('PSEAER', 'Pseudomonas aeruginosa', 'Trực khuẩn mủ xanh', 'negative', 'Pseudomonadaceae', 'Pseudomonas', 3, true),
('ACIBAU', 'Acinetobacter baumannii', 'Acinetobacter', 'negative', 'Moraxellaceae', 'Acinetobacter', 4, true),
('STAAUR', 'Staphylococcus aureus', 'Tụ cầu vàng', 'positive', 'Staphylococcaceae', 'Staphylococcus', 5, true),
('ENCFAE', 'Enterococcus faecalis', 'Cầu khuẩn đường ruột faecalis', 'positive', 'Enterococcaceae', 'Enterococcus', 6, true),
('ENCFAI', 'Enterococcus faecium', 'Cầu khuẩn đường ruột faecium', 'positive', 'Enterococcaceae', 'Enterococcus', 7, true),
('STRNEU', 'Streptococcus pneumoniae', 'Phế cầu khuẩn', 'positive', 'Streptococcaceae', 'Streptococcus', 8, true),
('ENTCLO', 'Enterobacter cloacae', 'Trực khuẩn Enterobacter', 'negative', 'Enterobacteriaceae', 'Enterobacter', 9, true),
('PROMIR', 'Proteus mirabilis', 'Trực khuẩn Proteus', 'negative', 'Morganellaceae', 'Proteus', 10, true)
ON CONFLICT (organism_code) DO NOTHING;

-- 5. ANTIBIOTICS
INSERT INTO public.antibiotics (antibiotic_code, antibiotic_short_name, antibiotic_name, antibiotic_group, antibiotic_class, gram_positive, gram_negative, urinary, priority) VALUES
('AMP', 'Ampicillin', 'Ampicillin', 'Penicillins', 'Beta-lactam', true, true, true, 1),
('AMC', 'Amox/Clav', 'Amoxicillin / Clavulanic acid', 'Beta-lactam combo', 'Beta-lactam', true, true, true, 2),
('TZP', 'Pip/Tazo', 'Piperacillin / Tazobactam', 'Beta-lactam combo', 'Beta-lactam', true, true, false, 3),
('CTX', 'Cefotaxime', 'Cefotaxime', 'Cephalosporins 3rd', 'Beta-lactam', false, true, true, 4),
('CRO', 'Ceftriaxone', 'Ceftriaxone', 'Cephalosporins 3rd', 'Beta-lactam', true, true, true, 5),
('CAZ', 'Ceftazidime', 'Ceftazidime', 'Cephalosporins 3rd', 'Beta-lactam', false, true, true, 6),
('FEP', 'Cefepime', 'Cefepime', 'Cephalosporins 4th', 'Beta-lactam', true, true, true, 7),
('MEM', 'Meropenem', 'Meropenem', 'Carbapenems', 'Beta-lactam', true, true, true, 8),
('IPM', 'Imipenem', 'Imipenem / Cilastatin', 'Carbapenems', 'Beta-lactam', true, true, true, 9),
('ETP', 'Ertapenem', 'Ertapenem', 'Carbapenems', 'Beta-lactam', false, true, true, 10),
('CIP', 'Ciprofloxacin', 'Ciprofloxacin', 'Fluoroquinolones', 'Quinolones', true, true, true, 11),
('LEV', 'Levofloxacin', 'Levofloxacin', 'Fluoroquinolones', 'Quinolones', true, true, true, 12),
('GEN', 'Gentamicin', 'Gentamicin', 'Aminoglycosides', 'Aminoglycosides', true, true, true, 13),
('AMK', 'Amikacin', 'Amikacin', 'Aminoglycosides', 'Aminoglycosides', false, true, true, 14),
('SXT', 'Co-trimoxazole', 'Trimethoprim / Sulfamethoxazole', 'Folate inhibitors', 'Sulfonamides', true, true, true, 15),
('VAN', 'Vancomycin', 'Vancomycin', 'Glycopeptides', 'Glycopeptides', true, false, false, 16),
('LZD', 'Linezolid', 'Linezolid', 'Oxazolidinones', 'Oxazolidinones', true, false, false, 17),
('TEC', 'Teicoplanin', 'Teicoplanin', 'Glycopeptides', 'Glycopeptides', true, false, false, 18),
('CLI', 'Clindamycin', 'Clindamycin', 'Lincosamides', 'Lincosamides', true, false, false, 19),
('ERY', 'Erythromycin', 'Erythromycin', 'Macrolides', 'Macrolides', true, false, false, 20),
('COL', 'Colistin', 'Colistin (Polymyxin E)', 'Polymyxins', 'Polymyxins', false, true, true, 21),
('TGC', 'Tigecycline', 'Tigecycline', 'Glycylcyclines', 'Tetracyclines', true, true, false, 22)
ON CONFLICT (antibiotic_code) DO NOTHING;

-- 6. MDR DEFINITIONS
INSERT INTO public.mdr_definitions (definition_name, version, description, criteria) VALUES
('MDR Enterobacterales', 'CDC/ECDC 2012', 'Đa kháng thuốc: Không nhạy cảm (I hoặc R) với >= 1 kháng sinh thuộc >= 3 nhóm kháng sinh', '{"min_groups_resistant": 3, "target_family": "Enterobacteriaceae"}'),
('XDR Enterobacterales', 'CDC/ECDC 2012', 'Kháng mở rộng: Không nhạy cảm với >= 1 kháng sinh trong tất cả ngoại trừ <= 2 nhóm', '{"max_sensitive_groups": 2, "target_family": "Enterobacteriaceae"}'),
('PDR Pan-drug resistant', 'CDC/ECDC 2012', 'Toàn kháng: Không nhạy cảm với tất cả kháng sinh trong tất cả các nhóm được thử nghiệm', '{"max_sensitive_groups": 0}')
ON CONFLICT DO NOTHING;

-- 7. GENERATE 100 PATIENTS, 150 SPECIMENS, 200 CULTURES, 1,000 AST RESULTS
DO $$
DECLARE
    v_patient_id UUID;
    v_specimen_id UUID;
    v_culture_id UUID;
    v_org_id UUID;
    v_abx_id UUID;
    
    p_code TEXT;
    p_dept TEXT;
    p_sex TEXT;
    p_age INT;
    
    spec_type TEXT;
    spec_date DATE;
    
    org_code TEXT;
    org_name TEXT;
    
    abx_code TEXT;
    interp TEXT;
    mic_val NUMERIC;
    
    depts TEXT[] := ARRAY['ICU', 'CC', 'NOI_HH', 'NOI_TH', 'NGOAI_TH', 'NGOAI_TN', 'NHI', 'TRUYEN_NHIEM', 'SAN', 'THAN_NT'];
    sexes TEXT[] := ARRAY['Nam', 'Nữ'];
    spec_types TEXT[] := ARRAY['Nước tiểu', 'Máu', 'Đờm', 'Dịch vết thương', 'Mủ ổ áp xe', 'Dịch phế quản (BAL)', 'Dịch màng phổi', 'Dịch ổ bụng (Asites)'];
    
    -- Target bacteria distribution: E. coli (35%), K. pneumoniae (22%), P. aeruginosa (12%), A. baumannii (8%), S. aureus (10%), E. faecalis (7%), Khác (6%)
    org_list TEXT[] := ARRAY[
        'ESCCOL', 'ESCCOL', 'ESCCOL', 'ESCCOL', 'ESCCOL', 'ESCCOL', 'ESCCOL',
        'KLEPNE', 'KLEPNE', 'KLEPNE', 'KLEPNE',
        'PSEAER', 'PSEAER',
        'ACIBAU', 'ACIBAU',
        'STAAUR', 'STAAUR',
        'ENCFAE',
        'STRNEU'
    ];
    
    -- Antibiotics for Gram-negative
    abx_gn TEXT[] := ARRAY['AMP', 'AMC', 'TZP', 'CTX', 'CRO', 'CAZ', 'FEP', 'MEM', 'IPM', 'CIP', 'LEV', 'GEN', 'AMK', 'SXT', 'COL'];
    -- Antibiotics for Gram-positive
    abx_gp TEXT[] := ARRAY['AMP', 'CRO', 'CIP', 'LEV', 'GEN', 'SXT', 'VAN', 'LZD', 'TEC', 'CLI', 'ERY'];
    
    rand_val INT;
    ast_count INT := 0;
    i INT;
    j INT;
    k INT;
BEGIN
    -- Check if data already exists to avoid redundant duplication
    IF (SELECT COUNT(*) FROM public.patients) >= 100 THEN
        RETURN;
    END IF;

    -- Generate 100 patients
    FOR i IN 1..100 LOOP
        p_code := 'BN' || LPAD(i::text, 5, '0');
        p_dept := depts[1 + (i % array_length(depts, 1))];
        p_sex := sexes[1 + (i % 2)];
        p_age := 18 + (i * 7) % 75;
        
        INSERT INTO public.patients (
            patient_code, patient_name, age, sex, department, room, bed, inpatient_outpatient, created_at
        ) VALUES (
            p_code, 'Bệnh nhân ' || p_code, p_age, p_sex, p_dept, 'P.' || (100 + (i % 20)), 'G.' || (1 + (i % 10)),
            CASE WHEN p_dept = 'ICU' THEN 'ICU' WHEN (i % 4 = 0) THEN 'outpatient' ELSE 'inpatient' END,
            NOW() - ((100 - i) || ' days')::INTERVAL
        ) RETURNING id INTO v_patient_id;

        -- Create 1 or 2 specimens per patient (Total ~ 150 specimens)
        FOR j IN 1..(1 + (i % 2)) LOOP
            spec_type := spec_types[1 + ((i * 3 + j) % array_length(spec_types, 1))];
            spec_date := (CURRENT_DATE - ((100 - i + j) % 90 || ' days')::INTERVAL)::DATE;
            
            INSERT INTO public.specimens (
                patient_id, specimen_code, specimen_type, collection_date, requesting_department, created_at
            ) VALUES (
                v_patient_id, 'BP' || LPAD((i * 10 + j)::text, 6, '0'), spec_type, spec_date, p_dept,
                spec_date + TIME '08:30:00'
            ) RETURNING id INTO v_specimen_id;

            -- Create culture isolation for each specimen (~ 200 cultures)
            FOR k IN 1..(1 + ((i + j) % 3 = 0)::INT) LOOP
                org_code := org_list[1 + ((i * 5 + j * 3 + k) % array_length(org_list, 1))];
                SELECT id, organism_name INTO v_org_id, org_name FROM public.organisms WHERE organism_code = org_code LIMIT 1;
                
                INSERT INTO public.cultures (
                    specimen_id, culture_date, culture_result, organism_id, organism_name, organism_code,
                    colony_count, identification_method, instrument, created_at
                ) VALUES (
                    v_specimen_id, spec_date, 'Dương tính mọc vi khuẩn', v_org_id, org_name, org_code,
                    '> 10^5 CFU/mL', 'Vitek 2 Compact', 'VITEK-2-LAB01', spec_date + TIME '14:00:00'
                ) RETURNING id INTO v_culture_id;

                -- Generate 5-6 AST antibiotic results per culture to reach ~1,000 AST rows
                -- Clinical resistance profiles designed to yield overall S ~62%, I ~8%, R ~30%
                IF org_code IN ('STAAUR', 'ENCFAE', 'STRNEU') THEN
                    -- Gram positive antibiotic panel
                    FOR a IN 1..array_length(abx_gp, 1) LOOP
                        IF ast_count >= 1000 THEN EXIT; END IF;
                        abx_code := abx_gp[a];
                        SELECT id INTO v_abx_id FROM public.antibiotics WHERE antibiotic_code = abx_code LIMIT 1;
                        
                        -- Clinical logic: Vancomycin & Linezolid almost 100% S; Ampicillin/Erythromycin higher R
                        rand_val := (i * 11 + j * 7 + a * 13) % 100;
                        IF abx_code IN ('VAN', 'LZD', 'TEC') THEN
                            interp := 'S';
                            mic_val := 0.5;
                        ELSIF abx_code IN ('AMP', 'ERY', 'CLI') THEN
                            IF rand_val < 60 THEN interp := 'R'; mic_val := 32;
                            ELSIF rand_val < 72 THEN interp := 'I'; mic_val := 4;
                            ELSE interp := 'S'; mic_val := 0.25; END IF;
                        ELSE
                            IF rand_val < 28 THEN interp := 'R'; mic_val := 16;
                            ELSIF rand_val < 38 THEN interp := 'I'; mic_val := 2;
                            ELSE interp := 'S'; mic_val := 0.5; END IF;
                        END IF;

                        INSERT INTO public.ast_results (
                            culture_id, antibiotic_id, antibiotic_code, raw_result, normalized_result,
                            mic, interpretation, testing_method, guideline, guideline_version, tested_date
                        ) VALUES (
                            v_culture_id, v_abx_id, abx_code, interp, interp,
                            mic_val, interp, 'Vitek AST', 'CLSI', 'M100 2025', spec_date
                        );
                        ast_count := ast_count + 1;
                        IF a >= 5 THEN EXIT; END IF; -- 5 antibiotics per culture
                    END LOOP;
                ELSE
                    -- Gram negative antibiotic panel
                    FOR a IN 1..array_length(abx_gn, 1) LOOP
                        IF ast_count >= 1000 THEN EXIT; END IF;
                        abx_code := abx_gn[a];
                        SELECT id INTO v_abx_id FROM public.antibiotics WHERE antibiotic_code = abx_code LIMIT 1;

                        -- Realistic clinical resistance probabilities:
                        -- AMP: ~80% R; CRO/CTX: ~65% R; MEM: ~6-10% R; AMK: ~8% R; CIP: ~60% R
                        rand_val := (i * 17 + j * 19 + a * 23) % 100;
                        IF abx_code = 'AMP' THEN
                            IF rand_val < 82 THEN interp := 'R'; mic_val := 32;
                            ELSIF rand_val < 88 THEN interp := 'I'; mic_val := 16;
                            ELSE interp := 'S'; mic_val := 2; END IF;
                        ELSIF abx_code IN ('CRO', 'CTX', 'CAZ') THEN
                            IF rand_val < 65 THEN interp := 'R'; mic_val := 16;
                            ELSIF rand_val < 73 THEN interp := 'I'; mic_val := 4;
                            ELSE interp := 'S'; mic_val := 0.5; END IF;
                        ELSIF abx_code IN ('MEM', 'IPM') THEN
                            -- ICU patients have higher carbapenem resistance
                            IF p_dept = 'ICU' AND rand_val < 25 THEN interp := 'R'; mic_val := 8;
                            ELSIF rand_val < 6 THEN interp := 'R'; mic_val := 8;
                            ELSIF rand_val < 11 THEN interp := 'I'; mic_val := 2;
                            ELSE interp := 'S'; mic_val := 0.25; END IF;
                        ELSIF abx_code = 'AMK' THEN
                            IF rand_val < 8 THEN interp := 'R'; mic_val := 32;
                            ELSIF rand_val < 14 THEN interp := 'I'; mic_val := 16;
                            ELSE interp := 'S'; mic_val := 2; END IF;
                        ELSIF abx_code IN ('CIP', 'LEV') THEN
                            IF rand_val < 60 THEN interp := 'R'; mic_val := 8;
                            ELSIF rand_val < 68 THEN interp := 'I'; mic_val := 2;
                            ELSE interp := 'S'; mic_val := 0.25; END IF;
                        ELSE
                            IF rand_val < 30 THEN interp := 'R'; mic_val := 16;
                            ELSIF rand_val < 38 THEN interp := 'I'; mic_val := 4;
                            ELSE interp := 'S'; mic_val := 1; END IF;
                        END IF;

                        INSERT INTO public.ast_results (
                            culture_id, antibiotic_id, antibiotic_code, raw_result, normalized_result,
                            mic, interpretation, testing_method, guideline, guideline_version, tested_date
                        ) VALUES (
                            v_culture_id, v_abx_id, abx_code, interp, interp,
                            mic_val, interp, 'Vitek AST', 'CLSI', 'M100 2025', spec_date
                        );
                        ast_count := ast_count + 1;
                        IF a >= 5 THEN EXIT; END IF;
                    END LOOP;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Demo data creation finished: 100 patients, 150 specimens, 200 cultures, % AST records generated.', ast_count;
END $$;
