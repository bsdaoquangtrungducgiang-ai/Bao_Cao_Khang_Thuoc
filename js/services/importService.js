/**
 * IMPORT SERVICE - BAO-CAO-KHANG-THUOC
 * Xử lý đọc file Excel / CSV, nhận diện cột tự động, biến đổi bảng ngang/dọc và nạp dữ liệu vào Database
 * Tuân thủ các mục X, XI, XV, XXXII, XXXIII
 */

const ImportService = {
  // Từ điển nhận diện cột tự động (Auto-detection column mapping)
  headerAliasDictionary: {
    patient_code: [
      'mã bn', 'mã bệnh nhân', 'ma bn', 'ma benh nhan', 'patient code', 'patient id', 'patient_id', 'mabenhnhan',
      'so_benh_an', 'maba', 'mã ba', 'mã người bệnh', 'ma nguoi benh', 'mã số người bệnh', 'ma so nguoi benh',
      'mã số bn', 'ma so bn', 'mã số bệnh nhân', 'ma so benh nhan', 'mã y tế', 'ma y te', 'mayte', 'pid', 'mrn',
      'mã hsba', 'số hsba', 'mã hồ sơ', 'số hồ sơ', 'so ho so', 'mã tiếp nhận', 'số tiếp nhận', 'so tiep nhan',
      'mã khám', 'mã lượt khám', 'mã kcb', 'makcb', 'malk', 'mã số', 'ma so', 'số ba', 'so ba', 'mã viện phí',
      'số thẻ bhyt', 'mã bhyt', 'id bn', 'id người bệnh', 'mã bệnh nhân his', 'mã bn his',
      // Accession / Lab Order codes that serve as specimen/order IDs in hospital exports:
      'mã xét nghiệm', 'mã xn', 'số xét nghiệm', 'so xn', 'mã mẫu', 'ma mau', 'barcode', 'mã phiếu', 'số phiếu',
      'so phieu', 'mã ca bệnh', 'mã đợt khám', 'accession', 'accession no', 'sample id', 'sample_id', 'specimen id'
    ],
    patient_name: [
      'họ và tên', 'họ tên', 'tên bệnh nhân', 'ho ten', 'ten benh nhan', 'patient name', 'patient_name', 'hoten',
      'tên bn', 'họ và tên bệnh nhân', 'tên người bệnh', 'họ tên người bệnh', 'họ và tên người bệnh', 'full name',
      'fullname', 'patient'
    ],
    age: ['tuổi', 'tuoi', 'age', 'năm sinh', 'nam sinh', 'yob', 'birth year'],
    sex: ['giới', 'giới tính', 'gioi', 'gioi tinh', 'sex', 'gender', 'phái', 'phai'],
    department: [
      'khoa', 'khoa phòng', 'khoa phong', 'phòng', 'department', 'dept', 'khoa chỉ định', 'khoa điều trị',
      'khoa dieu tri', 'khoa yeu cau', 'phòng khám', 'phong kham', 'vi trí', 'đơn vị'
    ],
    specimen_type: [
      'bệnh phẩm', 'loại bệnh phẩm', 'benh pham', 'loai benh pham', 'specimen', 'specimen type', 'specimen_type',
      'mẫu bệnh phẩm', 'loại mẫu', 'chủng bệnh phẩm', 'nguồn mẫu', 'vị trí lấy mẫu', 'specimen_name'
    ],
    collection_date: [
      'ngày lấy mẫu', 'ngày nhận mẫu', 'ngày cấy', 'ngày làm xn', 'ngày chỉ định', 'ngày xét nghiệm',
      'ngay lay mau', 'ngay nhan mau', 'ngay cay', 'collection date', 'collection_date', 'received date',
      'specimen date', 'ngay_nhan', 'ngay'
    ],
    organism_name: [
      'tên vi khuẩn', 'chủng vi khuẩn', 'vi khuẩn', 'vi khuan', 'ten vi khuan', 'organism', 'organism name',
      'organism_name', 'mầm bệnh', 'bacterial', 'vi sinh vật', 'tên vi sinh vật', 'chủng phân lập', 'kết quả cấy',
      'kết quả nuôi cấy', 'định danh vi khuẩn', 'định danh', 'kết quả định danh'
    ],
    antibiotic_code: [
      'kháng sinh', 'mã kháng sinh', 'tên kháng sinh', 'khang sinh', 'antibiotic', 'antibiotic code',
      'abx', 'thuốc kháng sinh', 'tên thuốc'
    ],
    interpretation: [
      'kết quả ast', 'kết quả kháng sinh', 'kết quả sir', 'kết quả s/i/r', 's/i/r', 'sir', 'interpretation',
      'độ nhạy', 'độ nhạy cảm', 'nhạy cảm', 'kháng thuốc', 'mic/sir', 'diễn giải', 'phân loại sir', 'kết luận ast',
      'kết quả ksđ', 'kq ksđ', 'độ nhạy kháng sinh', 'kết quả'
    ]
  },

  /**
   * Đọc file Excel (.xlsx, .xls) hoặc CSV qua SheetJS
   */
  async parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          // Lấy sheet đầu tiên
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Đọc thành mảng các mảng dòng (raw matrix)
          const rawMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

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

          const rawHeaders = rawMatrix[headerRowIndex].map(h => String(h || '').trim());
          const dataRows = rawMatrix.slice(headerRowIndex + 1).filter(row => 
            row.some(cell => String(cell).trim() !== '')
          );

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

    const lines = textData.trim().split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      throw new Error('Dữ liệu cần tối thiểu 1 dòng tiêu đề và 1 dòng dữ liệu!');
    }

    // Tự động phát hiện dấu phân cách (phẩy, tab, hoặc chấm phẩy)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const parseLine = (line) => line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));

    const rawHeaders = parseLine(lines[0]);
    const dataRows = lines.slice(1).map(parseLine);
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

    // Vòng 1: Khớp chính xác hoàn toàn (Exact match) với từ điển
    headers.forEach((header, colIndex) => {
      const cleanHeader = String(header).toLowerCase().trim();
      for (const [sysField, aliases] of Object.entries(this.headerAliasDictionary)) {
        if (recognizedFields.has(sysField)) continue;
        if (aliases.some(alias => cleanHeader === alias)) {
          mapping[colIndex] = {
            colIndex,
            rawHeader: header,
            systemField: sysField,
            isAntibiotic: false
          };
          recognizedFields.add(sysField);
          break;
        }
      }
    });

    // Vòng 2: Khớp tương đối (Substring match) có bộ lọc an toàn
    headers.forEach((header, colIndex) => {
      if (mapping[colIndex]) return; // Đã khớp ở vòng 1

      const cleanHeader = String(header).toLowerCase().trim();
      let matchedField = null;

      for (const [sysField, aliases] of Object.entries(this.headerAliasDictionary)) {
        if (recognizedFields.has(sysField)) continue;

        // Bộ lọc an toàn: Tránh nhận diện nhầm mã số thành kết quả xét nghiệm
        if (sysField === 'interpretation') {
          // Nếu tiêu đề chứa mã, code, id, số, phiếu, ngày -> Không thể là kết quả AST
          if (/mã|code|id|số|stt|phiếu|ngay|date/.test(cleanHeader)) {
            continue;
          }
        }
        if (sysField === 'collection_date') {
          // Tránh nhầm ngày sinh với ngày lấy mẫu
          if (/sinh|yob|birth/.test(cleanHeader)) {
            continue;
          }
        }

        if (aliases.some(alias => cleanHeader.includes(alias))) {
          matchedField = sysField;
          recognizedFields.add(sysField);
          break;
        }
      }

      if (matchedField) {
        mapping[colIndex] = {
          colIndex,
          rawHeader: header,
          systemField: matchedField,
          isAntibiotic: false
        };
      }
    });

    // Vòng 3: Phân tích nội dung dữ liệu thực tế (Data Content Sampling)
    headers.forEach((header, colIndex) => {
      const current = mapping[colIndex];
      const samples = getSampleValues(colIndex);
      if (samples.length === 0) return;

      // 1. Kiểm tra xem có phải cột Mã định danh / Mã bệnh nhân / Mã mẫu (010126-130011, 23031418...)
      const idMatches = samples.filter(s => Norm.isLikelyIdentifier && Norm.isLikelyIdentifier(s)).length;
      const isMostlyId = samples.length > 0 && (idMatches / samples.length) >= 0.5;

      if (isMostlyId) {
        // Nếu cột này bị nhận diện nhầm là interpretation -> Hủy ngay lập tức!
        if (current && current.systemField === 'interpretation') {
          recognizedFields.delete('interpretation');
          current.systemField = 'ignore';
        }
        // Nếu chưa có patient_code -> Gán làm patient_code
        if (!recognizedFields.has('patient_code') && (!current || current.systemField === 'ignore')) {
          mapping[colIndex] = {
            colIndex,
            rawHeader: header,
            systemField: 'patient_code',
            isAntibiotic: false
          };
          recognizedFields.add('patient_code');
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
        // Chỉ gán interpretation nếu đây không phải là cột kháng sinh trong bảng ngang
        if (!current || current.systemField === 'ignore') {
          mapping[colIndex] = {
            colIndex,
            rawHeader: header,
            systemField: 'interpretation',
            isAntibiotic: false
          };
          recognizedFields.add('interpretation');
          return;
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
        return;
      }

      // 4. Kiểm tra xem có phải cột Ngày lấy mẫu
      const dateMatches = samples.filter(s => Norm.normalizeDate && Norm.normalizeDate(s).isValid).length;
      if (samples.length > 0 && (dateMatches / samples.length) >= 0.6 && !recognizedFields.has('collection_date')) {
        mapping[colIndex] = {
          colIndex,
          rawHeader: header,
          systemField: 'collection_date',
          isAntibiotic: false
        };
        recognizedFields.add('collection_date');
        return;
      }
    });

    // Vòng 4: Nhận diện cột Kháng sinh cho bảng định dạng ngang (Wide format)
    headers.forEach((header, colIndex) => {
      if (mapping[colIndex] && mapping[colIndex].systemField !== 'ignore') {
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
        return res.isValid && !res.isIdentifier;
      });

      if (normAbx && ((Norm.antibioticDictionary && normAbx in Norm.antibioticDictionary) || (/^[A-Z]{3,4}$/.test(normAbx) && isAstContent))) {
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
