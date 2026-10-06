/**
 * GOOGLE DRIVE & EXCEL AUTO-ARCHIVE TEST SUITE (JSC COMPATIBLE)
 * Kiểm tra triệt để yêu cầu của người dùng:
 * "Khi tôi vào mục 'Dữ liệu & Nhập liệu' và tiến hành 'Import dữ liệu' thì dữ liệu này
 * sẽ đồng thời lưu thành từng file excel lấy tên là 'số thứ tự file tăng dần, ngày tháng năm ví dụ: STT01_02102026'
 * lưu cả trên google drive vào vị trí theo đường Link này trên google drive:
 * https://drive.google.com/drive/folders/1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP trong mục '5. Webapp Actigrivity'"
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
    removeItem: function(k) { delete _storage[k]; },
    clear: function() { _storage = {}; }
  };
}
window.localStorage = localStorage;

if (typeof Blob === 'undefined') {
  var Blob = function(parts, opts) {
    this.parts = parts;
    this.type = (opts && opts.type) || '';
  };
}
window.Blob = Blob;

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
  this.listeners = {};
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
}
MockElement.prototype.setAttribute = function(k, v) { this.attributes[k] = v; };
MockElement.prototype.getAttribute = function(k) { return this.attributes[k] || null; };
MockElement.prototype.addEventListener = function(evt, fn) {
  if (!this.listeners[evt]) this.listeners[evt] = [];
  this.listeners[evt].push(fn);
};
MockElement.prototype.appendChild = function(child) { this.children.push(child); };
MockElement.prototype.querySelector = function(sel) { return new MockElement('inner'); };
MockElement.prototype.querySelectorAll = function(sel) { return this.children; };

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

var Toast = {
  success: function(msg) {},
  info: function(msg) {},
  error: function(msg) {},
  warning: function(msg) {}
};
window.Toast = Toast;

// Mock XLSX (SheetJS)
var _capturedSheets = {};
var _downloadedFiles = [];
var XLSX = {
  utils: {
    json_to_sheet: function(data) {
      return { '!data': data, '!cols': [] };
    },
    aoa_to_sheet: function(data) {
      return { '!aoa': data, '!cols': [] };
    },
    book_new: function() {
      return { SheetNames: [], Sheets: {} };
    },
    book_append_sheet: function(wb, ws, name) {
      wb.SheetNames.push(name);
      wb.Sheets[name] = ws;
      _capturedSheets[name] = ws;
    }
  },
  write: function(wb, opts) {
    return new Uint8Array([1, 2, 3, 4]);
  },
  writeFile: function(wb, fileName) {
    _downloadedFiles.push(fileName);
  }
};
window.XLSX = XLSX;

// Nạp các script
if (typeof load !== 'undefined') {
  load('js/config.js');
  load('js/utils/dataNormalization.js');
  load('js/utils/dataValidation.js');
  load('js/data/hospitalCsvData.js');
  load('js/services/googleDriveService.js');
  load('js/services/importService.js');
  load('js/services/demoDataService.js');
  load('js/components/importWizard.js');
}

print('\n================================================================');
print('  CHẠY BỘ TEST: TỰ ĐỘNG LƯU EXCEL & ĐỒNG BỘ GOOGLE DRIVE');
print('================================================================');

// TEST 1: Cấu hình Thư mục Google Drive và CONFIG
print('\n--- TEST 1: CẤU HÌNH THƯ MỤC GOOGLE DRIVE & HỆ THỐNG ---');
assert(CONFIG.GOOGLE_DRIVE.FOLDER_ID === '1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP', 'Folder ID đúng: 1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP');
assert(CONFIG.GOOGLE_DRIVE.FOLDER_NAME === '5. Webapp Actigrivity', 'Tên thư mục đúng: 5. Webapp Actigrivity');
assert(CONFIG.GOOGLE_DRIVE.FOLDER_URL === 'https://drive.google.com/drive/folders/1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP', 'URL đúng: https://drive.google.com/drive/folders/1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP');
assert(GoogleDriveService.config.FOLDER_ID === '1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP', 'GoogleDriveService cấu hình đúng Folder ID');
assert(GoogleDriveService.config.FOLDER_NAME === '5. Webapp Actigrivity', 'GoogleDriveService cấu hình đúng Folder Name');

// TEST 2: Quy tắc đặt tên file STTxx_DDMMYYYY tăng dần
print('\n--- TEST 2: QUY TẮC ĐẶT TÊN FILE TỰ ĐỘNG TĂNG DẦN (STTxx_DDMMYYYY) ---');
localStorage.removeItem('DRIVE_IMPORT_STT_COUNTER');
GoogleDriveService.setSequence(1);

// Test với ngày 02/10/2026 như trong ví dụ của người dùng
var testDate = new Date(2026, 9, 2); // Tháng 9 index là tháng 10
var dateStr = GoogleDriveService.formatDateDDMMYYYY(testDate);
assert(dateStr === '02102026', 'Định dạng ngày DDMMYYYY cho ngày 02/10/2026 là 02102026 (kết quả: ' + dateStr + ')');

var peek1 = GoogleDriveService.peekNextFileName(testDate);
assert(peek1 === 'STT01_02102026.xlsx', 'Xem trước file đầu tiên là STT01_02102026.xlsx');

// Sinh file lần 1: STT01_02102026.xlsx
var gen1 = GoogleDriveService.generateNextFileName(testDate);
assert(gen1.fileName === 'STT01_02102026.xlsx', 'Tên file lần 1: ' + gen1.fileName);
assert(gen1.stt === 'STT01', 'Mã STT lần 1: STT01');
assert(GoogleDriveService.getCurrentSequence() === 2, 'Bộ đếm tự động tăng lên 2 cho lần tiếp theo');

// Sinh file lần 2: STT02_02102026.xlsx
var gen2 = GoogleDriveService.generateNextFileName(testDate);
assert(gen2.fileName === 'STT02_02102026.xlsx', 'Tên file lần 2: ' + gen2.fileName);
assert(gen2.stt === 'STT02', 'Mã STT lần 2: STT02');
assert(GoogleDriveService.getCurrentSequence() === 3, 'Bộ đếm tự động tăng lên 3');

// Sinh file lần 3: STT03_02102026.xlsx
var gen3 = GoogleDriveService.generateNextFileName(testDate);
assert(gen3.fileName === 'STT03_02102026.xlsx', 'Tên file lần 3: ' + gen3.fileName);

// TEST 3: Khởi tạo Workbook Excel đầy đủ 2 Sheet
print('\n--- TEST 3: CẤU TRÚC WORKBOOK EXCEL (2 SHEET: DỮ LIỆU & LƯU TRỮ) ---');
var sampleRecords = [
  {
    patient_code: 'BN00101',
    patient_name: 'Nguyễn Văn Minh',
    age: 45,
    sex: 'Nam',
    department: 'Khoa Ngoại',
    specimen_type: 'Nước tiểu',
    collection_date: '2026-10-02',
    organism_name: 'Escherichia coli',
    antibiotic_code: 'MEM',
    raw_result: 'S',
    interpretation: 'S'
  },
  {
    patient_code: 'BN00102',
    patient_name: 'Trần Thị Hoa',
    age: 62,
    sex: 'Nữ',
    department: 'ICU',
    specimen_type: 'Máu',
    collection_date: '2026-10-02',
    organism_name: 'Klebsiella pneumoniae',
    antibiotic_code: 'CIP',
    raw_result: 'R',
    interpretation: 'R'
  }
];

var wb = GoogleDriveService.buildExcelWorkbook(sampleRecords, { originalFileName: 'import_raw.csv' }, 'STT01_02102026.xlsx');
assert(wb.SheetNames.length === 2, 'Workbook có đúng 2 sheet (hiện có: ' + wb.SheetNames.length + ')');
assert(wb.SheetNames[0] === 'Du_Lieu_Khang_Sinh_Do', 'Sheet 1 tên là Du_Lieu_Khang_Sinh_Do');
assert(wb.SheetNames[1] === 'Thong_Tin_Luu_Tru', 'Sheet 2 tên là Thong_Tin_Luu_Tru');

var sheet1Data = wb.Sheets['Du_Lieu_Khang_Sinh_Do']['!data'];
assert(sheet1Data && sheet1Data.length === 2, 'Sheet 1 chứa đủ 2 bản ghi AST');
assert(sheet1Data[0]['Mã bệnh nhân'] === 'BN00101', 'Bản ghi 1 có mã BN00101');
assert(sheet1Data[0]['Tên gốc kháng sinh'] === 'Meropenem', 'Mã MEM được tra cứu thành Meropenem');
assert(sheet1Data[1]['Tên gốc kháng sinh'] === 'Ciprofloxacin', 'Mã CIP được tra cứu thành Ciprofloxacin');

// TEST 4: Quy trình archiveImportDataset & Lưu trữ lịch sử
print('\n--- TEST 4: THỰC THI QUY TRÌNH ARCHIVE VÀ TẢI XUỐNG ---');
GoogleDriveService.setSequence(1);
_downloadedFiles = [];

var archiveRes = null;
// Gọi hàm archive
var promise = GoogleDriveService.archiveImportDataset(sampleRecords, {
  originalFileName: 'Du_lieu_xet_nghiem.xlsx',
  date: testDate
});

promise.then(function(res) {
  archiveRes = res;
});

if (typeof drainMicrotasks === 'function') {
  drainMicrotasks();
}

assert(archiveRes && archiveRes.success === true, 'archiveImportDataset thành công');
assert(archiveRes.fileName === 'STT01_02102026.xlsx', 'Tên file tạo ra: ' + (archiveRes ? archiveRes.fileName : 'N/A'));
assert(archiveRes.folderName === '5. Webapp Actigrivity', 'Thư mục Google Drive: ' + (archiveRes ? archiveRes.folderName : 'N/A'));
assert(archiveRes && archiveRes.folderUrl.indexOf('1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP') !== -1, 'Chứa ID thư mục Google Drive chính xác');
assert(_downloadedFiles.indexOf('STT01_02102026.xlsx') !== -1, 'File STT01_02102026.xlsx được tự động kích hoạt tải xuống');

var savedList = GoogleDriveService.getSavedArchives();
assert(savedList.length > 0, 'Lịch sử lưu trữ ghi nhận file đã tạo');
assert(savedList[0].fileName === 'STT01_02102026.xlsx', 'Bản ghi đầu tiên trong lịch sử là STT01_02102026.xlsx');

// TEST 5: Tích hợp với ImportWizard.executeCommit
print('\n--- TEST 5: TÍCH HỢP NẠP DỮ LIỆU & BƯỚC 5 TRONG WIZARD ---');
DemoDataService.init();

var wizardData = [
  {
    patient_code: 'BN999',
    patient_name: 'Bệnh Nhân Test',
    age: 30,
    sex: 'Nam',
    department: 'Khoa Cấp cứu',
    specimen_type: 'Đờm',
    collection_date: '2026-10-02',
    organism_name: 'Acinetobacter baumannii',
    antibiotic_code: 'MEM',
    raw_result: 'R',
    interpretation: 'R'
  }
];

ImportWizard.parsedData = {
  fileName: 'test_file_input.csv',
  fileType: 'csv',
  totalRows: 1
};
ImportWizard.validationResult = {
  validRecords: wizardData,
  warningRecords: [],
  warningCount: 0,
  errorCount: 0
};

// Gọi executeCommit
var commitCompleted = false;
ImportWizard.executeCommit().then(function() {
  commitCompleted = true;
});

if (typeof drainMicrotasks === 'function') {
  drainMicrotasks();
}

assert(commitCompleted, 'ImportWizard.executeCommit hoàn tất');
var savedFilenameDom = document.getElementById('drive-saved-filename');
var expectedName = 'STT02_' + GoogleDriveService.formatDateDDMMYYYY() + '.xlsx';
assert(savedFilenameDom.textContent === expectedName, 'DOM hiển thị chính xác file tiếp theo: ' + savedFilenameDom.textContent);

var reDownloaded = GoogleDriveService.redownloadLastArchive();
assert(reDownloaded === true, 'Hỗ trợ tải lại file Excel STT từ bộ nhớ cache');

// TEST 6: Cấu hình Webhook & Đồng bộ tự động Google Drive
print('\n--- TEST 6: CẤU HÌNH WEBHOOK & TÍNH NĂNG ĐỒNG BỘ ĐÁM MÂY ---');
var scriptTemplate = GoogleDriveService.getAppsScriptTemplate();
assert(scriptTemplate.indexOf('1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP') !== -1, 'Mã Google Apps Script chứa đúng Folder ID đích');
assert(scriptTemplate.indexOf('5. Webapp Actigrivity') !== -1, 'Mã Apps Script chứa đúng tên thư mục 5. Webapp Actigrivity');

assert(GoogleDriveService.hasWebhook() === false, 'Mặc định chưa cấu hình Webhook URL');
GoogleDriveService.setWebhookUrl('https://script.google.com/macros/s/AKfycbxTestDummy/exec');
assert(GoogleDriveService.hasWebhook() === true, 'Đã lưu thành công Webhook URL');
assert(GoogleDriveService.getWebhookUrl() === 'https://script.google.com/macros/s/AKfycbxTestDummy/exec', 'Lấy đúng Webhook URL đã lưu');

var badgeEl = document.getElementById('drive-sync-badge');
assert(badgeEl !== null, 'Phần tử badge đồng bộ Drive tồn tại trên DOM');

GoogleDriveService.setWebhookUrl('');
assert(GoogleDriveService.hasWebhook() === false, 'Xóa Webhook URL thành công khi bỏ trống');

print('\n================================================================');
print('  ✔ TOÀN BỘ CÁC BÀI TEST TỰ ĐỘNG LƯU EXCEL & DRIVE ĐỀU ĐẠT 100%!');
print('================================================================');
