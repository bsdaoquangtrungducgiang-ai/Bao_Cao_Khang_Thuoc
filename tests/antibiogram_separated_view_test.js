/**
 * TEST SUITE: KIỂM TRA TIÊU ĐỀ ĐỎ TƯƠI & BỐ CỤC TÁCH BIỆT BẢNG - BIỂU ĐỒ ANTIBIOGRAM (JSC COMPATIBLE)
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
  window.localStorage = localStorage;
}

window.Toast = {
  success: function() {},
  error: function() {},
  info: function() {}
};

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
  this.attributes = {};
  var self = this;
  this.classList = {
    _set: {},
    add: function(c) { self.classList._set[c] = true; },
    remove: function(c) { delete self.classList._set[c]; },
    contains: function(c) { return !!self.classList._set[c]; }
  };
  this.getAttribute = function(attr) { return self.attributes[attr] || null; };
  this.setAttribute = function(attr, val) { self.attributes[attr] = val; };
  this.listeners = {};
  this.appendChild = function(child) {
    self.children.push(child);
    return child;
  };
  this.addEventListener = function(evt, handler) {
    self.listeners[evt] = handler;
  };
}

var mockElements = {};
function getOrCreateEl(id, tag) {
  if (!mockElements[id]) {
    mockElements[id] = new MockElement(id, tag);
  }
  return mockElements[id];
}

var document = {
  getElementById: function(id) {
    return getOrCreateEl(id);
  },
  createElement: function(tag) {
    return new MockElement(null, tag);
  },
  querySelectorAll: function(selector) {
    if (selector === '.btn-abg-mode') {
      return [
        getOrCreateEl('btn-mode-both'),
        getOrCreateEl('btn-mode-table'),
        getOrCreateEl('btn-mode-chart')
      ];
    }
    return [];
  }
};
window.document = document;

// Nạp các script cần thiết
if (typeof load !== 'undefined') {
  load('js/config.js');
  load('js/utils/dataNormalization.js');
  load('js/utils/dataValidation.js');
  load('js/services/analyticsService.js');
  load('js/components/antibiogramView.js');
}

print('\n================================================================');
print('  CHẠY BỘ TEST 11: TIÊU ĐỀ ĐỎ TƯƠI & TÁCH BIỆT BẢNG - BIỂU ĐỒ ANTIBIOGRAM');
print('================================================================\n');

// 1. Kiểm tra khởi tạo state hỗ trợ tách biệt và sắp xếp
assert(AntibiogramView.state.viewMode === 'both', 'Mặc định chế độ hiển thị là cả 2 (Bảng trên - Biểu đồ dưới)');
assert(AntibiogramView.state.chartSortMode === 'default', 'Mặc định sắp xếp biểu đồ theo STT chuẩn');

// 2. Kiểm tra chuyển đổi chế độ xem (View Mode Switcher)
var secTable = getOrCreateEl('abg-section-table');
var secChart = getOrCreateEl('abg-section-chart');

// Chuyển sang chỉ xem Bảng số liệu
AntibiogramView.setViewMode('table');
assert(AntibiogramView.state.viewMode === 'table', 'Chuyển sang chế độ xem Bảng');
assert(secTable.style.display === 'block', 'Khối Bảng hiển thị (display: block)');
assert(secChart.style.display === 'none', 'Khối Biểu đồ ẩn (display: none)');

// Chuyển sang chỉ xem Biểu đồ
AntibiogramView.setViewMode('chart');
assert(AntibiogramView.state.viewMode === 'chart', 'Chuyển sang chế độ xem Biểu đồ');
assert(secTable.style.display === 'none', 'Khối Bảng ẩn (display: none)');
assert(secChart.style.display === 'block', 'Khối Biểu đồ hiển thị (display: block)');

// Chuyển lại về hiển thị tách biệt cả hai
AntibiogramView.setViewMode('both');
assert(AntibiogramView.state.viewMode === 'both', 'Chuyển về hiển thị cả hai tách biệt');
assert(secTable.style.display === 'block', 'Khối Bảng hiển thị độc lập');
assert(secChart.style.display === 'block', 'Khối Biểu đồ hiển thị độc lập');

// 3. Kiểm tra tính toán Summary KPIs
var sampleRows = [
  { stt: 1, code: 'AM', name: 'Ampicillin', sRate: 15.5, iRate: 2.1, rRate: 82.4, sCount: 30, iCount: 4, rCount: 160, total: 194 },
  { stt: 2, code: 'MEM', name: 'Meropenem', sRate: 91.2, iRate: 1.5, rRate: 7.3, sCount: 250, iCount: 4, rCount: 20, total: 274 },
  { stt: 3, code: 'AMK', name: 'Amikacin', sRate: 85.0, iRate: 5.0, rRate: 10.0, sCount: 170, iCount: 10, rCount: 20, total: 200 }
];

AntibiogramView.updateSummaryKPIs(sampleRows);
var totalAbxEl = getOrCreateEl('kpi-abg-total-abx');
var maxREl = getOrCreateEl('kpi-abg-max-r');
var maxSEl = getOrCreateEl('kpi-abg-max-s');
var badgeTextEl = getOrCreateEl('abg-badge-text');

assert(totalAbxEl.textContent == 3, 'Tổng số kháng sinh KPI = 3');
assert(badgeTextEl.textContent.indexOf('3 Kháng Sinh') !== -1, 'Huy hiệu số lượng cập nhật "3 Kháng Sinh"');
assert(maxREl.textContent.indexOf('AM') !== -1 && maxREl.textContent.indexOf('82.4%') !== -1, 'Kháng cao nhất nhận diện đúng AM (82.4%)');
assert(maxSEl.textContent.indexOf('MEM') !== -1 && maxSEl.textContent.indexOf('91.2%') !== -1, 'Nhạy cao nhất nhận diện đúng MEM (91.2%)');

// 4. Kiểm tra render bảng số liệu chi tiết
var tbody = getOrCreateEl('table-abg-body', 'TBODY');
AntibiogramView.renderTable(sampleRows);
assert(tbody.children.length === 3, 'Bảng Antibiogram render đủ 3 hàng dữ liệu');

print('\n================================================================');
print('  ✔ TOÀN BỘ CÁC BÀI TEST TÁCH BIỆT BẢNG & BIỂU ĐỒ ĐỀU ĐẠT 100%!');
print('================================================================\n');
