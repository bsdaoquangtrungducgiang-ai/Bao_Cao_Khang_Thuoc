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
