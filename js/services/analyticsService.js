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
   * @param {string|Array|Object} organismName Tên vi khuẩn hoặc mảng các vi khuẩn (hoặc 'ALL', hoặc options object)
   * @param {string|Array} specimenType Loại bệnh phẩm hoặc mảng các bệnh phẩm (hoặc 'ALL')
   * @param {string|Array} department Khoa phòng hoặc mảng các khoa phòng (mặc định 'ALL')
   * @param {string} gender Giới tính (mặc định 'ALL')
   * @param {string} year Năm xét nghiệm (mặc định 'ALL')
   * @returns {Array} Bảng kết quả từng kháng sinh { antibiotic, sCount, iCount, rCount, total, sRate, iRate, rRate }
   */
  generateAntibiogram(astList = [], organismName = 'ALL', specimenType = 'ALL', department = 'ALL', gender = 'ALL', year = 'ALL') {
    // Hỗ trợ truyền theo dạng options object: generateAntibiogram(astList, { organism, specimen, department, gender, year })
    if (organismName && typeof organismName === 'object' && !Array.isArray(organismName)) {
      const opts = organismName;
      organismName = opts.organism || opts.organismName || opts.organisms || 'ALL';
      specimenType = opts.specimen || opts.specimenType || opts.specimens || 'ALL';
      department = opts.department || opts.departments || 'ALL';
      gender = opts.gender || opts.sex || 'ALL';
      year = opts.year || 'ALL';
    }

    let patMap = null;
    const getPatInfo = (item) => {
      let dept = item.department || item.requesting_department || '';
      let sex = item.sex || item.gender || '';
      if (!dept || !sex) {
        if (!patMap) {
          patMap = new Map();
          const patients = (typeof window !== 'undefined' && (window.App?.state?.surveillanceData?.patients || window.DemoDataService?.data?.patients)) || [];
          patients.forEach(p => {
            if (p.patient_code) patMap.set(p.patient_code, p);
            if (p.id) patMap.set(p.id, p);
          });
        }
        const pat = (item.patient_code && patMap.get(item.patient_code)) || (item.patient_id && patMap.get(item.patient_id));
        if (pat) {
          if (!dept) dept = pat.department || '';
          if (!sex) sex = pat.sex || pat.gender || '';
        }
      }
      return { department: dept, sex: sex };
    };

    let filtered = astList;

    // 1. Lọc Vi khuẩn (1 hoặc nhiều vi khuẩn hoặc tất cả)
    if (organismName && organismName !== 'ALL') {
      if (Array.isArray(organismName)) {
        if (organismName.length > 0 && !organismName.includes('ALL')) {
          const orgSet = new Set(organismName.map(o => String(o).trim().toLowerCase()));
          filtered = filtered.filter(item => {
            const o1 = String(item.organism_name || '').trim().toLowerCase();
            const o2 = String(item.organism_code || '').trim().toLowerCase();
            return orgSet.has(o1) || orgSet.has(o2);
          });
        }
      } else {
        const orgTarget = String(organismName).trim().toLowerCase();
        filtered = filtered.filter(item => 
          String(item.organism_name || '').trim().toLowerCase() === orgTarget || 
          String(item.organism_code || '').trim().toLowerCase() === orgTarget
        );
      }
    }

    // 2. Lọc Bệnh phẩm (1 hoặc nhiều bệnh phẩm hoặc tất cả)
    if (specimenType && specimenType !== 'ALL') {
      if (Array.isArray(specimenType)) {
        if (specimenType.length > 0 && !specimenType.includes('ALL')) {
          const specSet = new Set(specimenType.map(s => String(s).trim().toLowerCase()));
          filtered = filtered.filter(item => 
            specSet.has(String(item.specimen_type || '').trim().toLowerCase())
          );
        }
      } else {
        const specTarget = String(specimenType).trim().toLowerCase();
        filtered = filtered.filter(item => 
          String(item.specimen_type || '').trim().toLowerCase() === specTarget
        );
      }
    }

    // 3. Lọc Khoa phòng (1 hoặc nhiều khoa phòng hoặc tất cả - mặc định: tất cả)
    if (department && department !== 'ALL') {
      if (Array.isArray(department)) {
        if (department.length > 0 && !department.includes('ALL')) {
          const deptSet = new Set(department.map(d => String(d).trim().toLowerCase()));
          filtered = filtered.filter(item => {
            const info = getPatInfo(item);
            return deptSet.has(String(info.department || '').trim().toLowerCase());
          });
        }
      } else {
        const deptTarget = String(department).trim().toLowerCase();
        filtered = filtered.filter(item => {
          const info = getPatInfo(item);
          return String(info.department || '').trim().toLowerCase() === deptTarget;
        });
      }
    }

    // 4. Lọc Giới tính (mặc định: tất cả)
    if (gender && gender !== 'ALL') {
      const g = String(gender).trim().toLowerCase();
      filtered = filtered.filter(item => {
        const info = getPatInfo(item);
        const itemGender = String(info.sex || '').trim().toLowerCase();
        if (g === 'nam' || g === 'm' || g === 'male') {
          return itemGender === 'nam' || itemGender === 'm' || itemGender === 'male';
        }
        if (g === 'nu' || g === 'nữ' || g === 'f' || g === 'female') {
          return itemGender === 'nu' || itemGender === 'nữ' || itemGender === 'f' || itemGender === 'female';
        }
        return itemGender === g;
      });
    }

    // 5. Lọc Năm (nếu có)
    if (year && year !== 'ALL') {
      const yStr = String(year).trim();
      filtered = filtered.filter(item => {
        const d = String(item.tested_date || item.culture_date || item.collection_date || '');
        return d.startsWith(yStr);
      });
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
