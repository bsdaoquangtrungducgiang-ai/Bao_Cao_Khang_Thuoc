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
      else if (interp === 'I' || interp === 'SD') iCount++;
      else if (interp === 'R' || interp === 'NS') rCount++;
      else naCount++; // NA, Not tested
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
   * @param {string|Array} targetAntibiotics Kháng sinh cần lọc (mặc định 'ALL' tách đủ 63 loại)
   * @returns {Array} Bảng kết quả từng kháng sinh { stt, code, name, indication, group, sCount, iCount, rCount, total, sRate, iRate, rRate }
   */
  generateAntibiogram(astList = [], organismName = 'ALL', specimenType = 'ALL', department = 'ALL', gender = 'ALL', year = 'ALL', targetAntibiotics = 'ALL') {
    // Hỗ trợ truyền theo dạng options object: generateAntibiogram(astList, { organism, specimen, department, gender, year, antibiotic })
    if (organismName && typeof organismName === 'object' && !Array.isArray(organismName)) {
      const opts = organismName;
      organismName = opts.organism || opts.organismName || opts.organisms || 'ALL';
      specimenType = opts.specimen || opts.specimenType || opts.specimens || 'ALL';
      department = opts.department || opts.departments || 'ALL';
      gender = opts.gender || opts.sex || 'ALL';
      year = opts.year || 'ALL';
      targetAntibiotics = opts.antibiotic || opts.antibiotics || opts.targetAntibiotics || 'ALL';
    }

    let patMap = null;
    const getPatInfo = (item) => {
      let dept = item.department || item.requesting_department || '';
      let sex = item.sex || item.gender || '';
      if (!dept || !sex) {
        if (!patMap) {
          patMap = new Map();
          const patients = (typeof window !== 'undefined' && (
            window.App?.state?.surveillanceData?.patients || 
            window.DemoDataService?.data?.patients || 
            window.DemoDataService?.getAll()?.patients
          )) || [];
          patients.forEach(p => {
            if (p.patient_code) patMap.set(String(p.patient_code).trim(), p);
            if (p.id) patMap.set(String(p.id).trim(), p);
          });
        }
        const pCode = String(item.patient_code || '').trim();
        const pId = String(item.patient_id || '').trim();
        const pat = (pCode && patMap.get(pCode)) || (pId && patMap.get(pId));
        if (pat) {
          if (!dept) dept = pat.department || '';
          if (!sex) sex = pat.sex || pat.gender || '';
        }
      }
      return { department: dept, sex: sex };
    };

    // Helper chuẩn hóa vi khuẩn chống lệch chính tả (Acinetobacter baumannii vs Acinetobacter baumanii)
    const normOrg = (o) => {
      if (!o) return '';
      const s = String(o).trim().toLowerCase();
      if (typeof DataNormalization !== 'undefined' && DataNormalization.normalizeOrganism) {
        const res = DataNormalization.normalizeOrganism(s);
        if (res && res.name) return res.name.trim().toLowerCase();
      }
      return s;
    };

    // Helper chuẩn hóa khoa phòng chống lệch dấu gạch nối, khoảng trắng thừa
    const normDept = (d) => {
      return String(d || '')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\u00A0\s]+/g, ' ')
        .trim()
        .toLowerCase();
    };

    const matchDept = (itemDept, targetDept) => {
      const d1 = normDept(itemDept);
      const d2 = normDept(targetDept);
      if (!d1 || !d2) return false;
      if (d1 === d2) return true;
      const c1 = d1.replace(/^(khoa|phòng|đơn nguyên|khám)\s+/i, '');
      const c2 = d2.replace(/^(khoa|phòng|đơn nguyên|khám)\s+/i, '');
      return c1 === c2 || c1.includes(c2) || c2.includes(c1) || d1.includes(d2) || d2.includes(d1);
    };

    // Helper chuẩn hóa bệnh phẩm
    const normSpec = (s) => String(s || '').replace(/[\u00A0\s]+/g, ' ').trim().toLowerCase();
    const matchSpec = (itemSpec, targetSpec) => {
      const s1 = normSpec(itemSpec);
      const s2 = normSpec(targetSpec);
      if (!s1 || !s2) return false;
      return s1 === s2 || s1.includes(s2) || s2.includes(s1);
    };

    let filtered = astList;

    // 1. Lọc Vi khuẩn (1 hoặc nhiều vi khuẩn hoặc tất cả - Hỗ trợ alias & chuẩn hóa)
    if (organismName && organismName !== 'ALL') {
      const targetOrgList = Array.isArray(organismName) ? organismName : [organismName];
      if (targetOrgList.length > 0 && !targetOrgList.includes('ALL')) {
        const targetNorms = targetOrgList.map(o => normOrg(o)).filter(Boolean);
        const targetRaws = targetOrgList.map(o => String(o).trim().toLowerCase()).filter(Boolean);

        filtered = filtered.filter(item => {
          const itemOrg = normOrg(item.organism_name);
          const itemRaw = String(item.organism_name || '').trim().toLowerCase();
          const itemCode = String(item.organism_code || '').trim().toLowerCase();

          return targetNorms.some((tNorm, idx) => {
            const tRaw = targetRaws[idx] || tNorm;
            return (
              itemOrg === tNorm ||
              itemRaw === tRaw ||
              itemCode === tRaw ||
              itemOrg.includes(tNorm) ||
              tNorm.includes(itemOrg) ||
              itemRaw.includes(tRaw) ||
              tRaw.includes(itemRaw)
            );
          });
        });
      }
    }

    // 2. Lọc Bệnh phẩm (1 hoặc nhiều bệnh phẩm hoặc tất cả)
    if (specimenType && specimenType !== 'ALL') {
      const targetSpecList = Array.isArray(specimenType) ? specimenType : [specimenType];
      if (targetSpecList.length > 0 && !targetSpecList.includes('ALL')) {
        filtered = filtered.filter(item => {
          const s = item.specimen_type;
          return targetSpecList.some(target => matchSpec(s, target));
        });
      }
    }

    // 3. Lọc Khoa phòng (1 hoặc nhiều khoa phòng hoặc tất cả - mặc định: tất cả)
    if (department && department !== 'ALL') {
      const targetDeptList = Array.isArray(department) ? department : [department];
      if (targetDeptList.length > 0 && !targetDeptList.includes('ALL')) {
        filtered = filtered.filter(item => {
          const info = getPatInfo(item);
          const itemDept = info.department;
          return targetDeptList.some(target => matchDept(itemDept, target));
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
          return itemGender === 'nam' || itemGender === 'm' || itemGender === 'male' || itemGender === 'trai' || itemGender === '1';
        }
        if (g === 'nu' || g === 'nữ' || g === 'f' || g === 'female') {
          return itemGender === 'nu' || itemGender === 'nữ' || itemGender === 'f' || itemGender === 'female' || itemGender === 'gai' || itemGender === '0';
        }
        return itemGender === g;
      });
    }

    // 5. Lọc Năm (Hỗ trợ YYYY-MM-DD, DD/MM/YYYY, HH:mm DD/MM/YYYY, Year-only)
    if (year && year !== 'ALL') {
      const yStr = String(year).trim();
      const shortYear = yStr.slice(-2);
      filtered = filtered.filter(item => {
        const d = String(item.tested_date || item.culture_date || item.collection_date || item.created_at || '').trim();
        if (!d) return true; // Không loại trừ bản ghi nếu ngày chưa điền
        if (d.includes(yStr)) return true;
        const m = d.match(/\b(19\d\d|20\d\d)\b/);
        if (m) return m[1] === yStr;
        const shortMatch = d.match(/\b\d{1,2}[-\/.]\d{1,2}[-\/.](\d{2})\b/);
        if (shortMatch && shortMatch[1] === shortYear) return true;
        return true;
      });
    }

    // 6. Lọc Kháng sinh (1 hoặc nhiều kháng sinh hoặc tất cả 63 loại)
    if (targetAntibiotics && targetAntibiotics !== 'ALL') {
      const targetAbxList = Array.isArray(targetAntibiotics) ? targetAntibiotics : [targetAntibiotics];
      if (targetAbxList.length > 0 && !targetAbxList.includes('ALL')) {
        const targetClean = targetAbxList.map(a => String(a || '').trim().toLowerCase()).filter(Boolean);
        filtered = filtered.filter(item => {
          const itemCode = String(item.antibiotic_code || '').trim().toLowerCase();
          const itemRaw = String(item.antibiotic_raw || '').trim().toLowerCase();
          const cleanItemCode = itemCode.replace(/[^a-z0-9]/g, '');
          return targetClean.some(t => {
            const cleanT = t.replace(/[^a-z0-9]/g, '');
            return itemCode === t || itemRaw === t || cleanItemCode === cleanT;
          });
        });
      }
    }

    // Tra cứu danh mục 63 kháng sinh chuẩn để gán đúng Tên và Chỉ định điều trị lâm sàng
    const catalog = (typeof window !== 'undefined' && window.DataNormalization?.antibioticCatalog) ||
      (typeof DataNormalization !== 'undefined' && DataNormalization.antibioticCatalog) || [];

    const getAbxMeta = (code, rawName) => {
      const clean = String(code || '').trim().toLowerCase();
      const cleanNoSep = clean.replace(/[^a-z0-9]/g, '');
      const match = catalog.find(a => 
        a.code.toLowerCase() === clean || 
        a.code.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNoSep
      );
      if (match) {
        return {
          stt: match.stt,
          code: match.code,
          name: match.name,
          indication: match.indication,
          group: match.group,
          class: match.class
        };
      }
      return {
        stt: 999,
        code: code,
        name: rawName || code,
        indication: '',
        group: 'Khác',
        class: 'Khác'
      };
    };

    // Nhóm theo Kháng sinh (Tách đủ từng loại kháng sinh, không gộp peng01-05 hay CTX01-03)
    const grouped = {};
    for (const item of filtered) {
      const code = item.antibiotic_code || 'OTHER';
      if (!grouped[code]) {
        const meta = getAbxMeta(code, item.antibiotic_name);
        grouped[code] = {
          code: meta.code,
          name: meta.name,
          indication: meta.indication,
          group: meta.group,
          class: meta.class,
          stt: meta.stt,
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
          stt: group.stt,
          code: group.code,
          name: group.name,
          indication: group.indication,
          group: group.group,
          class: group.class,
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

    // Sắp xếp theo STT danh mục chuẩn 63 kháng sinh (1..63) rồi theo tỷ lệ kháng giảm dần
    rows.sort((a, b) => (a.stt || 999) - (b.stt || 999) || (b.rRate - a.rRate));
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
