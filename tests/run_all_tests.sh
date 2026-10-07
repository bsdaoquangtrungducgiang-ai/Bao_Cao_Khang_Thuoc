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

    echo "6. Chạy Bộ Test 5 Yêu Cầu (Sky Blue Sidebar, Multi-Format, Supabase, File Analytics & FIFO)..."
    "$JSC_BIN" tests/file_fifo_analytics_test.js
    P6_STATUS=$?

    echo "7. Chạy Bộ Test Antibiogram Đa Tiêu Chí (Đa Vi Khuẩn, Đa Bệnh Phẩm, Khoa, Giới Tính & Menu Brand)..."
    "$JSC_BIN" tests/antibiogram_multi_filter_test.js
    P7_STATUS=$?

    echo "8. Chạy Bộ Test Thích Ứng Tiêu Chí Antibiogram & Auto-Resolve Xung Đột..."
    "$JSC_BIN" tests/antibiogram_adaptive_filter_test.js
    P8_STATUS=$?

    echo "9. Chạy Bộ Test Tách Đủ 63 Kháng Sinh Riêng Biệt (Không Gộp peng, CTX, CRO)..."
    "$JSC_BIN" tests/antibiogram_63_antibiotics_test.js
    P9_STATUS=$?

    echo "10. Chạy Bộ Test Danh Sách 12 Nhân Sự Khoa Vi Sinh - BV Đa Khoa Đức Giang..."
    "$JSC_BIN" tests/user_list_test.js
    P10_STATUS=$?

    echo "11. Chạy Bộ Test Tiêu Đề Đỏ Tươi & Tách Biệt Bảng - Biểu Đồ Antibiogram..."
    "$JSC_BIN" tests/antibiogram_separated_view_test.js
    P11_STATUS=$?

    if [ $P1_STATUS -eq 0 ] && [ $P2_STATUS -eq 0 ] && [ $P3_STATUS -eq 0 ] && [ $P4_STATUS -eq 0 ] && [ $P5_STATUS -eq 0 ] && [ $P6_STATUS -eq 0 ] && [ $P7_STATUS -eq 0 ] && [ $P8_STATUS -eq 0 ] && [ $P9_STATUS -eq 0 ] && [ $P10_STATUS -eq 0 ] && [ $P11_STATUS -eq 0 ]; then
        echo "================================================================"
        echo "  ✔ TOÀN BỘ 11 BÀI TEST HỆ THỐNG ĐÃ VƯỢT QUA XUẤT SẮC (100% SUCCESS)!"
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
