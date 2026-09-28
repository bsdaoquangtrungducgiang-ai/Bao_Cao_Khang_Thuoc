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
