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
