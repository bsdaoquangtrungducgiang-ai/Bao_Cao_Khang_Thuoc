/**
 * TEST 18: KIỂM THỬ GỠ BỎ HEADING, CHUYỂN USER/LOGOUT VÀO SIDEBAR FOOTER, VÀ BỔ SUNG PHÂN TÍCH AI ANTIBIOGRAM
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
  this.scrollIntoView = function() {};
  this.querySelectorAll = function(sel) {
    return [];
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
        getOrCreateEl('btn-mode-chart'),
        getOrCreateEl('btn-mode-ai')
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
print('  CHẠY BỘ TEST 18: GỠ BỎ HEADING, USER SIDEBAR & PHÂN TÍCH AI ANTIBIOGRAM');
print('================================================================\n');

// 1. Kiểm tra cấu trúc viewMode hỗ trợ mode 'ai'
assert(typeof AntibiogramView.setViewMode === 'function', 'AntibiogramView.setViewMode sẵn sàng');
var secTable = getOrCreateEl('abg-section-table');
var secChart = getOrCreateEl('abg-section-chart');
var secAi = getOrCreateEl('abg-section-ai');

AntibiogramView.setViewMode('ai');
assert(AntibiogramView.state.viewMode === 'ai', 'Chuyển sang chế độ chỉ xem Phân tích AI');
assert(secTable.style.display === 'none', 'Khối Bảng ẩn trong mode AI');
assert(secChart.style.display === 'none', 'Khối Biểu đồ ẩn trong mode AI');
assert(secAi.style.display === 'block', 'Khối Phân tích AI hiển thị (display: block)');

AntibiogramView.setViewMode('both');
assert(AntibiogramView.state.viewMode === 'both', 'Chuyển về hiển thị đầy đủ');
assert(secTable.style.display === 'block', 'Bảng hiển thị');
assert(secChart.style.display === 'block', 'Biểu đồ hiển thị');
assert(secAi.style.display === 'block', 'Phân tích AI hiển thị');

// 2. Kiểm tra phương thức renderAIAnalysis
assert(typeof AntibiogramView.renderAIAnalysis === 'function', 'AntibiogramView.renderAIAnalysis sẵn sàng hoạt động');

var aiContainer = getOrCreateEl('abg-ai-content-body');

// 2.1 Test khi mảng rỗng
AntibiogramView.renderAIAnalysis([]);
assert(aiContainer.innerHTML.indexOf('Chưa Có Dữ Liệu Kháng Sinh') !== -1, 'Hiển thị thông báo khi chưa có dữ liệu');

// 2.2 Test phân tích chủng Acinetobacter kháng Carbapenem (CRAB)
AntibiogramView.state.selectedOrganisms = new Set(['Acinetobacter baumannii']);
AntibiogramView.state.selectedSpecimens = new Set(['Đờm']);
AntibiogramView.state.selectedDepartments = new Set(['Hồi sức tích cực']);

var mockCrabRows = [
  { code: 'MEM', name: 'Meropenem', sRate: 7.6, iRate: 0.0, rRate: 92.4, sCount: 20, iCount: 0, rCount: 244, total: 264 },
  { code: 'IPM', name: 'Imipenem', sRate: 9.1, iRate: 0.0, rRate: 90.9, sCount: 24, iCount: 0, rCount: 240, total: 264 },
  { code: 'CST', name: 'Colistin', sRate: 98.5, iRate: 0.0, rRate: 1.5, sCount: 197, iCount: 0, rCount: 3, total: 200 },
  { code: 'AMK', name: 'Amikacin', sRate: 25.0, iRate: 5.0, rRate: 70.0, sCount: 50, iCount: 10, rCount: 140, total: 200 },
  { code: 'SAM', name: 'Ampicillin/Sulbactam', sRate: 35.0, iRate: 10.0, rRate: 55.0, sCount: 70, iCount: 20, rCount: 110, total: 200 }
];

AntibiogramView.renderAIAnalysis(mockCrabRows);
assert(aiContainer.innerHTML.indexOf('BÁO ĐỘNG ĐỎ') !== -1, 'AI phát hiện mức độ nguy hiểm: Báo Động Đỏ cho CRAB');
assert(aiContainer.innerHTML.indexOf('Colistin') !== -1, 'AI khuyến nghị kháng sinh ưu tiên Colistin (%S cao)');
assert(aiContainer.innerHTML.indexOf('CST (98.5%)') !== -1, 'Hiển thị kháng sinh nhạy nhất CST 98.5%');
assert(aiContainer.innerHTML.indexOf('MEM (92.4%)') !== -1, 'Hiển thị kháng cao nhất MEM 92.4%');
assert(aiContainer.innerHTML.indexOf('Ampicillin/Sulbactam') !== -1, 'AI đưa ra khuyến cáo phối hợp Ampicillin/Sulbactam liều cao cho A. baumannii');
assert(aiContainer.innerHTML.indexOf('Cách ly tiếp xúc') !== -1, 'AI đề xuất quy trình cách ly tiếp xúc phòng lây nhiễm chéo');

// 2.3 Test phân tích S. aureus kháng Methicillin (MRSA)
AntibiogramView.state.selectedOrganisms = new Set(['Staphylococcus aureus']);
AntibiogramView.state.selectedSpecimens = new Set(['Mủ']);
AntibiogramView.state.selectedDepartments = new Set(['Ngoại']);

var mockMrsaRows = [
  { code: 'FOX', name: 'Cefoxitin', sRate: 21.4, iRate: 0.0, rRate: 78.6, sCount: 30, iCount: 0, rCount: 110, total: 140 },
  { code: 'VA', name: 'Vancomycin', sRate: 100.0, iRate: 0.0, rRate: 0.0, sCount: 140, iCount: 0, rCount: 0, total: 140 },
  { code: 'LZD', name: 'Linezolid', sRate: 100.0, iRate: 0.0, rRate: 0.0, sCount: 140, iCount: 0, rCount: 0, total: 140 },
  { code: 'OX', name: 'Oxacillin', sRate: 21.4, iRate: 0.0, rRate: 78.6, sCount: 30, iCount: 0, rCount: 110, total: 140 }
];

AntibiogramView.renderAIAnalysis(mockMrsaRows);
assert(aiContainer.innerHTML.indexOf('MRSA') !== -1, 'AI nhận diện chính xác chủng MRSA');
assert(aiContainer.innerHTML.indexOf('Vancomycin') !== -1, 'AI khuyến nghị thuốc chủ lực Vancomycin cho MRSA');
assert(aiContainer.innerHTML.indexOf('Linezolid') !== -1, 'AI khuyến nghị thuốc Linezolid');
assert(aiContainer.innerHTML.indexOf('Daptomycin') !== -1, 'AI ghi nhận lưu ý về Daptomycin');

// 3. Kiểm tra các hàm hỗ trợ
assert(typeof AntibiogramView.openFullAIAssistantForAntibiogram === 'function', 'Hàm mở trợ lý AI Antibiogram sẵn sàng');
assert(typeof AntibiogramView.copyAIAnalysisToClipboard === 'function', 'Hàm sao chép phân tích AI sẵn sàng');

print('\n================================================================');
print('  ✔ TOÀN BỘ CÁC TIÊU CHÍ TEST 18 ĐỀU ĐẠT 100%!');
print('================================================================\n');
