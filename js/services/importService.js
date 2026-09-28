/**
 * IMPORT SERVICE - BAO-CAO-KHANG-THUOC
 * Xử lý đọc file Excel / CSV, nhận diện cột tự động, biến đổi bảng ngang/dọc và nạp dữ liệu vào Database
 * Tuân thủ các mục X, XI, XV, XXXII, XXXIII
 */

const ImportService = {
  // Từ điển nhận diện cột tự động (Auto-detection column mapping)
  headerAliasDictionary: {
    patient_code: ['mã bn', 'mã bệnh nhân', 'ma bn', 'ma benh nhan', 'patient code', 'patient id', 'patient_id', 'mabenhnhan', 'so_benh_an', 'maba', 'mã ba'],
    patient_name: ['họ và tên', 'họ tên', 'tên bệnh nhân', 'ho ten', 'ten benh nhan', 'patient name', 'patient_name', 'hoten', 'tên bn'],
    age: ['tuổi', 'tuoi', 'age', 'năm sinh', 'nam sinh'],
    sex: ['giới', 'giới tính', 'gioi', 'gioi tinh', 'sex', 'gender', 'phái'],
    department: ['khoa', 'khoa phòng', 'khoa phong', 'phòng', 'department', 'dept', 'khoa chỉ định', 'khoa dieu tri'],
    specimen_type: ['bệnh phẩm', 'loại bệnh phẩm', 'benh pham', 'loai benh pham', 'specimen', 'specimen type', 'specimen_type', 'mẫu'],
    collection_date: ['ngày lấy mẫu', 'ngày nhận mẫu', 'ngày', 'ngay lay mau', 'ngay', 'date', 'collection date', 'collection_date', 'ngay_nhan'],
    organism_name: ['vi khuẩn', 'tên vi khuẩn', 'chủng vi khuẩn', 'vi khuan', 'ten vi khuan', 'organism', 'organism name', 'organism_name', 'mầm bệnh', 'bacterial'],
    antibiotic_code: ['kháng sinh', 'mã kháng sinh', 'tên kháng sinh', 'khang sinh', 'antibiotic', 'antibiotic code', 'abx'],
    interpretation: ['kết quả', 'ket qua', 'sir', 's/i/r', 'interpretation', 'nhạy cảm', 'kháng thuốc', 'result']
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

          // Nhận diện cột tự động
          const detectedMapping = this.autoDetectColumns(rawHeaders);

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
    const detectedMapping = this.autoDetectColumns(rawHeaders);

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
   * Tự động nhận diện cột từ Header (Section X.Bước 3)
   */
  autoDetectColumns(headers = []) {
    const mapping = {};
    const recognizedFields = new Set();
    const antibioticColumns = [];

    headers.forEach((header, colIndex) => {
      const cleanHeader = String(header).toLowerCase().trim();
      let matchedField = null;

      // Kiểm tra với từ điển hệ thống
      for (const [sysField, aliases] of Object.entries(this.headerAliasDictionary)) {
        if (recognizedFields.has(sysField)) continue;
        if (aliases.some(alias => cleanHeader === alias || cleanHeader.includes(alias))) {
          matchedField = sysField;
          recognizedFields.add(sysField);
          break;
        }
      }

      // Nếu không khớp với trường hành chính, kiểm tra xem có phải cột Kháng sinh (AMP, CRO, MEM...)
      if (!matchedField) {
        const normAbx = window.DataNormalization.normalizeAntibiotic(header);
        if (normAbx && (normAbx in window.DataNormalization.antibioticDictionary || header.length <= 4)) {
          antibioticColumns.push({
            colIndex,
            headerName: header,
            antibioticCode: normAbx
          });
          matchedField = `antibiotic_${normAbx}`;
        }
      }

      mapping[colIndex] = {
        colIndex,
        rawHeader: header,
        systemField: matchedField || 'ignore',
        isAntibiotic: !!matchedField?.startsWith('antibiotic_')
      };
    });

    return {
      columnMap: mapping,
      antibioticColumns,
      isWideFormat: antibioticColumns.length > 0
    };
  },

  /**
   * Chuyển đổi dữ liệu ma trận (Excel) thành danh sách đối tượng AST chuẩn hóa
   */
  transformData(dataRows = [], mappingInfo = {}) {
    const columnMap = mappingInfo.columnMap || {};
    const isWide = mappingInfo.isWideFormat;
    const records = [];

    dataRows.forEach((row) => {
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

      // Đọc thông tin cơ bản
      for (const colIndex in columnMap) {
        const field = columnMap[colIndex].systemField;
        const val = row[colIndex];
        if (field && !field.startsWith('antibiotic_') && field !== 'ignore') {
          baseInfo[field] = val;
        }
      }

      if (isWide) {
        // Định dạng Ngang (Mỗi cột là 1 kháng sinh) -> Xoay thành nhiều dòng AST
        mappingInfo.antibioticColumns.forEach(abxCol => {
          const rawResult = row[abxCol.colIndex];
          if (rawResult !== undefined && rawResult !== null && String(rawResult).trim() !== '') {
            records.push({
              ...baseInfo,
              antibiotic_code: abxCol.antibioticCode,
              raw_result: rawResult,
              interpretation: rawResult
            });
          }
        });
      } else {
        // Định dạng Dọc (Mỗi dòng là 1 kết quả)
        let abxCode = '';
        let interp = '';
        for (const colIndex in columnMap) {
          const field = columnMap[colIndex].systemField;
          if (field === 'antibiotic_code') abxCode = row[colIndex];
          if (field === 'interpretation') interp = row[colIndex];
        }

        records.push({
          ...baseInfo,
          antibiotic_code: abxCode,
          raw_result: interp,
          interpretation: interp
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
