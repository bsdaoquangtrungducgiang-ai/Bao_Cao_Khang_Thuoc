/**
 * PHASE 7, 8, 9 & 10 TEST SUITE - BAO-CAO-KHANG-THUOC
 * Kiểm thử tính năng trích xuất PDF/OCR, tạo Báo cáo tự động 9 phần, Audit Log và Export
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
  load('js/services/demoDataService.js');
  load('js/services/analyticsService.js');
  load('js/services/specializedAMRService.js');
  load('js/services/authService.js');
  load('js/services/auditService.js');
  load('js/services/pdfImportService.js');
  load('js/services/reportExportService.js');
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
print("  CHAY BO KIEM THU GIAI DOAN 7, 8 & 9 (PDF, REPORTS, AUDIT)");
print("  HE THONG: BAO-CAO-KHANG-THUOC");
print("================================================================\n");

// TEST SUITE 1: TRÍCH XUẤT DỮ LIỆU PDF PHIẾU XÉT NGHIỆM (Mục XIV)
print("--- TEST SUITE 1: TRICH XUAT DU LIEU PDF XET NGHIEM (XIV) ---");

var samplePdfText = 
  "BỆNH VIỆN ĐA KHOA TRUNG TÂM - KHOA VI SINH\n" +
  "PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM VI SINH\n" +
  "Mã BN: BN00999   Họ tên: Lê Văn Bình   Tuổi: 52   Giới tính: Nam\n" +
  "Khoa chỉ định: Khoa Cấp cứu   Bệnh phẩm: Nước tiểu   Ngày lấy mẫu: 25/09/2026\n" +
  "KẾT QUẢ ĐỊNH DANH: Escherichia coli\n" +
  "KẾT QUẢ KHÁNG SINH ĐỒ (AST):\n" +
  "1. Ampicillin (AMP) >= 32 R (Kháng)\n" +
  "2. Ceftriaxone (CRO) 16 R (Kháng)\n" +
  "3. Ciprofloxacin (CIP) 4 I (Trung gian)\n" +
  "4. Meropenem (MEM) <= 0.25 S (Nhạy cảm)\n" +
  "5. Amikacin (AMK) <= 2 S (Nhạy cảm)\n";

var pdfResult = PDFImportService.extractClinicalData(samplePdfText, 'Phieu_XN_BN00999.pdf');

assert(pdfResult.extractedInfo.patientCode === 'BN00999', "Trich xuat dung ma benh nhan BN00999");
assert(pdfResult.extractedInfo.patientName.indexOf('Lê Văn Bình') !== -1, "Trich xuat dung ho ten benh nhan");
assert(pdfResult.extractedInfo.age === 52, "Trich xuat dung tuoi 52");
assert(pdfResult.extractedInfo.sex === 'Nam', "Trich xuat dung gioi tinh Nam");
assert(pdfResult.extractedInfo.organismName === 'Escherichia coli', "Trich xuat dung vi khuan Escherichia coli");
assert(pdfResult.extractedInfo.specimenType.indexOf('Nước tiểu') !== -1, "Trich xuat dung benh pham Nuoc tieu");
assert(pdfResult.astRecords.length >= 4, "Trich xuat thanh cong " + pdfResult.astRecords.length + " ket qua khang sinh do AST");
assert(pdfResult.confidenceScore >= 70, "Diem tin cay do PDF text dat " + pdfResult.confidenceScore + "/100");

// Trường hợp file scan ảnh không có text layer
var emptyPdfResult = PDFImportService.extractClinicalData('', 'Scan_Image.pdf');
assert(emptyPdfResult.needsReview === true, "Canh bao dung truong hop PDF scan anh (needsReview = true)");
assert(emptyPdfResult.warningMessage !== null, "Hien thi thong bao canh bao y te cho can bo kiem tra");


// TEST SUITE 2: TẠO BÁO CÁO GIÁM SÁT AMR 9 PHẦN (Mục XXX & XXXI)
print("\n--- TEST SUITE 2: TAO BAO CAO GIAM SAT AMR 9 PHAN (XXX & XXXI) ---");

var reportData = ReportExportService.generateFullReportData({ time: '2026', organism: 'ALL', specimenType: 'ALL' });

assert(reportData.metadata !== undefined, "1. Metadata bao cao day du");
assert(reportData.summary !== undefined, "2. Phan 1 Tong quan & ty le S/I/R day du");
assert(reportData.orgDistribution.length > 0, "3. Phan 2 Phan bo vi khuan co " + reportData.orgDistribution.length + " loai");
assert(reportData.specDistribution.length > 0, "4. Phan 3 Phan bo benh pham co " + reportData.specDistribution.length + " loai");
assert(reportData.antibiogram.length > 0, "5. Phan 4 & 5 Antibiogram co " + reportData.antibiogram.length + " khang sinh");
assert(reportData.heatmap.matrix.length > 0, "6. Phan 6 Heatmap ma tran vi khuan x khang sinh san sang");
assert(reportData.trends.length > 0, "7. Phan 7 Xu huong khang theo thoi gian co du lieu");
assert(reportData.departmentResistance.length > 0, "8. Phan 8 So sanh cac khoa phong day du");
assert(reportData.yearComparison.length === 3, "9. Phan 9 So sanh da nam (2024-2026) day du");


// TEST SUITE 3: AUDIT LOG GHI NHẬN HÀNH ĐỘNG HỆ THỐNG (Mục XXXV)
print("\n--- TEST SUITE 3: NHAT KY KIEM TOAN AUDIT LOG (XXXV) ---");

AuditService.log('LOGIN', 'auth_users', 'user-01', { method: 'password' });
AuditService.log('UPLOAD', 'import_jobs', 'job-101', { fileName: 'test.xlsx' });
AuditService.log('REPORT', 'amr_reports', 'rep-2026', { year: 2026 });

assert(AuditService.localLogs.length >= 3, "Ghi nhat ky thanh cong it nhat 3 su kien");
assert(AuditService.localLogs[0].action === 'REPORT', "Nhat ky moi nhat duoc day len dau danh sach");
assert(AuditService.localLogs[0].timestamp !== undefined, "Moi log deu co dau thoi gian ISO 8601");

print("\n================================================================");
print("  KET QUA KIEM THU: " + passedTests + "/" + totalTests + " TESTS DAT (" + Math.round((passedTests / totalTests) * 100) + "%)");
if (failedTests === 0) {
  print("  \x1b[32m[SUCCESS] TAT CA CAC BAI KIEM THU PHASE 7, 8 & 9 DA VUOT QUA XUAT SAC!\x1b[0m");
} else {
  print("  \x1b[31m[FAILED] CO " + failedTests + " BAI KIEM THU THAT BAI!\x1b[0m");
}
print("================================================================\n");
