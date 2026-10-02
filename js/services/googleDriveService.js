/**
 * GOOGLE DRIVE & EXCEL ARCHIVE SERVICE - BAO-CAO-KHANG-THUOC
 * Tự động tạo file Excel theo định dạng STTxx_DDMMYYYY khi người dùng Import dữ liệu
 * và đồng bộ trực tiếp lên thư mục Google Drive:
 * "5. Webapp Actigrivity" (Folder ID: 1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP)
 * Link: https://drive.google.com/drive/folders/1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP
 */

const GoogleDriveService = {
  // Cấu hình Google Drive theo chỉ định của người dùng
  config: {
    FOLDER_ID: '1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP',
    FOLDER_NAME: '5. Webapp Actigrivity',
    FOLDER_URL: 'https://drive.google.com/drive/folders/1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP',
    FILE_PREFIX: 'STT',
    AUTO_DOWNLOAD_LOCAL: true,
    STORAGE_KEY_COUNTER: 'DRIVE_IMPORT_STT_COUNTER',
    STORAGE_KEY_ARCHIVES: 'DRIVE_IMPORT_SAVED_ARCHIVES',
    STORAGE_KEY_TOKEN: 'GOOGLE_DRIVE_ACCESS_TOKEN',
    STORAGE_KEY_WEBHOOK: 'GOOGLE_DRIVE_WEBHOOK_URL'
  },

  // Cache dữ liệu file vừa tạo trong phiên làm việc
  lastArchivedFile: null,

  /**
   * Lấy số thứ tự hiện tại của file
   */
  getCurrentSequence() {
    if (typeof localStorage === 'undefined') return 1;
    const val = localStorage.getItem(this.config.STORAGE_KEY_COUNTER);
    if (!val) return 1;
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 ? 1 : num;
  },

  /**
   * Đặt lại hoặc cập nhật số thứ tự
   */
  setSequence(num) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.config.STORAGE_KEY_COUNTER, String(Math.max(1, parseInt(num, 10) || 1)));
    }
  },

  /**
   * Định dạng chuỗi ngày tháng theo DDMMYYYY
   * Ví dụ: Ngày 02 tháng 10 năm 2026 -> "02102026"
   */
  formatDateDDMMYYYY(date = new Date()) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = String(date.getFullYear());
    return `${d}${m}${y}`;
  },

  /**
   * Xem trước tên file tiếp theo mà không làm tăng bộ đếm
   * Ví dụ: STT01_02102026.xlsx
   */
  peekNextFileName(date = new Date()) {
    const seq = this.getCurrentSequence();
    const seqStr = String(seq).padStart(2, '0');
    const dateStr = this.formatDateDDMMYYYY(date);
    return `${this.config.FILE_PREFIX}${seqStr}_${dateStr}.xlsx`;
  },

  /**
   * Sinh tên file tiếp theo và tự động tăng bộ đếm số thứ tự
   */
  generateNextFileName(date = new Date()) {
    const seq = this.getCurrentSequence();
    const seqStr = String(seq).padStart(2, '0');
    const dateStr = this.formatDateDDMMYYYY(date);
    const fileName = `${this.config.FILE_PREFIX}${seqStr}_${dateStr}.xlsx`;

    // Tăng bộ đếm cho lần import tiếp theo
    this.setSequence(seq + 1);
    return {
      fileName,
      stt: `${this.config.FILE_PREFIX}${seqStr}`,
      sequenceNumber: seq,
      dateString: dateStr
    };
  },

  /**
   * Khởi tạo Workbook Excel đầy đủ tiêu chuẩn từ dữ liệu AST vừa Import
   */
  buildExcelWorkbook(validatedRecords = [], metadata = {}, fileName = '') {
    if (typeof XLSX === 'undefined') {
      throw new Error('Thư viện XLSX (SheetJS) chưa được nạp!');
    }

    const catalog = (typeof window !== 'undefined' && window.DataNormalization?.antibioticCatalog) ||
      (typeof DataNormalization !== 'undefined' && DataNormalization.antibioticCatalog) || [];

    const catalogMap = new Map();
    catalog.forEach(item => {
      if (item.code) catalogMap.set(item.code.toUpperCase(), item);
    });

    // 1. Sheet 1: Dữ liệu Kháng Sinh Đồ Chi Tiết
    const sheetData = validatedRecords.map((r, idx) => {
      const codeUpper = (r.antibiotic_code || '').toUpperCase();
      const cat = catalogMap.get(codeUpper) || {};

      return {
        'STT': idx + 1,
        'Mã bệnh nhân': r.patient_code || '',
        'Họ và tên': r.patient_name || '',
        'Tuổi': r.age !== null && r.age !== undefined ? r.age : '',
        'Giới tính': r.sex || '',
        'Khoa phòng': r.department || '',
        'Loại bệnh phẩm': r.specimen_type || '',
        'Ngày lấy mẫu': r.collection_date || '',
        'Tên vi khuẩn': r.organism_name || '',
        'Mã kháng sinh': r.antibiotic_code || '',
        'Tên gốc kháng sinh': cat.name || r.antibiotic_raw || r.antibiotic_code || '',
        'Phiên giải dùng (Chỉ định điều trị)': cat.indication || '',
        'Nhóm kháng sinh': cat.group || '',
        'Kết quả đo (MIC/Zone)': r.raw_result || '',
        'Phiên giải (S/I/R)': r.interpretation || r.normalized_result || ''
      };
    });

    const wsData = XLSX.utils.json_to_sheet(sheetData);

    // Cài đặt độ rộng cột tối ưu cho Sheet 1
    wsData['!cols'] = [
      { wch: 6 },  // STT
      { wch: 15 }, // Mã BN
      { wch: 22 }, // Họ tên
      { wch: 8 },  // Tuổi
      { wch: 10 }, // Giới tính
      { wch: 20 }, // Khoa phòng
      { wch: 18 }, // Bệnh phẩm
      { wch: 14 }, // Ngày lấy mẫu
      { wch: 26 }, // Vi khuẩn
      { wch: 12 }, // Mã KS
      { wch: 22 }, // Tên KS
      { wch: 38 }, // Chỉ định điều trị
      { wch: 18 }, // Nhóm KS
      { wch: 16 }, // Kết quả đo
      { wch: 14 }  // S/I/R
    ];

    // 2. Sheet 2: Thông tin Lưu trữ & Bản quyền thư mục Google Drive
    const nowStr = new Date().toLocaleString('vi-VN');
    const metaRows = [
      ['THÔNG TIN LƯU TRỮ VÀ ĐỒNG BỘ DỮ LIỆU KHÁNG SINH ĐỒ', ''],
      ['Mã định danh file (STT & Ngày):', fileName.replace(/\.[^/.]+$/, '')],
      ['Tên tệp Excel đầy đủ:', fileName],
      ['Thời điểm Import vào hệ thống:', nowStr],
      ['Tổng số bản ghi AST đã chuẩn hóa:', validatedRecords.length],
      ['Tên file nguồn tải lên:', metadata.originalFileName || metadata.fileName || 'N/A'],
      ['Thư mục Google Drive lưu trữ:', this.config.FOLDER_NAME],
      ['ID Thư mục Google Drive:', this.config.FOLDER_ID],
      ['Đường dẫn thư mục Google Drive:', this.config.FOLDER_URL],
      ['Hệ thống tạo file:', 'Phần mềm Quản lý & Báo cáo Kháng thuốc - Khoa Vi sinh Đức Giang'],
      ['Tiêu chuẩn diễn giải kháng sinh:', 'CLSI M100 / EUCAST']
    ];

    const wsMeta = XLSX.utils.aoa_to_sheet(metaRows);
    wsMeta['!cols'] = [{ wch: 34 }, { wch: 55 }];

    // Tạo Workbook và thêm 2 Sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, 'Du_Lieu_Khang_Sinh_Do');
    XLSX.utils.book_append_sheet(wb, wsMeta, 'Thong_Tin_Luu_Tru');

    return wb;
  },

  /**
   * Lưu workbook thành file tải xuống máy tính người dùng
   */
  downloadWorkbookLocally(wb, fileName) {
    if (typeof XLSX === 'undefined') return false;
    try {
      if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
        XLSX.writeFile(wb, fileName);
        return true;
      }
    } catch (e) {
      console.warn('[GoogleDriveService] Download local warning:', e);
    }
    return false;
  },

  /**
   * Chuyển Workbook thành ArrayBuffer / Blob để upload
   */
  workbookToBlob(wb) {
    if (typeof XLSX === 'undefined' || typeof Blob === 'undefined') return null;
    try {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      return new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    } catch (e) {
      console.warn('[GoogleDriveService] Convert to blob error:', e);
      return null;
    }
  },

  /**
   * Upload trực tiếp file lên Google Drive qua REST API v3
   * Sử dụng Google Drive OAuth Token nếu người dùng đã cấp quyền
   */
  async uploadToGoogleDriveAPI(fileBlob, fileName) {
    if (typeof localStorage === 'undefined' || typeof fetch === 'undefined') {
      return { success: false, reason: 'Môi trường không hỗ trợ fetch' };
    }

    const token = localStorage.getItem(this.config.STORAGE_KEY_TOKEN);
    const webhookUrl = localStorage.getItem(this.config.STORAGE_KEY_WEBHOOK);

    // 1. Thử gửi qua Webhook Google Apps Script nếu có
    if (webhookUrl) {
      try {
        const reader = new FileReader();
        const base64Data = await new Promise((res, rej) => {
          reader.onload = () => res(reader.result.split(',')[1]);
          reader.onerror = rej;
          reader.readAsDataURL(fileBlob);
        });

        const resp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: fileName,
            folderId: this.config.FOLDER_ID,
            fileData: base64Data,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          })
        });
        const resJson = await resp.json();
        if (resJson && (resJson.status === 'success' || resJson.fileId)) {
          return { success: true, method: 'webhook', fileId: resJson.fileId, link: resJson.url || this.config.FOLDER_URL };
        }
      } catch (err) {
        console.warn('[GoogleDriveService] Webhook upload failed:', err.message);
      }
    }

    // 2. Thử gửi qua Google Drive REST API multipart upload
    if (token) {
      try {
        const metadata = {
          name: fileName,
          parents: [this.config.FOLDER_ID],
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', fileBlob);

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: form
        });

        if (response.ok) {
          const driveData = await response.json();
          return {
            success: true,
            method: 'oauth_api',
            fileId: driveData.id,
            link: `https://drive.google.com/file/d/${driveData.id}/view`
          };
        }
      } catch (err) {
        console.warn('[GoogleDriveService] OAuth API upload failed:', err.message);
      }
    }

    return {
      success: false,
      reason: 'Chưa có Token OAuth hoặc Webhook (Đã lưu trữ an toàn trên máy và tạo sẵn liên kết thư mục)'
    };
  },

  /**
   * QUY TRÌNH CHÍNH: TỰ ĐỘNG LƯU TRỮ VÀ ĐỒNG BỘ DỮ LIỆU IMPORT
   * Được gọi ngay khi người dùng nhấn "Import dữ liệu" tại Bước 5
   */
  async archiveImportDataset(validatedRecords = [], metadata = {}) {
    if (!validatedRecords || validatedRecords.length === 0) {
      return { success: false, reason: 'Không có bản ghi hợp lệ' };
    }

    // 1. Sinh tên file theo định dạng STTxx_DDMMYYYY.xlsx
    const dateObj = metadata.date instanceof Date ? metadata.date : new Date();
    const nameInfo = this.generateNextFileName(dateObj);
    const fileName = nameInfo.fileName;
    const stt = nameInfo.stt;

    // 2. Khởi tạo Workbook Excel đầy đủ 2 Sheet
    let wb = null;
    let fileBlob = null;
    if (typeof XLSX !== 'undefined') {
      wb = this.buildExcelWorkbook(validatedRecords, { ...metadata, stt }, fileName);
      fileBlob = this.workbookToBlob(wb);

      // 3. Tự động tải file xuống máy tính của người dùng
      if (this.config.AUTO_DOWNLOAD_LOCAL && typeof window !== 'undefined') {
        this.downloadWorkbookLocally(wb, fileName);
      }
    }

    // 4. Đồng bộ lên Google Drive
    let driveUploadResult = { success: false, reason: 'Chờ kết nối' };
    if (fileBlob) {
      driveUploadResult = await this.uploadToGoogleDriveAPI(fileBlob, fileName);
    }

    // 5. Lưu lại vào lịch sử lưu trữ
    const archiveRecord = {
      fileName: fileName,
      stt: stt,
      sequenceNumber: nameInfo.sequenceNumber,
      dateString: nameInfo.dateString,
      originalFileName: metadata.originalFileName || metadata.fileName || 'Dữ liệu nạp',
      recordCount: validatedRecords.length,
      createdAt: new Date().toISOString(),
      folderName: this.config.FOLDER_NAME,
      folderId: this.config.FOLDER_ID,
      folderUrl: this.config.FOLDER_URL,
      driveStatus: driveUploadResult.success ? 'synced' : 'pending_cloud',
      driveFileLink: driveUploadResult.link || this.config.FOLDER_URL
    };

    this.saveArchiveRecord(archiveRecord);
    this.lastArchivedFile = { ...archiveRecord, workbook: wb };

    // Phát sự kiện để cập nhật các giao diện khác (như Quản lý File)
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('googleDriveArchiveCreated', { detail: archiveRecord }));
    }

    return {
      success: true,
      fileName: fileName,
      stt: stt,
      folderName: this.config.FOLDER_NAME,
      folderUrl: this.config.FOLDER_URL,
      folderId: this.config.FOLDER_ID,
      recordCount: validatedRecords.length,
      driveUploaded: driveUploadResult.success,
      driveStatus: driveUploadResult.success ? 'Đã tải lên Google Drive' : 'Đã lưu file & Sẵn sàng đồng bộ Drive',
      archiveRecord
    };
  },

  /**
   * Lưu bản ghi lịch sử vào LocalStorage
   */
  saveArchiveRecord(record) {
    if (typeof localStorage === 'undefined') return;
    try {
      const list = this.getSavedArchives();
      list.unshift(record);
      // Giữ tối đa 50 file gần nhất
      const trimmed = list.slice(0, 50);
      localStorage.setItem(this.config.STORAGE_KEY_ARCHIVES, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[GoogleDriveService] Save archive history warning:', e);
    }
  },

  /**
   * Lấy danh sách các file đã được lưu trữ
   */
  getSavedArchives() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.config.STORAGE_KEY_ARCHIVES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Tải lại file Excel đã lưu trong phiên làm việc gần nhất
   */
  redownloadLastArchive() {
    if (this.lastArchivedFile && this.lastArchivedFile.workbook) {
      this.downloadWorkbookLocally(this.lastArchivedFile.workbook, this.lastArchivedFile.fileName);
      return true;
    }
    return false;
  }
};

if (typeof window !== 'undefined') {
  window.GoogleDriveService = GoogleDriveService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleDriveService;
}
