/**
 * ANTIBIOGRAM 63 ANTIBIOTICS SEPARATION TEST SUITE (JSC COMPATIBLE)
 * Kiểm tra triệt để yêu cầu của người dùng:
 * "Mục antibiogram: khi chọn phân tích kháng sinh yêu cầu tách đủ 63 loại kháng sinh theo danh sách.
 * Đặc biệt lưu ý không gộp các kháng sinh như peng 01, peng02, peng 03, peng 04 thành 1 là PEN
 * hoặc như CTX01, CTX02, CTX03 thành CTX mà phải tách thành các hàng báo cáo riêng lẻ
 * vì mục đích điều trị của các kháng sinh này là khác nhau"
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
  var window = (typeof globalThis !== 'undefined') ? globalThis : this;
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

// Mock DOM
function MockElement(id, tag) {
  this.id = id;
  this.tagName = (tag || 'DIV').toUpperCase();
  this.style = {};
  this.innerHTML = '';
  this.textContent = '';
  this.value = '';
  this.children = [];
  var self = this;
  this.classList = {
    _set: {},
    add: function(c) { self.classList._set[c] = true; },
    remove: function(c) { delete self.classList._set[c]; },
    toggle: function(c, force) {
      if (force === undefined) {
        if (self.classList._set[c]) delete self.classList._set[c];
        else self.classList._set[c] = true;
      } else if (force) {
        self.classList._set[c] = true;
      } else {
        delete self.classList._set[c];
      }
    },
    contains: function(c) { return !!self.classList._set[c]; }
  };
  this.listeners = {};
  this.attributes = {};
}
MockElement.prototype.setAttribute = function(k, v) { this.attributes[k] = v; };
MockElement.prototype.getAttribute = function(k) { return this.attributes[k] || null; };
MockElement.prototype.addEventListener = function(evt, fn) {
  if (!this.listeners[evt]) this.listeners[evt] = [];
  this.listeners[evt].push(fn);
};
MockElement.prototype.appendChild = function(child) { this.children.push(child); };
MockElement.prototype.querySelector = function(sel) {
  if (sel.indexOf('input') !== -1) return new MockElement('chk', 'input');
  return new MockElement('inner');
};
MockElement.prototype.querySelectorAll = function(sel) { return this.children; };
MockElement.prototype.getContext = function() {
  return { canvas: {}, clearRect: function() {}, fillRect: function() {} };
};

var _domStore = {};
var document = {
  getElementById: function(id) {
    if (!_domStore[id]) _domStore[id] = new MockElement(id);
    return _domStore[id];
  },
  createElement: function(tag) { return new MockElement('gen-' + Math.random(), tag); },
  addEventListener: function() {},
  querySelectorAll: function() { return []; }
};
window.document = document;

var Toast = { success: function() {}, info: function() {}, error: function() {} };
window.Toast = Toast;

// Nạp các script
if (typeof load !== 'undefined') {
  load('js/config.js');
  load('js/utils/dataNormalization.js');
  load('js/utils/dataValidation.js');
  load('js/data/hospitalCsvData.js');
  load('js/services/importService.js');
  load('js/services/demoDataService.js');
  load('js/services/analyticsService.js');
  load('js/components/antibiogramView.js');
}

print('\n================================================================');
print('  CHẠY BỘ TEST: PHÂN TÍCH ĐỦ 63 KHÁNG SINH & KHÔNG GỘP BIẾN THỂ');
print('================================================================');

// TEST 1: Kiểm tra Danh mục 63 Kháng sinh chuẩn bệnh viện
print('\n--- TEST 1: KIỂM TRA DANH MỤC 63 KHÁNG SINH CHUẨN ĐỨC GIANG ---');
var catalog = DataNormalization.antibioticCatalog;
assert(Array.isArray(catalog), 'Danh mục antibioticCatalog tồn tại dưới dạng mảng');
assert(catalog.length === 63, 'Danh mục có chính xác 63 loại kháng sinh (hiện có: ' + catalog.length + ')');

// Kiểm tra STT từ 1 đến 63
for (var i = 0; i < 63; i++) {
  var item = catalog[i];
  assert(item.stt === (i + 1), 'Mục thứ ' + (i + 1) + ' có STT chính xác là ' + (i + 1) + ' (' + item.code + ')');
  assert(item.code && item.code.length > 0, 'Kháng sinh STT ' + item.stt + ' có mã hợp lệ: ' + item.code);
  assert(item.name && item.name.length > 0, 'Kháng sinh STT ' + item.stt + ' có tên: ' + item.name);
  assert(item.indication && item.indication.length > 0, 'Kháng sinh STT ' + item.stt + ' có phiên giải dùng: ' + item.indication);
}

// TEST 2: Kiểm tra việc TÁCH RIÊNG từng biến thể lâm sàng (KHÔNG ĐƯỢC GỘP)
print('\n--- TEST 2: KIỂM TRA TÁCH BIỆT CÁC BIẾN THỂ LÂM SÀNG (KHÔNG GỘP MÃ) ---');

// Nhóm Penicillin G: peng02 đến peng05 và peng trong catalog, cộng peng01
var penVariants = ['peng02', 'peng03', 'peng04', 'peng05', 'peng'];
penVariants.forEach(function(code) {
  var norm = DataNormalization.normalizeAntibiotic(code);
  assert(norm === code, 'Kháng sinh ' + code + ' KHÔNG bị gộp thành PEN, giữ nguyên mã: ' + norm);
  var catItem = catalog.find(function(c) { return c.code === code; });
  assert(catItem && catItem.indication.length > 0, 'Kháng sinh ' + code + ' có chỉ định rõ: ' + (catItem ? catItem.indication : 'N/A'));
});
assert(DataNormalization.normalizeAntibiotic('peng01') === 'peng01', 'peng01 không bị gộp thành PEN');

// Nhóm Cefotaxime: CTX, CTX02, CTX03 trong catalog, cộng CTX01
var ctxVariants = ['CTX', 'CTX02', 'CTX03'];
ctxVariants.forEach(function(code) {
  var norm = DataNormalization.normalizeAntibiotic(code);
  assert(norm === code, 'Kháng sinh ' + code + ' KHÔNG bị gộp thành CTX chung, giữ nguyên mã: ' + norm);
  var catItem = catalog.find(function(c) { return c.code === code; });
  assert(catItem && catItem.indication.length > 0, 'Kháng sinh ' + code + ' có chỉ định rõ: ' + (catItem ? catItem.indication : 'N/A'));
});
assert(DataNormalization.normalizeAntibiotic('CTX01') === 'CTX01', 'CTX01 không bị gộp mất đuôi số');

// Nhóm Ceftriaxone: CRO, CRO02, CRO03 trong catalog, cộng CRO01
var croVariants = ['CRO', 'CRO02', 'CRO03'];
croVariants.forEach(function(code) {
  var norm = DataNormalization.normalizeAntibiotic(code);
  assert(norm === code, 'Kháng sinh ' + code + ' KHÔNG bị gộp thành CRO chung, giữ nguyên mã: ' + norm);
  var catItem = catalog.find(function(c) { return c.code === code; });
  assert(catItem && catItem.indication.length > 0, 'Kháng sinh ' + code + ' có chỉ định rõ: ' + (catItem ? catItem.indication : 'N/A'));
});
assert(DataNormalization.normalizeAntibiotic('CRO01') === 'CRO01', 'CRO01 không bị gộp mất đuôi số');

// Oxacillin & Oxacillin Screen Test
var oxsfNorm = DataNormalization.normalizeAntibiotic('oxsf');
var oxaNorm = DataNormalization.normalizeAntibiotic('OXA');
assert(oxsfNorm === 'oxsf', 'oxsf (Oxacillin screen test) tách riêng mã oxsf');
assert(oxaNorm === 'OXA', 'OXA (Oxacillin) tách riêng mã OXA');

// Inducible Clindamycin Resistance (D-test)
var icrNorm = DataNormalization.normalizeAntibiotic('icr');
assert(icrNorm === 'icr', 'icr (Inducible clindamycin resistance) tách riêng mã icr');

// TEST 3: Phân tích Antibiogram trên dữ liệu thực tế giữ nguyên đủ các dòng riêng lẻ
print('\n--- TEST 3: PHÂN TÍCH ANTIBIOGRAM TRÊN DỮ LIỆU THỰC TẾ ---');
DemoDataService.init();
var allData = DemoDataService.getAll();
var hospitalAst = allData.astResults.filter(function(a) {
  return a.file_name === 'ĐG Dương tính (010126. 230626).xls';
});
assert(hospitalAst.length > 0, 'Tìm thấy ' + hospitalAst.length + ' bản ghi AST thực tế từ bệnh viện');

// Phân tích toàn bộ vi khuẩn
var fullAbg = AnalyticsService.generateAntibiogram(
  hospitalAst,
  'ALL',
  'ALL',
  'ALL',
  'ALL',
  'ALL',
  'ALL'
);

assert(fullAbg.length >= 60, 'Số lượng kháng sinh phân tích được: ' + fullAbg.length + ' dòng riêng biệt');

// Kiểm tra các dòng riêng biệt xuất hiện trong kết quả phân tích
var peng02Row = fullAbg.find(function(r) { return r.code === 'peng02'; });
var peng03Row = fullAbg.find(function(r) { return r.code === 'peng03'; });
var peng04Row = fullAbg.find(function(r) { return r.code === 'peng04'; });
var peng05Row = fullAbg.find(function(r) { return r.code === 'peng05'; });
assert(peng02Row, 'peng02 xuất hiện như 1 hàng riêng lẻ (Đường uống): Tổng ' + (peng02Row ? peng02Row.total : 0));
assert(peng03Row, 'peng03 xuất hiện như 1 hàng riêng lẻ (Đường tiêm ngoài MN): Tổng ' + (peng03Row ? peng03Row.total : 0));
assert(peng04Row, 'peng04 xuất hiện như 1 hàng riêng lẻ (Viêm phổi): Tổng ' + (peng04Row ? peng04Row.total : 0));
assert(peng05Row, 'peng05 xuất hiện như 1 hàng riêng lẻ (Viêm màng não): Tổng ' + (peng05Row ? peng05Row.total : 0));

var ctx02Row = fullAbg.find(function(r) { return r.code === 'CTX02'; });
var ctx03Row = fullAbg.find(function(r) { return r.code === 'CTX03'; });
assert(ctx02Row, 'CTX02 xuất hiện như 1 hàng riêng lẻ (Viêm màng não): Tổng ' + (ctx02Row ? ctx02Row.total : 0));
assert(ctx03Row, 'CTX03 xuất hiện như 1 hàng riêng lẻ (Ngoài màng não): Tổng ' + (ctx03Row ? ctx03Row.total : 0));

// TEST 4: Bộ lọc đa lựa chọn kháng sinh (targetAntibiotics)
print('\n--- TEST 4: BỘ LỌC ĐA LỰA CHỌN KHÁNG SINH (TARGET ANTIBIOTICS) ---');
var filteredAbg = AnalyticsService.generateAntibiogram(
  hospitalAst,
  'ALL',
  'ALL',
  'ALL',
  'ALL',
  'ALL',
  ['peng04', 'peng05', 'CTX02', 'MEM']
);
assert(filteredAbg.length === 4, 'Chỉ lọc ra chính xác 4 loại kháng sinh đã chọn');
var filteredCodes = filteredAbg.map(function(r) { return r.code; }).sort();
assert(
  JSON.stringify(filteredCodes) === JSON.stringify(['CTX02', 'MEM', 'peng04', 'peng05'].sort()),
  'Các mã kháng sinh lọc ra khớp chính xác: ' + filteredCodes.join(', ')
);

// TEST 5: Tích hợp với Component AntibiogramView
print('\n--- TEST 5: TÍCH HỢP GIAO DIỆN & STATE TRONG ANTIBIOGRAMVIEW ---');
var App = {
  state: {
    surveillanceData: allData,
    filters: { file: 'ĐG Dương tính (010126. 230626).xls' }
  },
  getActiveAstRecords: function() { return hospitalAst; }
};
window.App = App;

AntibiogramView.populateDropdowns();
assert(AntibiogramView.state.availableAntibiotics.length === 63, 'Dropdown Kháng Sinh hiển thị đủ 63 loại kháng sinh');
assert(AntibiogramView.state.selectedAntibiotics.has('ALL'), 'Trạng thái mặc định là Tất cả kháng sinh (Set có ALL)');

// Chọn cụ thể 2 kháng sinh
AntibiogramView.state.selectedAntibiotics = new Set(['peng04', 'peng05']);
AntibiogramView.renderAntibiogram();
assert(AntibiogramView.state.selectedAntibiotics.has('peng04'), 'Bộ chọn lưu trữ peng04');
assert(AntibiogramView.state.selectedAntibiotics.has('peng05'), 'Bộ chọn lưu trữ peng05');

// Reset bộ lọc
AntibiogramView.resetFilters();
assert(AntibiogramView.state.selectedAntibiotics.has('ALL'), 'Reset khôi phục về Tất cả kháng sinh (Set có ALL)');

// TEST 6: Cấu trúc dữ liệu xuất Excel bao gồm STT và Chỉ định điều trị
print('\n--- TEST 6: CẤU TRÚC XUẤT EXCEL CHUẨN ĐỦ 63 KHÁNG SINH VÀ CHỈ ĐỊNH ---');
var capturedExcelData = null;
var XLSX = {
  utils: {
    json_to_sheet: function(data) { capturedExcelData = data; return {}; },
    book_new: function() { return {}; },
    book_append_sheet: function() {}
  },
  writeFile: function() {}
};
window.XLSX = XLSX;

AntibiogramView.exportExcel();
assert(capturedExcelData && capturedExcelData.length === 63, 'Dữ liệu xuất Excel có đủ 63 dòng kháng sinh riêng biệt');
var firstRow = capturedExcelData[0];
assert(firstRow['STT'] === 1, 'Dòng 1 có STT = 1');
assert(firstRow['Mã kháng sinh'] === 'AM', 'Mã kháng sinh cột đầu là AM');
assert(firstRow['Phiên giải dùng (Chỉ định điều trị)'].length > 0, 'Xuất file kèm Phiên giải dùng / Chỉ định điều trị');

var pen04Excel = capturedExcelData.find(function(r) { return r['Mã kháng sinh'] === 'peng04'; });
assert(pen04Excel, 'Dữ liệu xuất Excel có dòng peng04 riêng biệt');
assert(pen04Excel['Phiên giải dùng (Chỉ định điều trị)'].indexOf('viêm phổi') !== -1, 'peng04 có chỉ định viêm phổi trong Excel');

print('\n================================================================');
print('  ✔ TOÀN BỘ CÁC BÀI TEST 63 KHÁNG SINH RIÊNG BIỆT ĐỀU ĐẠT 100%!');
print('================================================================');
