/**
 * ANALYTICS SERVICE - BAO-CAO-KHANG-THUOC
 * Động cơ phân tích vi sinh và giám sát kháng kháng sinh (AMR Surveillance Engine)
 * Tuân thủ nghiêm ngặt các công thức tại mục XLV & XLVI:
 * - R% = R / (S + I + R) * 100
 * - S% = S / (S + I + R) * 100
 * - I% = I / (S + I + R) * 100
 * - Loại trừ NA, NS, Not Tested khỏi mẫu số
 */

const AnalyticsService = {
  /**
   * Tính toán tỷ lệ S, I, R từ mảng kết quả AST
   * @param {Array} astList Danh sách bản ghi AST
   * @returns {Object} { total, denominator, sCount, iCount, rCount, sRate, iRate, rRate, naCount }
   */
  calculateRates(astList = []) {
    let sCount = 0;
    let iCount = 0;
    let rCount = 0;
    let naCount = 0;

    for (const item of astList) {
      const interp = (item.normalized_result || item.interpretation || '').toUpperCase().trim();
      if (interp === 'S') sCount++;
      else if (interp === 'I') iCount++;
      else if (interp === 'R') rCount++;
      else naCount++; // NA, NS, SD, Not tested
    }

    const denominator = sCount + iCount + rCount;

    // Tránh chia cho 0
    const sRate = denominator > 0 ? (sCount / denominator) * 100 : 0;
    const iRate = denominator > 0 ? (iCount / denominator) * 100 : 0;
    const rRate = denominator > 0 ? (rCount / denominator) * 100 : 0;

    return {
      totalRecords: astList.length,
      denominator,
      sCount,
      iCount,
      rCount,
      naCount,
      sRate: Math.round(sRate * 10) / 10,
      iRate: Math.round(iRate * 10) / 10,
      rRate: Math.round(rRate * 10) / 10
    };
  },

  /**
   * Phân tích phân bố vi khuẩn (Organism Distribution)
   */
  getOrganismDistribution(culturesList = []) {
    const counts = {};
    for (const c of culturesList) {
      const name = c.organism_name || 'Chưa định danh';
      counts[name] = (counts[name] || 0) + 1;
    }

    const total = culturesList.length || 1;
    const list = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / total) * 1000) / 10
    }));

    // Sắp xếp giảm dần theo số lượng
    list.sort((a, b) => b.count - a.count);
    return list;
  },

  /**
   * Phân tích phân bố bệnh phẩm (Specimen Distribution)
   */
  getSpecimenDistribution(specimensList = []) {
    const counts = {};
    for (const s of specimensList) {
      const type = s.specimen_type || 'Khác';
      counts[type] = (counts[type] || 0) + 1;
    }

    const total = specimensList.length || 1;
    const list = Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      percent: Math.round((count / total) * 1000) / 10
    }));

    list.sort((a, b) => b.count - a.count);
    return list;
  },

  /**
   * Tạo bảng ANTIBIOGRAM cho vi khuẩn đã chọn (Section XX)
   * @param {Array} astList Danh sách kết quả AST
   * @param {string} organismName Tên vi khuẩn (hoặc 'ALL')
   * @param {string} specimenType Loại bệnh phẩm (hoặc 'ALL')
   * @returns {Array} Bảng kết quả từng kháng sinh { antibiotic, sCount, iCount, rCount, total, sRate, iRate, rRate }
   */
  generateAntibiogram(astList = [], organismName = 'ALL', specimenType = 'ALL') {
    let filtered = astList;

    if (organismName && organismName !== 'ALL') {
      filtered = filtered.filter(item => 
        item.organism_name === organismName || item.organism_code === organismName
      );
    }

    if (specimenType && specimenType !== 'ALL') {
      filtered = filtered.filter(item => item.specimen_type === specimenType);
    }

    // Nhóm theo Kháng sinh
    const grouped = {};
    for (const item of filtered) {
      const code = item.antibiotic_code || 'OTHER';
      const name = item.antibiotic_name || code;
      if (!grouped[code]) {
        grouped[code] = {
          code,
          name,
          items: []
        };
      }
      grouped[code].items.push(item);
    }

    const rows = [];
    for (const code in grouped) {
      const group = grouped[code];
      const stats = this.calculateRates(group.items);
      if (stats.denominator > 0) {
        rows.push({
          code: group.code,
          name: group.name,
          sCount: stats.sCount,
          iCount: stats.iCount,
          rCount: stats.rCount,
          total: stats.denominator,
          sRate: stats.sRate,
          iRate: stats.iRate,
          rRate: stats.rRate
        });
      }
    }

    // Sắp xếp theo tỷ lệ kháng giảm dần hoặc theo tên
    rows.sort((a, b) => b.rRate - a.rRate);
    return rows;
  },

  /**
   * Tạo ma trận HEATMAP Kháng thuốc: Vi khuẩn (Hàng) x Kháng sinh (Cột) -> %R (Section XXI)
   */
  generateHeatmap(astList = [], targetOrganisms = [], targetAntibiotics = []) {
    const orgs = targetOrganisms.length > 0 
      ? targetOrganisms 
      : [...new Set(astList.map(a => a.organism_name))].slice(0, 8);

    const abxs = targetAntibiotics.length > 0
      ? targetAntibiotics
      : ['AMP', 'AMC', 'TZP', 'CTX', 'CRO', 'CAZ', 'FEP', 'MEM', 'CIP', 'AMK'];

    const matrix = [];

    for (const org of orgs) {
      const row = { organism: org, cells: {} };
      for (const abx of abxs) {
        const matches = astList.filter(a => 
          a.organism_name === org && (a.antibiotic_code === abx || a.antibiotic_short_name === abx)
        );
        const stats = this.calculateRates(matches);
        row.cells[abx] = {
          count: stats.denominator,
          rRate: stats.denominator > 0 ? stats.rRate : null,
          sRate: stats.denominator > 0 ? stats.sRate : null
        };
      }
      matrix.push(row);
    }

    return { antibiotics: abxs, matrix };
  },

  /**
   * Xu hướng kháng thuốc theo thời gian (Trend Analysis - Section XXVIII)
   */
  getResistanceTrend(astList = [], organism = 'Escherichia coli', antibiotic = 'CRO') {
    const filtered = astList.filter(a => 
      (organism === 'ALL' || a.organism_name === organism) &&
      (antibiotic === 'ALL' || a.antibiotic_code === antibiotic)
    );

    // Nhóm theo Tháng hoặc Năm
    const timeGroups = {};
    for (const item of filtered) {
      const dateStr = item.culture_date || item.tested_date || item.created_at;
      if (!dateStr) continue;
      const key = dateStr.substring(0, 7); // YYYY-MM
      if (!timeGroups[key]) timeGroups[key] = [];
      timeGroups[key].push(item);
    }

    const sortedKeys = Object.keys(timeGroups).sort();
    return sortedKeys.map(key => {
      const stats = this.calculateRates(timeGroups[key]);
      return {
        period: key,
        total: stats.denominator,
        rRate: stats.rRate,
        sRate: stats.sRate,
        iRate: stats.iRate
      };
    });
  },

  /**
   * Phân tích theo khoa phòng (Section XXIII)
   */
  getResistanceByDepartment(astList = [], specimensList = [], organism = 'Escherichia coli', antibiotic = 'CRO') {
    // Map specimen_id to department
    const specDeptMap = {};
    for (const s of specimensList) {
      specDeptMap[s.id] = s.requesting_department || 'Khác';
    }

    const filtered = astList.filter(a => 
      (organism === 'ALL' || a.organism_name === organism) &&
      (antibiotic === 'ALL' || a.antibiotic_code === antibiotic)
    );

    const deptGroups = {};
    for (const item of filtered) {
      const dept = item.department || specDeptMap[item.specimen_id] || 'Chưa rõ';
      if (!deptGroups[dept]) deptGroups[dept] = [];
      deptGroups[dept].push(item);
    }

    const result = [];
    for (const dept in deptGroups) {
      const stats = this.calculateRates(deptGroups[dept]);
      if (stats.denominator > 0) {
        result.push({
          department: dept,
          total: stats.denominator,
          sRate: stats.sRate,
          iRate: stats.iRate,
          rRate: stats.rRate
        });
      }
    }

    result.sort((a, b) => b.rRate - a.rRate);
    return result;
  }
};

if (typeof window !== 'undefined') {
  window.AnalyticsService = AnalyticsService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnalyticsService };
}
