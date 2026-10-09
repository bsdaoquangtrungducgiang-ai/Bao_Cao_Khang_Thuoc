/**
 * DEMO DATA SERVICE - BAO-CAO-KHANG-THUOC
 * Cung cấp dữ liệu mẫu theo yêu cầu mục XLIX & L:
 * 100 Bệnh nhân, 150 Bệnh phẩm, 200 Nuôi cấy, 1,000 Kết quả AST
 * Tỷ lệ S 62%, Tỷ lệ I 8%, Tỷ lệ R 30%
 */

const DemoDataService = {
  data: {
    patients: [],
    specimens: [],
    cultures: [],
    astResults: [],
    organisms: [],
    antibiotics: [],
    departments: [],
    specimenTypes: [],
    importJobs: []
  },

  isInitialized: false,

  init() {
    if (this.isInitialized) return this.data;

    // 1. Danh mục Vi khuẩn
    this.data.organisms = [
      { id: 'org-1', organism_code: 'ESCCOL', organism_name: 'Escherichia coli', vietnamese_name: 'Trực khuẩn E. coli', gram_stain: 'negative', family: 'Enterobacteriaceae' },
      { id: 'org-2', organism_code: 'KLEPNE', organism_name: 'Klebsiella pneumoniae', vietnamese_name: 'Trực khuẩn Klebsiella', gram_stain: 'negative', family: 'Enterobacteriaceae' },
      { id: 'org-3', organism_code: 'PSEAER', organism_name: 'Pseudomonas aeruginosa', vietnamese_name: 'Trực khuẩn mủ xanh', gram_stain: 'negative', family: 'Pseudomonadaceae' },
      { id: 'org-4', organism_code: 'ACIBAU', organism_name: 'Acinetobacter baumannii', vietnamese_name: 'Trực khuẩn Acinetobacter', gram_stain: 'negative', family: 'Moraxellaceae' },
      { id: 'org-5', organism_code: 'STAAUR', organism_name: 'Staphylococcus aureus', vietnamese_name: 'Tụ cầu vàng', gram_stain: 'positive', family: 'Staphylococcaceae' },
      { id: 'org-6', organism_code: 'ENCFAE', organism_name: 'Enterococcus faecalis', vietnamese_name: 'Cầu khuẩn faecalis', gram_stain: 'positive', family: 'Enterococcaceae' },
      { id: 'org-7', organism_code: 'STRNEU', organism_name: 'Streptococcus pneumoniae', vietnamese_name: 'Phế cầu khuẩn', gram_stain: 'positive', family: 'Streptococcaceae' },
      { id: 'org-8', organism_code: 'PROMIR', organism_name: 'Proteus mirabilis', vietnamese_name: 'Trực khuẩn Proteus', gram_stain: 'negative', family: 'Morganellaceae' }
    ];

    // 2. Danh mục 63 Kháng sinh & Chỉ định lâm sàng chuẩn hóa
    const NormRef = (typeof window !== 'undefined' && window.DataNormalization) ? window.DataNormalization : (typeof DataNormalization !== 'undefined' ? DataNormalization : null);
    if (NormRef && NormRef.antibioticCatalog) {
      this.data.antibiotics = NormRef.antibioticCatalog.map(a => ({
        id: 'abx-' + a.stt,
        stt: a.stt,
        antibiotic_code: a.code,
        antibiotic_name: a.name,
        indication: a.indication,
        antibiotic_group: a.group,
        antibiotic_class: a.class
      }));
    } else {
      this.data.antibiotics = [
        { id: 'abx-1', stt: 1, antibiotic_code: 'AMP', antibiotic_name: 'Ampicillin', indication: 'Kháng sinh nhóm Penicillin phổ rộng', antibiotic_group: 'Penicillins', antibiotic_class: 'Beta-lactam' },
        { id: 'abx-2', stt: 2, antibiotic_code: 'AMC', antibiotic_name: 'Amoxicillin/Clavulanate', indication: 'Kháng sinh phối hợp chất ức chế beta-lactamase', antibiotic_group: 'Beta-lactam combo', antibiotic_class: 'Beta-lactam' },
        { id: 'abx-3', stt: 3, antibiotic_code: 'TZP', antibiotic_name: 'Piperacillin/Tazobactam', indication: 'Kháng sinh phối hợp chất ức chế beta-lactamase', antibiotic_group: 'Beta-lactam combo', antibiotic_class: 'Beta-lactam' },
        { id: 'abx-4', stt: 4, antibiotic_code: 'CTX', antibiotic_name: 'Cefotaxime', indication: 'Cephalosporin thế hệ 3', antibiotic_group: 'Cephalosporins 3rd', antibiotic_class: 'Beta-lactam' },
        { id: 'abx-5', stt: 5, antibiotic_code: 'CRO', antibiotic_name: 'Ceftriaxone', indication: 'Cephalosporin thế hệ 3', antibiotic_group: 'Cephalosporins 3rd', antibiotic_class: 'Beta-lactam' },
        { id: 'abx-6', stt: 6, antibiotic_code: 'CAZ', antibiotic_name: 'Ceftazidime', indication: 'Cephalosporin thế hệ 3', antibiotic_group: 'Cephalosporins 3rd', antibiotic_class: 'Beta-lactam' },
        { id: 'abx-7', stt: 7, antibiotic_code: 'FEP', antibiotic_name: 'Cefepime', indication: 'Cephalosporin thế hệ 4', antibiotic_group: 'Cephalosporins 4th', antibiotic_class: 'Beta-lactam' },
        { id: 'abx-8', stt: 8, antibiotic_code: 'MEM', antibiotic_name: 'Meropenem', indication: 'Carbapenem', antibiotic_group: 'Carbapenems', antibiotic_class: 'Beta-lactam' },
        { id: 'abx-9', stt: 9, antibiotic_code: 'IPM', antibiotic_name: 'Imipenem', indication: 'Carbapenem', antibiotic_group: 'Carbapenems', antibiotic_class: 'Beta-lactam' },
        { id: 'abx-10', stt: 10, antibiotic_code: 'CIP', antibiotic_name: 'Ciprofloxacin', indication: 'Nhóm Fluoroquinolone', antibiotic_group: 'Fluoroquinolones', antibiotic_class: 'Quinolones' },
        { id: 'abx-11', stt: 11, antibiotic_code: 'LEV', antibiotic_name: 'Levofloxacin', indication: 'Nhóm Fluoroquinolone', antibiotic_group: 'Fluoroquinolones', antibiotic_class: 'Quinolones' },
        { id: 'abx-12', stt: 12, antibiotic_code: 'GEN', antibiotic_name: 'Gentamicin', indication: 'Nhóm Aminoglycoside', antibiotic_group: 'Aminoglycosides', antibiotic_class: 'Aminoglycosides' },
        { id: 'abx-13', stt: 13, antibiotic_code: 'AMK', antibiotic_name: 'Amikacin', indication: 'Nhóm Aminoglycoside', antibiotic_group: 'Aminoglycosides', antibiotic_class: 'Aminoglycosides' },
        { id: 'abx-14', stt: 14, antibiotic_code: 'SXT', antibiotic_name: 'Trimethoprim/Sulfamethoxazole', indication: 'Cotrimoxazole', antibiotic_group: 'Folate inhibitors', antibiotic_class: 'Sulfonamides' },
        { id: 'abx-15', stt: 15, antibiotic_code: 'VAN', antibiotic_name: 'Vancomycin', indication: 'Nhóm Glycopeptide', antibiotic_group: 'Glycopeptides', antibiotic_class: 'Glycopeptides' },
        { id: 'abx-16', stt: 16, antibiotic_code: 'LZD', antibiotic_name: 'Linezolid', indication: 'Nhóm Oxazolidinone', antibiotic_group: 'Oxazolidinones', antibiotic_class: 'Oxazolidinones' }
      ];
    }

    // 3. Danh mục Khoa và Bệnh phẩm
    this.data.departments = ['ICU (Hồi sức tích cực)', 'Cấp cứu', 'Nội Hô hấp', 'Ngoại Tổng hợp', 'Ngoại Tiết niệu', 'Nhi Sơ sinh', 'Truyền nhiễm'];
    this.data.specimenTypes = ['Nước tiểu', 'Máu', 'Đờm', 'Dịch vết thương', 'Mủ ổ áp xe', 'Dịch phế quản (BAL)', 'Dịch màng phổi'];

    // Nếu ở chế độ Clean Slate (chỉ ghi nhận số liệu file người dùng nạp):
    if (this.isCleanSlateActive()) {
      this.data.patients = [];
      this.data.specimens = [];
      this.data.cultures = [];
      this.data.astResults = [];
      this.data.importJobs = [];
      this.isInitialized = true;
      this.loadPersistedFiles();
      return this.data;
    }

    // 4. Sinh 100 bệnh nhân
    const depts = this.data.departments;
    const specTypes = this.data.specimenTypes;
    for (let i = 1; i <= 100; i++) {
      const pCode = 'BN' + String(i).padStart(5, '0');
      const dept = depts[i % depts.length];
      this.data.patients.push({
        id: 'pat-' + i,
        patient_code: pCode,
        patient_name: 'Bệnh nhân ' + pCode,
        age: 18 + ((i * 7) % 75),
        sex: i % 2 === 0 ? 'Nam' : 'Nữ',
        department: dept,
        room: 'P.' + (100 + (i % 20)),
        bed: 'G.' + (1 + (i % 10)),
        inpatient_outpatient: dept.includes('ICU') ? 'ICU' : (i % 4 === 0 ? 'Ngoại trú' : 'Nội trú'),
        created_at: new Date(Date.now() - (100 - i) * 86400000).toISOString()
      });
    }

    // 5. Sinh 150 bệnh phẩm
    let specIndex = 1;
    for (let i = 1; i <= 100; i++) {
      const numSpecs = (i <= 50) ? 2 : 1; // 50 BN có 2 mẫu, 50 BN có 1 mẫu = 150 mẫu
      for (let s = 1; s <= numSpecs; s++) {
        const p = this.data.patients[i - 1];
        const sType = specTypes[(i * 3 + s) % specTypes.length];
        const specDate = new Date(Date.now() - ((100 - i + s) % 60) * 86400000).toISOString().split('T')[0];
        this.data.specimens.push({
          id: 'spec-' + specIndex,
          patient_id: p.id,
          patient_code: p.patient_code,
          specimen_code: 'BP' + String(specIndex).padStart(6, '0'),
          specimen_type: sType,
          collection_date: specDate,
          requesting_department: p.department,
          created_at: specDate + 'T08:30:00Z'
        });
        specIndex++;
      }
    }

    // 6. Sinh 200 nuôi cấy định danh vi khuẩn
    const orgDistribution = [
      'ESCCOL', 'ESCCOL', 'ESCCOL', 'ESCCOL', 'ESCCOL', 'ESCCOL', 'ESCCOL', // 35%
      'KLEPNE', 'KLEPNE', 'KLEPNE', 'KLEPNE',                               // 22%
      'PSEAER', 'PSEAER',                                                   // 12%
      'ACIBAU', 'ACIBAU',                                                   // 10%
      'STAAUR', 'STAAUR',                                                   // 10%
      'ENCFAE',                                                             // 6%
      'STRNEU'                                                              // 5%
    ];

    let cultIndex = 1;
    for (let s = 1; s <= 150; s++) {
      const spec = this.data.specimens[s - 1];
      const numCultures = (s <= 50) ? 2 : 1; // 50 mẫu có 2 chủng = 200 chủng
      for (let c = 1; c <= numCultures; c++) {
        const orgCode = orgDistribution[(s * 5 + c * 3) % orgDistribution.length];
        const org = this.data.organisms.find(o => o.organism_code === orgCode) || this.data.organisms[0];
        this.data.cultures.push({
          id: 'cult-' + cultIndex,
          specimen_id: spec.id,
          specimen_type: spec.specimen_type,
          patient_id: spec.patient_id,
          patient_code: spec.patient_code,
          culture_date: spec.collection_date,
          culture_result: 'Dương tính mọc vi khuẩn',
          organism_id: org.id,
          organism_name: org.organism_name,
          organism_code: org.organism_code,
          gram_stain: org.gram_stain,
          colony_count: '> 10^5 CFU/mL',
          identification_method: 'Vitek 2 Compact',
          instrument: 'VITEK-2-LAB01',
          created_at: spec.collection_date + 'T14:00:00Z'
        });
        cultIndex++;
      }
    }

    // 7. Sinh 1,000 kết quả kháng sinh đồ AST
    // Tỷ lệ mục tiêu: S = 620 (62%), I = 80 (8%), R = 300 (30%)
    const gnAbx = ['AMP', 'AMC', 'TZP', 'CTX', 'CRO', 'CAZ', 'FEP', 'MEM', 'IPM', 'CIP', 'LEV', 'GEN', 'AMK', 'SXT'];
    const gpAbx = ['AMP', 'CRO', 'CIP', 'LEV', 'GEN', 'SXT', 'VAN', 'LZD'];
    
    // Tạo mảng kết quả mong muốn với chính xác 620 S, 80 I, 300 R
    const targetResults = [];
    for (let i = 0; i < 620; i++) targetResults.push('S');
    for (let i = 0; i < 80; i++) targetResults.push('I');
    for (let i = 0; i < 300; i++) targetResults.push('R');
    
    // Trộn ngẫu nhiên có kiểm soát (deterministic PRNG)
    let seed = 123456789;
    function pseudoRandom() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    }
    
    for (let i = targetResults.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [targetResults[i], targetResults[j]] = [targetResults[j], targetResults[i]];
    }

    let astIndex = 0;
    for (let c = 0; c < this.data.cultures.length && astIndex < 1000; c++) {
      const cult = this.data.cultures[c];
      const isGramPos = cult.gram_stain === 'positive';
      const availableAbx = isGramPos ? gpAbx : gnAbx;
      
      // 5 kháng sinh cho mỗi culture (200 * 5 = 1,000 kết quả)
      for (let k = 0; k < 5 && astIndex < 1000; k++) {
        const abxCode = availableAbx[(c * 3 + k) % availableAbx.length];
        const abxObj = this.data.antibiotics.find(a => a.antibiotic_code === abxCode) || this.data.antibiotics[0];
        const interp = targetResults[astIndex];
        
        let mic = 1.0;
        if (interp === 'S') mic = 0.5;
        else if (interp === 'I') mic = 4.0;
        else if (interp === 'R') mic = 32.0;

        this.data.astResults.push({
          id: 'ast-' + (astIndex + 1),
          culture_id: cult.id,
          culture_date: cult.culture_date,
          patient_id: cult.patient_id,
          patient_code: cult.patient_code,
          specimen_type: cult.specimen_type,
          organism_name: cult.organism_name,
          organism_code: cult.organism_code,
          gram_stain: cult.gram_stain,
          antibiotic_id: abxObj.id,
          antibiotic_code: abxCode,
          antibiotic_name: abxObj.antibiotic_name,
          raw_result: interp === 'S' ? 'Susceptible' : (interp === 'I' ? 'Intermediate' : 'Resistant'),
          normalized_result: interp,
          interpretation: interp,
          mic: mic,
          testing_method: 'Vitek AST',
          guideline: 'CLSI',
          guideline_version: 'M100 2025',
          tested_date: cult.culture_date,
          file_name: 'Du_lieu_mau_benh_vien_2026.xlsx',
          import_job_id: 'job-seed-2026'
        });
        astIndex++;
      }
    }

    this.data.importJobs = [
      {
        id: 'job-seed-2026',
        file_name: 'Du_lieu_mau_benh_vien_2026.xlsx',
        file_type: 'xlsx',
        file_size: 245760,
        record_count: this.data.astResults.length,
        status: 'COMPLETED',
        processing_status: 'completed',
        created_at: '2026-01-01T08:00:00.000Z'
      }
    ];

    this.isInitialized = true;
    this.loadHospitalDataset();
    this.loadPersistedFiles();
    console.log(`[DemoDataService] Initialized: ${this.data.patients.length} patients, ${this.data.specimens.length} specimens, ${this.data.cultures.length} cultures, ${this.data.astResults.length} AST results.`);
    return this.data;
  },

  loadPersistedFiles() {
    if (typeof localStorage === 'undefined') return;
    try {
      const manifestStr = localStorage.getItem('amr_persisted_files_manifest');
      if (!manifestStr) return;
      const manifest = JSON.parse(manifestStr);
      if (!Array.isArray(manifest)) return;

      const ImportRef = (typeof window !== 'undefined' && window.ImportService) ? window.ImportService : (typeof ImportService !== 'undefined' ? ImportService : null);
      if (!ImportRef || !ImportRef.getPersistedFileRecords) return;

      manifest.forEach(item => {
        if (!item || !item.fileName) return;
        // Nếu file đã có trong danh sách importJobs thì không nạp lại
        if (this.data.importJobs && this.data.importJobs.some(j => j.file_name === item.fileName)) {
          return;
        }

        const recs = ImportRef.getPersistedFileRecords(item.fileName);
        if (recs && recs.length > 0) {
          ImportRef.syncToLocalStore(
            this.data,
            recs,
            item.id || ('job-persisted-' + item.fileName),
            item.fileName,
            item.fileType || 'xlsx',
            { fileSize: item.fileSize || 0, totalRows: recs.length }
          );
        }
      });
    } catch (e) {
      console.warn('[DemoDataService] Lỗi khi nạp persisted files:', e);
    }
  },

  loadHospitalDataset() {
    const csvData = (typeof window !== 'undefined' && window.HOSPITAL_CSV_DATA) ? window.HOSPITAL_CSV_DATA : (typeof HOSPITAL_CSV_DATA !== 'undefined' ? HOSPITAL_CSV_DATA : null);
    if (!csvData) return;

    if (this.data.importJobs && this.data.importJobs.some(j => j.file_name === 'ĐG Dương tính (010126. 230626).xls')) {
      return;
    }

    try {
      const ImportRef = (typeof window !== 'undefined' && window.ImportService) ? window.ImportService : (typeof ImportService !== 'undefined' ? ImportService : null);
      if (!ImportRef || !ImportRef.parseText) return;

      const parsed = ImportRef.parseText(csvData);
      const transformed = ImportRef.transformData(parsed.dataRows, parsed.detectedMapping);
      const DataValidationRef = (typeof window !== 'undefined' && window.DataValidation) ? window.DataValidation : (typeof DataValidation !== 'undefined' ? DataValidation : null);
      const validated = DataValidationRef ? DataValidationRef.validateBatch(transformed) : { validRecords: transformed };

      ImportRef.syncToLocalStore(
        this.data,
        validated.validRecords,
        'job-dg-2026',
        'ĐG Dương tính (010126. 230626).xls',
        'xls',
        { fileSize: 593103, totalRows: parsed.totalRows || 1466 }
      );
    } catch (e) {
      console.warn('[DemoDataService] Could not preload hospital dataset:', e);
    }
  },

  isCleanSlateActive() {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('amr_clean_slate_active') === 'true');
  },

  clearAllFiles() {
    this.data.patients = [];
    this.data.specimens = [];
    this.data.cultures = [];
    this.data.astResults = [];
    this.data.importJobs = [];

    if (typeof localStorage !== 'undefined') {
      try {
        const manifestStr = localStorage.getItem('amr_persisted_files_manifest');
        if (manifestStr) {
          const manifest = JSON.parse(manifestStr) || [];
          manifest.forEach(m => {
            if (m && m.fileName) {
              localStorage.removeItem('amr_file_records_' + encodeURIComponent(m.fileName));
            }
          });
        }
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('amr_file_records_') || key === 'amr_persisted_files_manifest' || key === 'amr_last_imported_file' || key === 'amr_active_selected_file')) {
            localStorage.removeItem(key);
          }
        }
        localStorage.setItem('amr_clean_slate_active', 'true');
      } catch (e) {}
    }
    return this.data;
  },

  getAll() {
    if (!this.isInitialized) this.init();
    if (!this.isCleanSlateActive()) {
      if (this.data && this.data.importJobs && !this.data.importJobs.some(j => j.file_name === 'ĐG Dương tính (010126. 230626).xls')) {
        this.loadHospitalDataset();
      }
    }
    this.loadPersistedFiles();
    return this.data;
  }
};

if (typeof window !== 'undefined') {
  window.DemoDataService = DemoDataService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DemoDataService };
}
