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
