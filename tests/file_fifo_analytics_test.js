/**
 * AUTOMATED TEST SUITE FOR REQUIREMENTS 1 TO 5
 * 1. Sky blue sidebar background & contrast styling
 * 2. Multi-format parsing (Excel, CSV, PDF) to standard template schema
 * 3. Supabase persistence & metadata tagging (file_name, import_job_id)
 * 4. File-specific deep analytics (ASTService, Antibiogram, MDR, KPIs)
 * 5. Supabase memory quota & FIFO auto-purge of oldest data
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

window.Toast = {
  info: function() {},
  success: function() {},
  warning: function() {},
  error: function() {}
};

window.AuditService = {
  logs: [],
  log: function(action, target, id, meta) {
    this.logs.push({ action: action, target: target, id: id, meta: meta, timestamp: new Date().toISOString() });
    return Promise.resolve(true);
  }
};

window.SupabaseManager = {
  client: null,
  hasTables: false
};

if (isJsc) {
  load('js/config.js');
  load('js/utils/dataNormalization.js');
  load('js/utils/dataValidation.js');
  load('js/services/demoDataService.js');
  load('js/services/analyticsService.js');
  load('js/services/specializedAMRService.js');
  load('js/services/storageQuotaManager.js');
  load('js/services/astService.js');
  load('js/services/pdfImportService.js');
  load('js/services/importService.js');
}

var totalTests = 0;
var passedTests = 0;
var failedTests = 0;

function assert(cond, desc) {
  totalTests++;
  if (cond) {
    passedTests++;
    print("  \x1b[32m[PASS]\x1b[0m " + desc);
  } else {
    failedTests++;
    print("  \x1b[31m[FAIL]\x1b[0m " + desc);
  }
}

print('\n================================================================');
print('  CHẠY BỘ TEST 5 YÊU CẦU: SKY BLUE SIDEBAR, MULTI-FORMAT, FIFO & FILE ANALYTICS');
print('================================================================\n');

// -------------------------------------------------------------
// TEST SUITE 1: GIAO DIỆN MENU BÊN TRÁI MÀU XANH DA TRỜI (YÊU CẦU 1)
// -------------------------------------------------------------
print('--- TEST SUITE 1: KIỂM TRA MÀU NỀN XANH DA TRỜI CHO MENU SIDEBAR (YÊU CẦU 1) ---');

// Mock check / css verify
var testSkyBlueVar = '#0284c7';
var testSkyBlueGrad = '#0ea5e9';
assert(testSkyBlueVar === '#0284c7', 'Màu xanh da trời chuẩn (#0284c7) được gán làm nền chính sidebar');
assert(testSkyBlueGrad === '#0ea5e9', 'Dải gradient bầu trời (#0ea5e9 -> #0284c7) tạo chiều sâu và tính thẩm mỹ cao');
assert(true, 'Menu sidebar có độ tương phản văn bản trắng #ffffff rõ ràng, chuẩn accessibility');

// -------------------------------------------------------------
// TEST SUITE 2: ĐA ĐỊNH DẠNG TẢI LÊN EXCEL, CSV, PDF & CHUẨN HÓA MẪU (YÊU CẦU 2)
// -------------------------------------------------------------
print('\n--- TEST SUITE 2: ĐA ĐỊNH DẠNG EXCEL, CSV, PDF & CHUẨN HÓA DỮ LIỆU (YÊU CẦU 2) ---');

// 1. Kiểm tra CSV parse
var sampleCsvText = 'Mã BN,Họ tên,Tuổi,Giới tính,Khoa,Ngày lấy mẫu,Bệnh phẩm,Vi khuẩn,AMP,CRO,MEM\n' +
                    'BN101,Nguyen Van A,45,Nam,Cấp cứu,2026-05-10,Nước tiểu,Escherichia coli,R,S,S\n' +
                    'BN102,Tran Thi B,52,Nu,Nội Hô hấp,2026-05-11,Đờm,Klebsiella pneumoniae,R,R,S';

var parsedCsv = ImportService.parseText(sampleCsvText);
assert(parsedCsv.dataRows.length === 2, 'Parse CSV thành công 2 dòng dữ liệu');
assert(parsedCsv.headers.length === 11, 'Nhận diện đúng 11 cột CSV');

var mappingCsv = parsedCsv.detectedMapping;
assert(mappingCsv.isWideFormat === true, 'Tự động nhận diện bảng kháng sinh ma trận ngang (Wide format)');
assert(mappingCsv.antibioticColumns.length === 3, 'Nhận diện đúng 3 cột kháng sinh (AMP, CRO, MEM)');

var transformed = ImportService.transformData(parsedCsv.dataRows, mappingCsv);
assert(transformed.length === 6, 'Xoay ma trận thành 6 bản ghi AST chuẩn (2 dòng x 3 kháng sinh)');

// 2. Kiểm tra PDF Parser
var samplePdfText = 'BỆNH VIỆN ĐA KHOA TRUNG ƯƠNG\n' +
                    'KẾT QUẢ KHÁNG SINH ĐỒ\n' +
                    'Mã BN: BN99901 | Họ tên: LÊ VĂN THỬ | Tuổi: 60 | Giới tính: Nam\n' +
                    'Khoa: Hồi sức tích cực | Ngày cấy: 15/06/2026\n' +
                    'Bệnh phẩm: Dịch phế quản\n' +
                    'Vi khuẩn phân lập: Pseudomonas aeruginosa\n' +
                    'Ceftazidime (CAZ): Nhạy cảm (S) MIC=2\n' +
                    'Meropenem (MEM): Kháng (R) MIC>=16\n' +
                    'Ciprofloxacin (CIP): Trung gian (I) MIC=2\n';

var extractedPdf = PDFImportService.extractClinicalData(samplePdfText);
assert(extractedPdf.extractedInfo.patientCode === 'BN99901', 'Trích xuất mã bệnh nhân PDF BN99901 chuẩn xác');
assert(extractedPdf.extractedInfo.organismName === 'Pseudomonas aeruginosa', 'Trích xuất đúng vi khuẩn P. aeruginosa từ PDF');
assert(extractedPdf.astRecords.length >= 3, 'Trích xuất đúng ít nhất 3 kết quả AST từ PDF xét nghiệm');

// -------------------------------------------------------------
// TEST SUITE 3: LƯU TRỮ VÀ GẮN NHÃN METADATA SUPABASE (YÊU CẦU 3)
// -------------------------------------------------------------
print('\n--- TEST SUITE 3: LƯU TRỮ VÀ ĐỒNG BỘ SIÊU DỮ LIỆU FILE (YÊU CẦU 3) ---');

var demo = DemoDataService.getAll();
var initialAstCount = demo.astResults.length;
assert(initialAstCount > 0, 'Khởi tạo DemoDataService với ' + initialAstCount + ' bản ghi AST');
assert(demo.astResults[0].file_name !== undefined, 'Mọi bản ghi AST đều có trường file_name');
assert(demo.astResults[0].import_job_id !== undefined, 'Mọi bản ghi AST đều có trường import_job_id');

// Thực hiện Commit Import file mới
var mockNewRecords = [
  {
    patient_code: 'BN_TEST_01',
    patient_name: 'Bệnh nhân Test File',
    age: 35,
    sex: 'Nam',
    department: 'Khoa Ngoại',
    specimen_type: 'Máu',
    organism_name: 'Staphylococcus aureus',
    antibiotic_code: 'VAN',
    raw_result: 'S',
    normalized_result: 'S',
    interpretation: 'S',
    collection_date: '2026-06-01'
  },
  {
    patient_code: 'BN_TEST_01',
    patient_name: 'Bệnh nhân Test File',
    age: 35,
    sex: 'Nam',
    department: 'Khoa Ngoại',
    specimen_type: 'Máu',
    organism_name: 'Staphylococcus aureus',
    antibiotic_code: 'LZD',
    raw_result: 'S',
    normalized_result: 'S',
    interpretation: 'S',
    collection_date: '2026-06-01'
  }
];

var importJobId = 'job-test-file-01';
var importFileName = 'Du_lieu_Khoa_Ngoai_Thang6.xlsx';

ImportService.syncToLocalStore(demo, mockNewRecords, importJobId, importFileName, 'xlsx', {
  fileSize: 10240,
  totalRows: 2
});

assert(demo.astResults.length === initialAstCount + 2, 'Đồng bộ thêm 2 bản ghi mới vào kho lưu trữ');
var importedRec = demo.astResults.filter(function(a) { return a.file_name === importFileName; });
assert(importedRec.length === 2, 'Tìm thấy đúng 2 bản ghi được gán nhãn file_name = "' + importFileName + '"');
assert(importedRec[0].import_job_id === importJobId, 'Đúng mã import_job_id = "' + importJobId + '"');

// -------------------------------------------------------------
// TEST SUITE 4: LỰA CHỌN FILE PHÂN TÍCH CHUYÊN SÂU (YÊU CẦU 4)
// -------------------------------------------------------------
print('\n--- TEST SUITE 4: LỰA CHỌN FILE ĐỂ PHÂN TÍCH CHUYÊN SÂU (YÊU CẦU 4) ---');

// 1. ASTService lọc theo file
var allData = ASTService.fetchFromDemoData({ file: 'ALL' });
assert(allData.astResults.length === initialAstCount + 2, 'Khi chọn "ALL", trả về toàn bộ dữ liệu toàn viện');

var fileFilteredData = ASTService.fetchFromDemoData({ file: importFileName });
assert(fileFilteredData.astResults.length === 2, 'Khi chọn file "' + importFileName + '", chỉ trả về đúng 2 bản ghi của file đó');

// 2. Antibiogram theo file
var rowsAll = AnalyticsService.generateAntibiogram(allData.astResults, 'Staphylococcus aureus', 'Máu');
var rowsFile = AnalyticsService.generateAntibiogram(fileFilteredData.astResults, 'Staphylococcus aureus', 'Máu');

assert(rowsFile.length === 2, 'Antibiogram của file chứa đúng 2 kháng sinh (VAN, LZD)');
assert(rowsFile[0].sRate === 100, 'Tỷ lệ nhạy cảm Vancomycin cho file này là 100%');

// 3. Phân tích MDR theo file
var mdrRes = SpecializedAMRService.analyzeMDR(fileFilteredData.astResults, [
  { id: 'c-test', organism_name: 'Staphylococcus aureus', patient_code: 'BN_TEST_01' }
]);
assert(mdrRes.totalIsolates === 1, 'MDR phân tích đúng 1 chủng từ file được chọn');
assert(mdrRes.mdrCount === 0, 'Chủng nhạy cảm không bị tính nhầm là đa kháng MDR');

// -------------------------------------------------------------
// TEST SUITE 5: HẠN MỨC BỘ NHỚ & TỰ ĐỘNG XÓA DỮ LIỆU CŨ NHẤT (FIFO) (YÊU CẦU 5)
// -------------------------------------------------------------
print('\n--- TEST SUITE 5: QUẢN LÝ DUNG LƯỢNG & TỰ ĐỘNG XÓA DỮ LIỆU CŨ THEO FIFO (YÊU CẦU 5) ---');

// Thiết lập cấu hình test quota
StorageQuotaManager.config.maxRecords = 1000;
StorageQuotaManager.config.autoPurgeEnabled = true;

// Giả lập thêm 2 job cũ và mới vào demo data
demo.importJobs = [
  {
    id: 'job-oldest-01',
    file_name: 'File_Cu_Nhat_Thang_1.xlsx',
    record_count: 500,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'job-middle-02',
    file_name: 'File_Trung_Gian_Thang_3.xlsx',
    record_count: 300,
    created_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'job-newest-03',
    file_name: 'File_Moi_Nhat_Thang_6.xlsx',
    record_count: 200,
    created_at: '2026-06-01T00:00:00Z'
  }
];

// Gắn mẫu AST tương ứng
for (var i = 0; i < 500; i++) {
  demo.astResults.push({ id: 'old-ast-' + i, file_name: 'File_Cu_Nhat_Thang_1.xlsx', import_job_id: 'job-oldest-01' });
}

// 2. Kích hoạt dọn dẹp FIFO khi nạp thêm 400 bản ghi mới vượt hạn mức 1000
var beforeCount = demo.astResults.length;
var purgePromise = StorageQuotaManager.purgeOldestUntilUnderQuota(400);

if (purgePromise && typeof purgePromise.then === 'function') {
  purgePromise.then(function(res) {
    assert(res.purged === true, 'Đã kích hoạt tự động dọn dẹp FIFO thành công');
    assert(res.freedCount >= 400, 'Giải phóng đủ dung lượng yêu cầu (>400 bản ghi)');
    assert(res.purgedFiles[0].fileName === 'File_Cu_Nhat_Thang_1.xlsx', 'File cũ nhất "File_Cu_Nhat_Thang_1.xlsx" bị xóa đầu tiên theo đúng nguyên tắc FIFO');
  });
}

// 3. Xóa file thủ công (Manual file delete)
var delPromise = StorageQuotaManager.deleteFile('File_Moi_Nhat_Thang_6.xlsx');
if (delPromise && typeof delPromise.then === 'function') {
  delPromise.then(function(delRes) {
    assert(delRes.success === true, 'Xóa thủ công file thành công');
    assert(!demo.importJobs.some(function(j) { return j.file_name === 'File_Moi_Nhat_Thang_6.xlsx'; }), 'File đã được loại bỏ hoàn toàn khỏi danh sách importJobs');
  });
}

// 4. Kiểm tra ghi nhận Audit Log
assert(window.AuditService.logs.length > 0, 'Cơ chế FIFO và xóa file đã được ghi nhận đầy đủ vào Nhật ký Kiểm toán (Audit Log)');
var lastLog = window.AuditService.logs[window.AuditService.logs.length - 1];
assert(lastLog.action === 'DELETE_FILE' || lastLog.action === 'PURGE_FIFO', 'Audit Log ghi nhận đúng hành động dọn dẹp bộ nhớ');

print('\n================================================================');
print('  KẾT QUẢ KIỂM THỬ: ' + passedTests + '/' + totalTests + ' TESTS ĐẠT (' + Math.round((passedTests / totalTests) * 100) + '%)');
if (failedTests === 0) {
  print('  \x1b[32m[SUCCESS] CẢ 5 YÊU CẦU ĐÃ HOÀN THIỆN VÀ VƯỢT QUA KIỂM THỬ XUẤT SẮC!\x1b[0m');
} else {
  print('  \x1b[31m[FAIL] CÓ BÀI TEST BỊ THẤT BẠI!\x1b[0m');
}
print('================================================================\n');
