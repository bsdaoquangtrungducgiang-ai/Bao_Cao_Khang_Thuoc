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
          error: 'Thiếu mã bệnh nhân (Bắt buộc)',
          severity: 'error'
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
      const dateCheck = window.DataNormalization.normalizeDate(rawDate);
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
      if (row.age !== undefined && row.age !== null && row.age !== '') {
        const ageNum = Number(row.age);
        if (isNaN(ageNum) || ageNum < 0 || ageNum > 130) {
          rowWarnings.push({
            row: rowNum,
            field: 'age',
            value: String(row.age),
            error: `Tuổi không hợp lý (${row.age})`,
            severity: 'warning'
          });
        }
      }

      // 5. Kiểm tra Vi khuẩn (Organism Name)
      const rawOrg = row.organism_name;
      const orgCheck = window.DataNormalization.normalizeOrganism(rawOrg);
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
      const normAbx = window.DataNormalization.normalizeAntibiotic(rawAbx);
      if (!rawAbx) {
        rowErrors.push({
          row: rowNum,
          field: 'antibiotic_code',
          value: '',
          error: 'Thiếu mã kháng sinh',
          severity: 'error'
        });
      }

      const astCheck = window.DataNormalization.normalizeAST(row.raw_result || row.interpretation);
      if (!astCheck.isValid) {
        rowErrors.push({
          row: rowNum,
          field: 'interpretation',
          value: String(row.raw_result || row.interpretation || ''),
          error: `Kết quả kháng sinh đồ không thuộc S/I/R ("${row.raw_result || row.interpretation}")`,
          severity: 'error'
        });
      }

      // 7. Kiểm tra Trùng lặp (Duplicate Detection - Section XXXIV)
      const validDate = dateCheck.isValid ? dateCheck.dateStr : 'NO-DATE';
      const fp = window.DataNormalization.generateFingerprint(
        patientCode,
        specimenType,
        validDate,
        orgCheck.name,
        normAbx
      );

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
        sex: window.DataNormalization.normalizeSex(row.sex),
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
  }
};

if (typeof window !== 'undefined') {
  window.DataValidation = DataValidation;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DataValidation };
}
