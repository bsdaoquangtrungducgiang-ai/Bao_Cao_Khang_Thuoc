/**
 * CLEAN SLATE & UNIVERSAL FILE SYNCHRONIZATION TEST SUITE
 * Kiểm tra:
 * 1. Chế độ Clean Slate xoá toàn bộ dữ liệu mẫu, không tự động nạp file bệnh viện
 * 2. Khi chưa có file nào được nạp: hệ thống hiển thị 0 bản ghi, báo cáo hiển thị 0 chủng
 * 3. Khi nạp 1 file mới: CHỈ ghi nhận số liệu file đó
 * 4. Toàn bộ hệ thống phân tích đồng bộ 100% theo file đã chọn
 * 5. StorageQuotaManager.deleteAllFiles làm sạch triệt để bộ nhớ
 */

var passed = 0;
var failed = 0;

function assert(condition, message) {
  if (condition) {
    print("  [PASS] " + message);
    passed++;
  } else {
    print("  [FAIL] " + message);
    failed++;
  }
}

if (typeof console === 'undefined') {
  var console = {
    log: typeof print !== 'undefined' ? print : function() {},
    warn: typeof print !== 'undefined' ? print : function() {},
    error: typeof print !== 'undefined' ? print : function() {},
    info: typeof print !== 'undefined' ? print : function() {}
  };
}

if (typeof window === 'undefined') {
  var window = {};
}
window.console = console;
var localStorageMock = {};
var localStorage = {
  getItem: function(k) { return localStorageMock[k] || null; },
  setItem: function(k, v) { localStorageMock[k] = String(v); },
  removeItem: function(k) { delete localStorageMock[k]; }
};
window.localStorage = localStorage;

var domNodes = {};
function createMockElement(id, tag) {
  return {
    id: id || '',
    tagName: tag || 'div',
    value: id === 'report-select-file' ? '' : '',
    textContent: '',
    innerHTML: '',
    style: {},
    options: [],
    children: [],
    classList: {
      add: function() {},
      remove: function() {}
    },
    addEventListener: function() {},
    appendChild: function(c) {
      if (!this.children) this.children = [];
      this.children.push(c);
      if (this.options) this.options.push(c);
    }
  };
}

var document = {
  getElementById: function(id) {
    if (!domNodes[id]) {
      domNodes[id] = createMockElement(id, 'div');
    }
    return domNodes[id];
  },
  createElement: function(tag) {
    return createMockElement('', tag);
  }
};
window.document = document;
window.addEventListener = function() {};

// Nạp các utils & service cần thiết
load('js/utils/dataNormalization.js');
load('js/utils/dataValidation.js');
load('js/services/importService.js');
load('js/data/hospitalCsvData.js');
load('js/services/demoDataService.js');
load('js/services/storageQuotaManager.js');
load('js/services/astService.js');
load('js/services/reportExportService.js');
load('js/components/reportView.js');

window.DemoDataService = DemoDataService;
window.StorageQuotaManager = StorageQuotaManager;
window.ImportService = ImportService;
window.ASTService = ASTService;
window.ReportExportService = ReportExportService;
window.ReportView = ReportView;

print("\n================================================================");
print("  CHẠY BỘ TEST CLEAN SLATE & ĐỒNG BỘ PHÂN TÍCH TOÀN HỆ THỐNG");
print("================================================================\n");

// 1. Kích hoạt Clean Slate
localStorage.setItem('amr_clean_slate_active', 'true');
assert(DemoDataService.isCleanSlateActive() === true, "1. Clean Slate kích hoạt thành công (isCleanSlateActive = true)");

// 2. Làm sạch toàn bộ dữ liệu cũ
DemoDataService.clearAllFiles();
assert(DemoDataService.data.patients.length === 0, "2. DemoDataService patients = 0 sau khi clear");
assert(DemoDataService.data.astResults.length === 0, "3. DemoDataService astResults = 0 sau khi clear");
assert(DemoDataService.data.importJobs.length === 0, "4. DemoDataService importJobs = 0 sau khi clear");

// 3. Kiểm tra getAll() trong Clean Slate không tự nạp file mẫu
var all = DemoDataService.getAll();
assert(all.astResults.length === 0, "5. DemoDataService.getAll() không tự động inject 22.046 dòng file bệnh viện");

// 4. Kiểm tra ReportView khi ở Clean Slate và chưa có file
ReportView.populateFileOptions();
var fileSelect = document.getElementById('report-select-file');
assert(fileSelect.options.length >= 1 && fileSelect.options[0].value === '', "6. Dropdown file hiển thị thông báo chưa có file nào");

var emptyRep = ReportExportService.getComprehensiveAmrReport('');
assert(emptyRep.overview.totalIsolates === 0, "7. Báo cáo AMR tính toán 0 chủng phân lập (Không lấy 1.466 mặc định)");
assert(emptyRep.overview.totalPatients === 0, "8. Báo cáo AMR tính toán 0 bệnh nhân (Không lấy 1.137 mặc định)");
assert(emptyRep.gramGroups[0].percent === 0, "9. Tỷ lệ Gram âm hiển thị an toàn 0% (Không bị NaN)");

// 5. Nạp file xét nghiệm mới của người dùng
var userRecords = [
  { patient_code: 'BN-01', patient_name: 'Nguyễn Văn A', organism_name: 'Staphylococcus aureus', antibiotic_code: 'FOX', interpretation: 'R', department: 'Khoa Ngoại', specimen_type: 'Mủ vết thương' },
  { patient_code: 'BN-01', patient_name: 'Nguyễn Văn A', organism_name: 'Staphylococcus aureus', antibiotic_code: 'VA', interpretation: 'S', department: 'Khoa Ngoại', specimen_type: 'Mủ vết thương' },
  { patient_code: 'BN-02', patient_name: 'Trần Thị B', organism_name: 'Pseudomonas aeruginosa', antibiotic_code: 'MEM', interpretation: 'R', department: 'Khoa Hồi sức', specimen_type: 'Dịch phế quản' },
  { patient_code: 'BN-02', patient_name: 'Trần Thị B', organism_name: 'Pseudomonas aeruginosa', antibiotic_code: 'CIP', interpretation: 'S', department: 'Khoa Hồi sức', specimen_type: 'Dịch phế quản' },
  { patient_code: 'BN-03', patient_name: 'Lê Văn C', organism_name: 'Escherichia coli', antibiotic_code: 'CTX', interpretation: 'R', department: 'Khoa Cấp cứu', specimen_type: 'Nước tiểu' }
];

ImportService.syncToLocalStore(DemoDataService.data, userRecords, 'job-user-01', 'File_Nguoi_Dung_Upload_2026.xlsx', 'xlsx', {
  totalRows: 5
});

assert(DemoDataService.data.astResults.length === 5, "10. Hệ thống CHỈ ghi nhận đúng 5 kết quả AST của file vừa nạp");
assert(DemoDataService.data.importJobs.length === 1, "11. Hệ thống chỉ ghi nhận 1 file duy nhất");
assert(DemoDataService.data.importJobs[0].file_name === 'File_Nguoi_Dung_Upload_2026.xlsx', "12. Tên file lưu trữ khớp chính xác");

// 6. Kiểm tra phân tích toàn hệ thống theo file
var survData = ASTService.fetchFromDemoData({ file: 'File_Nguoi_Dung_Upload_2026.xlsx' });
assert(survData.astResults.length === 5, "13. ASTService đồng bộ đúng 5 AST records của file");
assert(survData.patients.length === 3, "14. ASTService lọc đúng 3 bệnh nhân của file");
assert(survData.cultures.length === 3, "15. ASTService lọc đúng 3 lượt nuôi cấy của file");

var userRep = ReportExportService.getComprehensiveAmrReport('File_Nguoi_Dung_Upload_2026.xlsx');
assert(userRep.overview.totalIsolates === 3, "16. Báo cáo AMR tính toán chuẩn xác 3 chủng phân lập");
assert(userRep.overview.totalPatients === 3, "17. Báo cáo AMR tính toán chuẩn xác 3 bệnh nhân");
assert(userRep.overview.totalDepartments === 3, "18. Báo cáo AMR tính toán chuẩn xác 3 khoa phòng");

// 7. Xóa toàn bộ file bằng StorageQuotaManager.deleteAllFiles
StorageQuotaManager.deleteAllFiles();
assert(DemoDataService.data.astResults.length === 0, "19. StorageQuotaManager.deleteAllFiles làm sạch 100% dữ liệu AST");
assert(DemoDataService.data.importJobs.length === 0, "20. StorageQuotaManager.deleteAllFiles làm sạch 100% danh sách file");

print("\n================================================================");
print("  KẾT QUẢ: " + passed + " PASS, " + failed + " FAIL");
if (failed === 0) {
  print("  ✔ TOÀN BỘ 20 TIÊU CHÍ CLEAN SLATE VÀ ĐỒNG BỘ PHÂN TÍCH ĐÃ ĐẠT 100%!");
}
print("================================================================\n");

quit(failed > 0 ? 1 : 0);
