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
