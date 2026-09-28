/**
 * PHASE 1 AUTOMATED TEST SUITE - BAO-CAO-KHANG-THUOC
 * Kiểm thử tính toán dịch tễ học, công thức chuẩn AMR, tính toàn vẹn dữ liệu demo,
 * và phân quyền RBAC theo các mục XLV, XLVI, XLVIII, XLIX, L.
 */

// Load services in Node.js environment
const { CONFIG } = require('../js/config.js');
const { DemoDataService } = require('../js/services/demoDataService.js');
const { AnalyticsService } = require('../js/services/analyticsService.js');
const { AuthService } = require('../js/services/authService.js');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName} - ${details}`);
  }
}

console.log('================================================================');
console.log('  CHẠY BỘ KIỂM THỬ GIAI ĐOẠN 1 (PHASE 1 TEST SUITE)');
console.log('  HỆ THỐNG: BAO-CAO-KHANG-THUOC');
console.log('================================================================\n');

// TEST SUITE 1: Kiểm thử Công thức Analytics (Section XLV & XLVI)
console.log('--- TEST SUITE 1: CÔNG THỨC ANALYTICS VÀ MẪU SỐ (XLV & XLVI) ---');

const sampleAST = [
  { normalized_result: 'S', antibiotic_code: 'CRO' },
  { normalized_result: 'S', antibiotic_code: 'CRO' },
  { normalized_result: 'S', antibiotic_code: 'CRO' },
  { normalized_result: 'I', antibiotic_code: 'CRO' },
  { normalized_result: 'R', antibiotic_code: 'CRO' },
  { normalized_result: 'R', antibiotic_code: 'CRO' },
  { normalized_result: 'NA', antibiotic_code: 'CRO' }, // Phải loại khỏi mẫu số
  { normalized_result: 'NS', antibiotic_code: 'CRO' }  // Phải loại khỏi mẫu số
];

const rates = AnalyticsService.calculateRates(sampleAST);

// Denominator phải là S(3) + I(1) + R(2) = 6. Tổng ban đầu là 8.
assert(rates.totalRecords === 8, 'Tổng bản ghi ghi nhận 8');
assert(rates.denominator === 6, 'Mẫu số chính xác là 6 (loại trừ NA, NS)');
assert(rates.sCount + rates.iCount + rates.rCount === rates.denominator, 'S + I + R = denominator');
assert(rates.rRate <= 100 && rates.rRate >= 0, 'R% nằm trong khoảng 0-100%');

// R% = 2 / 6 * 100 = 33.3%
assert(Math.abs(rates.rRate - 33.3) < 0.2, `R% tính đúng 33.3% (thực tế: ${rates.rRate}%)`);
// S% = 3 / 6 * 100 = 50.0%
assert(Math.abs(rates.sRate - 50.0) < 0.2, `S% tính đúng 50.0% (thực tế: ${rates.sRate}%)`);
// I% = 1 / 6 * 100 = 16.7%
assert(Math.abs(rates.iRate - 16.7) < 0.2, `I% tính đúng 16.7% (thực tế: ${rates.iRate}%)`);

// Trường hợp danh sách rỗng (tránh chia cho 0)
const emptyRates = AnalyticsService.calculateRates([]);
assert(emptyRates.denominator === 0 && emptyRates.rRate === 0, 'Xử lý an toàn khi danh sách rỗng (Không chia cho 0)');


// TEST SUITE 2: Kiểm thử Bộ Dữ liệu Mẫu Demo (Section XLIX & L)
console.log('\n--- TEST SUITE 2: DỮ LIỆU DEMO THEO CHUẨN ĐẶC TẢ (XLIX & L) ---');

const demoData = DemoDataService.init();

assert(demoData.patients.length === 100, `Số lượng bệnh nhân đúng 100 (thực tế: ${demoData.patients.length})`);
assert(demoData.specimens.length === 150, `Số lượng bệnh phẩm đúng 150 (thực tế: ${demoData.specimens.length})`);
assert(demoData.cultures.length === 200, `Số lượng nuôi cấy đúng 200 (thực tế: ${demoData.cultures.length})`);
assert(demoData.astResults.length === 1000, `Số lượng kết quả AST đúng 1,000 (thực tế: ${demoData.astResults.length})`);

// Kiểm tra tỷ lệ mục tiêu: S ~62%, I ~8%, R ~30%
const demoRates = AnalyticsService.calculateRates(demoData.astResults);
assert(demoRates.sRate === 62.0, `Tỷ lệ S đạt chuẩn 62.0% (thực tế: ${demoRates.sRate}%)`);
assert(demoRates.iRate === 8.0, `Tỷ lệ I đạt chuẩn 8.0% (thực tế: ${demoRates.iRate}%)`);
assert(demoRates.rRate === 30.0, `Tỷ lệ R đạt chuẩn 30.0% (thực tế: ${demoRates.rRate}%)`);
assert(demoRates.sCount === 620, 'Số lượng kết quả S chính xác 620');
assert(demoRates.iCount === 80, 'Số lượng kết quả I chính xác 80');
assert(demoRates.rCount === 300, 'Số lượng kết quả R chính xác 300');


// TEST SUITE 3: Kiểm thử Antibiogram & Heatmap Engine (Section XX & XXI)
console.log('\n--- TEST SUITE 3: MA TRẬN ANTIBIOGRAM & HEATMAP (XX & XXI) ---');

const antibiogram = AnalyticsService.generateAntibiogram(demoData.astResults, 'Escherichia coli');
assert(antibiogram.length > 0, `Antibiogram sinh thành công ${antibiogram.length} kháng sinh cho E. coli`);

antibiogram.forEach(row => {
  assert(
    row.sCount + row.iCount + row.rCount === row.total,
    `Kháng sinh ${row.code}: S(${row.sCount}) + I(${row.iCount}) + R(${row.rCount}) = Total(${row.total})`
  );
  assert(row.rRate <= 100 && row.rRate >= 0, `Kháng sinh ${row.code}: %R (${row.rRate}%) hợp lệ <= 100%`);
});

const heatmap = AnalyticsService.generateHeatmap(demoData.astResults);
assert(heatmap.matrix.length > 0, 'Heatmap sinh ma trận hàng vi khuẩn thành công');
assert(heatmap.antibiotics.length > 0, 'Heatmap sinh danh sách cột kháng sinh thành công');


// TEST SUITE 4: Phân quyền RBAC & Bảo mật (Section II & XXXVI)
console.log('\n--- TEST SUITE 4: PHÂN QUYỀN VAI TRÒ NGƯỜI DÙNG RBAC (II & XXXVI) ---');

AuthService.setDemoRole('admin');
assert(AuthService.canUpload() === true, 'Admin có quyền upload dữ liệu');
assert(AuthService.canEditData() === true, 'Admin có quyền sửa dữ liệu');
assert(AuthService.canDeleteData() === true, 'Admin có quyền xóa dữ liệu');
assert(AuthService.canManageUsers() === true, 'Admin có quyền quản lý người dùng');

AuthService.setDemoRole('manager');
assert(AuthService.canUpload() === true, 'Manager có quyền upload dữ liệu');
assert(AuthService.canEditData() === true, 'Manager có quyền sửa dữ liệu');
assert(AuthService.canDeleteData() === false, 'Manager KHÔNG có quyền xóa dữ liệu (Admin only)');
assert(AuthService.canManageUsers() === false, 'Manager KHÔNG có quyền quản lý tài khoản Admin');

AuthService.setDemoRole('user');
assert(AuthService.canUpload() === true, 'User có quyền upload dữ liệu');
assert(AuthService.canEditData() === false, 'User KHÔNG có quyền sửa dữ liệu hệ thống');
assert(AuthService.canDeleteData() === false, 'User KHÔNG có quyền xóa dữ liệu');

AuthService.setDemoRole('viewer');
assert(AuthService.canUpload() === false, 'Viewer chỉ có quyền xem, không được upload');
assert(AuthService.canEditData() === false, 'Viewer không được sửa dữ liệu');


// TEST SUITE 5: Cấu hình Hệ thống & Kết nối Supabase
console.log('\n--- TEST SUITE 5: CẤU HÌNH SUPABASE & GUIDELINE ---');
assert(CONFIG.APP_NAME === 'BAO-CAO-KHANG-THUOC', 'Tên hệ thống đúng BAO-CAO-KHANG-THUOC');
assert(CONFIG.SUPABASE.DEFAULT_URL.includes('supabase.co'), 'SUPABASE_URL hợp lệ');
assert(CONFIG.DEFAULT_GUIDELINE === 'CLSI', 'Tiêu chuẩn mặc định là CLSI');

console.log('\n================================================================');
console.log(`  KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT (${Math.round((passedTests / totalTests) * 100)}%)`);
if (failedTests === 0) {
  console.log('  \x1b[32m✔ TẤT CẢ CÁC BÀI KIỂM THỬ ĐÃ VƯỢT QUA XUẤT SẮC!\x1b[0m');
} else {
  console.log(`  \x1b[31m✖ CÓ ${failedTests} BÀI KIỂM THỬ THẤT BẠI!\x1b[0m`);
}
console.log('================================================================\n');

process.exit(failedTests > 0 ? 1 : 0);
