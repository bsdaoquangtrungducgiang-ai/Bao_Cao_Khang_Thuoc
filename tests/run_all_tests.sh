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

    if [ $P1_STATUS -eq 0 ] && [ $P2_STATUS -eq 0 ] && [ $P3_STATUS -eq 0 ]; then
        echo "================================================================"
        echo "  ✔ TOÀN BỘ 153 BÀI TEST ĐÃ VƯỢT QUA XUẤT SẮC (100% SUCCESS)!"
        echo "================================================================"
        exit 0
    else
        echo "  ✖ CÓ LỖI XẢY RA TRONG QUÁ TRÌNH TEST!"
        exit 1
    fi
else
    echo "Không tìm thấy JSC binary tại $JSC_BIN. Thử chạy với Node.js..."
    node tests/phase1_tests.js && node tests/phase2_phase3_tests.js && node tests/phase4_5_6_tests.js
fi
