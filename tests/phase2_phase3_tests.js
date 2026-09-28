/**
 * PHASE 2 & PHASE 3 TEST SUITE - BAO-CAO-KHANG-THUOC
 * Kiểm thử tính năng Import Excel/CSV, Nhận diện cột, Chuẩn hóa S/I/R và Kiểm định dữ liệu
 * Tương thích cả Node.js và macOS JavaScriptCore (jsc)
 */

var isJsc = (typeof load === 'function');

if (typeof console === 'undefined') {
  var console = {
    log: function(msg) { print(msg); },
    warn: function(msg) { print("[WARN] " + msg); },
    error: function(msg) { print("[ERROR] " + msg); }
  };
}

if (typeof window === 'undefined') {
  var window = this;
}

if (typeof localStorage === 'undefined') {
  var _storage = {};
  var localStorage = {
    getItem: function(k) { return _storage[k] || null; },
    setItem: function(k, v) { _storage[k] = String(v); },
    removeItem: function(k) { delete _storage[k]; }
  };
}

if (isJsc) {
  load('js/config.js');
  load('js/utils/dataNormalization.js');
  load('js/utils/dataValidation.js');
  load('js/services/importService.js');
}

var totalTests = 0;
var passedTests = 0;
var failedTests = 0;

function assert(condition, testName, details) {
  totalTests++;
  if (condition) {
    passedTests++;
    print("  \x1b[32m[PASS]\x1b[0m " + testName);
  } else {
    failedTests++;
    print("  \x1b[31m[FAIL]\x1b[0m " + testName + " - " + (details || ""));
  }
}

print("================================================================");
print("  CHAY BO KIEM THU GIAI DOAN 2 & 3 (IMPORT & VALIDATION TESTS)");
print("  HE THONG: BAO-CAO-KHANG-THUOC");
print("================================================================\n");

// TEST SUITE 1: CHUẨN HÓA KẾT QUẢ S / I / R (Mục XII & XLVII)
print("--- TEST SUITE 1: CHUAN HOA KET QUA AST S/I/R (XII & XLVII) ---");

var sVariants = ['S', 's', 'Sensitive', 'Susceptible', 'Nhay', 'Nhạy', 'nhay', 'nhạy'];
sVariants.forEach(function(val) {
  var norm = DataNormalization.normalizeAST(val);
  assert(norm.normalized_value === 'S', "Gia tri '" + val + "' chuan hoa thanh S", "Nhan duoc: " + norm.normalized_value);
  assert(norm.raw_value === val, "Giu nguyen raw_value '" + val + "'");
});

var iVariants = ['I', 'i', 'Intermediate', 'Trung gian', 'trung gian'];
iVariants.forEach(function(val) {
  var norm = DataNormalization.normalizeAST(val);
  assert(norm.normalized_value === 'I', "Gia tri '" + val + "' chuan hoa thanh I", "Nhan duoc: " + norm.normalized_value);
  assert(norm.raw_value === val, "Giu nguyen raw_value '" + val + "'");
});

var rVariants = ['R', 'r', 'Resistant', 'Kháng', 'Khang', 'khang', 'kháng', 'resistance'];
rVariants.forEach(function(val) {
  var norm = DataNormalization.normalizeAST(val);
  assert(norm.normalized_value === 'R', "Gia tri '" + val + "' chuan hoa thanh R", "Nhan duoc: " + norm.normalized_value);
  assert(norm.raw_value === val, "Giu nguyen raw_value '" + val + "'");
});

var naNorm = DataNormalization.normalizeAST('-');
assert(naNorm.normalized_value === 'NA', "Dau '-' duoc chuan hoa thanh NA");

var unknownNorm = DataNormalization.normalizeAST('X_INVALID_RESULT');
assert(unknownNorm.isValid === false, "Ket qua bat thuong duoc danh dau isValid = false");


// TEST SUITE 2: CHUẨN HÓA VI KHUẨN VÀ KHÁNG SINH
print("\n--- TEST SUITE 2: CHUAN HOA VI KHUAN VA KHANG SINH ---");

var orgEcoli = DataNormalization.normalizeOrganism('E. coli');
assert(orgEcoli.name === 'Escherichia coli' && orgEcoli.isValid === true, "E. coli -> Escherichia coli");

var orgKleb = DataNormalization.normalizeOrganism('k. pneumoniae');
assert(orgKleb.name === 'Klebsiella pneumoniae' && orgKleb.isValid === true, "k. pneumoniae -> Klebsiella pneumoniae");

var abxAmp = DataNormalization.normalizeAntibiotic('Ampicillin');
assert(abxAmp === 'AMP', "Ampicillin -> AMP");

var abxCef = DataNormalization.normalizeAntibiotic('Ceftriaxone');
assert(abxCef === 'CRO', "Ceftriaxone -> CRO");

var abxMero = DataNormalization.normalizeAntibiotic('meropenem');
assert(abxMero === 'MEM', "meropenem -> MEM");


// TEST SUITE 3: CHUẨN HÓA NGÀY THÁNG VÀ FINGERPRINT TRÙNG LẶP
print("\n--- TEST SUITE 3: CHUAN HOA NGAY THANG & CHONG IMPORT TRUNG (XXXIV) ---");

var date1 = DataNormalization.normalizeDate('2026-09-25');
assert(date1.isValid === true && date1.dateStr === '2026-09-25', "Ngay YYYY-MM-DD hop le");

var date2 = DataNormalization.normalizeDate('25/09/2026');
assert(date2.isValid === true && date2.dateStr === '2026-09-25', "Ngay DD/MM/YYYY chuan hoa thanh 2026-09-25");

var dateInvalid = DataNormalization.normalizeDate('35/20/2026');
assert(dateInvalid.isValid === false, "Phat hien ngay khong hop le 35/20/2026");

var fp1 = DataNormalization.generateFingerprint('BN001', 'Urine', '2026-09-25', 'Escherichia coli', 'CRO');
var fp2 = DataNormalization.generateFingerprint('BN001', 'Urine', '2026-09-25', 'Escherichia coli', 'CRO');
var fp3 = DataNormalization.generateFingerprint('BN001', 'Urine', '2026-09-25', 'Escherichia coli', 'MEM');

assert(fp1 === fp2, "Hai ban ghi trung khop co fingerprint giong nhau");
assert(fp1 !== fp3, "Hai ban ghi khac khang sinh co fingerprint khac nhau");


// TEST SUITE 4: TỰ ĐỘNG NHẬN DIỆN CỘT (AUTO-DETECT MAPPING - Mục X & XI)
print("\n--- TEST SUITE 4: TU DONG NHAN DIEN COT MAPPING (X & XI) ---");

var sampleHeaders = ['Mã BN', 'Tên bệnh nhân', 'Tuổi', 'Giới', 'Khoa', 'Bệnh phẩm', 'Ngày lấy mẫu', 'Vi khuẩn', 'AMP', 'CTX', 'CRO', 'MEM'];
var detected = ImportService.autoDetectColumns(sampleHeaders);

assert(detected.isWideFormat === true, "Nhan dien chinh xac bang dang ngang (Wide/Matrix format)");
assert(detected.antibioticColumns.length === 4, "Nhan dien dung 4 cot khang sinh (AMP, CTX, CRO, MEM)");
assert(detected.columnMap[0].systemField === 'patient_code', "Cot 'Mã BN' -> patient_code");
assert(detected.columnMap[1].systemField === 'patient_name', "Cot 'Tên bệnh nhân' -> patient_name");
assert(detected.columnMap[5].systemField === 'specimen_type', "Cot 'Bệnh phẩm' -> specimen_type");
assert(detected.columnMap[7].systemField === 'organism_name', "Cot 'Vi khuẩn' -> organism_name");


// TEST SUITE 5: PHÁT HIỆN LỖI DỮ LIỆU & KIỂM ĐỊNH (DATA VALIDATION - Mục XIII & LII)
print("\n--- TEST SUITE 5: KIEM DINH CHAT LUONG DU LIEU (XIII & LII) ---");

var rawRowsToValidate = [
  // 1. Dòng hợp lệ
  {
    patient_code: 'BN001',
    patient_name: 'Nguyen Van A',
    age: 45,
    sex: 'Nam',
    department: 'Ngoai',
    specimen_type: 'Nuoc tieu',
    collection_date: '2026-09-25',
    organism_name: 'Escherichia coli',
    antibiotic_code: 'CRO',
    raw_result: 'R'
  },
  // 2. Dòng thiếu mã bệnh nhân
  {
    patient_code: '',
    patient_name: 'Vo Danh',
    age: 30,
    sex: 'Nam',
    department: 'Noi',
    specimen_type: 'Mau',
    collection_date: '2026-09-25',
    organism_name: 'Klebsiella pneumoniae',
    antibiotic_code: 'MEM',
    raw_result: 'S'
  },
  // 3. Dòng ngày không hợp lệ (35/20/2026)
  {
    patient_code: 'BN003',
    patient_name: 'Tran B',
    age: 25,
    sex: 'Nu',
    department: 'ICU',
    specimen_type: 'Dom',
    collection_date: '35/20/2026',
    organism_name: 'Pseudomonas aeruginosa',
    antibiotic_code: 'CIP',
    raw_result: 'S'
  },
  // 4. Dòng kết quả AST không hợp lệ ("X")
  {
    patient_code: 'BN004',
    patient_name: 'Le C',
    age: 50,
    sex: 'Nam',
    department: 'Cap cuu',
    specimen_type: 'Mau',
    collection_date: '2026-09-26',
    organism_name: 'Staphylococcus aureus',
    antibiotic_code: 'VAN',
    raw_result: 'X_INVALID'
  },
  // 5. Dòng trùng lặp với Dòng 1
  {
    patient_code: 'BN001',
    patient_name: 'Nguyen Van A',
    age: 45,
    sex: 'Nam',
    department: 'Ngoai',
    specimen_type: 'Nuoc tieu',
    collection_date: '2026-09-25',
    organism_name: 'Escherichia coli',
    antibiotic_code: 'CRO',
    raw_result: 'R'
  }
];

var valResult = DataValidation.validateBatch(rawRowsToValidate);

assert(valResult.total === 5, "Tong so ban ghi kiem tra la 5");
assert(valResult.validCount === 1, "Dung 1 ban ghi hoan toan hop le (Dong 1)");
assert(valResult.errorCount >= 3, "Phat hien dung it nhat 3 dong co loi nghiem trong (thieu ma, sai ngay, sai AST)");
assert(valResult.duplicateCount === 1, "Phat hien dung 1 ban ghi trung lap (Dong 5 trung Dong 1)");
assert(valResult.errorList.length > 0, "Bao cao danh sach chi tiet loi thanh cong");


// TEST SUITE 6: PARSE CSV & VĂN BẢN TRỰC TIẾP (Mục XV)
print("\n--- TEST SUITE 6: PARSE CSV / TEXT PASTE (XV) ---");

var csvPasteText = "Mã BN,Vi khuẩn,Bệnh phẩm,Kháng sinh,Kết quả\n" +
  "BN001,E. coli,Urine,AMP,R\n" +
  "BN001,E. coli,Urine,CTX,R\n" +
  "BN001,E. coli,Urine,MEM,S";

var parsedText = ImportService.parseText(csvPasteText);
assert(parsedText.totalRows === 3, "Parse duoc 3 dong du lieu tu text paste");
assert(parsedText.totalCols === 5, "Parse duoc 5 cot tu text paste");

print("\n================================================================");
print("  KET QUA KIEM THU: " + passedTests + "/" + totalTests + " TESTS DAT (" + Math.round((passedTests / totalTests) * 100) + "%)");
if (failedTests === 0) {
  print("  \x1b[32m[SUCCESS] TAT CA CAC BAI KIEM THU PHASE 2 & 3 DA VUOT QUA XUAT SAC!\x1b[0m");
} else {
  print("  \x1b[31m[FAILED] CO " + failedTests + " BAI KIEM THU THAT BAI!\x1b[0m");
}
print("================================================================\n");
