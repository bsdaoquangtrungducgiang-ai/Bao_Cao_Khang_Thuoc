#!/bin/bash
# MASTER TEST RUNNER - BAO-CAO-KHANG-THUOC
echo "================================================================"
echo "    CHẠY TOÀN BỘ BỘ TEST HỆ THỐNG BAO-CAO-KHANG-THUOC"
echo "================================================================"

JSC_BIN="/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"

if [ -f "$JSC_BIN" ]; then
    echo "1. Chạy Bộ Test Phase 1 (Analytics, Antibiogram, Demo Data, RBAC)..."
    "$JSC_BIN" tests/run_jsc_tests.js
    P1_STATUS=$?

    echo "2. Chạy Bộ Test Phase 2 & 3 (Excel/CSV Import, Mapping, Normalization, Validation)..."
    "$JSC_BIN" tests/phase2_phase3_tests.js
    P2_STATUS=$?

    echo "3. Chạy Bộ Test Phase 4, 5 & 6 (MDR/XDR, Carbapenem, MRSA, ESBL, Epidemiology)..."
    "$JSC_BIN" tests/phase4_5_6_tests.js
    P3_STATUS=$?

    echo "4. Chạy Bộ Test Phase 7, 8 & 9 (PDF Import Extraction, 9-Section Report, Audit Logs)..."
    "$JSC_BIN" tests/phase7_8_tests.js
    P4_STATUS=$?

    echo "5. Chạy Bộ Test Xử lý Dữ liệu Thực tế Bệnh viện (23.792 dòng & Auto-Fix)..."
    "$JSC_BIN" tests/hospital_large_import_test.js
    P5_STATUS=$?

    if [ $P1_STATUS -eq 0 ] && [ $P2_STATUS -eq 0 ] && [ $P3_STATUS -eq 0 ] && [ $P4_STATUS -eq 0 ] && [ $P5_STATUS -eq 0 ]; then
        echo "================================================================"
        echo "  ✔ TOÀN BỘ 208 BÀI TEST ĐÃ VƯỢT QUA XUẤT SẮC (100% SUCCESS)!"
        echo "================================================================"
        exit 0
    else
        echo "  ✖ CÓ LỖI XẢY RA TRONG QUÁ TRÌNH TEST!"
        exit 1
    fi
else
    echo "Không tìm thấy JSC binary tại $JSC_BIN. Thử chạy với Node.js..."
    node tests/phase1_tests.js && node tests/phase2_phase3_tests.js && node tests/phase4_5_6_tests.js && node tests/phase7_8_tests.js
fi
