/**
 * IMPORT WIZARD COMPONENT - BAO-CAO-KHANG-THUOC
 * Điều khiển Wizard 5 bước nhập liệu theo chuẩn UX tại mục LI:
 * STEP 1: Upload file -> STEP 2: Detect columns & Preview -> STEP 3: Mapping -> STEP 4: Validate -> STEP 5: Import
 */

const ImportWizard = {
  currentStep: 1,
  parsedData: null,
  mappingState: null,
  validationResult: null,

  systemFieldOptions: [
    { value: 'ignore', label: '-- Bỏ qua cột này --' },
    { value: 'patient_code', label: 'Mã bệnh nhân (patient_code) *' },
    { value: 'patient_name', label: 'Họ và tên (patient_name)' },
    { value: 'age', label: 'Tuổi (age)' },
    { value: 'sex', label: 'Giới tính (sex)' },
    { value: 'department', label: 'Khoa phòng (department)' },
    { value: 'specimen_type', label: 'Loại bệnh phẩm (specimen_type) *' },
    { value: 'collection_date', label: 'Ngày lấy mẫu (collection_date) *' },
    { value: 'organism_name', label: 'Tên vi khuẩn (organism_name) *' },
    { value: 'antibiotic_code', label: 'Mã kháng sinh (Dạng dọc)' },
    { value: 'interpretation', label: 'Kết quả AST S/I/R (Dạng dọc)' }
  ],

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // 1. Kéo thả và chọn file
    const dropzone = document.getElementById('import-dropzone');
    const fileInput = document.getElementById('import-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
          this.handleFileSelected(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFileSelected(e.target.files[0]);
        }
      });
    }

    // 2. Paste text import
    const btnParseText = document.getElementById('btn-parse-text');
    if (btnParseText) {
      btnParseText.addEventListener('click', () => {
        const textData = document.getElementById('textarea-import-paste')?.value;
        try {
          const result = window.ImportService.parseText(textData);
          this.onDataParsed(result);
        } catch (err) {
          window.Toast.error(err.message);
        }
      });
    }

    // 3. Nút tải file mẫu Excel
    const btnDownloadTemplate = document.getElementById('btn-download-template');
    if (btnDownloadTemplate) {
      btnDownloadTemplate.addEventListener('click', () => this.generateSampleTemplate());
    }

    // 4. Các nút điều hướng Wizard (Prev / Next)
    document.querySelectorAll('[data-wizard-goto]').forEach(btn => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.getAttribute('data-wizard-goto'), 10);
        this.goToStep(step);
      });
    });

    // 5. Nút thực hiện commit import ở bước 5
    const btnExecuteImport = document.getElementById('btn-execute-import');
    if (btnExecuteImport) {
      btnExecuteImport.addEventListener('click', () => this.executeCommit());
    }

    // 6. Nút xuất file Excel lỗi
    const btnExportErrors = document.getElementById('btn-export-errors');
    if (btnExportErrors) {
      btnExportErrors.addEventListener('click', () => {
        if (this.validationResult) {
          window.ImportService.downloadErrorReport(this.validationResult.errorList);
        }
      });
    }

    // 7. Nút tự động nhận diện lại cột ở Bước 3
    const btnReAuto = document.getElementById('btn-reauto-detect');
    if (btnReAuto) {
      btnReAuto.addEventListener('click', () => {
        if (this.parsedData) {
          this.mappingState = window.ImportService.autoDetectColumns(this.parsedData.rawHeaders, this.parsedData.dataRows.slice(0, 30));
          this.renderStep3Mapping();
          window.Toast.success('Đã tự động nhận diện lại toàn bộ các cột!');
        }
      });
    }

    // 8. Nút Tự động sửa lỗi & Chuẩn hóa ở Bước 4
    const btnAutoFix = document.getElementById('btn-autofix-errors');
    if (btnAutoFix) {
      btnAutoFix.addEventListener('click', () => {
        if (!this.transformedData || this.transformedData.length === 0) {
          window.Toast.warning('Chưa có dữ liệu để sửa!');
          return;
        }
        const fixResult = window.DataValidation.autoFixBatch(this.transformedData);
        this.transformedData = fixResult.fixedRows;
        this.validationResult = fixResult.validation;
        this.renderValidationUI();
        window.Toast.success(`Đã tự động xử lý và chuẩn hóa! Hiện có ${(this.validationResult.validCount + this.validationResult.warningCount).toLocaleString()} bản ghi sẵn sàng nạp.`);
      });
    }
  },

  async handleFileSelected(file) {
    if (!window.AuthService.canUpload()) {
      window.Toast.warning('Tài khoản của bạn không có quyền Upload dữ liệu!');
      return;
    }

    try {
      window.Toast.info(`Đang đọc file: ${file.name}...`);
      const result = await window.ImportService.parseFile(file);
      this.onDataParsed(result);
      window.Toast.success(`Đọc file thành công: ${result.totalRows} dòng, ${result.totalCols} cột`);
    } catch (err) {
      console.error(err);
      window.Toast.error('Không thể đọc file: ' + err.message);
    }
  },

  onDataParsed(result) {
    this.parsedData = result;
    this.mappingState = JSON.parse(JSON.stringify(result.detectedMapping));

    // Cập nhật thông tin Preview ở Bước 2
    this.renderStep2Preview();

    // Chuẩn bị giao diện Mapping ở Bước 3
    this.renderStep3Mapping();

    // Chuyển sang Bước 2
    this.goToStep(2);
  },

  goToStep(step) {
    this.currentStep = step;

    // Cập nhật thanh chỉ báo bước (Step indicator)
    document.querySelectorAll('.wizard-step-item').forEach(el => {
      const s = parseInt(el.getAttribute('data-step'), 10);
      el.classList.remove('active', 'completed');
      if (s === step) el.classList.add('active');
      else if (s < step) el.classList.add('completed');
    });

    // Ẩn/Hiện nội dung từng bước
    document.querySelectorAll('.wizard-step-content').forEach(el => {
      el.classList.remove('active');
    });

    const activeContent = document.getElementById(`wizard-step-${step}`);
    if (activeContent) activeContent.classList.add('active');

    // Kích hoạt logic khi vào từng bước cụ thể
    if (step === 4) {
      this.runValidationStep();
    } else if (step === 5) {
      document.getElementById('import-complete-summary')?.classList.add('hidden');
      document.getElementById('import-step5-actions')?.classList.remove('hidden');
      const btn = document.getElementById('btn-execute-import');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Xác nhận & Nạp vào Database';
      }
    }
  },

  // RENDER BƯỚC 2: PREVIEW 20 DÒNG
  renderStep2Preview() {
    const p = this.parsedData;
    if (!p) return;

    document.getElementById('preview-file-name').textContent = p.fileName;
    document.getElementById('preview-total-rows').textContent = p.totalRows.toLocaleString();
    document.getElementById('preview-total-cols').textContent = p.totalCols;
    document.getElementById('preview-sheet-name').textContent = p.activeSheet || 'Sheet 1';

    // Bảng preview 20 dòng
    const thead = document.getElementById('preview-table-head');
    const tbody = document.getElementById('preview-table-body');
    if (!thead || !tbody) return;

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Header
    const trHead = document.createElement('tr');
    trHead.innerHTML = '<th style="width: 45px; text-align: center;">#</th>';
    p.headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // Rows
    p.previewRows.forEach((row, rIdx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="text-align: center; color: var(--text-muted); font-size: 11px;">${rIdx + 1}</td>`;
      p.headers.forEach((_, cIdx) => {
        const td = document.createElement('td');
        td.textContent = row[cIdx] !== undefined ? String(row[cIdx]) : '';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  },

  // RENDER BƯỚC 3: MAPPING CỘT
  renderStep3Mapping() {
    const container = document.getElementById('mapping-cards-container');
    if (!container || !this.parsedData) return;

    container.innerHTML = '';
    const mapObj = this.mappingState.columnMap;

    for (const colIndex in mapObj) {
      const col = mapObj[colIndex];
      const card = document.createElement('div');
      card.className = 'mapping-item-card';

      let optionsHtml = '';
      this.systemFieldOptions.forEach(opt => {
        const selected = col.systemField === opt.value ? 'selected' : '';
        optionsHtml += `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
      });

      // Nếu là cột kháng sinh phát hiện tự động
      const isAbx = col.systemField.startsWith('antibiotic_');
      const abxCode = isAbx ? col.systemField.replace('antibiotic_', '') : '';

      // Lấy 3 giá trị mẫu từ dữ liệu thực tế của cột này
      const sampleVals = (this.parsedData.previewRows || [])
        .map(r => r[colIndex])
        .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
        .slice(0, 3)
        .map(v => String(v).trim());
      const sampleText = sampleVals.length > 0 ? sampleVals.join(' | ') : '(Cột trống)';

      card.innerHTML = `
        <div class="mapping-col-left">
          <div class="mapping-col-index">Cột ${parseInt(colIndex) + 1}</div>
          <div class="mapping-raw-header" title="${col.rawHeader}">
            <strong>${col.rawHeader}</strong>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 260px;" title="${sampleText}">
            Mẫu: <span style="color: var(--primary); font-weight: 500;">${sampleText}</span>
          </div>
        </div>
        <div class="mapping-arrow">
          <i class="fa-solid fa-arrow-right"></i>
        </div>
        <div class="mapping-col-right">
          <select class="mapping-select" data-col="${colIndex}">
            ${optionsHtml}
            ${isAbx ? `<option value="${col.systemField}" selected>Kháng sinh: ${abxCode} (Auto-detected)</option>` : ''}
          </select>
          <span class="mapping-badge ${isAbx ? 'badge-abx' : (col.systemField !== 'ignore' ? 'badge-mapped' : 'badge-ignored')}">
            ${isAbx ? `Kháng sinh [${abxCode}]` : (col.systemField !== 'ignore' ? 'Đã nhận diện' : 'Bỏ qua')}
          </span>
        </div>
      `;

      // Bắt sự kiện người dùng tự chọn sửa mapping
      card.querySelector('.mapping-select').addEventListener('change', (e) => {
        const val = e.target.value;
        this.mappingState.columnMap[colIndex].systemField = val;
        this.mappingState.columnMap[colIndex].isAntibiotic = val.startsWith('antibiotic_');

        // Re-calculate wide format status
        const abxList = [];
        for (const idx in this.mappingState.columnMap) {
          const item = this.mappingState.columnMap[idx];
          if (item.systemField.startsWith('antibiotic_')) {
            abxList.push({
              colIndex: parseInt(idx),
              headerName: item.rawHeader,
              antibioticCode: item.systemField.replace('antibiotic_', '')
            });
          }
        }
        this.mappingState.antibioticColumns = abxList;
        this.mappingState.isWideFormat = abxList.length >= 3;
      });

      container.appendChild(card);
    }
  },

  // THỰC HIỆN BƯỚC 4: DATA VALIDATION
  runValidationStep() {
    window.Toast.info('Đang kiểm tra chất lượng dữ liệu...');

    // Đọc tùy chọn người dùng
    const autoForwardFill = document.getElementById('chk-auto-forward-fill')?.checked !== false;
    const autoGeneratePatientCode = document.getElementById('chk-auto-gen-patient-code')?.checked !== false;

    // 1. Chuyển đổi dữ liệu thô theo mapping
    const transformed = window.ImportService.transformData(
      this.parsedData.dataRows,
      this.mappingState,
      { autoForwardFill, autoGeneratePatientCode }
    );
    this.transformedData = transformed;

    // 2. Chạy Validation Engine
    const validation = window.DataValidation.validateBatch(transformed);
    this.validationResult = validation;

    // 3. Render giao diện Bước 4
    this.renderValidationUI();
  },

  renderValidationUI() {
    const validation = this.validationResult;
    if (!validation) return;

    document.getElementById('val-stat-total').textContent = validation.total.toLocaleString();
    document.getElementById('val-stat-valid').textContent = validation.validCount.toLocaleString();
    document.getElementById('val-stat-warning').textContent = validation.warningCount.toLocaleString();
    document.getElementById('val-stat-error').textContent = validation.errorCount.toLocaleString();
    document.getElementById('val-stat-duplicate').textContent = validation.duplicateCount.toLocaleString();

    // Render bảng chi tiết lỗi
    const errorBody = document.getElementById('validation-error-table-body');
    if (errorBody) {
      errorBody.innerHTML = '';
      if (validation.errorList.length === 0) {
        errorBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--color-s); padding: 24px;">
              <i class="fa-solid fa-circle-check" style="font-size: 24px; margin-bottom: 8px; display: block;"></i>
              Dữ liệu hoàn hảo! Không phát hiện lỗi nghiêm trọng nào.
            </td>
          </tr>
        `;
      } else {
        validation.errorList.slice(0, 100).forEach(item => {
          const tr = document.createElement('tr');
          tr.className = item.severity === 'error' ? 'row-error' : 'row-warning';
          tr.innerHTML = `
            <td style="text-align: center; font-weight: 600;">${item.row}</td>
            <td><code>${item.field}</code></td>
            <td><span class="value-chip">${item.value || '(Trống)'}</span></td>
            <td>${item.error}</td>
            <td style="text-align: center;">
              <span class="error-severity-badge severity-${item.severity}">
                ${item.severity === 'error' ? 'Lỗi' : 'Cảnh báo'}
              </span>
            </td>
          `;
          errorBody.appendChild(tr);
        });
      }
    }
  },

  // THỰC HIỆN BƯỚC 5: COMMIT IMPORT VÀO DATABASE
  async executeCommit() {
    if (!this.validationResult) return;

    const validToImport = [
      ...this.validationResult.validRecords,
      ...this.validationResult.warningRecords
    ];

    if (validToImport.length === 0) {
      window.Toast.error('Không có bản ghi hợp lệ nào để import!');
      return;
    }

    const btn = document.getElementById('btn-execute-import');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang nạp ' + validToImport.length.toLocaleString() + ' bản ghi AST...';
    }

    const currentFileName = this.parsedData?.fileName || ('Du_lieu_nạp_' + new Date().toISOString().slice(0, 10) + '.csv');

    try {
      const res = await window.ImportService.commitImport(validToImport, {
        fileName: currentFileName,
        fileType: this.parsedData?.fileType || 'csv',
        fileSize: this.parsedData?.fileSize || 0,
        totalRows: this.parsedData?.totalRows || validToImport.length,
        errorCount: this.validationResult?.errorCount || 0,
        warningCount: this.validationResult?.warningCount || 0
      });

      // Hiển thị kết quả thành công
      const summaryEl = document.getElementById('import-complete-summary');
      const actionsEl = document.getElementById('import-step5-actions');
      if (summaryEl) summaryEl.classList.remove('hidden');
      if (actionsEl) actionsEl.classList.add('hidden');

      const sumImported = document.getElementById('sum-imported-count');
      const sumWarning = document.getElementById('sum-warning-count');
      const sumRejected = document.getElementById('sum-rejected-count');

      const importedCount = (res?.count || validToImport.length);
      if (sumImported) sumImported.textContent = importedCount.toLocaleString();
      if (sumWarning) sumWarning.textContent = (this.validationResult?.warningCount || 0).toLocaleString();
      if (sumRejected) sumRejected.textContent = (this.validationResult?.errorCount || 0).toLocaleString();

      window.Toast?.success(`Import hoàn tất! Đã lưu thành công ${importedCount.toLocaleString()} kết quả AST.`);

      // Lưu file vừa import làm file kích hoạt cho Báo Cáo AMR Tự Động & Dashboard
      try {
        localStorage.setItem('amr_last_imported_file', currentFileName);
      } catch (e) {}

      if (window.App) {
        if (!window.App.state) window.App.state = {};
        if (!window.App.state.filters) window.App.state.filters = {};
        window.App.state.filters.file = currentFileName;
        window.App.state.lastImportedFile = currentFileName;
        await window.App.refreshData();
      }

      // Thông báo cập nhật danh sách file cho ReportView và FileManager
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fileUploaded', { detail: { fileName: currentFileName } }));
        if (window.ReportView?.populateFileOptions) {
          window.ReportView.populateFileOptions(currentFileName);
        }
      }
    } catch (err) {
      console.error('[ImportWizard] Commit error:', err);
      window.Toast?.error('Lỗi khi nạp dữ liệu: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Xác nhận & Nạp vào Database';
      }
    }
  },

  // TẠO FILE EXCEL MẪU (Sample Excel Template)
  generateSampleTemplate() {
    const sampleHeaders = [
      'Mã bệnh nhân', 'Họ và tên', 'Tuổi', 'Giới tính', 'Khoa điều trị',
      'Loại bệnh phẩm', 'Ngày lấy mẫu', 'Tên vi khuẩn',
      'AMP', 'AMC', 'TZP', 'CTX', 'CRO', 'CAZ', 'FEP', 'MEM', 'CIP', 'GEN', 'AMK', 'SXT'
    ];

    const sampleRows = [
      ['BN00101', 'Nguyễn Văn Minh', 45, 'Nam', 'Khoa Ngoại Tổng hợp', 'Nước tiểu', '2026-09-25', 'Escherichia coli', 'R', 'S', 'S', 'R', 'R', 'S', 'S', 'S', 'R', 'S', 'S', 'R'],
      ['BN00102', 'Trần Thị Hoa', 62, 'Nữ', 'Khoa Hồi sức tích cực (ICU)', 'Máu', '2026-09-26', 'Klebsiella pneumoniae', 'R', 'R', 'I', 'R', 'R', 'R', 'I', 'S', 'R', 'S', 'S', 'R'],
      ['BN00103', 'Lê Hữu Đạt', 58, 'Nam', 'Khoa Nội Hô hấp', 'Đờm', '2026-09-26', 'Pseudomonas aeruginosa', '-', '-', 'S', '-', 'I', 'S', 'S', 'S', 'S', 'S', 'S', '-'],
      ['BN00104', 'Phạm Quỳnh Nga', 34, 'Nữ', 'Khoa Cấp cứu', 'Mủ ổ áp xe', '2026-09-27', 'Staphylococcus aureus', 'R', 'S', '-', 'S', 'S', '-', '-', '-', 'S', 'S', 'S', 'S']
    ];

    const data = [sampleHeaders, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Khang_Sinh_Do');

    XLSX.writeFile(wb, 'Mau_Khang_Sinh_Do_Khoa_Vi_Sinh.xlsx');
    window.Toast.success('Đã tải xuống file Excel mẫu chuẩn xét nghiệm vi sinh!');
  }
};

if (typeof window !== 'undefined') {
  window.ImportWizard = ImportWizard;
}
