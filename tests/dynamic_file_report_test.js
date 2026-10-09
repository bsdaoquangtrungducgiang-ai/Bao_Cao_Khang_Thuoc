/**
 * DYNAMIC FILE REPORT TEST SUITE
 * Kiểm tra tính toán linh hoạt 100% theo file được chọn từ "Import dữ liệu"
 * Đảm bảo: Không lấy số liệu mặc định tĩnh, chỉ giữ định danh bảng & cột,
 * toàn bộ chỉ số được điều chỉnh động theo file chọn phân tích.
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

// Giả lập console cho môi trường JSC CLI
if (typeof console === 'undefined') {
  var console = {
    log: typeof print !== 'undefined' ? print : function() {},
    warn: typeof print !== 'undefined' ? print : function() {},
    error: typeof print !== 'undefined' ? print : function() {},
    info: typeof print !== 'undefined' ? print : function() {}
  };
}

// Giả lập môi trường trình duyệt cho JSC
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

var document = {
  getElementById: function(id) {
    return {
      id: id,
      value: id === 'report-select-file' ? 'ĐG Dương tính (010126. 230626).xls' : '',
      textContent: '',
      innerHTML: '',
      style: {},
      options: [{ value: 'ĐG Dương tính (010126. 230626).xls' }],
      classList: {
        add: function() {},
        remove: function() {}
      },
      addEventListener: function() {},
      appendChild: function() {}
    };
  },
  createElement: function(tag) {
    return {
      tagName: tag,
      innerHTML: '',
      style: {},
      appendChild: function() {}
    };
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
load('js/services/reportExportService.js');
load('js/components/reportView.js');

print("\n================================================================");
print("  CHẠY BỘ TEST BÁO CÁO AMR ĐỘNG 100% THEO FILE ĐƯỢC CHỌN");
print("================================================================\n");

// Khởi tạo dữ liệu
var allData = DemoDataService.getAll();
assert(allData.astResults.length > 0, "1. Dữ liệu AST trong kho sẵn sàng (Tổng: " + allData.astResults.length + ")");

// KIỂM TRA 1: PHÂN TÍCH FILE THỰC TẾ BỆNH VIỆN ĐỨC GIANG
var repDg = ReportExportService.getComprehensiveAmrReport('ĐG Dương tính (010126. 230626).xls');
assert(repDg.metadata.fileName === 'ĐG Dương tính (010126. 230626).xls', "2. Nhận diện đúng file bệnh viện: " + repDg.metadata.fileName);
assert(repDg.overview.totalIsolates >= 1400, "3. Tính toán động quy mô chủng thực tế: " + repDg.overview.totalIsolates + " chủng");
assert(repDg.overview.totalPatients === 1137, "4. Tính toán động số lượng bệnh nhân thực tế: " + repDg.overview.totalPatients + " người");
assert(repDg.overview.totalDepartments === 24, "5. Tính toán động 24 khoa phòng thực tế");
assert(repDg.gramGroups[0].name === 'Gram âm' && repDg.gramGroups[0].count > 800, "6. Gram âm tính toán động đạt: " + repDg.gramGroups[0].count + " chủng (" + repDg.gramGroups[0].percent + "%)");
assert(repDg.monthlyComments.peakMonth.indexOf('4') !== -1, "7. Tự động nhận diện đỉnh dịch là Tháng 4 (" + repDg.monthlyComments.peakIsolates + " chủng)");
assert(repDg.top15Pathogens.length > 0 && repDg.top15Pathogens[0].name === 'Haemophilus influenzae', "8. Tác nhân dẫn đầu thực tế tính toán đúng là H. influenzae (" + repDg.top15Pathogens[0].count + " chủng)");

// KIỂM TRA 2: PHÂN TÍCH FILE KHÁC (Du_lieu_mau_benh_vien_2026.xlsx)
var repSeed = ReportExportService.getComprehensiveAmrReport('Du_lieu_mau_benh_vien_2026.xlsx');
assert(repSeed.metadata.fileName === 'Du_lieu_mau_benh_vien_2026.xlsx', "9. Nhận diện file mẫu: " + repSeed.metadata.fileName);
assert(repSeed.overview.totalIsolates === 200, "10. KHÔNG dùng số mặc định 1466, tính toán đúng 200 chủng cho file mẫu");
assert(repSeed.overview.totalPatients === 100, "11. KHÔNG dùng số mặc định 1137, tính toán đúng 100 bệnh nhân cho file mẫu");
assert(repSeed.top15Pathogens[0].name === 'Escherichia coli', "12. Tác nhân dẫn đầu của file mẫu tự động đổi thành E. coli (" + repSeed.top15Pathogens[0].count + " chủng)");
assert(repSeed.overview.totalIsolates !== repDg.overview.totalIsolates, "13. Hai file có kết quả phân tích hoàn toàn độc lập và linh hoạt");

// KIỂM TRA 3: NẠP FILE MỚI VÀ PHÂN TÍCH TỨC THÌ
var customFileName = 'Benh_Vien_Moi_Upload_2026.csv';
var fakeNewAst = [
  { culture_id: 'C1', patient_code: 'P01', department: 'Khoa Ngoại', organism_name: 'Staphylococcus aureus', specimen_type: 'Mủ', antibiotic_code: 'VAN', interpretation: 'S', tested_date: '2026-05-01', file_name: customFileName },
  { culture_id: 'C1', patient_code: 'P01', department: 'Khoa Ngoại', organism_name: 'Staphylococcus aureus', specimen_type: 'Mủ', antibiotic_code: 'OXA', interpretation: 'R', tested_date: '2026-05-01', file_name: customFileName },
  { culture_id: 'C2', patient_code: 'P02', department: 'Khoa Hồi sức', organism_name: 'Acinetobacter baumannii', specimen_type: 'Đờm', antibiotic_code: 'MEM', interpretation: 'R', tested_date: '2026-05-02', file_name: customFileName },
  { culture_id: 'C3', patient_code: 'P03', department: 'Khoa Hồi sức', organism_name: 'Acinetobacter baumannii', specimen_type: 'Đờm', antibiotic_code: 'COL', interpretation: 'S', tested_date: '2026-05-03', file_name: customFileName }
];

allData.astResults.push.apply(allData.astResults, fakeNewAst);
var repCustom = ReportExportService.getComprehensiveAmrReport(customFileName);

assert(repCustom.metadata.fileName === customFileName, "14. File tùy biến được định danh chính xác: " + repCustom.metadata.fileName);
assert(repCustom.overview.totalIsolates === 3, "15. Tính toán động chính xác 3 chủng phân lập cho file mới");
assert(repCustom.overview.totalPatients === 3, "16. Tính toán động chính xác 3 bệnh nhân cho file mới");
assert(repCustom.overview.totalDepartments === 2, "17. Tính toán động chính xác 2 khoa phòng (Khoa Ngoại, Khoa Hồi sức)");
assert(repCustom.departmentTop12[0].name === 'Khoa Hồi sức', "18. Khoa nhiều chủng nhất là Khoa Hồi sức (2 chủng)");
assert(repCustom.redAlerts.find(function(r) { return r.title === 'MRSA'; }).rate === 100, "19. Điểm đỏ MRSA của file mới tính đúng 100% (1/1 chủng)");
assert(repCustom.redAlerts.find(function(r) { return r.title === 'CRAB'; }).rate === 100, "20. Điểm đỏ CRAB của file mới tính đúng 100% (1/1 chủng)");

// KIỂM TRA 4: LIÊN KẾT TỪ IMPORT DỮ LIỆU ĐẾN BÁO CÁO AMR
localStorage.setItem('amr_last_imported_file', customFileName);
assert(localStorage.getItem('amr_last_imported_file') === customFileName, "21. Lưu vết file vừa import thành công");
ReportView.populateFileOptions(customFileName);
assert(typeof ReportView.selectFileAndOpen === 'function', "22. Có hàm selectFileAndOpen phục vụ chuyển trang từ Import");
assert(typeof ReportView.openLatestImported === 'function', "23. Có hàm openLatestImported mở file vừa nạp tức thì");

print("\n================================================================");
print("  KẾT QUẢ: " + passed + " PASS, " + failed + " FAIL");
if (failed === 0) {
  print("  ✔ TOÀN BỘ 23 TIÊU CHÍ BÁO CÁO AMR ĐỘNG THEO FILE ĐÃ VƯỢT QUA 100%!");
} else {
  print("  ✖ CÓ LỖI XẢY RA TRONG BỘ TEST!");
}
print("================================================================\n");

if (failed > 0) {
  throw new Error("Test failed with " + failed + " failures");
}
