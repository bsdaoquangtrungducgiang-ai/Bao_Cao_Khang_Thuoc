/**
 * DATA NORMALIZATION UTILS - BAO-CAO-KHANG-THUOC
 * Chuẩn hóa kết quả kháng sinh đồ AST, vi khuẩn, kháng sinh và thông tin bệnh nhân
 * Tuân thủ mục XII & XLVII (Giữ nguyên raw_value và gán normalized_value)
 */

const DataNormalization = {
  // 1. Chuẩn hóa kết quả Kháng sinh đồ S / I / R
  normalizeAST(rawValue) {
    if (rawValue === null || rawValue === undefined) {
      return { raw_value: '', normalized_value: 'NA', isValid: true };
    }

    const str = String(rawValue).trim();
    if (!str || str === '-' || str.toLowerCase() === 'na' || str.toLowerCase() === 'not applicable') {
      return { raw_value: str, normalized_value: 'NA', isValid: true };
    }

    const clean = str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt (Nhạy -> Nhay, Kháng -> Khang)
      .trim();

    // Nhạy cảm (S)
    if (
      clean === 's' ||
      clean === 'sensitive' ||
      clean === 'susceptible' ||
      clean === 'nhay' ||
      clean.startsWith('nhay') ||
      clean.startsWith('sens') ||
      clean.startsWith('susc') ||
      /\b[sS]\b/.test(str) ||
      /\([sS]\)/.test(str)
    ) {
      return { raw_value: str, normalized_value: 'S', isValid: true };
    }

    // Trung gian (I)
    if (
      clean === 'i' ||
      clean === 'intermediate' ||
      clean === 'trung gian' ||
      clean.startsWith('trung gian') ||
      clean.startsWith('inter') ||
      /\b[iI]\b/.test(str) ||
      /\([iI]\)/.test(str)
    ) {
      return { raw_value: str, normalized_value: 'I', isValid: true };
    }

    // Kháng thuốc (R)
    if (
      clean === 'r' ||
      clean === 'resistant' ||
      clean === 'resistance' ||
      clean === 'khang' ||
      clean.startsWith('khang') ||
      clean.startsWith('resist') ||
      /\b[rR]\b/.test(str) ||
      /\([rR]\)/.test(str)
    ) {
      return { raw_value: str, normalized_value: 'R', isValid: true };
    }

    // Susceptible Dose-Dependent (SD)
    if (clean === 'sd' || clean.includes('dose dependent')) {
      return { raw_value: str, normalized_value: 'SD', isValid: true };
    }

    // Non-Susceptible (NS)
    if (clean === 'ns' || clean.includes('non-susceptible') || clean.includes('non susceptible')) {
      return { raw_value: str, normalized_value: 'NS', isValid: true };
    }

    // Phát hiện giá trị là Mã định danh / Mã mẫu / Barcode thay vì kết quả AST
    const isIdentifier = this.isLikelyIdentifier(str);

    // Không thể chuẩn hóa tự động
    return { raw_value: str, normalized_value: 'UNKNOWN', isValid: false, isIdentifier };
  },

  // Kiểm tra chuỗi có phải là mã số / mã mẫu / barcode y tế
  isLikelyIdentifier(str) {
    if (!str) return false;
    const clean = String(str).trim();
    // Ví dụ: 010126-130011, 23031418, BN00123, SC-98213
    if (/^\d{4,10}$/.test(clean)) return true; // Chuỗi toàn số (Mã BN, Số hồ sơ)
    if (/^\d{4,8}[-_/]\d{4,8}$/.test(clean)) return true; // Định dạng mã mẫu ngày-số
    if (/^[A-Za-z]{1,4}[-_]?\d{4,10}$/.test(clean)) return true; // BN00123, XN2301
    return false;
  },

  // 2. Chuẩn hóa Tên vi khuẩn (Organism Aliases)
  organismDictionary: {
    'escherichia coli': 'Escherichia coli',
    'e. coli': 'Escherichia coli',
    'e.coli': 'Escherichia coli',
    'ecoli': 'Escherichia coli',
    'esccol': 'Escherichia coli',

    'klebsiella pneumoniae': 'Klebsiella pneumoniae',
    'k. pneumoniae': 'Klebsiella pneumoniae',
    'k.pneumoniae': 'Klebsiella pneumoniae',
    'klepne': 'Klebsiella pneumoniae',
    'klebsiella': 'Klebsiella pneumoniae',

    'pseudomonas aeruginosa': 'Pseudomonas aeruginosa',
    'p. aeruginosa': 'Pseudomonas aeruginosa',
    'p.aeruginosa': 'Pseudomonas aeruginosa',
    'pseaer': 'Pseudomonas aeruginosa',
    'pseudomonas': 'Pseudomonas aeruginosa',

    'acinetobacter baumannii': 'Acinetobacter baumannii',
    'a. baumannii': 'Acinetobacter baumannii',
    'a.baumannii': 'Acinetobacter baumannii',
    'acibau': 'Acinetobacter baumannii',
    'acinetobacter': 'Acinetobacter baumannii',

    'staphylococcus aureus': 'Staphylococcus aureus',
    's. aureus': 'Staphylococcus aureus',
    's.aureus': 'Staphylococcus aureus',
    'staaur': 'Staphylococcus aureus',

    'enterococcus faecalis': 'Enterococcus faecalis',
    'e. faecalis': 'Enterococcus faecalis',
    'e.faecalis': 'Enterococcus faecalis',
    'encfae': 'Enterococcus faecalis',

    'enterococcus faecium': 'Enterococcus faecium',
    'e. faecium': 'Enterococcus faecium',
    'e.faecium': 'Enterococcus faecium',
    'encfai': 'Enterococcus faecium',

    'streptococcus pneumoniae': 'Streptococcus pneumoniae',
    's. pneumoniae': 'Streptococcus pneumoniae',
    's.pneumoniae': 'Streptococcus pneumoniae',
    'strneu': 'Streptococcus pneumoniae',

    'enterobacter cloacae': 'Enterobacter cloacae',
    'e. cloacae': 'Enterobacter cloacae',
    'entclo': 'Enterobacter cloacae',

    'proteus mirabilis': 'Proteus mirabilis',
    'p. mirabilis': 'Proteus mirabilis',
    'promir': 'Proteus mirabilis'
  },

  normalizeOrganism(rawOrganism) {
    if (!rawOrganism) return { raw: '', name: 'Chưa xác định', isValid: false };
    const rawStr = String(rawOrganism).trim();
    const clean = rawStr.toLowerCase()
      .replace(/[\(\)\[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (this.organismDictionary[clean]) {
      return { raw: rawStr, name: this.organismDictionary[clean], isValid: true };
    }

    // Kiểm tra tương đối
    for (const [alias, standardName] of Object.entries(this.organismDictionary)) {
      if (clean.includes(alias) || alias.includes(clean)) {
        return { raw: rawStr, name: standardName, isValid: true };
      }
    }

    return { raw: rawStr, name: rawStr, isValid: false };
  },

  // 3. Chuẩn hóa Kháng sinh (Mã chuẩn AMP, CTX, CRO, MEM...)
  antibioticDictionary: {
    'amp': 'AMP', 'ampicillin': 'AMP',
    'amc': 'AMC', 'amoxicillin/clavulanic acid': 'AMC', 'amoxicillin-clavulanate': 'AMC', 'amox/clav': 'AMC',
    'sam': 'SAM', 'ampicillin/sulbactam': 'SAM', 'amp/sul': 'SAM',
    'tzp': 'TZP', 'piperacillin/tazobactam': 'TZP', 'pip/tazo': 'TZP',
    'ctx': 'CTX', 'cefotaxime': 'CTX',
    'cro': 'CRO', 'ceftriaxone': 'CRO',
    'caz': 'CAZ', 'ceftazidime': 'CAZ',
    'fep': 'FEP', 'cefepime': 'FEP',
    'cfz': 'CFZ', 'cefazolin': 'CFZ',
    'cxm': 'CXM', 'cefuroxime': 'CXM',
    'mem': 'MEM', 'meropenem': 'MEM',
    'ipm': 'IPM', 'imipenem': 'IPM',
    'etp': 'ETP', 'ertapenem': 'ETP',
    'cip': 'CIP', 'ciprofloxacin': 'CIP',
    'lev': 'LEV', 'levofloxacin': 'LEV',
    'mox': 'MOX', 'moxifloxacin': 'MOX',
    'gen': 'GEN', 'gentamicin': 'GEN',
    'amk': 'AMK', 'amikacin': 'AMK',
    'tob': 'TOB', 'tobramycin': 'TOB',
    'sxt': 'SXT', 'trimethoprim/sulfamethoxazole': 'SXT', 'co-trimoxazole': 'SXT', 'bactrim': 'SXT',
    'van': 'VAN', 'vancomycin': 'VAN',
    'lzd': 'LZD', 'linezolid': 'LZD',
    'tec': 'TEC', 'teicoplanin': 'TEC',
    'cli': 'CLI', 'clindamycin': 'CLI',
    'ery': 'ERY', 'erythromycin': 'ERY',
    'tet': 'TET', 'tetracycline': 'TET',
    'dox': 'DOX', 'doxycycline': 'DOX',
    'tgc': 'TGC', 'tigecycline': 'TGC',
    'col': 'COL', 'colistin': 'COL',
    'pol': 'POL', 'polymyxin b': 'POL',
    'fox': 'FOX', 'cefoxitin': 'FOX',
    'oxa': 'OXA', 'oxacillin': 'OXA',
    'pen': 'PEN', 'penicillin': 'PEN',
    'amx': 'AMX', 'amoxicillin': 'AMX',
    'dor': 'DOR', 'doripenem': 'DOR',
    'nit': 'NIT', 'nitrofurantoin': 'NIT',
    'fos': 'FOS', 'fosfomycin': 'FOS',
    'azm': 'AZM', 'azithromycin': 'AZM',
    'clr': 'CLR', 'clarithromycin': 'CLR',
    'czo': 'CZO', 'cefazolin': 'CFZ',
    'ctz': 'CTZ', 'ceftazidime': 'CAZ',
    'cpt': 'CPT', 'ceftaroline': 'CPT'
  },

  // Danh sách từ khóa hành chính / phi kháng sinh tuyệt đối không được nhận diện là kháng sinh
  nonAntibioticBlacklist: new Set([
    'stt', 'ma', 'mabn', 'manguoibenh', 'manb', 'maxn', 'id', 'pid', 'mrn', 'khoa', 'phong',
    'tuoi', 'nam', 'gioi', 'ngay', 'kq', 'note', 'ten', 'hoten', 'benhpham', 'vikhuan', 'mau',
    'sophieu', 'maphieu', 'matiepnhan', 'sotiepnhan', 'makcb', 'malk', 'no', 'order', 'barcode',
    'bacsi', 'chandoan', 'doituong', 'bhyt', 'ghichu', 'result', 'ketqua', 'date', 'age', 'sex',
    'patient', 'specimen', 'organism', 'dept', 'department', 'ward', 'note', 'comment', 'status'
  ]),

  normalizeAntibiotic(rawAbx) {
    if (!rawAbx) return null;
    const clean = String(rawAbx).trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '');
    if (!clean) return null;
    
    // Nếu nằm trong danh sách đen các từ khóa quản trị -> Bỏ qua
    if (this.nonAntibioticBlacklist.has(clean)) {
      return null;
    }

    if (this.antibioticDictionary[clean]) {
      return this.antibioticDictionary[clean];
    }

    // Nếu không nằm trong từ điển, chỉ coi là kháng sinh nếu không chứa số và độ dài phù hợp (3-4 ký tự viết tắt)
    const upper = clean.toUpperCase();
    if (/^[A-Z]{3,4}$/.test(upper)) {
      return upper;
    }
    return upper;
  },

  // 4. Chuẩn hóa Giới tính (Nam, Nữ, Khác)
  normalizeSex(rawSex) {
    if (!rawSex) return 'Unknown';
    const s = String(rawSex).trim().toLowerCase();
    if (s === 'nam' || s === 'm' || s === 'male' || s === 'trai' || s === '1') return 'Nam';
    if (s === 'nu' || s === 'nữ' || s === 'f' || s === 'female' || s === 'gai' || s === '0') return 'Nữ';
    return 'Khác';
  },

  // 5. Chuẩn hóa Ngày tháng (Hỗ trợ DD/MM/YYYY, YYYY-MM-DD, Excel Serial Date)
  normalizeDate(rawDate) {
    if (!rawDate) return { dateStr: null, isValid: false };

    // Nếu là Excel serial number (ví dụ 45300)
    if (typeof rawDate === 'number' || (!isNaN(rawDate) && !String(rawDate).includes('-') && !String(rawDate).includes('/'))) {
      const num = Number(rawDate);
      if (num > 30000 && num < 60000) {
        // Excel serial date formula
        const utcDays = Math.floor(num - 25569);
        const utcValue = utcDays * 86400;
        const dateObj = new Date(utcValue * 1000);
        return {
          dateStr: dateObj.toISOString().split('T')[0],
          isValid: true
        };
      }
    }

    const str = String(rawDate).trim();

    // Định dạng YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split('-').map(Number);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return { dateStr: str, isValid: true };
      }
      return { dateStr: str, isValid: false };
    }

    // Định dạng DD/MM/YYYY hoặc DD-MM-YYYY
    const parts = str.split(/[\/\-\.]/);
    if (parts.length === 3) {
      let d, m, y;
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        [y, m, d] = parts.map(Number);
      } else {
        // DD/MM/YYYY
        [d, m, y] = parts.map(Number);
      }

      if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const mm = String(m).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return { dateStr: `${y}-${mm}-${dd}`, isValid: true };
      }
    }

    return { dateStr: str, isValid: false };
  },

  // 6. Tạo Fingerprint để phát hiện bản ghi trùng lặp (Section XXXIV)
  generateFingerprint(patientCode, specimenType, collectionDate, organismName, antibioticCode) {
    const p = String(patientCode || '').trim().toLowerCase();
    const s = String(specimenType || '').trim().toLowerCase();
    const d = String(collectionDate || '').trim();
    const o = String(organismName || '').trim().toLowerCase();
    const a = String(antibioticCode || '').trim().toUpperCase();

    // Simple robust hash
    const text = `${p}|${s}|${d}|${o}|${a}`;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `fp-${Math.abs(hash).toString(16)}-${text.replace(/[^a-z0-9]/g, '').slice(0, 15)}`;
  }
};

if (typeof window !== 'undefined') {
  window.DataNormalization = DataNormalization;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DataNormalization };
}
