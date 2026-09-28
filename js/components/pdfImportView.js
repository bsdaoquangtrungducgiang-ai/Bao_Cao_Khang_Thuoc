/**
 * PDF IMPORT VIEW COMPONENT - BAO-CAO-KHANG-THUOC
 * Giao diện Upload và rà soát kết quả xét nghiệm PDF (Mục XIV)
 */

const PDFImportView = {
  currentReport: null,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const dropzone = document.getElementById('pdf-dropzone');
    const fileInput = document.getElementById('pdf-file-input');

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

    const btnCommit = document.getElementById('btn-commit-pdf-data');
    if (btnCommit) {
      btnCommit.addEventListener('click', () => this.commitPDFData());
    }
  },

  async handleFileSelected(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      window.Toast.error('Vui lòng chọn file tài liệu định dạng .pdf!');
      return;
    }

    window.Toast.info(`Đang phân tích file PDF: ${file.name}...`);
    try {
      const result = await window.PDFImportService.parsePDF(file);
      this.currentReport = result;
      this.renderExtractedData(result);
    } catch (err) {
      console.error(err);
      window.Toast.error('Lỗi khi đọc file PDF: ' + err.message);
    }
  },

  renderExtractedData(result) {
    const container = document.getElementById('pdf-result-container');
    if (!container) return;

    container.classList.remove('hidden');

    // Warning Banner (Section XIV)
    const warnEl = document.getElementById('pdf-warning-banner');
    if (warnEl) {
      if (result.needsReview) {
        warnEl.classList.remove('hidden');
        warnEl.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 20px;"></i>
          <div>
            <strong>Lưu ý quan trọng:</strong> ${result.warningMessage || 'Không thể tự động xác định chắc chắn dữ liệu. Vui lòng kiểm tra kỹ trước khi lưu!'}
          </div>
        `;
      } else {
        warnEl.classList.add('hidden');
      }
    }

    // Patient info fields
    const info = result.extractedInfo || {};
    document.getElementById('pdf-patient-code').value = info.patientCode || '';
    document.getElementById('pdf-patient-name').value = info.patientName || '';
    document.getElementById('pdf-age').value = info.age || '';
    document.getElementById('pdf-sex').value = info.sex || 'Unknown';
    document.getElementById('pdf-specimen').value = info.specimenType || 'Nước tiểu';
    document.getElementById('pdf-date').value = info.collectionDate || '';
    document.getElementById('pdf-organism').value = info.organismName || 'Chưa xác định';

    // AST Records table
    const tbody = document.getElementById('table-pdf-ast-body');
    if (tbody) {
      tbody.innerHTML = '';
      if (result.astRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 16px;">Không tìm thấy bảng kết quả kháng sinh đồ dạng văn bản số trong file PDF này</td></tr>';
      } else {
        result.astRecords.forEach((a, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="text-align: center;">${idx + 1}</td>
            <td><strong>${a.antibiotic_code}</strong></td>
            <td>${a.raw_result || '-'}</td>
            <td>${a.mic ? a.mic + ' µg/mL' : '-'}</td>
            <td style="text-align: center;"><span class="badge-status badge-${a.interpretation.toLowerCase()}">${a.interpretation}</span></td>
          `;
          tbody.appendChild(tr);
        });
      }
    }

    window.Toast.success(`Đã trích xuất xong: Phát hiện ${result.astRecords.length} kháng sinh.`);
  },

  async commitPDFData() {
    if (!this.currentReport || this.currentReport.astRecords.length === 0) {
      window.Toast.error('Không có bản ghi kháng sinh đồ nào để lưu!');
      return;
    }

    // Đọc các giá trị người dùng đã hiệu chỉnh
    const pCode = document.getElementById('pdf-patient-code').value;
    const pName = document.getElementById('pdf-patient-name').value;
    const pAge = document.getElementById('pdf-age').value;
    const pSex = document.getElementById('pdf-sex').value;
    const pSpec = document.getElementById('pdf-specimen').value;
    const pDate = document.getElementById('pdf-date').value;
    const pOrg = document.getElementById('pdf-organism').value;

    const validatedRecords = this.currentReport.astRecords.map(a => ({
      ...a,
      patient_code: pCode || a.patient_code,
      patient_name: pName || a.patient_name,
      age: pAge ? parseInt(pAge, 10) : null,
      sex: pSex,
      specimen_type: pSpec,
      collection_date: pDate,
      organism_name: pOrg,
      fingerprint: window.DataNormalization?.generateFingerprint(pCode, pSpec, pDate, pOrg, a.antibiotic_code)
    }));

    try {
      await window.ImportService.commitImport(validatedRecords, {
        fileName: this.currentReport.fileName,
        fileType: 'pdf',
        fileSize: 0,
        totalRows: validatedRecords.length
      });

      window.Toast.success(`Đã nạp thành công ${validatedRecords.length} kết quả AST từ PDF vào Database!`);
      document.getElementById('pdf-result-container').classList.add('hidden');
      if (window.App?.refreshData) window.App.refreshData();
    } catch (err) {
      window.Toast.error('Lỗi khi nạp dữ liệu: ' + err.message);
    }
  }
};

if (typeof window !== 'undefined') {
  window.PDFImportView = PDFImportView;
}
