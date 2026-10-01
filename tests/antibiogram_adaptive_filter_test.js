/**
 * ANTIBIOGRAM MULTI-CRITERIA & ADAPTIVE FILTER TEST SUITE (JSC COMPATIBLE)
 * Kiểm tra triệt để yêu cầu:
 * "phân tích tính hình kháng sinh đồ của của vi khuẩn lựa chọn theo 'Loại bệnh phẩm', theo 'Khoa phòng'.
 * Ví dụ: tôi chọn vi khuẩn Streptococcuapneumoniae, chọn loại bệnh phẩm là Dịch tỵ hầu,
 * chọn khoa phòng là khoa Sơ sinh thì lập tức phải lấy dữ liệu theo các thông tin đó để phân tích."
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
MockElement.prototype.appendChild = function(child) { this.children.push(child); };
MockElement.prototype.addEventListener = function(evt, fn) {
  if (!this.listeners[evt]) this.listeners[evt] = [];
  this.listeners[evt].push(fn);
};
MockElement.prototype.querySelector = function(sel) {
  if (sel.indexOf('input') !== -1) return new MockElement('chk', 'input');
  return new MockElement('inner');
};
MockElement.prototype.querySelectorAll = function(sel) {
  return this.children;
};
MockElement.prototype.getContext = function() {
  return {
    canvas: {},
    clearRect: function() {},
    fillRect: function() {}
  };
};

var _domStore = {};
var document = {
  getElementById: function(id) {
    if (!_domStore[id]) _domStore[id] = new MockElement(id);
    return _domStore[id];
  },
  createElement: function(tag) {
    return new MockElement('gen-' + Math.random(), tag);
  },
  addEventListener: function() {},
  querySelectorAll: function() { return []; }
};
window.document = document;

var Toast = {
  success: function() {},
  info: function() {},
  error: function() {}
};
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
print('  CHẠY BỘ TEST: PHÂN TÍCH ANTIBIOGRAM THEO ĐA TIÊU CHÍ KẾT HỢP');
print('================================================================');

DemoDataService.init();
var allData = DemoDataService.getAll();

var App = {
  state: {
    surveillanceData: allData,
    filters: { file: 'ĐG Dương tính (010126. 230626).xls' }
  },
  getActiveAstRecords: function() {
    var f = this.state.filters.file;
    if (!f || f === 'ALL') return allData.astResults;
    return allData.astResults.filter(function(a) {
      return a.file_name === f;
    });
  }
};
window.App = App;

AntibiogramView.populateDropdowns();

// TEST 1: Kiểm tra trích xuất dropdowns
print('\n--- TEST 1: TRÍCH XUẤT DANH SÁCH BỘ LỌC TỪ CƠ SỞ DỮ LIỆU ---');
assert(AntibiogramView.state.availableOrganisms.length > 0, 'Tìm thấy ' + AntibiogramView.state.availableOrganisms.length + ' loài vi khuẩn');
assert(AntibiogramView.state.availableSpecimens.length > 0, 'Tìm thấy ' + AntibiogramView.state.availableSpecimens.length + ' loại bệnh phẩm');
assert(AntibiogramView.state.availableDepartments.length > 0, 'Tìm thấy ' + AntibiogramView.state.availableDepartments.length + ' khoa phòng');

// TEST 2: Test đúng ví dụ của người dùng: S. pneumoniae + Dịch tỵ hầu + Khoa Sơ sinh
print('\n--- TEST 2: VÍ DỤ NGƯỜI DÙNG: S. PNEUMONIAE + DỊCH TỴ HẦU + KHOA SƠ SINH ---');
AntibiogramView.state.selectedOrganisms = new Set(['Streptococcus pneumoniae']);
AntibiogramView.state.selectedSpecimens = new Set(['Dịch tỵ hầu']);
AntibiogramView.state.selectedDepartments = new Set(['Khoa Sơ sinh']);
AntibiogramView.state.selectedYear = 'ALL';

var rows1 = AnalyticsService.generateAntibiogram(
  App.getActiveAstRecords(),
  Array.from(AntibiogramView.state.selectedOrganisms),
  Array.from(AntibiogramView.state.selectedSpecimens),
  Array.from(AntibiogramView.state.selectedDepartments),
  'ALL',
  'ALL'
);

assert(rows1.length === 19, 'Phân tích thành công 19 loại kháng sinh riêng biệt (tách riêng peng02-05, CTX02-03, CRO02-03) cho S. pneumoniae tại Khoa Sơ sinh / Dịch tỵ hầu');
var penRows = rows1.filter(function(r) { return r.code.indexOf('peng') === 0; });
assert(penRows.length === 4, 'Tách đủ 4 biến thể Penicillin G riêng biệt (peng02, peng03, peng04, peng05): ' + penRows.map(function(r){return r.code;}).join(', '));
var ctxRows = rows1.filter(function(r) { return r.code.indexOf('CTX') === 0; });
assert(ctxRows.length === 2, 'Tách đủ 2 biến thể Cefotaxime riêng biệt (CTX02, CTX03): ' + ctxRows.map(function(r){return r.code;}).join(', '));

// TEST 3: Typo tolerance: Streptococcuapneumoniae (viết liền có chữ a như prompt)
print('\n--- TEST 3: CHỐNG LỖI CHÍNH TẢ & DÍNH CHỮ: "Streptococcuapneumoniae" ---');
var normTypo = DataNormalization.normalizeOrganism('Streptococcuapneumoniae');
assert(normTypo.name === 'Streptococcus pneumoniae', 'Tự động nhận diện "Streptococcuapneumoniae" thành "Streptococcus pneumoniae"');

var rowsTypo = AnalyticsService.generateAntibiogram(
  App.getActiveAstRecords(),
  ['Streptococcuapneumoniae'],
  ['Dịch tỵ hầu'],
  ['Khoa Sơ sinh'],
  'ALL',
  'ALL'
);
assert(rowsTypo.length === 19, 'Vẫn phân tích thành công 19 kháng sinh riêng biệt dù người dùng nhập dính chữ');

// TEST 4: Đảm bảo các bộ lọc được tôn trọng khi người dùng chọn kết hợp, không bị xóa mất
print('\n--- TEST 4: TÔN TRỌNG CÁC LỰA CHỌN ĐA TIÊU CHÍ (KHÔNG TỰ Ý WIPE BỘ LỌC) ---');
AntibiogramView.state.selectedOrganisms = new Set(['Staphylococcus aureus']);
AntibiogramView.handleFilterChanged('selectedOrganisms');
assert(AntibiogramView.state.selectedOrganisms.has('Staphylococcus aureus'), 'Vi khuẩn S. aureus được giữ nguyên');
assert(AntibiogramView.state.selectedSpecimens.has('Dịch tỵ hầu'), 'Bệnh phẩm Dịch tỵ hầu không bị xóa');
assert(AntibiogramView.state.selectedDepartments.has('Khoa Sơ sinh'), 'Khoa Sơ sinh không bị xóa');

var rowsAureus = AnalyticsService.generateAntibiogram(
  App.getActiveAstRecords(),
  Array.from(AntibiogramView.state.selectedOrganisms),
  Array.from(AntibiogramView.state.selectedSpecimens),
  Array.from(AntibiogramView.state.selectedDepartments),
  'ALL',
  'ALL'
);
assert(rowsAureus.length > 20, 'S. aureus tại Khoa Sơ sinh / Dịch tỵ hầu có ' + rowsAureus.length + ' loại kháng sinh');

// TEST 5: Gợi ý thông minh khi gặp tổ hợp không có mẫu trong thực tế
print('\n--- TEST 5: GỢI Ý THÔNG MINH KHI TỔ HỢP 0 MẪU (S. aureus + Khoa Sơ sinh + Biểu bì da) ---');
AntibiogramView.state.selectedOrganisms = new Set(['Staphylococcus aureus']);
AntibiogramView.state.selectedSpecimens = new Set(['Biểu bì da']);
AntibiogramView.state.selectedDepartments = new Set(['Khoa Sơ sinh']);

AntibiogramView.renderAntibiogram();
var banner = document.getElementById('abg-adaptive-banner');
assert(banner.style.display !== 'none', 'Banner hướng dẫn hiển thị khi tổ hợp không có mẫu');
assert(banner.innerHTML.indexOf('Khoa Sơ sinh') !== -1, 'Banner thông báo rõ tên khoa');
assert(banner.innerHTML.indexOf('Dịch tỵ hầu') !== -1, 'Banner gợi ý bệnh phẩm thực tế có mẫu (Dịch tỵ hầu)');

// TEST 6: Giá trị mặc định sau Reset
print('\n--- TEST 6: KIỂM TRA GIÁ TRỊ MẶC ĐỊNH SAU RESET ---');
AntibiogramView.resetFilters();
assert(AntibiogramView.state.selectedYear === 'ALL', 'Năm mặc định là ALL');
assert(AntibiogramView.state.selectedOrganisms.has('ALL'), 'Vi khuẩn mặc định là ALL');
assert(AntibiogramView.state.selectedSpecimens.has('ALL'), 'Bệnh phẩm mặc định là ALL');
assert(AntibiogramView.state.selectedDepartments.has('ALL'), 'Khoa phòng mặc định là ALL');

print('\n================================================================');
print('  ✔ TOÀN BỘ CÁC BÀI TEST PHÂN TÍCH ĐA TIÊU CHÍ ĐỀU ĐẠT 100%!');
print('================================================================\n');
