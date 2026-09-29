/**
 * IMPORT SERVICE - BAO-CAO-KHANG-THUOC
 * Xử lý đọc file Excel / CSV, nhận diện cột tự động, biến đổi bảng ngang/dọc và nạp dữ liệu vào Database
 * Tuân thủ các mục X, XI, XV, XXXII, XXXIII
 */

const ImportService = {
  // Từ điển nhận diện cột tự động (Auto-detection column mapping)
  headerAliasDictionary: {
    patient_code: [
      'pid', 'mã bn', 'mã bệnh nhân', 'ma bn', 'ma benh nhan', 'patient code', 'patient id', 'patient_id', 'mabenhnhan',
      'mã y tế', 'ma y te', 'mayte', 'mrn', 'so_benh_an', 'maba', 'mã ba', 'mã người bệnh', 'ma nguoi benh',
      'mã số người bệnh', 'ma so nguoi benh', 'mã số bn', 'ma so bn', 'mã số bệnh nhân', 'ma so benh nhan',
      'mã hsba', 'số hsba', 'mã hồ sơ', 'số hồ sơ', 'so ho so', 'mã tiếp nhận', 'số tiếp nhận', 'so tiep nhan',
      'mã khám', 'mã lượt khám', 'mã kcb', 'makcb', 'malk', 'mã số', 'ma so', 'số ba', 'so ba', 'mã viện phí',
      'số thẻ bhyt', 'mã bhyt', 'id bn', 'id người bệnh', 'mã bệnh nhân his', 'mã bn his',
      // Accession / Lab Order codes that serve as specimen/order IDs in hospital exports:
      'sid', 'mã xét nghiệm', 'mã xn', 'số xét nghiệm', 'so xn', 'mã mẫu', 'ma mau', 'barcode', 'mã phiếu', 'số phiếu',
      'so phieu', 'mã ca bệnh', 'mã đợt khám', 'accession', 'accession no', 'sample id', 'sample_id', 'specimen id'
    ],
    patient_name: [
      'họ và tên', 'họ tên', 'tên bệnh nhân', 'ho ten', 'ten benh nhan', 'patient name', 'patient_name', 'hoten',
      'tên bn', 'họ và tên bệnh nhân', 'tên người bệnh', 'họ tên người bệnh', 'họ và tên người bệnh', 'full name',
      'fullname', 'patient'
    ],
    age: ['tuổi', 'tuoi', 'age', 'năm sinh', 'nam sinh', 'ngày sinh', 'ngay sinh', 'yob', 'birth year', 'dob', 'date of birth'],
    sex: ['giới', 'giới tính', 'gioi', 'gioi tinh', 'sex', 'gender', 'phái', 'phai'],
    department: [
      'tên khoa', 'ten khoa', 'khoa', 'khoa phòng', 'khoa phong', 'phòng', 'department', 'dept',
      'khoa chỉ định', 'khoa điều trị', 'khoa dieu tri', 'khoa yeu cau', 'phòng khám', 'phong kham',
      'vị trí', 'vi tri', 'đơn vị'
    ],
    specimen_type: [
      'bệnh phẩm', 'loại bệnh phẩm', 'benh pham', 'loai benh pham', 'specimen', 'specimen type', 'specimen_type',
      'mẫu bệnh phẩm', 'loại mẫu', 'chủng bệnh phẩm', 'nguồn mẫu', 'vị trí lấy mẫu', 'specimen_name'
    ],
    collection_date: [
      'intime', 'in time', 'tg có kết quả cấy', 'thời gian có kết quả cấy', 'tg co ket qua cay',
      'ngày lấy mẫu', 'ngày nhận mẫu', 'ngày cấy', 'ngày làm xn', 'ngày chỉ định', 'ngày xét nghiệm',
      'ngay lay mau', 'ngay nhan mau', 'ngay cay', 'tg cấy', 'thời gian cấy', 'tg nhận mẫu', 'thời gian nhận mẫu',
      'collection date', 'collection_date', 'received date', 'specimen date', 'ngay_nhan', 'ngay nhan'
    ],
    organism_name: [
      'tên vi khuẩn', 'ten vi khuan', 'tên vk', 'chủng vi khuẩn', 'vi khuẩn', 'vi khuan',
      'mã vi khuẩn', 'ma vi khuan', 'organism', 'organism name', 'organism_name',
      'mầm bệnh', 'bacterial', 'vi sinh vật', 'tên vi sinh vật', 'chủng phân lập',
      'định danh vi khuẩn', 'định danh', 'kết quả định danh'
    ],
    antibiotic_code: [
      'kháng sinh', 'mã kháng sinh', 'tên kháng sinh', 'khang sinh', 'antibiotic', 'antibiotic code',
      'abx', 'thuốc kháng sinh', 'tên thuốc'
    ],
    interpretation: [
      'kết quả ast', 'kết quả kháng sinh', 'kết quả sir', 'kết quả s/i/r', 's/i/r', 'sir', 'interpretation',
      'độ nhạy', 'độ nhạy cảm', 'nhạy cảm', 'kháng thuốc', 'mic/sir', 'diễn giải', 'phân loại sir', 'kết luận ast',
      'kết quả ksđ', 'kq ksđ', 'độ nhạy kháng sinh'
    ]
  },

  /**
   * Bộ phân tích dữ liệu phân cách đa năng (CSV, TSV, Semicolon CSV)
   * Tự động phát hiện dấu phân cách (;, \t, ,), xử lý quotes, newline trong ô, và UTF-8 BOM
   */
  parseDelimitedText(cleanText) {
    if (!cleanText) return { delimiter: ',', rows: [] };
    cleanText = String(cleanText).replace(/^\uFEFF/, '');

    const sampleLines = cleanText.split(/\r?\n/).slice(0, 10).filter(l => l.trim().length > 0);
    let delimiter = ',';
    let maxCount = -1;
    [';', '\t', ','].forEach(delim => {
      let count = 0;
      sampleLines.forEach(line => {
        const matches = line.split(delim);
        if (matches.length > 1) count += (matches.length - 1);
      });
      if (count > maxCount) {
        maxCount = count;
        delimiter = delim;
      }
    });

    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (currentCell !== '' || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
    }

    return { delimiter, rows };
  },

  /**
   * Đọc file Excel (.xlsx, .xls) hoặc CSV qua SheetJS & parseDelimitedText
   */
  async parseFile(file) {
    return new Promise((resolve, reject) => {
      const isCsv = file.name && (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.tsv'));

      // Ưu tiên đọc file dạng Text nếu là CSV / TXT / TSV
      if (isCsv) {
        const textReader = new FileReader();
        textReader.onload = (e) => {
          try {
            const text = e.target.result;
            const parsed = this.parseDelimitedText(text);
            if (!parsed.rows || parsed.rows.length === 0) {
              throw new Error('File không chứa dữ liệu!');
            }
            const rawHeaders = parsed.rows[0].map(h => String(h || '').replace(/^\uFEFF/, '').trim());
            const dataRows = parsed.rows.slice(1).filter(r => r.some(c => String(c).trim() !== ''));

            const detectedMapping = this.autoDetectColumns(rawHeaders, dataRows.slice(0, 30));
            const previewRows = dataRows.slice(0, 20);

            resolve({
              fileName: file.name,
              fileSize: file.size,
              fileType: file.name.split('.').pop().toLowerCase(),
              sheetNames: ['Sheet1'],
              activeSheet: 'Sheet1',
              headers: rawHeaders,
              totalRows: dataRows.length,
              totalCols: rawHeaders.length,
              detectedMapping,
              rawHeaders,
              previewRows,
              dataRows
            });
          } catch (err) {
            reject(err);
          }
        };
        textReader.onerror = (err) => reject(new Error('Lỗi khi đọc file CSV: ' + err.message));
        textReader.readAsText(file, 'utf-8');
        return;
      }

      // Đọc file Excel (.xlsx, .xls) qua SheetJS
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          // Lấy sheet đầu tiên
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Đọc thành mảng các mảng dòng (raw matrix)
          let rawMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          if (!rawMatrix || rawMatrix.length === 0) {
            throw new Error('File không chứa dữ liệu!');
          }

          // Tìm dòng header hợp lý (dòng có nhiều ô có chữ nhất trong 5 dòng đầu)
          let headerRowIndex = 0;
          let maxNonEmpty = 0;
          for (let r = 0; r < Math.min(5, rawMatrix.length); r++) {
            const count = rawMatrix[r].filter(cell => String(cell).trim() !== '').length;
            if (count > maxNonEmpty) {
              maxNonEmpty = count;
              headerRowIndex = r;
            }
          }

          let rawHeaders = rawMatrix[headerRowIndex].map(h => String(h || '').replace(/^\uFEFF/, '').trim());
          let dataRows = rawMatrix.slice(headerRowIndex + 1).filter(row => 
            row.some(cell => String(cell).trim() !== '')
          );

          // Trường hợp đặc biệt: file CSV có đuôi .xls/.xlsx hoặc SheetJS không tự tách dấu chấm phẩy
          if (rawHeaders.length <= 2 && rawHeaders[0] && (rawHeaders[0].includes(';') || rawHeaders[0].includes('\t'))) {
            const csvContent = XLSX.utils.sheet_to_csv(worksheet);
            const parsed = this.parseDelimitedText(csvContent);
            if (parsed.rows.length > 0) {
              rawHeaders = parsed.rows[0].map(h => String(h || '').replace(/^\uFEFF/, '').trim());
              dataRows = parsed.rows.slice(1).filter(r => r.some(c => String(c).trim() !== ''));
            }
          }

          // Nhận diện cột tự động (kết hợp tiêu đề và nội dung dữ liệu mẫu)
          const detectedMapping = this.autoDetectColumns(rawHeaders, dataRows.slice(0, 30));

          // Tạo preview 20 dòng
          const previewRows = dataRows.slice(0, 20);

          resolve({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.name.split('.').pop().toLowerCase(),
            sheetNames: workbook.SheetNames,
            activeSheet: firstSheetName,
            headers: rawHeaders,
            totalRows: dataRows.length,
            totalCols: rawHeaders.length,
            detectedMapping,
            rawHeaders,
            previewRows,
            dataRows
          });
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = (err) => reject(new Error('Lỗi khi đọc file: ' + err.message));
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Đọc chuỗi văn bản hoặc CSV paste trực tiếp (Section XV)
   */
  parseText(textData) {
    if (!textData || !textData.trim()) {
      throw new Error('Vui lòng dán nội dung dữ liệu!');
    }

    const parsed = this.parseDelimitedText(textData);
    if (!parsed.rows || parsed.rows.length < 2) {
      throw new Error('Dữ liệu cần tối thiểu 1 dòng tiêu đề và 1 dòng dữ liệu!');
    }

    const rawHeaders = parsed.rows[0].map(h => String(h || '').replace(/^\uFEFF/, '').trim());
    const dataRows = parsed.rows.slice(1).filter(r => r.some(c => String(c).trim() !== ''));
    const detectedMapping = this.autoDetectColumns(rawHeaders, dataRows.slice(0, 30));

    return {
      fileName: 'Text_Paste_' + new Date().toISOString().split('T')[0] + '.csv',
      fileSize: textData.length,
      fileType: 'csv',
      headers: rawHeaders,
      totalRows: dataRows.length,
      totalCols: rawHeaders.length,
      detectedMapping,
      rawHeaders,
      previewRows: dataRows.slice(0, 20),
      dataRows
    };
  },

  /**
   * Tự động nhận diện cột từ Header kết hợp kiểm tra nội dung dữ liệu mẫu (Section X.Bước 3)
   */
  autoDetectColumns(headers = [], sampleRows = []) {
    const Norm = (typeof window !== 'undefined' && window.DataNormalization) ? window.DataNormalization : (typeof DataNormalization !== 'undefined' ? DataNormalization : {});
    const mapping = {};
    const recognizedFields = new Set();
    const antibioticColumns = [];

    // Helper: trích xuất dữ liệu mẫu của 1 cột
    const getSampleValues = (colIdx) => {
      if (!sampleRows || sampleRows.length === 0) return [];
      return sampleRows
        .map(row => row[colIdx])
        .filter(val => val !== undefined && val !== null && String(val).trim() !== '')
        .map(val => String(val).trim());
    };

    // Vòng 1: Khớp chính xác hoàn toàn (Exact match) ưu tiên theo thứ tự từ điển
    const claimedCols = new Set();
    const fieldOrder = [
      'patient_code', 'patient_name', 'collection_date', 'organism_name',
      'specimen_type', 'department', 'sex', 'age', 'antibiotic_code', 'interpretation'
    ];

    fieldOrder.forEach(sysField => {
      const aliases = this.headerAliasDictionary[sysField];
      if (!aliases || recognizedFields.has(sysField)) return;

      let bestCol = -1;
      let bestRank = 999999;

      headers.forEach((header, colIndex) => {
        if (claimedCols.has(colIndex)) return;
        const cleanHeader = String(header).toLowerCase().trim();
        const rank = aliases.indexOf(cleanHeader);
        if (rank !== -1 && rank < bestRank) {
          bestRank = rank;
          bestCol = colIndex;
        }
      });

      if (bestCol !== -1) {
        mapping[bestCol] = {
          colIndex: bestCol,
          rawHeader: headers[bestCol],
          systemField: sysField,
          isAntibiotic: false
        };
        recognizedFields.add(sysField);
        claimedCols.add(bestCol);
      }
    });

    // Vòng 2: Khớp tương đối (Substring match) có bộ lọc an toàn cho các trường chưa nhận diện
    fieldOrder.forEach(sysField => {
      if (recognizedFields.has(sysField)) return;
      const aliases = this.headerAliasDictionary[sysField];
      if (!aliases) return;

      for (let colIndex = 0; colIndex < headers.length; colIndex++) {
        if (claimedCols.has(colIndex)) continue;
        const header = headers[colIndex];
        const cleanHeader = String(header).toLowerCase().trim();

        // Bộ lọc an toàn
        if (sysField === 'interpretation') {
          if (/mã|code|id|số|stt|phiếu|ngay|date|tg|thời gian|time|cấy/.test(cleanHeader)) {
            continue;
          }
        }
        if (sysField === 'collection_date') {
          if (/sinh|yob|birth|dob/.test(cleanHeader)) {
            continue;
          }
        }
        if (sysField === 'organism_name') {
          if (/kết quả cấy|kq cấy|nuôi cấy/.test(cleanHeader)) {
            continue;
          }
        }

        if (aliases.some(alias => cleanHeader.includes(alias))) {
          mapping[colIndex] = {
            colIndex,
            rawHeader: header,
            systemField: sysField,
            isAntibiotic: false
          };
          recognizedFields.add(sysField);
          claimedCols.add(colIndex);
          break;
        }
      }
    });

    // Vòng 3: Phân tích nội dung dữ liệu thực tế (Data Content Sampling)
    headers.forEach((header, colIndex) => {
      if (claimedCols.has(colIndex)) return;
      const current = mapping[colIndex];
      const samples = getSampleValues(colIndex);
      if (samples.length === 0) return;
      const cleanHeader = String(header).toLowerCase().trim();

      // 1. Kiểm tra xem có phải cột Mã định danh / Mã bệnh nhân / Mã mẫu (010126-130011, 23031418...)
      const idMatches = samples.filter(s => Norm.isLikelyIdentifier && Norm.isLikelyIdentifier(s)).length;
      const isMostlyId = samples.length > 0 && (idMatches / samples.length) >= 0.5;

      if (isMostlyId) {
        if (current && current.systemField === 'interpretation') {
          recognizedFields.delete('interpretation');
          current.systemField = 'ignore';
        }
        if (!recognizedFields.has('patient_code') && (!current || current.systemField === 'ignore')) {
          mapping[colIndex] = {
            colIndex,
            rawHeader: header,
            systemField: 'patient_code',
            isAntibiotic: false
          };
          recognizedFields.add('patient_code');
          claimedCols.add(colIndex);
          return;
        }
      }

      // 2. Kiểm tra xem có phải cột Kết quả AST S/I/R
      const astMatches = samples.filter(s => {
        if (!Norm.normalizeAST) return false;
        const res = Norm.normalizeAST(s);
        return res.isValid && res.normalized_value !== 'UNKNOWN' && !res.isIdentifier;
      }).length;
      const isMostlyAST = samples.length > 0 && (astMatches / samples.length) >= 0.5;

      if (isMostlyAST && !recognizedFields.has('interpretation')) {
        // Chỉ gán interpretation nếu đây KHÔNG phải là cột kháng sinh
        const normAbx = Norm.normalizeAntibiotic ? Norm.normalizeAntibiotic(header) : null;
        const isKnownAbx = (Norm.antibioticDictionary && (cleanHeader in Norm.antibioticDictionary)) || (normAbx && /^[A-Z0-9_]{2,8}$/.test(normAbx));
        if (isKnownAbx) {
          // Là cột kháng sinh trong bảng ngang -> Không được gán làm interpretation!
          return;
        }

        // Tránh nhầm "Kết quả cấy" hoặc tiêu đề vi khuẩn với cột kết quả AST
        if (!/cấy|nuôi cấy|vi khuẩn|bacterial|culture/.test(cleanHeader)) {
          if (!current || current.systemField === 'ignore') {
            mapping[colIndex] = {
              colIndex,
              rawHeader: header,
              systemField: 'interpretation',
              isAntibiotic: false
            };
            recognizedFields.add('interpretation');
            claimedCols.add(colIndex);
            return;
          }
        }
      }

      // 3. Kiểm tra xem có phải cột Tên Vi khuẩn
      const orgMatches = samples.filter(s => Norm.normalizeOrganism && Norm.normalizeOrganism(s).isValid).length;
      if (samples.length > 0 && (orgMatches / samples.length) >= 0.4 && !recognizedFields.has('organism_name')) {
        mapping[colIndex] = {
          colIndex,
          rawHeader: header,
          systemField: 'organism_name',
          isAntibiotic: false
        };
        recognizedFields.add('organism_name');
        claimedCols.add(colIndex);
        return;
      }

      // 4. Kiểm tra xem có phải cột Ngày lấy mẫu
      if (!/sinh|yob|birth|dob/.test(cleanHeader)) {
        const dateMatches = samples.filter(s => Norm.normalizeDate && Norm.normalizeDate(s).isValid).length;
        if (samples.length > 0 && (dateMatches / samples.length) >= 0.6 && !recognizedFields.has('collection_date')) {
          mapping[colIndex] = {
            colIndex,
            rawHeader: header,
            systemField: 'collection_date',
            isAntibiotic: false
          };
          recognizedFields.add('collection_date');
          claimedCols.add(colIndex);
          return;
        }
      }
    });

    // Vòng 4: Nhận diện cột Kháng sinh cho bảng định dạng ngang (Wide format)
    headers.forEach((header, colIndex) => {
      if (claimedCols.has(colIndex)) {
        return;
      }

      const cleanHeader = String(header).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (Norm.nonAntibioticBlacklist && Norm.nonAntibioticBlacklist.has(cleanHeader)) {
        mapping[colIndex] = {
          colIndex,
          rawHeader: header,
          systemField: 'ignore',
          isAntibiotic: false
        };
        return;
      }

      const normAbx = Norm.normalizeAntibiotic ? Norm.normalizeAntibiotic(header) : null;
      const samples = getSampleValues(colIndex);
      const isAstContent = samples.length === 0 || samples.some(s => {
        if (!Norm.normalizeAST) return false;
        const res = Norm.normalizeAST(s);
        return res.isValid && !res.isIdentifier && res.normalized_value !== 'NA';
      });

      const isKnownAbx = Norm.antibioticDictionary && (cleanHeader in Norm.antibioticDictionary);
      if (normAbx && (isKnownAbx || (/^[A-Z0-9_]{2,8}$/.test(normAbx) && isAstContent))) {
        antibioticColumns.push({
          colIndex,
          headerName: header,
          antibioticCode: normAbx
        });
        mapping[colIndex] = {
          colIndex,
          rawHeader: header,
          systemField: `antibiotic_${normAbx}`,
          isAntibiotic: true
        };
        claimedCols.add(colIndex);
      } else {
        mapping[colIndex] = {
          colIndex,
          rawHeader: header,
          systemField: 'ignore',
          isAntibiotic: false
        };
      }
    });

    return {
      columnMap: mapping,
      antibioticColumns,
      isWideFormat: antibioticColumns.length >= 3 // Cần tối thiểu 3 cột kháng sinh để xác định là bảng ngang
    };
  },

  /**
   * Chuyển đổi dữ liệu ma trận (Excel) thành danh sách đối tượng AST chuẩn hóa
   * Hỗ trợ Forward-fill dòng gộp và Tự động sinh mã bệnh nhân nếu thiếu
   */
  transformData(dataRows = [], mappingInfo = {}, options = {}) {
    const Norm = (typeof window !== 'undefined' && window.DataNormalization) ? window.DataNormalization : (typeof DataNormalization !== 'undefined' ? DataNormalization : {});
    const { autoForwardFill = true, autoGeneratePatientCode = true } = options;
    const columnMap = mappingInfo.columnMap || {};
    const isWide = mappingInfo.isWideFormat;
    const records = [];

    // Bộ nhớ đệm lưu thông tin bệnh nhân của dòng trước đó (Forward-Fill cho ô merged)
    let lastPatient = {
      patient_code: '',
      patient_name: '',
      age: null,
      sex: 'Unknown',
      department: '',
      specimen_type: '',
      collection_date: '',
      organism_name: ''
    };

    dataRows.forEach((row, rowIdx) => {
      const rowNum = rowIdx + 2;
      const baseInfo = {
        patient_code: '',
        patient_name: '',
        age: null,
        sex: 'Unknown',
        department: '',
        specimen_type: '',
        collection_date: '',
        organism_name: ''
      };

      // Đọc thông tin cơ bản từ dòng hiện tại
      for (const colIndex in columnMap) {
        const field = columnMap[colIndex].systemField;
        const val = row[colIndex];
        if (field && !field.startsWith('antibiotic_') && field !== 'ignore') {
          baseInfo[field] = val !== undefined && val !== null ? String(val).trim() : '';
        }
      }

      if (isWide) {
        // --- ĐỊNH DẠNG BẢNG NGANG (Mỗi cột là 1 kháng sinh) ---
        // Áp dụng Forward-fill nếu dòng hiện tại bị trống thông tin bệnh nhân
        if (autoForwardFill) {
          if (!baseInfo.patient_code && lastPatient.patient_code) baseInfo.patient_code = lastPatient.patient_code;
          if (!baseInfo.patient_name && lastPatient.patient_name) baseInfo.patient_name = lastPatient.patient_name;
          if (!baseInfo.collection_date && lastPatient.collection_date) baseInfo.collection_date = lastPatient.collection_date;
          if (!baseInfo.specimen_type && lastPatient.specimen_type) baseInfo.specimen_type = lastPatient.specimen_type;
          if (!baseInfo.organism_name && lastPatient.organism_name) baseInfo.organism_name = lastPatient.organism_name;
        }

        // Tự động sinh mã bệnh nhân nếu vẫn trống
        if (!baseInfo.patient_code && autoGeneratePatientCode) {
          baseInfo.patient_code = `BN_AUTO_${rowNum}`;
        }

        // Cập nhật lastPatient nếu dòng hiện tại có thông tin
        if (baseInfo.patient_code && !baseInfo.patient_code.startsWith('BN_AUTO_')) {
          lastPatient = { ...baseInfo };
        }

        // Xoay các cột kháng sinh thành các bản ghi AST
        mappingInfo.antibioticColumns.forEach(abxCol => {
          const rawResult = row[abxCol.colIndex];
          if (rawResult !== undefined && rawResult !== null && String(rawResult).trim() !== '') {
            records.push({
              ...baseInfo,
              antibiotic_code: abxCol.antibioticCode,
              raw_result: String(rawResult).trim(),
              interpretation: String(rawResult).trim()
            });
          }
        });
      } else {
        // --- ĐỊNH DẠNG BẢNG DỌC (Mỗi dòng là 1 kết quả) ---
        let abxCode = '';
        let interp = '';
        for (const colIndex in columnMap) {
          const field = columnMap[colIndex].systemField;
          if (field === 'antibiotic_code') abxCode = row[colIndex];
          if (field === 'interpretation') interp = row[colIndex];
        }

        const rawAbxStr = abxCode !== undefined && abxCode !== null ? String(abxCode).trim() : '';
        const rawInterpStr = interp !== undefined && interp !== null ? String(interp).trim() : '';

        // Kiểm tra xem dòng này có phải là dòng tiêu đề phụ / mã mẫu của nhóm xét nghiệm không
        const isMetadataRow = Norm.isLikelyIdentifier && Norm.isLikelyIdentifier(rawInterpStr) && !rawAbxStr;
        if (isMetadataRow) {
          // Dòng này chứa mã số tiếp nhận / mã mẫu -> Cập nhật vào lastPatient để các dòng kháng sinh phía dưới kế thừa
          lastPatient.patient_code = rawInterpStr;
          return; // Bỏ qua không đẩy thành bản ghi AST rác
        }

        // Forward-fill từ dòng trước nếu các trường hành chính bị trống
        if (autoForwardFill) {
          if (!baseInfo.patient_code && lastPatient.patient_code) baseInfo.patient_code = lastPatient.patient_code;
          if (!baseInfo.patient_name && lastPatient.patient_name) baseInfo.patient_name = lastPatient.patient_name;
          if (!baseInfo.collection_date && lastPatient.collection_date) baseInfo.collection_date = lastPatient.collection_date;
          if (!baseInfo.specimen_type && lastPatient.specimen_type) baseInfo.specimen_type = lastPatient.specimen_type;
          if (!baseInfo.organism_name && lastPatient.organism_name) baseInfo.organism_name = lastPatient.organism_name;
        }

        // Tự động sinh mã bệnh nhân nếu vẫn trống
        if (!baseInfo.patient_code && autoGeneratePatientCode) {
          baseInfo.patient_code = `BN_AUTO_${rowNum}`;
        }

        // Cập nhật lastPatient
        if (baseInfo.patient_code && !baseInfo.patient_code.startsWith('BN_AUTO_')) {
          lastPatient = { ...baseInfo };
        }

        // Bỏ qua dòng hoàn toàn rỗng không có kháng sinh và không có kết quả
        if (!rawAbxStr && !rawInterpStr) {
          return;
        }

        records.push({
          ...baseInfo,
          antibiotic_code: rawAbxStr,
          raw_result: rawInterpStr,
          interpretation: rawInterpStr
        });
      }
    });

    return records;
  },

  /**
   * Lưu các bản ghi hợp lệ vào Database (Supabase hoặc Fallback Store)
   */
  async commitImport(validatedRecords = [], metadata = {}) {
    const sb = window.SupabaseManager?.client;
    const hasDb = window.SupabaseManager?.hasTables;

    const successful = validatedRecords.length;

    if (sb && hasDb) {
      try {
        // 1. Tạo import job record
        const { data: job, error: jobErr } = await sb.from('import_jobs').insert([{
          file_name: metadata.fileName || 'import_data.xlsx',
          file_type: metadata.fileType || 'xlsx',
          file_size: metadata.fileSize || 0,
          record_count: metadata.totalRows || successful,
          successful_records: successful,
          error_records: metadata.errorCount || 0,
          warning_records: metadata.warningCount || 0,
          processing_status: 'completed',
          file_fingerprint: metadata.fingerprint || null
        }]).select().single();

        // 2. Insert theo lô
        // Lưu ý: Đối với Supabase RLS, ta có thể upsert hoặc insert theo bảng quan hệ
        for (const rec of validatedRecords) {
          // Check/Insert patient
          let patientId = null;
          const { data: pat } = await sb.from('patients').upsert([{
            patient_code: rec.patient_code,
            patient_name: rec.patient_name,
            age: rec.age,
            sex: rec.sex,
            department: rec.department
          }], { onConflict: 'patient_code' }).select('id').single();

          patientId = pat?.id;

          // Insert specimen
          let specimenId = null;
          if (patientId) {
            const { data: spec } = await sb.from('specimens').insert([{
              patient_id: patientId,
              specimen_type: rec.specimen_type,
              collection_date: rec.collection_date || new Date().toISOString().split('T')[0],
              requesting_department: rec.department
            }]).select('id').single();
            specimenId = spec?.id;
          }

          // Insert culture
          let cultureId = null;
          if (specimenId) {
            const { data: cult } = await sb.from('cultures').insert([{
              specimen_id: specimenId,
              culture_date: rec.collection_date || new Date().toISOString().split('T')[0],
              organism_name: rec.organism_name
            }]).select('id').single();
            cultureId = cult?.id;
          }

          // Insert AST result
          if (cultureId) {
            await sb.from('ast_results').insert([{
              culture_id: cultureId,
              antibiotic_code: rec.antibiotic_code,
              raw_result: rec.raw_result,
              normalized_result: rec.normalized_result,
              interpretation: rec.interpretation,
              fingerprint: rec.fingerprint,
              tested_date: rec.collection_date
            }]);
          }
        }

        // 3. Ghi Audit Log
        await window.AuditService?.log('IMPORT', 'import_jobs', job?.id, {
          fileName: metadata.fileName,
          total: successful
        });

        return { success: true, count: successful, mode: 'supabase' };
      } catch (err) {
        console.warn('[ImportService] Supabase commit error, saving to in-memory store:', err);
      }
    }

    // Fallback: Lưu vào DemoDataService
    const demo = window.DemoDataService?.getAll();
    if (demo) {
      validatedRecords.forEach((rec, i) => {
        demo.astResults.push({
          id: 'imported-ast-' + Date.now() + '-' + i,
          culture_id: 'imported-cult-' + i,
          patient_code: rec.patient_code,
          specimen_type: rec.specimen_type,
          organism_name: rec.organism_name,
          antibiotic_code: rec.antibiotic_code,
          raw_result: rec.raw_result,
          normalized_result: rec.normalized_result,
          interpretation: rec.interpretation,
          tested_date: rec.collection_date,
          created_at: new Date().toISOString()
        });
      });
    }

    // Ghi Audit Log
    await window.AuditService?.log('IMPORT', 'local_store', null, {
      fileName: metadata.fileName,
      total: successful
    });

    return { success: true, count: successful, mode: 'local' };
  },

  /**
   * Xuất báo cáo lỗi ra file Excel (Section LII: Export error Excel)
   */
  downloadErrorReport(errorList = []) {
    if (!errorList || errorList.length === 0) {
      window.Toast.info('Không có lỗi nào để xuất báo cáo!');
      return;
    }

    const rows = errorList.map(item => ({
      'Dòng Excel': item.row,
      'Cột / Trường': item.field,
      'Giá trị ghi nhận': item.value,
      'Mô tả lỗi / Cảnh báo': item.error,
      'Mức độ': item.severity === 'error' ? 'LỖI NGHIÊM TRỌNG' : 'CẢNH BÁO'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bao_Cao_Loi_Du_Lieu');

    XLSX.writeFile(wb, `Bao_Cao_Loi_Import_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
};

if (typeof window !== 'undefined') {
  window.ImportService = ImportService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ImportService };
}
