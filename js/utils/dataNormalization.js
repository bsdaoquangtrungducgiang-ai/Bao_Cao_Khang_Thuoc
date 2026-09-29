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

    // Kháng thuốc (R) - Bao gồm cả test sàng lọc dương tính (+) như oxsf, ICR, ESBL
    if (
      clean === 'r' ||
      clean === 'resistant' ||
      clean === 'resistance' ||
      clean === 'khang' ||
      clean === '+' ||
      clean === 'pos' ||
      clean === 'positive' ||
      clean === 'duong tinh' ||
      clean.startsWith('khang') ||
      clean.startsWith('resist') ||
      clean.startsWith('duong') ||
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
    // E. coli
    'escherichia coli': 'Escherichia coli',
    'e. coli': 'Escherichia coli',
    'e.coli': 'Escherichia coli',
    'ecoli': 'Escherichia coli',
    'esccol': 'Escherichia coli',
    'eco': 'Escherichia coli',

    // Klebsiella
    'klebsiella pneumoniae': 'Klebsiella pneumoniae',
    'klebsiella pneumoniae ssp pneumoniae': 'Klebsiella pneumoniae',
    'klebsiella pneumoniae ssp ozaenae': 'Klebsiella pneumoniae',
    'k. pneumoniae': 'Klebsiella pneumoniae',
    'k.pneumoniae': 'Klebsiella pneumoniae',
    'klepne': 'Klebsiella pneumoniae',
    'kleoza': 'Klebsiella pneumoniae',
    'klebsiella': 'Klebsiella pneumoniae',

    // Pseudomonas
    'pseudomonas aeruginosa': 'Pseudomonas aeruginosa',
    'p. aeruginosa': 'Pseudomonas aeruginosa',
    'p.aeruginosa': 'Pseudomonas aeruginosa',
    'pseaer': 'Pseudomonas aeruginosa',
    'pae': 'Pseudomonas aeruginosa',
    'pseudomonas': 'Pseudomonas aeruginosa',

    // Acinetobacter
    'acinetobacter baumannii': 'Acinetobacter baumannii',
    'acinetobacter baumanii': 'Acinetobacter baumannii',
    'a. baumannii': 'Acinetobacter baumannii',
    'a.baumanii': 'Acinetobacter baumannii',
    'acibau': 'Acinetobacter baumannii',
    'aba': 'Acinetobacter baumannii',
    'acinetobacter': 'Acinetobacter baumannii',
    'acinetobacter lwoffii': 'Acinetobacter lwoffii',
    'alw': 'Acinetobacter lwoffii',

    // Staphylococci
    'staphylococcus aureus': 'Staphylococcus aureus',
    's. aureus': 'Staphylococcus aureus',
    's.aureus': 'Staphylococcus aureus',
    'staaur': 'Staphylococcus aureus',
    'sau': 'Staphylococcus aureus',
    'staphylococcus epidermidis': 'Staphylococcus epidermidis',
    'sep': 'Staphylococcus epidermidis',
    'staphylococcus hominis': 'Staphylococcus hominis',
    'staphylococcus hominis ssp hominis': 'Staphylococcus hominis',
    'stahsh': 'Staphylococcus hominis',
    'staphylococcus haemolyticus': 'Staphylococcus haemolyticus',
    'shl': 'Staphylococcus haemolyticus',
    'staphylococcus coagulase negative': 'Staphylococcus coagulase negative',
    'scn': 'Staphylococcus coagulase negative',

    // Streptococci
    'streptococcus pneumoniae': 'Streptococcus pneumoniae',
    's. pneumoniae': 'Streptococcus pneumoniae',
    's.pneumoniae': 'Streptococcus pneumoniae',
    'strneu': 'Streptococcus pneumoniae',
    'spn': 'Streptococcus pneumoniae',
    'streptococcus agalactiae': 'Streptococcus agalactiae',
    'sgc': 'Streptococcus agalactiae',
    'streptococcus pyogenes': 'Streptococcus pyogenes',
    'spy': 'Streptococcus pyogenes',
    'streptococcus suis': 'Streptococcus suis',
    'sui': 'Streptococcus suis',
    'streptococcus sanguinis': 'Streptococcus sanguinis',
    'ssn': 'Streptococcus sanguinis',
    'streptococcus anginosus': 'Streptococcus anginosus',
    'san': 'Streptococcus anginosus',
    'streptococcus gallolyticus': 'Streptococcus gallolyticus',
    'streptococcus gallolyticus ssp pasteurianus': 'Streptococcus gallolyticus',
    'strpas': 'Streptococcus gallolyticus',
    'streptococcus dysgalactiae': 'Streptococcus dysgalactiae',
    'streptococcus dysgalactiae ss. dysgalactiae': 'Streptococcus dysgalactiae',
    'streptococcus dysgalactiae ss. equisimilis': 'Streptococcus dysgalactiae',
    'sdy': 'Streptococcus dysgalactiae',
    'sqm': 'Streptococcus dysgalactiae',

    // Enterococci
    'enterococcus faecalis': 'Enterococcus faecalis',
    'e. faecalis': 'Enterococcus faecalis',
    'e.faecalis': 'Enterococcus faecalis',
    'encfae': 'Enterococcus faecalis',
    'efa': 'Enterococcus faecalis',
    'enterococcus faecium': 'Enterococcus faecium',
    'e. faecium': 'Enterococcus faecium',
    'e.faecium': 'Enterococcus faecium',
    'encfai': 'Enterococcus faecium',
    'efm': 'Enterococcus faecium',
    'enterococcus gallinarum': 'Enterococcus gallinarum',
    'ega': 'Enterococcus gallinarum',
    'enterococcus hirae': 'Enterococcus hirae',
    'enh': 'Enterococcus hirae',

    // Enterobacter
    'enterobacter cloacae': 'Enterobacter cloacae',
    'enterobacter cloacae ssp cloacae': 'Enterobacter cloacae',
    'enterobacter cloacae complex': 'Enterobacter cloacae',
    'e. cloacae': 'Enterobacter cloacae',
    'entclo': 'Enterobacter cloacae',
    'entclc': 'Enterobacter cloacae',
    'entcpx': 'Enterobacter cloacae',
    'enterobacter aerogenes': 'Enterobacter aerogenes',
    'eae': 'Enterobacter aerogenes',

    // Haemophilus & Moraxella
    'haemophilus influenzae': 'Haemophilus influenzae',
    'h. influenzae': 'Haemophilus influenzae',
    'hin': 'Haemophilus influenzae',
    'moraxella catarrhalis': 'Moraxella catarrhalis',
    'm. catarrhalis': 'Moraxella catarrhalis',
    'bca': 'Moraxella catarrhalis',

    // Proteus
    'proteus mirabilis': 'Proteus mirabilis',
    'p. mirabilis': 'Proteus mirabilis',
    'promir': 'Proteus mirabilis',
    'pmi': 'Proteus mirabilis',
    'proteus rettgeri': 'Proteus rettgeri',
    'pre': 'Proteus rettgeri',

    // Salmonella
    'salmonella group': 'Salmonella spp.',
    'salmonella': 'Salmonella spp.',
    'salgrp': 'Salmonella spp.',

    // Citrobacter & Serratia & Morganella
    'citrobacter freundii': 'Citrobacter freundii',
    'cfr': 'Citrobacter freundii',
    'citrobacter youngae': 'Citrobacter youngae',
    'cyo': 'Citrobacter youngae',
    'serratia marcescens': 'Serratia marcescens',
    'sma': 'Serratia marcescens',
    'morganella morganii': 'Morganella morganii',
    'mmo': 'Morganella morganii',

    // Other Gram Negative
    'stenotrophomonas maltophilia': 'Stenotrophomonas maltophilia',
    'pma': 'Stenotrophomonas maltophilia',
    'burkholderia cepacia': 'Burkholderia cepacia',
    'pce': 'Burkholderia cepacia',
    'burkholderia mallei': 'Burkholderia mallei',
    'bma': 'Burkholderia mallei',
    'achromobacter xylosoxidans': 'Achromobacter xylosoxidans',
    'axy': 'Achromobacter xylosoxidans',
    'achromobacter denitrificans': 'Achromobacter denitrificans',
    'ade': 'Achromobacter denitrificans',
    'pasteurella multocida': 'Pasteurella multocida',
    'pasteurella multocida ss. multocida': 'Pasteurella multocida',
    'pam': 'Pasteurella multocida',
    'raoultella planticola': 'Raoultella planticola',
    'raoutella planticola': 'Raoultella planticola',
    'kpl': 'Raoultella planticola',
    'elizabethkingia meningoseptica': 'Elizabethkingia meningoseptica',
    'fme': 'Elizabethkingia meningoseptica',
    'ralstonia pickettii': 'Ralstonia pickettii',
    'ralstonia picketii': 'Ralstonia pickettii',
    'ppi': 'Ralstonia pickettii',
    'chryseobacterium indologenes': 'Chryseobacterium indologenes',
    'fin': 'Chryseobacterium indologenes',
    'pandoraea spp': 'Pandoraea spp.',
    'pan1': 'Pandoraea spp.',

    // Nấm Candida
    'candida albicans': 'Candida albicans',
    'cal': 'Candida albicans',
    'candida tropicalis': 'Candida tropicalis',
    'ctr': 'Candida tropicalis',
    'candida parapsilosis': 'Candida parapsilosis',
    'cpa': 'Candida parapsilosis',
    'candida glabrata': 'Candida glabrata',
    'candida glabratan': 'Candida glabrata',
    'cgl': 'Candida glabrata',
    'candida lusitaniae': 'Candida lusitaniae',
    'clu': 'Candida lusitaniae',
    'candida guilliermondii': 'Candida guilliermondii',
    'candida guillerrmondii': 'Candida guilliermondii',
    'cgu': 'Candida guilliermondii'
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
    'am': 'AMP', 'amp': 'AMP', 'ampicillin': 'AMP',
    'amc': 'AMC', 'amoxicillin/clavulanic acid': 'AMC', 'amoxicillin-clavulanate': 'AMC', 'amox/clav': 'AMC',
    'sam': 'SAM', 'ampicillin/sulbactam': 'SAM', 'amp/sul': 'SAM',
    'tzp': 'TZP', 'piperacillin/tazobactam': 'TZP', 'pip/tazo': 'TZP',
    'ctx': 'CTX', 'cefotaxime': 'CTX', 'ctx02': 'CTX', 'ctx03': 'CTX',
    'cro': 'CRO', 'ceftriaxone': 'CRO', 'cro02': 'CRO', 'cro03': 'CRO',
    'caz': 'CAZ', 'ceftazidime': 'CAZ',
    'fep': 'FEP', 'cefepime': 'FEP',
    'cfz': 'CFZ', 'cefazolin': 'CFZ', 'czo': 'CFZ',
    'cxm': 'CXM', 'cefuroxime': 'CXM',
    'mem': 'MEM', 'meropenem': 'MEM',
    'ipm': 'IPM', 'imipenem': 'IPM', 'imr': 'IPM',
    'etp': 'ETP', 'ertapenem': 'ETP',
    'cip': 'CIP', 'ciprofloxacin': 'CIP',
    'lev': 'LEV', 'levofloxacin': 'LEV', 'lvx': 'LEV',
    'mox': 'MOX', 'moxifloxacin': 'MOX', 'mfx': 'MOX',
    'gen': 'GEN', 'gentamicin': 'GEN',
    'amk': 'AMK', 'amikacin': 'AMK',
    'tob': 'TOB', 'tobramycin': 'TOB',
    'sxt': 'SXT', 'trimethoprim/sulfamethoxazole': 'SXT', 'co-trimoxazole': 'SXT', 'bactrim': 'SXT',
    'van': 'VAN', 'vancomycin': 'VAN',
    'lzd': 'LZD', 'linezolid': 'LZD', 'lnz': 'LZD',
    'tec': 'TEC', 'teicoplanin': 'TEC',
    'cli': 'CLI', 'clindamycin': 'CLI',
    'ery': 'ERY', 'erythromycin': 'ERY',
    'tet': 'TET', 'tetracycline': 'TET', 'tcy': 'TET',
    'dox': 'DOX', 'doxycycline': 'DOX',
    'tgc': 'TGC', 'tigecycline': 'TGC',
    'col': 'COL', 'colistin': 'COL',
    'pol': 'POL', 'polymyxin b': 'POL',
    'fox': 'FOX', 'cefoxitin': 'FOX',
    'oxa': 'OXA', 'oxacillin': 'OXA', 'oxsf': 'OXA',
    'pen': 'PEN', 'penicillin': 'PEN', 'peng': 'PEN', 'peng02': 'PEN', 'peng03': 'PEN', 'peng04': 'PEN', 'peng05': 'PEN',
    'amx': 'AMX', 'amoxicillin': 'AMX',
    'dor': 'DOR', 'doripenem': 'DOR',
    'nit': 'NIT', 'nitrofurantoin': 'NIT',
    'fos': 'FOS', 'fosfomycin': 'FOS',
    'azm': 'AZM', 'azithromycin': 'AZM',
    'clr': 'CLR', 'clarithromycin': 'CLR',
    'cpt': 'CPT', 'ceftaroline': 'CPT',
    'chl': 'CHL', 'c': 'CHL', 'chloramphenicol': 'CHL',
    'rif': 'RIF', 'rifampicin': 'RIF', 'rifampin': 'RIF',
    'icr': 'CLI_IND', 'inducible clindamycin': 'CLI_IND',
    'qda': 'QDA', 'quinupristin/dalfopristin': 'QDA',
    'tcc': 'TCC', 'ticarcillin/clavulanic acid': 'TCC',
    'pip': 'PIP', 'piperacillin': 'PIP',
    'met': 'MET', 'metronidazole': 'MET',
    'cfp': 'CFP', 'cefoperazone': 'CFP',
    'cza': 'CZA', 'ceftazidime/avibactam': 'CZA',
    'czt': 'CZT', 'ceftolozane/tazobactam': 'CZT',
    'flu': 'FLU', 'fluconazole': 'FLU',
    'cas': 'CAS', 'caspofungin': 'CAS',
    'mif': 'MIF', 'micafungin': 'MIF',
    'amb': 'AMB', 'amphotericin b': 'AMB',
    'mev': 'MEV', 'meropenem/vaborbactam': 'MEV',
    'vor': 'VOR', 'voriconazole': 'VOR'
  },

  // Danh sách từ khóa hành chính / phi kháng sinh tuyệt đối không được nhận diện là kháng sinh
  nonAntibioticBlacklist: new Set([
    'stt', 'ma', 'mabn', 'manguoibenh', 'manb', 'maxn', 'id', 'pid', 'sid', 'mrn', 'khoa', 'phong',
    'tuoi', 'nam', 'gioi', 'ngay', 'kq', 'note', 'ten', 'hoten', 'benhpham', 'vikhuan', 'mau',
    'sophieu', 'maphieu', 'matiepnhan', 'sotiepnhan', 'makcb', 'malk', 'no', 'order', 'barcode',
    'bacsi', 'chandoan', 'doituong', 'bhyt', 'ghichu', 'result', 'ketqua', 'ketquacay', 'date', 'age', 'sex',
    'patient', 'specimen', 'organism', 'dept', 'department', 'ward', 'note', 'comment', 'status',
    'mayte', 'maba', 'sothe', 'mavienphi', 'intime', 'yeucau', 'mayeucau', 'tenyeucau'
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

    // Nếu không nằm trong từ điển, chỉ coi là kháng sinh nếu không chứa số và độ dài phù hợp (2-5 ký tự viết tắt)
    const upper = clean.toUpperCase();
    if (/^[A-Z]{2,5}$/.test(upper)) {
      return upper;
    }
    return null;
  },

  // 4. Chuẩn hóa Giới tính (Nam, Nữ, Khác)
  normalizeSex(rawSex) {
    if (!rawSex) return 'Unknown';
    const s = String(rawSex).trim().toLowerCase();
    if (s === 'nam' || s === 'm' || s === 'male' || s === 'trai' || s === '1') return 'Nam';
    if (s === 'nu' || s === 'nữ' || s === 'f' || s === 'female' || s === 'gai' || s === '0') return 'Nữ';
    return 'Khác';
  },

  // 5. Chuẩn hóa Ngày tháng (Hỗ trợ DD/MM/YYYY, YYYY-MM-DD, Datetime với giờ phút, Excel Serial Date)
  normalizeDate(rawDate) {
    if (!rawDate) return { dateStr: null, isValid: false };

    // Nếu là Date object
    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      return {
        dateStr: rawDate.toISOString().split('T')[0],
        isValid: true
      };
    }

    // Nếu là Excel serial number (ví dụ 45300)
    if (typeof rawDate === 'number' || (!isNaN(rawDate) && !String(rawDate).includes('-') && !String(rawDate).includes('/') && !String(rawDate).includes(':'))) {
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

    // Định dạng YYYY-MM-DD hoặc YYYY-MM-DD HH:mm:ss
    const ymdMatch = str.match(/\b(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);
    if (ymdMatch) {
      const y = Number(ymdMatch[1]);
      const m = Number(ymdMatch[2]);
      const d = Number(ymdMatch[3]);
      if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const mm = String(m).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return { dateStr: `${y}-${mm}-${dd}`, isValid: true };
      }
    }

    // Định dạng DD/MM/YYYY hoặc DD-MM-YYYY (kèm giờ phút ví dụ: 17:47 01/01/2026 hoặc 01/01/2026 17:47)
    const dmyMatch = str.match(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})\b/);
    if (dmyMatch) {
      const d = Number(dmyMatch[1]);
      const m = Number(dmyMatch[2]);
      const y = Number(dmyMatch[3]);
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
