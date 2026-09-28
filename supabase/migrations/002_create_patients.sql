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
