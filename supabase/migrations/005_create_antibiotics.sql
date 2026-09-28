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
