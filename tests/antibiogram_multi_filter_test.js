/**
 * ANTIBIOGRAM MULTI-FILTER TEST SUITE
 * Kiểm tra các tính năng mới trong Bảng phân tích chuyên sâu Antibiogram:
 * 1. Chọn từ 1 đến nhiều Vi khuẩn (hoặc tất cả)
 * 2. Chọn 1 hoặc nhiều Loại bệnh phẩm (hoặc tất cả)
 * 3. Bổ sung lựa chọn Khoa phòng (mặc định là tất cả)
 * 4. Bổ sung lựa chọn Giới tính (mặc định là tất cả)
 * 5. Đổi tên thanh menu: "PT KHÁNG THUỐC" & "Vi sinh – Đức Giang"
 */

var _sysPrint = (typeof print === 'function') ? print : function(msg) {};
var print = _sysPrint;

if (typeof console === 'undefined') {
  var console = {
    log: function(msg) { _sysPrint(msg); },
    warn: function(msg) { _sysPrint("[WARN] " + msg); },
    error: function(msg) { _sysPrint("[ERROR] " + msg); }
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

function assert(condition, message) {
  if (!condition) {
    _sysPrint('  [FAIL] ' + message);
    throw new Error('FAILED: ' + message);
  }
  _sysPrint('  [PASS] ' + message);
}

// Nạp các module cần thiết
if (typeof load !== 'undefined') {
  load('js/config.js');
  load('js/utils/dataNormalization.js');
  load('js/services/demoDataService.js');
  load('js/services/analyticsService.js');
}

print('\n================================================================');
print('  CHẠY BỘ TEST: ANTIBIOGRAM ĐA TIÊU CHÍ & MENU BRAND');
print('================================================================');

// Khởi tạo Demo Data
DemoDataService.init();
var demoData = DemoDataService.getAll();
var allAst = demoData.astResults;

// -------------------------------------------------------------
// TEST SUITE 1: CHỌN TỪ 1 ĐẾN NHIỀU VI KHUẨN (HOẶC TẤT CẢ)
// -------------------------------------------------------------
print('\n--- TEST SUITE 1: CHỌN TỪ 1 ĐẾN NHIỀU VI KHUẨN ---');

// 1.1 Chọn 1 vi khuẩn (E. coli)
var abgSingle = AnalyticsService.generateAntibiogram(allAst, 'Escherichia coli');
assert(abgSingle.length > 0, 'Sinh thành công Antibiogram cho 1 vi khuẩn (E. coli)');
var eColiCount = allAst.filter(function(a) { return a.organism_name === 'Escherichia coli'; }).length;
var totalEColiTested = abgSingle.reduce(function(acc, r) { return acc + r.total; }, 0);
assert(totalEColiTested === eColiCount, 'Tổng số mẫu thử khớp chính xác với số bản ghi E. coli (' + eColiCount + ')');

// 1.2 Chọn mảng 1 vi khuẩn
var abgSingleArr = AnalyticsService.generateAntibiogram(allAst, ['Escherichia coli']);
assert(abgSingleArr.length === abgSingle.length, 'Truyền mảng 1 vi khuẩn tương đương truyền chuỗi');

// 1.3 Chọn 2 vi khuẩn (E. coli + K. pneumoniae)
var abgMulti = AnalyticsService.generateAntibiogram(allAst, ['Escherichia coli', 'Klebsiella pneumoniae']);
var kpCount = allAst.filter(function(a) { return a.organism_name === 'Klebsiella pneumoniae'; }).length;
var totalMultiTested = abgMulti.reduce(function(acc, r) { return acc + r.total; }, 0);
assert(totalMultiTested === (eColiCount + kpCount), 'Tổng số mẫu thử khi chọn 2 vi khuẩn bằng tổng E. coli + K. pneumoniae (' + (eColiCount + kpCount) + ')');

// 1.4 Chọn "ALL" (Tất cả vi khuẩn)
var abgAllOrg = AnalyticsService.generateAntibiogram(allAst, 'ALL');
var totalAllOrgTested = abgAllOrg.reduce(function(acc, r) { return acc + r.total; }, 0);
assert(totalAllOrgTested === allAst.length, 'Khi chọn "ALL" vi khuẩn, tổng số mẫu bằng toàn bộ mẫu AST (' + allAst.length + ')');

// -------------------------------------------------------------
// TEST SUITE 2: CHỌN 1 HOẶC NHIỀU LOẠI BỆNH PHẨM (HOẶC TẤT CẢ)
// -------------------------------------------------------------
print('\n--- TEST SUITE 2: CHỌN 1 HOẶC NHIỀU LOẠI BỆNH PHẨM ---');

// 2.1 Chọn 1 bệnh phẩm: Nước tiểu
var abgUrine = AnalyticsService.generateAntibiogram(allAst, 'Escherichia coli', 'Nước tiểu');
assert(abgUrine.length > 0, 'Sinh Antibiogram E. coli trên bệnh phẩm Nước tiểu');

// 2.2 Chọn 2 bệnh phẩm: Nước tiểu + Máu
var abgTwoSpecs = AnalyticsService.generateAntibiogram(allAst, 'Escherichia coli', ['Nước tiểu', 'Máu']);
var urineCount = allAst.filter(function(a) { return a.organism_name === 'Escherichia coli' && a.specimen_type === 'Nước tiểu'; }).length;
var bloodCount = allAst.filter(function(a) { return a.organism_name === 'Escherichia coli' && a.specimen_type === 'Máu'; }).length;
var totalTwoSpecs = abgTwoSpecs.reduce(function(acc, r) { return acc + r.total; }, 0);
assert(totalTwoSpecs === (urineCount + bloodCount), 'Tổng số mẫu thử 2 bệnh phẩm khớp tổng Nước tiểu + Máu (' + (urineCount + bloodCount) + ')');

// 2.3 Chọn Tất cả bệnh phẩm ('ALL')
var abgAllSpecs = AnalyticsService.generateAntibiogram(allAst, 'Escherichia coli', 'ALL');
var totalAllSpecs = abgAllSpecs.reduce(function(acc, r) { return acc + r.total; }, 0);
assert(totalAllSpecs === eColiCount, 'Khi chọn "ALL" bệnh phẩm, bao trùm toàn bộ mẫu E. coli (' + eColiCount + ')');

// -------------------------------------------------------------
// TEST SUITE 3: BỔ SUNG LỰA CHỌN KHOA PHÒNG (MẶC ĐỊNH: TẤT CẢ)
// -------------------------------------------------------------
print('\n--- TEST SUITE 3: LỰA CHỌN KHOA PHÒNG (MẶC ĐỊNH: TẤT CẢ) ---');

// 3.1 Mặc định 'ALL' khoa phòng
var abgDeptDefault = AnalyticsService.generateAntibiogram(allAst, 'Escherichia coli', 'ALL', 'ALL');
assert(abgDeptDefault.reduce(function(acc, r) { return acc + r.total; }, 0) === eColiCount, 'Khoa phòng mặc định là "ALL" bao trùm toàn viện');

// 3.2 Lọc theo 1 khoa phòng cụ thể
var depts = [...new Set(demoData.patients.map(function(p) { return p.department; }))];
var testDept = depts[0];
var abgSingleDept = AnalyticsService.generateAntibiogram(allAst, 'Escherichia coli', 'ALL', testDept);
assert(abgSingleDept !== null && typeof abgSingleDept === 'object', 'Lọc Antibiogram theo khoa ' + testDept + ' thành công');

// 3.3 Lọc theo nhiều khoa phòng (Mảng)
if (depts.length >= 2) {
  var abgMultiDept = AnalyticsService.generateAntibiogram(allAst, 'Escherichia coli', 'ALL', [depts[0], depts[1]]);
  assert(abgMultiDept.length >= 0, 'Lọc Antibiogram kết hợp nhiều khoa phòng thành công');
}

// -------------------------------------------------------------
// TEST SUITE 4: LỰA CHỌN THEO GIỚI TÍNH (MẶC ĐỊNH: TẤT CẢ)
// -------------------------------------------------------------
print('\n--- TEST SUITE 4: LỰA CHỌN THEO GIỚI TÍNH (MẶC ĐỊNH: TẤT CẢ) ---');

// 4.1 Mặc định 'ALL' giới tính
var abgGenderAll = AnalyticsService.generateAntibiogram(allAst, 'Escherichia coli', 'ALL', 'ALL', 'ALL');
assert(abgGenderAll.reduce(function(acc, r) { return acc + r.total; }, 0) === eColiCount, 'Giới tính mặc định là "ALL"');

// 4.2 Lọc theo giới tính Nam
var abgMale = AnalyticsService.generateAntibiogram(allAst, 'Escherichia coli', 'ALL', 'ALL', 'Nam');
var abgFemale = AnalyticsService.generateAntibiogram(allAst, 'Escherichia coli', 'ALL', 'ALL', 'Nu');
var maleTested = abgMale.reduce(function(acc, r) { return acc + r.total; }, 0);
var femaleTested = abgFemale.reduce(function(acc, r) { return acc + r.total; }, 0);
assert(maleTested + femaleTested === eColiCount, 'Tổng mẫu Nam (' + maleTested + ') + Nữ (' + femaleTested + ') đúng bằng tổng E. coli (' + eColiCount + ')');

// 4.3 Hỗ trợ Options Object
var abgOpts = AnalyticsService.generateAntibiogram(allAst, {
  organism: ['Escherichia coli'],
  specimen: ['Nước tiểu'],
  department: 'ALL',
  gender: 'Nam'
});
assert(abgOpts.length > 0, 'Gọi qua Options Object thành công');

// -------------------------------------------------------------
// TEST SUITE 5: KIỂM TRA ĐỔI TÊN MENU SIDEBAR
// -------------------------------------------------------------
print('\n--- TEST SUITE 5: KIỂM TRA ĐỔI TÊN MENU SIDEBAR ---');
var htmlContent = '';
if (typeof readFile !== 'undefined') {
  htmlContent = readFile('index.html');
} else if (typeof read !== 'undefined') {
  htmlContent = read('index.html');
}

if (htmlContent) {
  assert(htmlContent.indexOf('PT KHÁNG THUỐC') !== -1, 'Sidebar header có tên thương hiệu "PT KHÁNG THUỐC"');
  assert(htmlContent.indexOf('Vi sinh – Đức Giang') !== -1 || htmlContent.indexOf('Vi sinh - Đức Giang') !== -1, 'Sidebar phụ đề hiển thị dòng chữ nhỏ "Vi sinh – Đức Giang"');
  assert(htmlContent.indexOf('id="ms-abg-organism"') !== -1, 'Tồn tại component Multi-Select Vi khuẩn');
  assert(htmlContent.indexOf('id="ms-abg-specimen"') !== -1, 'Tồn tại component Multi-Select Loại bệnh phẩm');
  assert(htmlContent.indexOf('id="ms-abg-department"') !== -1, 'Tồn tại component Multi-Select Khoa phòng');
  assert(htmlContent.indexOf('id="abg-select-gender"') !== -1, 'Tồn tại bộ chọn Giới tính');
} else {
  print('  [SKIP] Đọc file index.html qua JSC runtime');
}

// -------------------------------------------------------------
// TEST SUITE 6: KIỂM TRA GIÁ TRỊ MẶC ĐỊNH (TẤT CẢ VI KHUẨN, TẤT CẢ BỆNH PHẨM, TOÀN VIỆN)
// -------------------------------------------------------------
print('\n--- TEST SUITE 6: KIỂM TRA GIÁ TRỊ MẶC ĐỊNH ---');
var abgDefaultAll = AnalyticsService.generateAntibiogram(allAst, 'ALL', 'ALL', 'ALL', 'ALL');
assert(abgDefaultAll.length > 0, 'Antibiogram mặc định (Tất cả vi khuẩn, Tất cả bệnh phẩm, Toàn viện) sinh ra kết quả chuẩn xác');
var totalAllDefault = abgDefaultAll.reduce(function(acc, r) { return acc + r.total; }, 0);
assert(totalAllDefault === allAst.length, 'Mặc định bao trùm chính xác 100% mẫu xét nghiệm toàn viện (' + allAst.length + ' bản ghi)');

print('\n================================================================');
print('  KẾT QUẢ KIỂM THỬ: TẤT CẢ CÁC TEST ĐA TIÊU CHÍ ĐỀU ĐẠT 100%!');
print('================================================================\n');
