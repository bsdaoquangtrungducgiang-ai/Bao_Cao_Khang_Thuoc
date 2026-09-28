/**
 * PDF IMPORT SERVICE - BAO-CAO-KHANG-THUOC
 * Trích xuất và nhận diện dữ liệu phiếu kết quả xét nghiệm vi sinh từ file PDF
 * Tuân thủ yêu cầu mục XIV
 */

const PDFImportService = {
  /**
   * Đọc file PDF và trích xuất text qua PDF.js
   * @param {File} file 
   * @returns {Promise<Object>} { rawText, parsedReport, confidenceScore, needsReview }
   */
  async parsePDF(file) {
    if (typeof pdfjsLib === 'undefined') {
      throw new Error('Thư viện PDF.js chưa được tải!');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return this.extractClinicalData(fullText, file.name);
  },

  /**
   * Phân tích văn bản phiếu xét nghiệm bằng mẫu nhận diện y khoa
   */
  extractClinicalData(text, fileName = 'Report.pdf') {
    if (!text || !text.trim()) {
      return {
        fileName,
        rawText: '',
        confidenceScore: 0,
        needsReview: true,
        warningMessage: 'Không tìm thấy lớp văn bản số trong file PDF (Có thể là bản scan hình ảnh). Vui lòng kiểm tra kỹ trước khi lưu!',
        extractedInfo: null,
        astRecords: []
      };
    }

    const cleanText = text.replace(/\s+/g, ' ');

    // 1. Nhận diện Mã bệnh nhân (Patient Code)
    let patientCode = '';
    const pCodeMatch = cleanText.match(/(?:mã\s*bn|mã\s*bệnh\s*nhân|mã\s*ba|patient\s*id|pid)[:\s]*([A-Z0-9\-_]{4,15})/i) ||
                       cleanText.match(/\b(BN\d{4,8})\b/i);
    if (pCodeMatch) patientCode = pCodeMatch[1].trim();

    // 2. Nhận diện Họ tên bệnh nhân
    let patientName = '';
    const nameMatch = cleanText.match(/(?:họ\s*(?:và)?\s*tên|tên\s*bệnh\s*nhân|patient\s*name)[:\s]*([A-ZÀ-Ỹa-zà-ỹ\s]{3,35})(?=\s+(?:tuổi|giới|ngày|mã|khoa))/i) ||
                      cleanText.match(/(?:họ\s*(?:và)?\s*tên|patient\s*name)[:\s]*([^\,\;\:\.]+)/i);
    if (nameMatch) patientName = nameMatch[1].trim();

    // 3. Nhận diện Tuổi & Giới tính
    let age = null;
    const ageMatch = cleanText.match(/(?:tuổi|age)[:\s]*(\d{1,3})/i);
    if (ageMatch) age = parseInt(ageMatch[1], 10);

    let sex = 'Unknown';
    if (/giới\s*(?:tính)?[:\s]*(?:nam|male|m)/i.test(cleanText)) sex = 'Nam';
    else if (/giới\s*(?:tính)?[:\s]*(?:nữ|female|f)/i.test(cleanText)) sex = 'Nữ';

    // 4. Nhận diện Bệnh phẩm
    let specimenType = 'Khác';
    const specMatch = cleanText.match(/(?:bệnh\s*phẩm|loại\s*bệnh\s*phẩm|mẫu\s*thử|specimen)[:\s]*([A-ZÀ-Ỹa-zà-ỹ\s\(\)]+?)(?=\s+(?:ngày|khoa|vi\s*khuẩn|bác\s*sĩ))/i);
    if (specMatch) {
      specimenType = specMatch[1].trim();
    } else {
      // Tìm từ khóa bệnh phẩm trực tiếp
      const keywords = ['Nước tiểu', 'Máu', 'Đờm', 'Mủ', 'Dịch màng phổi', 'Dịch não tủy', 'Dịch vết thương', 'Dịch phế quản'];
      for (const kw of keywords) {
        if (new RegExp(kw, 'i').test(cleanText)) {
          specimenType = kw;
          break;
        }
      }
    }

    // 5. Nhận diện Ngày lấy mẫu
    let collectionDate = new Date().toISOString().split('T')[0];
    const dateMatch = cleanText.match(/(?:ngày\s*(?:lấy\s*mẫu|nhận\s*mẫu|xét\s*nghiệm)?|date)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i);
    if (dateMatch) {
      const dNorm = window.DataNormalization?.normalizeDate(dateMatch[1]);
      if (dNorm?.isValid) collectionDate = dNorm.dateStr;
    }

    // 6. Nhận diện Vi khuẩn
    let organismName = 'Chưa xác định';
    const knownBugs = [
      'Escherichia coli', 'Klebsiella pneumoniae', 'Pseudomonas aeruginosa',
      'Acinetobacter baumannii', 'Staphylococcus aureus', 'Enterococcus faecalis',
      'Enterococcus faecium', 'Streptococcus pneumoniae', 'Enterobacter cloacae', 'Proteus mirabilis'
    ];
    for (const bug of knownBugs) {
      if (new RegExp(bug, 'i').test(cleanText)) {
        organismName = bug;
        break;
      }
    }

    // 7. Nhận diện Kết quả Kháng sinh đồ (AST Table Extraction)
    const astRecords = [];
    const knownAbx = [
      'AMP', 'AMC', 'TZP', 'CTX', 'CRO', 'CAZ', 'FEP', 'MEM', 'IPM', 'ETP',
      'CIP', 'LEV', 'GEN', 'AMK', 'SXT', 'VAN', 'LZD', 'TEC', 'CLI', 'ERY', 'COL'
    ];

    knownAbx.forEach(abx => {
      // Regex tìm kiếm kháng sinh kèm MIC hoặc kết quả S/I/R (cho phép có dấu ngoặc đơn ví dụ (AMP) >= 32 R)
      const abxRegex = new RegExp(`(?:${abx})\\)?[\\s\\:\\-\\=]+(?:(?:<=|>=|<|>)?\\s*([\\d\\.]+)\\s*)?(?:(S|I|R|Sensitive|Resistant|Intermediate|Nhạy|Kháng|Trung gian))\\b`, 'i');
      const match = cleanText.match(abxRegex);

      if (match) {
        const rawMic = match[1] ? parseFloat(match[1]) : null;
        const rawRes = match[2];
        const normRes = window.DataNormalization?.normalizeAST(rawRes);

        astRecords.push({
          patient_code: patientCode || 'BN_UNKNOWN',
          patient_name: patientName,
          age,
          sex,
          specimen_type: specimenType,
          collection_date: collectionDate,
          organism_name: organismName,
          antibiotic_code: abx,
          mic: rawMic,
          raw_result: rawRes,
          normalized_result: normRes?.normalized_value || 'NA',
          interpretation: normRes?.normalized_value || 'NA'
        });
      }
    });

    // Đánh giá Độ tin cậy (Confidence Score)
    let score = 0;
    if (patientCode) score += 25;
    if (organismName !== 'Chưa xác định') score += 25;
    if (astRecords.length >= 3) score += 30;
    else if (astRecords.length > 0) score += 15;
    if (collectionDate) score += 20;

    const needsReview = score < 70;
    let warningMessage = null;
    if (needsReview) {
      warningMessage = 'Không thể tự động xác định chắc chắn dữ liệu. Vui lòng kiểm tra trước khi lưu.';
    }

    return {
      fileName,
      rawText: text,
      confidenceScore: score,
      needsReview,
      warningMessage,
      extractedInfo: {
        patientCode,
        patientName,
        age,
        sex,
        specimenType,
        collectionDate,
        organismName
      },
      astRecords
    };
  }
};

if (typeof window !== 'undefined') {
  window.PDFImportService = PDFImportService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PDFImportService };
}
