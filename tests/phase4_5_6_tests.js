/**
 * PHASE 4, 5 & 6 TEST SUITE - BAO-CAO-KHANG-THUOC
 * Kiểm thử tính toán chuyên sâu: MDR/XDR, Carbapenem, MRSA, ESBL, Dịch tễ và Kháng theo khoa
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
  load('js/services/demoDataService.js');
  load('js/services/analyticsService.js');
  load('js/services/specializedAMRService.js');
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
print("  CHAY BO KIEM THU GIAI DOAN 4, 5 & 6 (AMR SURVEILLANCE TESTS)");
print("  HE THONG: BAO-CAO-KHANG-THUOC");
print("================================================================\n");

var demoData = DemoDataService.getAll();

// TEST SUITE 1: GIÁM SÁT VI KHUẨN ĐA KHÁNG MDR / XDR / PDR (Section XXIV)
print("--- TEST SUITE 1: PHAN TICH DA KHANG MDR / XDR / PDR (XXIV) ---");

var mdrResult = SpecializedAMRService.analyzeMDR(demoData.astResults, demoData.cultures);

assert(mdrResult.totalIsolates === 200, "Tong so chung vi khuan phan tich dung 200 (thuc te: " + mdrResult.totalIsolates + ")");
assert(mdrResult.mdrCount + mdrResult.xdrCount + mdrResult.pdrCount + mdrResult.nonMdrCount === mdrResult.totalIsolates, "Tong cac nhom MDR + XDR + PDR + Non-MDR = Tong chung phan lap");
assert(mdrResult.mdrRate >= 0 && mdrResult.mdrRate <= 100, "Ty le MDR hop le (thuc te: " + mdrResult.mdrRate + "%)");
assert(mdrResult.isolates.length === 200, "Danh sach phan loai chung du 200 ban ghi");

// TEST SUITE 2: GIÁM SÁT KHÁNG CARBAPENEM (Section XXVI - CRE, CRAB, CRPA)
print("\n--- TEST SUITE 2: GIAM SAT KHANG CARBAPENEM (XXVI) ---");

var carbaResult = SpecializedAMRService.analyzeCarbapenemResistance(demoData.astResults);

assert(carbaResult['Escherichia coli'] !== undefined, "Giam sat Carbapenem cho E. coli");
assert(carbaResult['Klebsiella pneumoniae'] !== undefined, "Giam sat Carbapenem cho K. pneumoniae");
assert(carbaResult['Pseudomonas aeruginosa'] !== undefined, "Giam sat Carbapenem cho P. aeruginosa");
assert(carbaResult['Acinetobacter baumannii'] !== undefined, "Giam sat Carbapenem cho A. baumannii");

var ecoliMem = carbaResult['Escherichia coli']['MEM'];
assert(ecoliMem.rRate >= 0 && ecoliMem.rRate <= 100, "Ty le E. coli khang MEM hop le (thuc te: " + ecoliMem.rRate + "%)");
assert(ecoliMem.sCount + ecoliMem.iCount + ecoliMem.rCount === ecoliMem.denominator, "Mau so tinh toan carbapenem dung chuan S+I+R");


// TEST SUITE 3: GIÁM SÁT MRSA (Section XXVII)
print("\n--- TEST SUITE 3: GIAM SAT MRSA vs MSSA (XXVII) ---");

var mrsaResult = SpecializedAMRService.analyzeMRSA(demoData.astResults);

assert(mrsaResult.totalStaph > 0, "Phat hien tong so chung S. aureus: " + mrsaResult.totalStaph);
assert(mrsaResult.mrsaCount + mrsaResult.mssaCount === mrsaResult.totalStaph, "MRSA + MSSA = Tong S. aureus");
assert(Math.round(mrsaResult.mrsaRate + mrsaResult.mssaRate) === 100, "MRSA% + MSSA% = 100% (thuc te: " + mrsaResult.mrsaRate + "% + " + mrsaResult.mssaRate + "%)");


// TEST SUITE 4: GIÁM SÁT VI KHUẨN TIẾT ESBL (Section XXV)
print("\n--- TEST SUITE 4: GIAM SAT VI KHUAN TIET ESBL (XXV) ---");

var esblResult = SpecializedAMRService.analyzeESBL(demoData.astResults);

assert(esblResult.totalCultures > 0, "Phat hien tong so chung Enterobacterales: " + esblResult.totalCultures);
assert(esblResult.esblCount + esblResult.nonEsblCount === esblResult.totalCultures, "ESBL(+) + ESBL(-) = Tong chung Enterobacterales");
assert(esblResult.esblRate >= 0 && esblResult.esblRate <= 100, "Ty le nghi ngo ESBL hop le (thuc te: " + esblResult.esblRate + "%)");


// TEST SUITE 5: PHÂN TÍCH KHÁNG THEO KHOA PHÒNG & SO SÁNH NĂM (XXIII & XXIX)
print("\n--- TEST SUITE 5: PHAN TICH THEO KHOA & SO SANH CAC NAM (XXIII & XXIX) ---");

var deptRes = AnalyticsService.getResistanceByDepartment(demoData.astResults, demoData.specimens, 'Escherichia coli', 'CRO');
assert(deptRes.length > 0, "Phan tich thanh cong ty le khang CRO theo khoa (" + deptRes.length + " khoa phong)");

deptRes.forEach(function(d) {
  assert(d.rRate <= 100 && d.sRate <= 100, "Khoa " + d.department + ": %R=" + d.rRate + "%, %S=" + d.sRate + "% hop le");
  assert(d.sRate + d.iRate + d.rRate <= 100.1, "Khoa " + d.department + ": Tong S+I+R rate <= 100%");
});

var yearsComp = SpecializedAMRService.compareYears(demoData.astResults, 'Escherichia coli', 'CRO');
assert(yearsComp.length === 3, "So sanh day du 3 moc nam (2024, 2025, 2026)");
assert(yearsComp[0].year === '2024' && yearsComp[1].year === '2025' && yearsComp[2].year === '2026', "Dung thu tu thoi gian 2024 -> 2025 -> 2026");

print("\n================================================================");
print("  KET QUA KIEM THU: " + passedTests + "/" + totalTests + " TESTS DAT (" + Math.round((passedTests / totalTests) * 100) + "%)");
if (failedTests === 0) {
  print("  \x1b[32m[SUCCESS] TAT CA CAC BAI KIEM THU PHASE 4, 5 & 6 DA VUOT QUA XUAT SAC!\x1b[0m");
} else {
  print("  \x1b[31m[FAILED] CO " + failedTests + " BAI KIEM THU THAT BAI!\x1b[0m");
}
print("================================================================\n");
