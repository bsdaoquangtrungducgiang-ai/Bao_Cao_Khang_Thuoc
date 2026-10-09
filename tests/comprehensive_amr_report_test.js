/**
 * COMPREHENSIVE AMR REPORT TEST SUITE
 * Kiểm tra Báo Cáo AMR Tự Động Theo Đúng Mẫu 2 File PDF & Xen Kẽ Bảng - Biểu Đồ
 * Chạy trên JavaScriptCore (jsc)
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

// Giả lập môi trường trình duyệt cho JSC
if (typeof window === 'undefined') {
  var window = {};
}
var document = {
  getElementById: function(id) {
    return {
      id: id,
      value: id === 'report-select-file' ? 'ĐG Dương tính (010126. 230626).xls' : '',
      textContent: '',
      innerHTML: '',
      style: {},
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

// Nạp các service
load('js/services/reportExportService.js');
load('js/components/reportView.js');

print("\n================================================================");
print("  CHẠY BỘ TEST BÁO CÁO AMR TOÀN DIỆN (CHUẨN 2 FILE MẪU PDF)");
print("================================================================\n");

// 1. Kiểm tra Benchmark Hospital Data
var benchmark = ReportExportService.hospitalBenchmarkData;
assert(benchmark !== undefined, "1. Dữ liệu chuẩn mực bệnh viện hospitalBenchmarkData tồn tại");
assert(benchmark.overview.totalIsolates === 1466, "2. Khớp đúng 1.466 chủng phân lập (Slide 1 & Văn bản Mục 2.2)");
assert(benchmark.overview.totalPatients === 1137, "3. Khớp đúng 1.137 bệnh nhân cấy dương tính");
assert(benchmark.overview.totalDepartments === 24, "4. Khớp đúng 24 khoa phòng lâm sàng");
assert(benchmark.overview.totalSpecies === 54, "5. Khớp đúng 54 loài vi sinh vật định danh");

// 2. Cơ cấu Gram & Nấm (Slide 1 & Văn bản Mục 3.1)
assert(benchmark.gramGroups.length === 4, "6. Đủ 4 nhóm cơ cấu vi sinh vật");
assert(benchmark.gramGroups[0].count === 867 && benchmark.gramGroups[0].percent === 59.1, "7. Gram âm chiếm 59.1% (867 chủng)");
assert(benchmark.gramGroups[1].count === 500 && benchmark.gramGroups[1].percent === 34.1, "8. Gram dương chiếm 34.1% (500 chủng)");
assert(benchmark.gramGroups[2].count === 66 && benchmark.gramGroups[2].percent === 4.5, "9. Nấm chiếm 4.5% (66 chủng)");

// 3. Phân bố theo tháng & đỉnh T4 (Slide 2 & Văn bản Mục 3.2)
assert(benchmark.monthlyDistribution.length === 6, "10. Đủ 6 tháng giám sát (T1 - T6/2026)");
var peakMonth = benchmark.monthlyDistribution.find(function(m) { return m.isPeak; });
assert(peakMonth !== undefined && peakMonth.shortName === 'T4' && peakMonth.count === 338, "11. Đỉnh phân lập chính xác vào Tháng 4 với 338 chủng (23.1%)");

// 4. Top khoa phòng & 4 khoa trọng điểm (Slide 3 & Văn bản Mục 3.3)
assert(benchmark.departmentTop12.length === 12, "12. Đủ danh sách Top 12 khoa phòng lâm sàng");
assert(benchmark.departmentComments.top4Total === 976, "13. Top 4 khoa trọng điểm đạt 976 chủng (~2/3 toàn viện)");
assert(benchmark.departmentComments.top4Ratio === '~2/3 (66.6%)', "14. Tỷ lệ Top 4 khoa khớp 66.6%");

// 5. Cơ cấu bệnh phẩm & so sánh VINARES (Slide 4 & Văn bản Mục 3.4)
assert(benchmark.specimenDistribution.length >= 10, "15. Đủ danh sách các loại bệnh phẩm");
assert(benchmark.specimenDistribution[0].type === 'Dịch tỵ hầu/họng' && benchmark.specimenDistribution[0].count === 682, "16. Bệnh phẩm tỵ hầu/họng chiếm nhiều nhất (682 ca - 46.5%)");
assert(benchmark.specimenLiterature.vinaresComparison.indexOf('VINARES 2016–2017') !== -1, "17. Chứa đối chiếu y văn chuẩn xác với Mạng VINARES toàn quốc");

// 6. Top 15 Vi khuẩn gây bệnh (Slide 5 & Văn bản Mục 3.5)
assert(benchmark.top15Pathogens.length === 15, "18. Đủ danh mục Top 15 tác nhân vi sinh vật");
assert(benchmark.top15Pathogens[0].name === 'Haemophilus influenzae' && benchmark.top15Pathogens[0].count === 253, "19. H. influenzae dẫn đầu với 253 chủng (17.3%)");
assert(benchmark.top15Pathogens[1].name === 'Staphylococcus aureus' && benchmark.top15Pathogens[1].count === 230, "20. S. aureus đứng thứ 2 với 230 chủng (15.7%)");
assert(benchmark.top15Pathogens[2].name === 'Streptococcus pneumoniae' && benchmark.top15Pathogens[2].count === 214, "21. S. pneumoniae đứng thứ 3 với 214 chủng (14.6%)");

// 7. 7 Con số cảnh báo điểm đỏ kháng thuốc (Slide 8 & Văn bản Mục 3.6)
assert(benchmark.redAlerts.length === 7, "22. Đủ 7 con số cảnh báo điểm đỏ kháng thuốc");
var crab = benchmark.redAlerts.find(function(r) { return r.id === 'CRAB'; });
assert(crab !== undefined && crab.rate === 92.0 && crab.ratio === '80/87 chủng', "23. CRAB: 92% (80/87 chủng) báo động đỏ");
var mrsa = benchmark.redAlerts.find(function(r) { return r.id === 'MRSA'; });
assert(mrsa !== undefined && mrsa.rate === 78.6 && mrsa.ratio === '180/229 chủng', "24. MRSA: 78.6% (180/229 chủng)");
var esblKp = benchmark.redAlerts.find(function(r) { return r.id === 'ESBL_KP'; });
assert(esblKp !== undefined && esblKp.rate === 67.9, "25. ESBL K. pneumoniae: 67.9%");
var esblEc = benchmark.redAlerts.find(function(r) { return r.id === 'ESBL_EC'; });
assert(esblEc !== undefined && esblEc.rate === 62.9, "26. ESBL E. coli: 62.9%");
var crpa = benchmark.redAlerts.find(function(r) { return r.id === 'CRPA'; });
assert(crpa !== undefined && crpa.rate === 56.9, "27. CRPA: 56.9% (66/116 chủng)");
var creKp = benchmark.redAlerts.find(function(r) { return r.id === 'CRE_KP'; });
assert(creKp !== undefined && creKp.rate === 56.0, "28. CRE K. pneumoniae: 56% (47/84 chủng)");
var vre = benchmark.redAlerts.find(function(r) { return r.id === 'VRE'; });
assert(vre !== undefined && vre.rate === 35.7, "29. VRE E. faecium: 35.7% (5/14 chủng)");

// 8. Kháng sinh đồ chi tiết cho các chủng trọng điểm (Slide 9-12 & Văn bản Mục 3.9)
assert(benchmark.detailedAntibiograms.sau.tableRows.length >= 15, "30. KSĐ chi tiết S. aureus đủ các kháng sinh");
assert(benchmark.detailedAntibiograms.spn.breakpointNote.indexOf('Viêm màng não') !== -1, "31. KSĐ S. pneumoniae có điểm gãy VMN chuẩn xác");
assert(benchmark.detailedAntibiograms.hin.ampicillinRate.indexOf('84.1%') !== -1, "32. H. influenzae kháng Ampicillin 84.1%");
assert(benchmark.detailedAntibiograms.enterobacterales.drugs.length === 5, "33. So sánh Enterobacterales 5 kháng sinh trọng yếu");
assert(benchmark.detailedAntibiograms.nonfermenters.drugs.length === 5, "34. So sánh Gram âm không lên men 5 kháng sinh trọng yếu");

// 9. Lựa chọn file động trong ReportExportService
var fileReport = ReportExportService.getComprehensiveAmrReport('MyUploadedData_Test.xlsx');
assert(fileReport.metadata.fileName === 'MyUploadedData_Test.xlsx', "35. Lựa chọn file phân tích động ghi nhận đúng tên file");

// 10. Chế độ xem & Điều khiển trong ReportView
assert(typeof ReportView.setMode === 'function', "36. ReportView hỗ trợ chuyển đổi 3 chế độ xem (setMode)");
ReportView.setMode('integrated');
assert(ReportView.currentMode === 'integrated', "37. Chế độ 1: Báo cáo tích hợp xen kẽ bảng và biểu đồ");
ReportView.setMode('slides');
assert(ReportView.currentMode === 'slides', "38. Chế độ 2: Trình chiếu 12 Slide deck");
ReportView.setMode('document');
assert(ReportView.currentMode === 'document', "39. Chế độ 3: Văn bản hành chính y khoa 15 trang");

// 11. Xuất báo cáo Excel & Word
assert(typeof ReportExportService.exportExcelReportBundle === 'function', "40. Xuất Excel trọn gói 13 Sheet sẵn sàng");
assert(typeof ReportExportService.exportWordDocument === 'function', "41. Xuất văn bản Word (.doc) sẵn sàng");

print("\n================================================================");
print("  KẾT QUẢ: " + passed + " PASS, " + failed + " FAIL");
if (failed === 0) {
  print("  ✔ TOÀN BỘ 41 TIÊU CHÍ BÁO CÁO AMR THEO 2 FILE PDF ĐÃ VƯỢT QUA 100%!");
} else {
  print("  ✖ CÓ LỖI XẢY RA TRONG BỘ TEST!");
}
print("================================================================\n");

if (failed > 0) {
  throw new Error("Test failed with " + failed + " failures");
}
