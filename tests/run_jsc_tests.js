/**
 * JSC COMPATIBLE TEST SUITE - BAO-CAO-KHANG-THUOC
 * Chạy trên macOS JavaScriptCore engine hoặc Node.js
 */

var isJsc = (typeof load === 'function');

if (typeof console === 'undefined') {
  var console = {
    log: function(msg) { print(msg); },
    warn: function(msg) { print("[WARN] " + msg); },
    error: function(msg) { print("[ERROR] " + msg); }
  };
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
  load('js/services/demoDataService.js');
  load('js/services/analyticsService.js');
  load('js/services/authService.js');
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
print("  CHAY BO KIEM THU GIAI DOAN 1 (PHASE 1 JAVASCRIPT TEST SUITE)");
print("  HE THONG: BAO-CAO-KHANG-THUOC");
print("================================================================\n");

// TEST SUITE 1: Kiểm thử Công thức Analytics (Section XLV & XLVI)
print("--- TEST SUITE 1: CONG THUC ANALYTICS VA MAU SO (XLV & XLVI) ---");

var sampleAST = [
  { normalized_result: 'S', antibiotic_code: 'CRO' },
  { normalized_result: 'S', antibiotic_code: 'CRO' },
  { normalized_result: 'S', antibiotic_code: 'CRO' },
  { normalized_result: 'I', antibiotic_code: 'CRO' },
  { normalized_result: 'R', antibiotic_code: 'CRO' },
  { normalized_result: 'R', antibiotic_code: 'CRO' },
  { normalized_result: 'NA', antibiotic_code: 'CRO' }, // Phải loại khỏi mẫu số
  { normalized_result: 'NS', antibiotic_code: 'CRO' }  // Phải loại khỏi mẫu số
];

var rates = AnalyticsService.calculateRates(sampleAST);

assert(rates.totalRecords === 8, "Tong ban ghi ghi nhan 8");
assert(rates.denominator === 6, "Mau so chinh xac la 6 (loai tru NA, NS)");
assert(rates.sCount + rates.iCount + rates.rCount === rates.denominator, "S + I + R = denominator");
assert(rates.rRate <= 100 && rates.rRate >= 0, "R% nam trong khoang 0-100%");

assert(Math.abs(rates.rRate - 33.3) < 0.2, "R% tinh dung 33.3% (thuc te: " + rates.rRate + "%)");
assert(Math.abs(rates.sRate - 50.0) < 0.2, "S% tinh dung 50.0% (thuc te: " + rates.sRate + "%)");
assert(Math.abs(rates.iRate - 16.7) < 0.2, "I% tinh dung 16.7% (thuc te: " + rates.iRate + "%)");

var emptyRates = AnalyticsService.calculateRates([]);
assert(emptyRates.denominator === 0 && emptyRates.rRate === 0, "Xu ly an toan khi danh sach rong (Khong chia cho 0)");

// TEST SUITE 2: Dữ liệu Demo 100 BN, 150 Bệnh phẩm, 200 Nuôi cấy, 1,000 AST
print("\n--- TEST SUITE 2: DU LIEU DEMO THEO CHUAN DAC TA (XLIX & L) ---");

var demoData = DemoDataService.init();

assert(demoData.patients.length === 100, "So luong benh nhan dung 100 (thuc te: " + demoData.patients.length + ")");
assert(demoData.specimens.length === 150, "So luong benh pham dung 150 (thuc te: " + demoData.specimens.length + ")");
assert(demoData.cultures.length === 200, "So luong nuoi cay dung 200 (thuc te: " + demoData.cultures.length + ")");
assert(demoData.astResults.length === 1000, "So luong ket qua AST dung 1,000 (thuc te: " + demoData.astResults.length + ")");

var demoRates = AnalyticsService.calculateRates(demoData.astResults);
assert(demoRates.sRate === 62.0, "Ty le S dat chuan 62.0% (thuc te: " + demoRates.sRate + "%)");
assert(demoRates.iRate === 8.0, "Ty le I dat chuan 8.0% (thuc te: " + demoRates.iRate + "%)");
assert(demoRates.rRate === 30.0, "Ty le R dat chuan 30.0% (thuc te: " + demoRates.rRate + "%)");
assert(demoRates.sCount === 620, "So luong ket qua S chinh xac 620");
assert(demoRates.iCount === 80, "So luong ket qua I chinh xac 80");
assert(demoRates.rCount === 300, "So luong ket qua R chinh xac 300");

// TEST SUITE 3: Antibiogram & Heatmap
print("\n--- TEST SUITE 3: MA TRAN ANTIBIOGRAM & HEATMAP (XX & XXI) ---");

var antibiogram = AnalyticsService.generateAntibiogram(demoData.astResults, 'Escherichia coli');
assert(antibiogram.length > 0, "Antibiogram sinh thanh cong " + antibiogram.length + " khang sinh cho E. coli");

for (var i = 0; i < antibiogram.length; i++) {
  var row = antibiogram[i];
  assert(
    row.sCount + row.iCount + row.rCount === row.total,
    "Khang sinh " + row.code + ": S(" + row.sCount + ") + I(" + row.iCount + ") + R(" + row.rCount + ") = Total(" + row.total + ")"
  );
  assert(row.rRate <= 100 && row.rRate >= 0, "Khang sinh " + row.code + ": %R (" + row.rRate + "%) hop le <= 100%");
}

var heatmap = AnalyticsService.generateHeatmap(demoData.astResults);
assert(heatmap.matrix.length > 0, "Heatmap sinh ma tran hang vi khuan thanh cong");
assert(heatmap.antibiotics.length > 0, "Heatmap sinh danh sach cot khang sinh thanh cong");

// TEST SUITE 4: Phân quyền RBAC
print("\n--- TEST SUITE 4: PHAN QUYEN VAI TRO NGUOI DUNG RBAC (II & XXXVI) ---");

AuthService.setDemoRole('admin');
assert(AuthService.canUpload() === true, "Admin co quyen upload du lieu");
assert(AuthService.canEditData() === true, "Admin co quyen sua du lieu");
assert(AuthService.canDeleteData() === true, "Admin co quyen xoa du lieu");
assert(AuthService.canManageUsers() === true, "Admin co quyen quan ly nguoi dung");

AuthService.setDemoRole('manager');
assert(AuthService.canUpload() === true, "Manager co quyen upload du lieu");
assert(AuthService.canEditData() === true, "Manager co quyen sua du lieu");
assert(AuthService.canDeleteData() === false, "Manager KHONG co quyen xoa du lieu (Admin only)");
assert(AuthService.canManageUsers() === false, "Manager KHONG co quyen quan ly tai khoan Admin");

AuthService.setDemoRole('user');
assert(AuthService.canUpload() === true, "User co quyen upload du lieu");
assert(AuthService.canEditData() === false, "User KHONG co quyen sua du lieu he thong");
assert(AuthService.canDeleteData() === false, "User KHONG co quyen xoa du lieu");

AuthService.setDemoRole('viewer');
assert(AuthService.canUpload() === false, "Viewer chi co quyen xem, khong duoc upload");
assert(AuthService.canEditData() === false, "Viewer khong duoc sua du lieu");

// TEST SUITE 5: Cấu hình hệ thống
print("\n--- TEST SUITE 5: CAU HINH SUPABASE & GUIDELINE ---");
assert(CONFIG.APP_NAME === 'BAO-CAO-KHANG-THUOC', "Ten he thong dung BAO-CAO-KHANG-THUOC");
assert(CONFIG.SUPABASE.DEFAULT_URL.indexOf('supabase.co') !== -1, "SUPABASE_URL hop le");
assert(CONFIG.DEFAULT_GUIDELINE === 'CLSI', "Tieu chuan mac dinh la CLSI");

print("\n================================================================");
print("  KET QUA KIEM THU: " + passedTests + "/" + totalTests + " TESTS DAT (" + Math.round((passedTests / totalTests) * 100) + "%)");
if (failedTests === 0) {
  print("  \x1b[32m[SUCCESS] TAT CA CAC BAI KIEM THU DA VUOT QUA XUAT SAC!\x1b[0m");
} else {
  print("  \x1b[31m[FAILED] CO " + failedTests + " BAI KIEM THU THAT BAI!\x1b[0m");
}
print("================================================================\n");
