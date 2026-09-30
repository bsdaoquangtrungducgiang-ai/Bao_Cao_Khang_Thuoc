/**
 * REPORT EXPORT SERVICE - BAO-CAO-KHANG-THUOC
 * Tạo báo cáo giám sát kháng kháng sinh 9 phần và xuất bản PDF / Excel / CSV
 * Tuân thủ yêu cầu các mục XXX & XXXI
 */

const ReportExportService = {
  /**
   * Tạo gói dữ liệu báo cáo giám sát hoàn chỉnh 9 phần
   */
  generateFullReportData(filters = {}) {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    const allAst = data.astResults || [];
    const allCultures = data.cultures || [];
    const allSpecimens = data.specimens || [];

    // Áp dụng bộ lọc nếu có
    let filteredAst = allAst;
    let reportCultures = allCultures;
    let reportSpecimens = allSpecimens;

    if (filters.file && filters.file !== 'ALL') {
      filteredAst = filteredAst.filter(a => a.file_name === filters.file || a.import_job_id === filters.file);
      reportCultures = reportCultures.filter(c => c.file_name === filters.file || c.import_job_id === filters.file);
      reportSpecimens = reportSpecimens.filter(s => s.file_name === filters.file || s.import_job_id === filters.file);
    }
    if (filters.organism && filters.organism !== 'ALL') {
      filteredAst = filteredAst.filter(a => a.organism_name === filters.organism);
    }
    if (filters.specimenType && filters.specimenType !== 'ALL') {
      filteredAst = filteredAst.filter(a => a.specimen_type === filters.specimenType);
    }

    // 1. Tổng quan
    const kpiRates = window.AnalyticsService.calculateRates(filteredAst);

    // 2. Phân bố vi khuẩn
    const orgDist = window.AnalyticsService.getOrganismDistribution(reportCultures);

    // 3. Phân bố bệnh phẩm
    const specDist = window.AnalyticsService.getSpecimenDistribution(reportSpecimens);

    // 4. Antibiogram
    const targetOrg = filters.organism !== 'ALL' ? filters.organism : 'Escherichia coli';
    const antibiogram = window.AnalyticsService.generateAntibiogram(allAst, targetOrg);

    // 5. Heatmap
    const heatmap = window.AnalyticsService.generateHeatmap(allAst);

    // 6. Xu hướng thời gian
    const trends = window.AnalyticsService.getResistanceTrend(allAst, 'Escherichia coli', 'CRO');

    // 7. Kháng theo khoa
    const deptRes = window.AnalyticsService.getResistanceByDepartment(allAst, allSpecimens, 'Escherichia coli', 'CRO');

    // 8. So sánh các năm
    const yearComp = window.SpecializedAMRService.compareYears(allAst, 'Escherichia coli', 'CRO');

    // 9. Giám sát vi khuẩn đa kháng
    const mdrStats = window.SpecializedAMRService.analyzeMDR(allAst, allCultures);

    const currentUser = window.AuthService?.getProfile() || { full_name: 'TS.BS. Nguyễn Văn An' };

    return {
      metadata: {
        hospitalName: window.CONFIG?.ORGANIZATION_NAME || 'BỆNH VIỆN ĐA KHOA TRUNG TÂM',
        departmentName: window.CONFIG?.DEPARTMENT_NAME || 'Khoa Vi Sinh',
        title: 'BÁO CÁO GIÁM SÁT TÌNH HÌNH KHÁNG KHÁNG SINH (AMR SURVEILLANCE REPORT)',
        createdAt: new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        author: currentUser.full_name,
        filtersApplied: {
          period: filters.time || 'Năm 2026',
          organism: filters.organism || 'Toàn bộ vi khuẩn',
          specimen: filters.specimenType || 'Toàn bộ bệnh phẩm'
        }
      },
      summary: kpiRates,
      orgDistribution: orgDist,
      specDistribution: specDist,
      antibiogram,
      heatmap,
      trends,
      departmentResistance: deptRes,
      yearComparison: yearComp,
      mdrStats
    };
  },

  /**
   * Xuất toàn bộ báo cáo sang file Excel nhiều Sheet (Mục XXXI)
   */
  exportExcelReportBundle(reportData) {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Tổng quan & Chỉ số
    const summarySheetData = [
      ['BÁO CÁO GIÁM SÁT KHÁNG KHÁNG SINH BỆNH VIỆN'],
      ['Đơn vị:', reportData.metadata.departmentName],
      ['Thời gian tạo:', reportData.metadata.createdAt],
      ['Người lập:', reportData.metadata.author],
      [],
      ['CHỈ SỐ TỔNG QUAN', 'GIÁ TRỊ'],
      ['Tổng số kết quả AST', reportData.summary.totalRecords],
      ['Mẫu số tính toán (S+I+R)', reportData.summary.denominator],
      ['Tỷ lệ Nhạy cảm (%S)', `${reportData.summary.sRate}%`],
      ['Tỷ lệ Trung gian (%I)', `${reportData.summary.iRate}%`],
      ['Tỷ lệ Kháng thuốc (%R)', `${reportData.summary.rRate}%`],
      ['Tỷ lệ vi khuẩn Đa kháng (MDR)', `${reportData.mdrStats.mdrRate}%`]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tong_Quan');

    // Sheet 2: Antibiogram
    const abgRows = reportData.antibiogram.map(r => ({
      'Mã kháng sinh': r.code,
      'Tên kháng sinh': r.name,
      'Số mẫu Nhạy (S)': r.sCount,
      'Tỷ lệ Nhạy (%S)': `${r.sRate}%`,
      'Số mẫu Trung gian (I)': r.iCount,
      'Tỷ lệ Trung gian (%I)': `${r.iRate}%`,
      'Số mẫu Kháng (R)': r.rCount,
      'Tỷ lệ Kháng (%R)': `${r.rRate}%`,
      'Tổng số mẫu': r.total
    }));
    const wsAbg = XLSX.utils.json_to_sheet(abgRows);
    XLSX.utils.book_append_sheet(wb, wsAbg, 'Antibiogram');

    // Sheet 3: Phân bố vi khuẩn
    const orgRows = reportData.orgDistribution.map(o => ({
      'Vi khuẩn phân lập': o.name,
      'Số lượng mẫu': o.count,
      'Tỷ lệ (%)': `${o.percent}%`
    }));
    const wsOrg = XLSX.utils.json_to_sheet(orgRows);
    XLSX.utils.book_append_sheet(wb, wsOrg, 'Phan_Bo_Vi_Khuan');

    // Sheet 4: So sánh các năm
    const yearRows = reportData.yearComparison.map(y => ({
      'Năm giám sát': y.year,
      'Tổng số mẫu': y.total,
      'Tỷ lệ Kháng (%R)': `${y.rRate}%`,
      'Tỷ lệ Nhạy (%S)': `${y.sRate}%`,
      'Tỷ lệ Trung gian (%I)': `${y.iRate}%`
    }));
    const wsYears = XLSX.utils.json_to_sheet(yearRows);
    XLSX.utils.book_append_sheet(wb, wsYears, 'Xu_Huong_Cac_Nam');

    XLSX.writeFile(wb, `Bao_Cao_AMR_${new Date().toISOString().split('T')[0]}.xlsx`);
    window.Toast.success('Đã xuất toàn bộ tập báo cáo AMR sang file Excel thành công!');
  }
};

if (typeof window !== 'undefined') {
  window.ReportExportService = ReportExportService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReportExportService };
}
