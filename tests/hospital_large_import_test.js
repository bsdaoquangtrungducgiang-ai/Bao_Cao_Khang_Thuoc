/**
 * TEST SCENARIO: MÔ PHỎNG IMPORT FILE DỮ LIỆU BỆNH VIỆN THỰC TẾ (23,792 DÒNG)
 * Kiểm tra khắc phục triệt để lỗi:
 * 1. "Không có bản ghi hợp lệ nào để import!"
 * 2. Cột Mã xét nghiệm ("010126-130011", "23031418") bị nhận nhầm thành interpretation
 * 3. Hàng ngàn dòng bị lỗi "Thiếu mã bệnh nhân (Bắt buộc)" do ô merged/trống
 */

var totalTests = 0;
var passedTests = 0;
var failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    print("  \x1b[32m[PASS]\x1b[0m " + message);
  } else {
    failedTests++;
    print("  \x1b[31m[FAIL]\x1b[0m " + message);
  }
}

// 1. Nạp các module cần thiết
load("js/config.js");
load("js/utils/dataNormalization.js");
load("js/utils/dataValidation.js");
load("js/services/importService.js");

print("================================================================");
print("  KIỂM THỬ XỬ LÝ DỮ LIỆU BỆNH VIỆN THỰC TẾ & LỖI IMPORT 23.792 DÒNG");
print("================================================================");

// --- TÌNH HUỐNG 1: NHẬN DIỆN MÃ ĐỊNH DẠNG BỆNH VIỆN ---
print("\n--- TEST 1: NHẬN DIỆN MÃ XÉT NGHIỆM / MÃ BN ---");
assert(DataNormalization.isLikelyIdentifier("010126-130011") === true, "Nhan dien '010126-130011' la Ma Mau / Ma XN");
assert(DataNormalization.isLikelyIdentifier("23031418") === true, "Nhan dien '23031418' la Ma Benh Nhan");
assert(DataNormalization.isLikelyIdentifier("010126-170001") === true, "Nhan dien '010126-170001' la Ma Mau / Ma XN");
assert(DataNormalization.isLikelyIdentifier("22049295") === true, "Nhan dien '22049295' la Ma Benh Nhan");
assert(DataNormalization.isLikelyIdentifier("S") === false, "'S' khong phai la Ma dinh danh");
assert(DataNormalization.isLikelyIdentifier("R") === false, "'R' khong phai la Ma dinh danh");

// --- TÌNH HUỐNG 2: BẢO VỆ CỘT KHÁNG SINH KHỎI CÁC TỪ KHÓA HÀNH CHÍNH ---
print("\n--- TEST 2: BẢO VỆ CỘT KHÁNG SINH KHÔNG BỊ NHẬN NHẦM TỪ 'STT', 'KHOA', 'MÃ' ---");
assert(DataNormalization.normalizeAntibiotic("STT") === null, "'STT' khong bao gio bi coi la khang sinh");
assert(DataNormalization.normalizeAntibiotic("Khoa") === null, "'Khoa' khong bao gio bi coi la khang sinh");
assert(DataNormalization.normalizeAntibiotic("Mã") === null, "'Mã' khong bao gio bi coi la khang sinh");
assert(DataNormalization.normalizeAntibiotic("Tuổi") === null, "'Tuổi' khong bao gio bi coi la khang sinh");
assert(DataNormalization.normalizeAntibiotic("AMP") === "AMP", "'AMP' duoc nhan dien dung la Ampicillin");
assert(DataNormalization.normalizeAntibiotic("CRO") === "CRO", "'CRO' duoc nhan dien dung la Ceftriaxone");

// --- TÌNH HUỐNG 3: AUTO-DETECT MAPPING VỚI DỮ LIỆU THỰC TẾ ---
print("\n--- TEST 3: AUTO-DETECT THÔNG MINH KẾT HỢP HEADER VÀ NỘI DUNG MẪU ---");
var realHeaders = ["Mã xét nghiệm", "Mã người bệnh", "Họ tên", "Khoa", "Bệnh phẩm", "Ngày nhận", "Vi khuẩn", "Kháng sinh", "Kết quả AST"];
var sampleDataRows = [
  ["010126-130011", "23031418", "Tran Thi Lan", "Noi", "Nuoc tieu", "2026-09-20", "Escherichia coli", "Ampicillin", "R"],
  ["010126-130011", "23031418", "Tran Thi Lan", "Noi", "Nuoc tieu", "2026-09-20", "Escherichia coli", "Ceftriaxone", "R"],
  ["010126-130011", "23031418", "Tran Thi Lan", "Noi", "Nuoc tieu", "2026-09-20", "Escherichia coli", "Meropenem", "S"],
  ["010126-170001", "22049295", "Nguyen Van Hai", "ICU", "Mau", "2026-09-21", "Klebsiella pneumoniae", "Amikacin", "S"]
];

var autoMapping = ImportService.autoDetectColumns(realHeaders, sampleDataRows);
assert(autoMapping.columnMap[0].systemField === "patient_code", "Cot 0 (Ma xet nghiem) duoc map vao patient_code");
assert(autoMapping.columnMap[2].systemField === "patient_name", "Cot 2 (Ho ten) duoc map vao patient_name");
assert(autoMapping.columnMap[4].systemField === "specimen_type", "Cot 4 (Benh pham) duoc map vao specimen_type");
assert(autoMapping.columnMap[5].systemField === "collection_date", "Cot 5 (Ngay nhan) duoc map vao collection_date");
assert(autoMapping.columnMap[6].systemField === "organism_name", "Cot 6 (Vi khuan) duoc map vao organism_name");
assert(autoMapping.columnMap[7].systemField === "antibiotic_code", "Cot 7 (Khang sinh) duoc map vao antibiotic_code");
assert(autoMapping.columnMap[8].systemField === "interpretation", "Cot 8 (Ket qua AST) duoc map dung vao interpretation (khong phai Ma XN!)");

// --- TÌNH HUỐNG 4: FORWARD-FILL DÒNG GỘP (MERGED CELLS) ---
print("\n--- TEST 4: FORWARD-FILL TỰ ĐỘNG KẾ THỪA THÔNG TIN BỆNH NHÂN CHO Ô GỘP ---");
var mergedExportRows = [
  // Dong 1: Day du thong tin benh nhan
  ["010126-130011", "23031418", "Tran Thi Lan", "Noi", "Nuoc tieu", "2026-09-20", "Escherichia coli", "Ampicillin", "R"],
  // Dong 2..4: O merged trong Excel (thong tin benh nhan bi trong!)
  ["", "", "", "", "", "", "", "Ceftriaxone", "R"],
  ["", "", "", "", "", "", "", "Ciprofloxacin", "I"],
  ["", "", "", "", "", "", "", "Meropenem", "S"],
  // Dong 5: Benh nhan tiep theo
  ["010126-170001", "22049295", "Nguyen Van Hai", "ICU", "Mau", "2026-09-21", "Klebsiella pneumoniae", "Gentamicin", "S"],
  // Dong 6: O merged trong
  ["", "", "", "", "", "", "", "Imipenem", "S"]
];

var transformed = ImportService.transformData(mergedExportRows, autoMapping, {
  autoForwardFill: true,
  autoGeneratePatientCode: true
});

assert(transformed.length === 6, "Chuyen doi thanh cong du 6 ban ghi AST");
assert(transformed[1].patient_code === "010126-130011", "Dong 2 ke thua dung patient_code cua Dong 1");
assert(transformed[1].organism_name === "Escherichia coli", "Dong 2 ke thua dung vi khuan cua Dong 1");
assert(transformed[1].antibiotic_code === "Ceftriaxone", "Dong 2 co dung khang sinh Ceftriaxone");
assert(transformed[2].patient_code === "010126-130011", "Dong 3 ke thua dung patient_code");
assert(transformed[4].patient_code === "010126-170001", "Dong 5 nhan dung ma benh nhan moi");
assert(transformed[5].patient_code === "010126-170001", "Dong 6 ke thua dung ma benh nhan moi");

// --- TÌNH HUỐNG 5: KIỂM ĐỊNH TOÀN BỘ BẢN GHI ĐƯỢC CHẤP NHẬN ---
print("\n--- TEST 5: KIỂM ĐỊNH & NẠP DỮ LIỆU THÀNH CÔNG (100% SẴN SÀNG IMPORT) ---");
var validation = DataValidation.validateBatch(transformed);
assert(validation.validCount + validation.warningCount === 6, "Toan bo 6/6 ban ghi hop le va san sang nap vao database (khong bi loi tu choi!)");
assert(validation.errorCount === 0, "Khong co loi tu choi nao!");

// --- TÌNH HUỐNG 6: TỰ ĐỘNG SỬA LỖI HÀNG LOẠT (AUTO-FIX BATCH) ---
print("\n--- TEST 6: THỬ NGHIỆM TÍNH NĂNG TỰ ĐỘNG SỬA LỖI (AUTO-FIX) ---");
var brokenRows = [
  { patient_code: '', specimen_type: '', collection_date: '', organism_name: 'E. coli', antibiotic_code: 'AMP', interpretation: 'R' },
  { patient_code: '', specimen_type: 'Mau', collection_date: '', organism_name: 'S. aureus', antibiotic_code: 'FOX', interpretation: 'S ' }
];
var autoFixed = DataValidation.autoFixBatch(brokenRows);
assert(autoFixed.fixedRows.length === 2, "Auto-Fix xu ly du 2 ban ghi");
assert(autoFixed.fixedRows[0].patient_code.indexOf("BN_AUTO_") === 0, "Tu dong sinh ma BN_AUTO_ cho dong thieu ma");
assert(autoFixed.fixedRows[0].collection_date !== '', "Tu dong dien ngay hien tai cho dong thieu ngay");
assert(autoFixed.fixedRows[1].interpretation === "S", "Tu dong cat bo khoang trang thua o interpretation");
assert(autoFixed.validation.validCount + autoFixed.validation.warningCount === 2, "Ca 2 dong sau khi Auto-Fix deu hop le de import!");

print("\n================================================================");
print("  KET QUA KIEM THU: " + passedTests + "/" + totalTests + " TESTS DAT (" + Math.round((passedTests / totalTests) * 100) + "%)");
if (failedTests === 0) {
  print("  \x1b[32m[SUCCESS] TAT CA CAC BAI KIEM THU BENH VIEN THUC TE DA DAT 100%!\x1b[0m");
} else {
  print("  \x1b[31m[FAILED] CO " + failedTests + " BAI KIEM THU THAT BAI!\x1b[0m");
}
print("================================================================\n");
