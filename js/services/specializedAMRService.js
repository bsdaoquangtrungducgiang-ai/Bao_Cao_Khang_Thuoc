/**
 * SPECIALIZED AMR SURVEILLANCE SERVICE - BAO-CAO-KHANG-THUOC
 * Xử lý các báo cáo chuyên sâu: Antibiogram, Heatmap, MDR/XDR, ESBL, Carbapenem, MRSA, So sánh các năm
 * Tuân thủ nghiêm ngặt các mục XIX đến XXIX
 */

const SpecializedAMRService = {
  /**
   * Tính toán Phân tích Chuyên biệt MDR / XDR / PDR (Section XXIV)
   * Tiêu chuẩn chuẩn hóa theo CDC/ECDC (Magiorakos et al.)
   * MDR: Kháng >= 1 kháng sinh trong >= 3 nhóm kháng sinh
   * XDR: Kháng trong tất cả ngoại trừ <= 2 nhóm
   * PDR: Kháng tất cả các nhóm kháng sinh thử nghiệm
   */
  analyzeMDR(astList = [], culturesList = []) {
    // Nhóm kết quả theo từng Culture (chủng vi khuẩn phân lập)
    const cultureAstMap = {};
    for (const item of astList) {
      if (!cultureAstMap[item.culture_id]) {
        cultureAstMap[item.culture_id] = {
          culture_id: item.culture_id,
          organism_name: item.organism_name,
          patient_code: item.patient_code,
          specimen_type: item.specimen_type,
          tested_date: item.tested_date || item.culture_date,
          resistantGroups: new Set(),
          sensitiveGroups: new Set(),
          allTestedGroups: new Set(),
          astItems: []
        };
      }

      const rec = cultureAstMap[item.culture_id];
      rec.astItems.push(item);

      // Tra cứu nhóm kháng sinh
      const abxCode = item.antibiotic_code;
      const abxObj = window.DemoDataService?.data?.antibiotics?.find(a => a.antibiotic_code === abxCode);
      const groupName = abxObj?.antibiotic_group || item.antibiotic_group || 'Other';

      rec.allTestedGroups.add(groupName);

      const interp = (item.normalized_result || item.interpretation || '').toUpperCase();
      if (interp === 'R') {
        rec.resistantGroups.add(groupName);
      } else if (interp === 'S') {
        rec.sensitiveGroups.add(groupName);
      }
    }

    let mdrCount = 0;
    let xdrCount = 0;
    let pdrCount = 0;
    let nonMdrCount = 0;

    const classifiedIsolates = [];

    for (const id in cultureAstMap) {
      const c = cultureAstMap[id];
      const numGroupsTested = c.allTestedGroups.size;
      const numResistantGroups = c.resistantGroups.size;
      const numSensitiveGroups = c.sensitiveGroups.size;

      let classification = 'Non-MDR';
      let badgeClass = 'badge-s';

      if (numGroupsTested >= 3) {
        if (numSensitiveGroups === 0 && numResistantGroups >= 3) {
          classification = 'PDR (Toàn kháng)';
          badgeClass = 'badge-pdr';
          pdrCount++;
        } else if (numSensitiveGroups <= 2 && numResistantGroups >= 3) {
          classification = 'XDR (Kháng mở rộng)';
          badgeClass = 'badge-xdr';
          xdrCount++;
        } else if (numResistantGroups >= 3) {
          classification = 'MDR (Đa kháng)';
          badgeClass = 'badge-mdr';
          mdrCount++;
        } else {
          nonMdrCount++;
        }
      } else {
        nonMdrCount++;
      }

      classifiedIsolates.push({
        ...c,
        classification,
        badgeClass,
        resistantCount: numResistantGroups,
        testedCount: numGroupsTested
      });
    }

    const totalIsolates = Object.keys(cultureAstMap).length || 1;
    return {
      totalIsolates,
      mdrCount,
      xdrCount,
      pdrCount,
      nonMdrCount,
      mdrRate: Math.round(((mdrCount + xdrCount + pdrCount) / totalIsolates) * 1000) / 10,
      xdrRate: Math.round((xdrCount / totalIsolates) * 1000) / 10,
      pdrRate: Math.round((pdrCount / totalIsolates) * 1000) / 10,
      isolates: classifiedIsolates
    };
  },

  /**
   * Giám sát Kháng Carbapenem (Section XXVI - CRE, CRAB, CRPA)
   * Meropenem (MEM), Imipenem (IPM), Ertapenem (ETP)
   */
  analyzeCarbapenemResistance(astList = []) {
    const carbapenemCodes = ['MEM', 'IPM', 'ETP'];
    const targetOrganisms = ['Escherichia coli', 'Klebsiella pneumoniae', 'Pseudomonas aeruginosa', 'Acinetobacter baumannii'];

    const results = {};

    targetOrganisms.forEach(org => {
      results[org] = {};
      carbapenemCodes.forEach(abx => {
        const matches = astList.filter(a => 
          a.organism_name === org && a.antibiotic_code === abx
        );
        const stats = window.AnalyticsService.calculateRates(matches);
        results[org][abx] = stats;
      });
    });

    return results;
  },

  /**
   * Giám sát Tụ cầu vàng kháng Methicillin (Section XXVII - MRSA)
   * Staphylococcus aureus: MSSA vs MRSA (dựa trên Cefoxitin FOX hoặc Oxacillin OXA hoặc Phenotype flag)
   */
  analyzeMRSA(astList = []) {
    const staphResults = astList.filter(a => 
      a.organism_name === 'Staphylococcus aureus'
    );

    // Tìm các chủng S. aureus có thử nghiệm Cefoxitin (FOX) hoặc Oxacillin hoặc kháng Beta-lactam
    const cultureMap = {};
    staphResults.forEach(item => {
      if (!cultureMap[item.culture_id]) {
        cultureMap[item.culture_id] = {
          culture_id: item.culture_id,
          patient_code: item.patient_code,
          isMRSA: false,
          isMSSA: true,
          items: []
        };
      }
      cultureMap[item.culture_id].items.push(item);

      // Nếu kháng Oxacillin, Cefoxitin hoặc Ampicillin/Beta-lactams
      const interp = (item.normalized_result || item.interpretation || '').toUpperCase();
      if ((item.antibiotic_code === 'FOX' || item.antibiotic_code === 'OXA' || item.antibiotic_code === 'AMP') && interp === 'R') {
        cultureMap[item.culture_id].isMRSA = true;
        cultureMap[item.culture_id].isMSSA = false;
      }
    });

    const totalStaph = Object.keys(cultureMap).length || 1;
    let mrsaCount = 0;
    for (const id in cultureMap) {
      if (cultureMap[id].isMRSA) mrsaCount++;
    }

    const mssaCount = totalStaph - mrsaCount;
    return {
      totalStaph,
      mrsaCount,
      mssaCount,
      mrsaRate: Math.round((mrsaCount / totalStaph) * 1000) / 10,
      mssaRate: Math.round((mssaCount / totalStaph) * 1000) / 10
    };
  },

  /**
   * Giám sát Vi khuẩn Tiết Men ESBL (Section XXV)
   * E. coli & K. pneumoniae kháng Cephalosporin thế hệ 3 (CRO, CTX, CAZ)
   */
  analyzeESBL(astList = []) {
    const enterobacterales = astList.filter(a => 
      a.organism_name === 'Escherichia coli' || a.organism_name === 'Klebsiella pneumoniae'
    );

    const cultureMap = {};
    enterobacterales.forEach(item => {
      if (!cultureMap[item.culture_id]) {
        cultureMap[item.culture_id] = {
          culture_id: item.culture_id,
          organism: item.organism_name,
          patient_code: item.patient_code,
          suspectedESBL: false,
          items: []
        };
      }
      cultureMap[item.culture_id].items.push(item);

      // Nghi ngờ ESBL khi kháng Ceftriaxone (CRO), Cefotaxime (CTX) hoặc Ceftazidime (CAZ)
      const interp = (item.normalized_result || item.interpretation || '').toUpperCase();
      if (['CRO', 'CTX', 'CAZ'].includes(item.antibiotic_code) && (interp === 'R' || interp === 'I')) {
        cultureMap[item.culture_id].suspectedESBL = true;
      }
    });

    const totalCultures = Object.keys(cultureMap).length || 1;
    let esblCount = 0;
    for (const id in cultureMap) {
      if (cultureMap[id].suspectedESBL) esblCount++;
    }

    return {
      totalCultures,
      esblCount,
      nonEsblCount: totalCultures - esblCount,
      esblRate: Math.round((esblCount / totalCultures) * 1000) / 10
    };
  },

  /**
   * So sánh xu hướng kháng qua các năm (Section XXIX: 2024 vs 2025 vs 2026)
   */
  compareYears(astList = [], organism = 'Escherichia coli', antibiotic = 'CRO') {
    // Demo multi-year baseline data + current dataset
    const baseStats = {
      '2024': { year: '2024', total: 420, sRate: 38.0, iRate: 4.0, rRate: 58.0 },
      '2025': { year: '2025', total: 560, sRate: 32.0, iRate: 5.0, rRate: 63.0 },
      '2026': { year: '2026', total: 1000, sRate: 27.0, iRate: 4.0, rRate: 69.0 }
    };

    // Tính toán từ dữ liệu thực tế nếu có
    const currentMatches = astList.filter(a => 
      (organism === 'ALL' || a.organism_name === organism) &&
      (antibiotic === 'ALL' || a.antibiotic_code === antibiotic)
    );

    if (currentMatches.length > 0) {
      const stats = window.AnalyticsService.calculateRates(currentMatches);
      baseStats['2026'].total = stats.denominator;
      baseStats['2026'].rRate = stats.rRate;
      baseStats['2026'].sRate = stats.sRate;
      baseStats['2026'].iRate = stats.iRate;
    }

    return [baseStats['2024'], baseStats['2025'], baseStats['2026']];
  }
};

if (typeof window !== 'undefined') {
  window.SpecializedAMRService = SpecializedAMRService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SpecializedAMRService };
}
