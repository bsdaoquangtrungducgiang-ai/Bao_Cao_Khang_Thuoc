/**
 * DATA VALIDATION ENGINE - BAO-CAO-KHANG-THUOC
 * Kiểm định chất lượng dữ liệu xét nghiệm vi sinh theo các mục XIII & LII
 */

const DataValidation = {
  /**
   * Kiểm định danh sách bản ghi trước khi import
   * @param {Array} rawRows Danh sách dòng dữ liệu đã map
   * @param {Object} existingFingerprints Tập hợp fingerprint đã có trong cơ sở dữ liệu
   * @returns {Object} { isValid, summary, validRecords, warningRecords, errorRecords, errorList }
   */
  validateBatch(rawRows = [], existingFingerprints = new Set()) {
    const Norm = (typeof window !== 'undefined' && window.DataNormalization) ? window.DataNormalization : (typeof DataNormalization !== 'undefined' ? DataNormalization : {});
    const errorList = [];
    const validRecords = [];
    const warningRecords = [];
    const errorRecords = [];
    const batchFingerprints = new Set();

    let duplicateCount = 0;

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // Dòng 1 thường là header Excel, dữ liệu bắt đầu từ dòng 2
      const rowErrors = [];
      const rowWarnings = [];

      // 1. Kiểm tra Mã bệnh nhân (Patient Code)
      const patientCode = String(row.patient_code || '').trim();
      if (!patientCode) {
        rowErrors.push({
          row: rowNum,
          field: 'patient_code',
          value: '',
          error: 'Thiếu mã bệnh nhân (Bắt buộc - Bấm "Tự động sửa lỗi" để tự sinh mã)',
          severity: 'error'
        });
      } else if (patientCode.startsWith('BN_AUTO_')) {
        rowWarnings.push({
          row: rowNum,
          field: 'patient_code',
          value: patientCode,
          error: `Mã bệnh nhân được tự động gán ("${patientCode}") do file gốc để trống`,
          severity: 'warning'
        });
      }

      // 2. Kiểm tra Bệnh phẩm (Specimen Type)
      const specimenType = String(row.specimen_type || '').trim();
      if (!specimenType) {
        rowWarnings.push({
          row: rowNum,
          field: 'specimen_type',
          value: '',
          error: 'Thiếu loại bệnh phẩm (Mặc định sẽ gán "Khác")',
          severity: 'warning'
        });
      }

      // 3. Kiểm tra Ngày lấy mẫu (Collection Date)
      const rawDate = row.collection_date;
      const dateCheck = Norm.normalizeDate ? Norm.normalizeDate(rawDate) : { isValid: true, dateStr: rawDate };
      if (!rawDate) {
        rowErrors.push({
          row: rowNum,
          field: 'collection_date',
          value: '',
          error: 'Thiếu ngày lấy mẫu',
          severity: 'error'
        });
      } else if (!dateCheck.isValid) {
        rowErrors.push({
          row: rowNum,
          field: 'collection_date',
          value: String(rawDate),
          error: `Ngày tháng không hợp lệ ("${rawDate}")`,
          severity: 'error'
        });
      }

      // 4. Kiểm tra Tuổi (Age)
      let parsedAge = null;
      if (row.age !== undefined && row.age !== null && row.age !== '') {
        let ageNum = Number(row.age);
        if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
          // Trích xuất năm sinh nếu trường này là ngày tháng năm sinh (DD/MM/YYYY hoặc YYYY-MM-DD)
          const yMatch = String(row.age).match(/\b(19\d\d|20\d\d)\b/);
          if (yMatch) {
            const birthYear = Number(yMatch[1]);
            const currentYear = new Date().getFullYear();
            const calculatedAge = currentYear - birthYear;
            if (calculatedAge >= 0 && calculatedAge <= 130) {
              row.age = calculatedAge;
              ageNum = calculatedAge;
            }
          }
        }
        if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
          rowWarnings.push({
            row: rowNum,
            field: 'age',
            value: String(row.age),
            error: `Tuổi không hợp lý (${row.age})`,
            severity: 'warning'
          });
        } else {
          parsedAge = ageNum;
        }
      }

      // 5. Kiểm tra Vi khuẩn (Organism Name)
      const rawOrg = row.organism_name;
      const orgCheck = Norm.normalizeOrganism ? Norm.normalizeOrganism(rawOrg) : { isValid: true, name: rawOrg, raw: rawOrg };
      if (!rawOrg) {
        rowErrors.push({
          row: rowNum,
          field: 'organism_name',
          value: '',
          error: 'Thiếu thông tin vi khuẩn nuôi cấy',
          severity: 'error'
        });
      } else if (!orgCheck.isValid) {
        rowWarnings.push({
          row: rowNum,
          field: 'organism_name',
          value: String(rawOrg),
          error: `Vi khuẩn chưa nằm trong danh mục chuẩn ("${rawOrg}")`,
          severity: 'warning'
        });
      }

      // 6. Kiểm tra Kháng sinh & Kết quả AST
      const rawAbx = row.antibiotic_code;
      const normAbx = Norm.normalizeAntibiotic ? Norm.normalizeAntibiotic(rawAbx) : rawAbx;
      if (!rawAbx) {
        rowErrors.push({
          row: rowNum,
          field: 'antibiotic_code',
          value: '',
          error: 'Thiếu mã kháng sinh',
          severity: 'error'
        });
      }

      const astCheck = Norm.normalizeAST ? Norm.normalizeAST(row.raw_result || row.interpretation) : { isValid: true, normalized_value: row.interpretation, raw_value: row.raw_result };
      if (!astCheck.isValid) {
        const valStr = String(row.raw_result || row.interpretation || '');
        if (astCheck.isIdentifier) {
          rowErrors.push({
            row: rowNum,
            field: 'interpretation',
            value: valStr,
            error: `Giá trị này có dạng Mã xét nghiệm/Mã BN ("${valStr}"). Vui lòng kiểm tra lại Bước 3 (Khớp nối Cột) để gán đúng cột Kết quả AST`,
            severity: 'error'
          });
        } else {
          rowErrors.push({
            row: rowNum,
            field: 'interpretation',
            value: valStr,
            error: `Kết quả kháng sinh đồ không thuộc S/I/R ("${valStr}")`,
            severity: 'error'
          });
        }
      }

      // 7. Kiểm tra Trùng lặp (Duplicate Detection - Section XXXIV)
      const validDate = dateCheck.isValid ? dateCheck.dateStr : 'NO-DATE';
      const fp = Norm.generateFingerprint ? Norm.generateFingerprint(
        patientCode,
        specimenType,
        validDate,
        orgCheck.name,
        normAbx
      ) : `${patientCode}|${specimenType}|${validDate}|${orgCheck.name}|${normAbx}`;

      let isDuplicate = false;
      if (batchFingerprints.has(fp) || existingFingerprints.has(fp)) {
        isDuplicate = true;
        duplicateCount++;
        rowWarnings.push({
          row: rowNum,
          field: 'duplicate',
          value: `${patientCode} - ${orgCheck.name} - ${normAbx}`,
          error: 'Bản ghi nghi vấn trùng lặp (Cùng BN, ngày, vi khuẩn & kháng sinh)',
          severity: 'warning'
        });
      } else {
        batchFingerprints.add(fp);
      }

      // Bản ghi đã được chuẩn hóa
      const processedRecord = {
        ...row,
        rowNumber: rowNum,
        patient_code: patientCode,
        patient_name: row.patient_name || `Bệnh nhân ${patientCode}`,
        age: !isNaN(Number(row.age)) ? Number(row.age) : null,
        sex: Norm.normalizeSex ? Norm.normalizeSex(row.sex) : (row.sex || 'Unknown'),
        department: row.department || 'Khoa Vi sinh',
        specimen_type: specimenType || 'Khác',
        collection_date: dateCheck.isValid ? dateCheck.dateStr : null,
        organism_name: orgCheck.name,
        organism_raw: orgCheck.raw,
        antibiotic_code: normAbx,
        antibiotic_raw: rawAbx,
        raw_result: astCheck.raw_value,
        normalized_result: astCheck.normalized_value,
        interpretation: astCheck.normalized_value,
        fingerprint: fp,
        isDuplicate
      };

      // Gom nhóm kết quả
      if (rowErrors.length > 0) {
        errorRecords.push(processedRecord);
        errorList.push(...rowErrors);
      } else if (rowWarnings.length > 0) {
        warningRecords.push(processedRecord);
        errorList.push(...rowWarnings);
      } else {
        validRecords.push(processedRecord);
      }
    });

    return {
      total: rawRows.length,
      validCount: validRecords.length,
      warningCount: warningRecords.length,
      errorCount: errorRecords.length,
      duplicateCount,
      validRecords,
      warningRecords,
      errorRecords,
      errorList
    };
  },

  /**
   * Tự động sửa lỗi hàng loạt:
   * - Tự động điền mã BN còn thiếu
   * - Tự động điền ngày hiện tại nếu thiếu
   * - Chuẩn hóa khoảng trắng dư thừa
   * - Bỏ qua các dòng tiêu đề phụ/phi AST
   */
  autoFixBatch(rawRows = [], existingFingerprints = new Set()) {
    const Norm = (typeof window !== 'undefined' && window.DataNormalization) ? window.DataNormalization : (typeof DataNormalization !== 'undefined' ? DataNormalization : {});
    const fixedRows = [];
    const todayStr = new Date().toISOString().split('T')[0];

    rawRows.forEach((row, idx) => {
      const fixed = { ...row };
      const rowNum = idx + 2;

      // 1. Sửa mã bệnh nhân
      if (!fixed.patient_code || !String(fixed.patient_code).trim()) {
        fixed.patient_code = `BN_AUTO_${rowNum}`;
      } else {
        fixed.patient_code = String(fixed.patient_code).trim();
      }

      // 2. Sửa ngày tháng
      if (!fixed.collection_date || !String(fixed.collection_date).trim()) {
        fixed.collection_date = todayStr;
      }

      // 3. Sửa loại bệnh phẩm
      if (!fixed.specimen_type || !String(fixed.specimen_type).trim()) {
        fixed.specimen_type = 'Khác';
      }

      // 4. Chuẩn hóa kết quả AST (loại bỏ khoảng trắng, dấu ngoặc)
      if (fixed.interpretation) {
        fixed.interpretation = String(fixed.interpretation).trim();
      }
      if (fixed.raw_result) {
        fixed.raw_result = String(fixed.raw_result).trim();
      }

      // Bỏ qua dòng nếu kết quả AST là mã định danh và không có kháng sinh
      const astCheck = Norm.normalizeAST ? Norm.normalizeAST(fixed.raw_result || fixed.interpretation) : { isIdentifier: false };
      if (astCheck.isIdentifier && (!fixed.antibiotic_code || !String(fixed.antibiotic_code).trim())) {
        return;
      }

      fixedRows.push(fixed);
    });

    return {
      fixedRows,
      validation: this.validateBatch(fixedRows, existingFingerprints)
    };
  }
};

if (typeof window !== 'undefined') {
  window.DataValidation = DataValidation;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DataValidation };
}
