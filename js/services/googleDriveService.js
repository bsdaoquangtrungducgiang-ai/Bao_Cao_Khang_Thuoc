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

  // Handle thư mục Google Drive trên máy (qua File System Access API)
  localDirHandle: null,

  /**
   * Kiểm tra xem trình duyệt có hỗ trợ File System Access API không
   */
  supportsFileSystemAccess() {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  },

  /**
   * Lấy tên thư mục đã chọn trên máy
   */
  getLocalFolderName() {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('DRIVE_LOCAL_FOLDER_NAME') || '';
  },

  /**
   * Kiểm tra đã chọn thư mục trên máy chưa
   */
  hasLocalFolder() {
    return Boolean(this.localDirHandle || this.getLocalFolderName());
  },

  /**
   * Kiểm tra xem hệ thống đã được cấp quyền tự động lưu vào Google Drive chưa
   */
  hasPermission() {
    if (typeof localStorage === 'undefined') return false;
    const permGranted = localStorage.getItem('GOOGLE_DRIVE_PERM_GRANTED') === 'true';
    const hasWebhook = Boolean(this.getWebhookUrl());
    const hasToken = Boolean(localStorage.getItem(this.config.STORAGE_KEY_TOKEN));
    const hasLocal = Boolean(this.localDirHandle || localStorage.getItem('DRIVE_LOCAL_FOLDER_NAME'));
    return permGranted || hasWebhook || hasToken || hasLocal;
  },

  /**
   * Cấp và lưu quyền tự động lưu vào hệ thống
   */
  grantPermission(method = 'auto') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('GOOGLE_DRIVE_PERM_GRANTED', 'true');
      localStorage.setItem('GOOGLE_DRIVE_PERM_METHOD', method);
      localStorage.setItem('GOOGLE_DRIVE_PERM_TIME', new Date().toISOString());
    }
    this.updatePermissionUI();
  },

  /**
   * Hủy quyền tự động lưu
   */
  revokePermission() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('GOOGLE_DRIVE_PERM_GRANTED');
      localStorage.removeItem('GOOGLE_DRIVE_PERM_METHOD');
      localStorage.removeItem('GOOGLE_DRIVE_PERM_TIME');
      localStorage.removeItem('DRIVE_LOCAL_FOLDER_NAME');
    }
    this.localDirHandle = null;
    this.updatePermissionUI();
  },

  /**
   * Lưu handle thư mục vào IndexedDB để tái sử dụng vĩnh viễn qua các phiên làm việc
   */
  async persistFolderHandleToIDB(handle) {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined' || !handle) return false;
    try {
      return await new Promise((resolve) => {
        const req = indexedDB.open('AmrGoogleDriveDB', 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('handles')) {
            db.createObjectStore('handles');
          }
        };
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('handles', 'readwrite');
          const store = tx.objectStore('handles');
          store.put(handle, 'folderHandle');
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        };
        req.onerror = () => resolve(false);
      });
    } catch (e) {
      return false;
    }
  },

  /**
   * Khôi phục quyền lưu thư mục từ IndexedDB khi tải lại trang
   */
  async restoreLocalFolderHandle() {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return null;
    try {
      const handle = await new Promise((resolve) => {
        const req = indexedDB.open('AmrGoogleDriveDB', 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('handles')) {
            db.createObjectStore('handles');
          }
        };
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('handles', 'readonly');
          const store = tx.objectStore('handles');
          const getReq = store.get('folderHandle');
          getReq.onsuccess = () => resolve(getReq.result || null);
          getReq.onerror = () => resolve(null);
        };
        req.onerror = () => resolve(null);
      });

      if (handle) {
        this.localDirHandle = handle;
        this.grantPermission('filesystem_idb');
        return handle;
      }
    } catch (err) {
      console.warn('[GoogleDriveService] Restore handle warning:', err);
    }
    return null;
  },

  /**
   * Mở hộp thoại chọn thư mục Google Drive trên máy (1 Lần Duy Nhất)
   * Tự động lưu quyền vào IndexedDB để tái sử dụng vĩnh viễn
   */
  async selectLocalDriveFolder() {
    if (!this.supportsFileSystemAccess()) {
      return {
        success: false,
        message: 'Trình duyệt này chưa hỗ trợ chọn thư mục trực tiếp. Bạn có thể sử dụng Chrome, Cốc Cốc hoặc Edge.'
      };
    }
    try {
      const dirHandle = await window.showDirectoryPicker({
        id: 'amr_google_drive_folder',
        mode: 'readwrite',
        startIn: 'documents'
      });
      this.localDirHandle = dirHandle;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('DRIVE_LOCAL_FOLDER_NAME', dirHandle.name);
      }
      await this.persistFolderHandleToIDB(dirHandle);
      this.grantPermission('local_directory');
      return { success: true, folderName: dirHandle.name };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true, message: 'Đã hủy chọn thư mục.' };
      }
      return { success: false, message: 'Lỗi: ' + err.message };
    }
  },

  /**
   * Lưu file trực tiếp vào thư mục Google Drive trên máy
   */
  async saveToLocalDirectory(fileBlob, fileName) {
    if (!this.localDirHandle || !fileBlob) return false;
    try {
      if (this.localDirHandle.requestPermission) {
        const state = await this.localDirHandle.queryPermission({ mode: 'readwrite' });
        if (state !== 'granted') {
          const req = await this.localDirHandle.requestPermission({ mode: 'readwrite' });
          if (req !== 'granted') return false;
        }
      }
      const fileHandle = await this.localDirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(fileBlob);
      await writable.close();
      return true;
    } catch (err) {
      console.warn('[GoogleDriveService] Save to local directory warning:', err);
      return false;
    }
  },

  /**
   * Cập nhật hiển thị trạng thái cấp quyền Google Drive trên giao diện
   */
  updatePermissionUI() {
    if (typeof document === 'undefined') return;
    const badgeWrap = document.getElementById('drive-step1-perm-badge-wrap');
    if (!badgeWrap) return;

    const hasPerm = this.hasPermission();
    if (hasPerm) {
      const folderName = this.getLocalFolderName() || '5. Webapp Actigrivity';
      badgeWrap.innerHTML = `
        <span class="badge-status badge-success" style="background: #dcfce7; color: #15803d !important; border: 1.5px solid #86efac; font-weight: 700; padding: 6px 14px; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-circle-check"></i> Đã cấp quyền tự động lưu Drive (${folderName})
        </span>
        <button type="button" class="btn-setup-action" id="btn-change-drive-perm-step1" style="background: #0284c7; color: #ffffff !important; padding: 6px 12px; font-size: 12px; font-weight: 600;">
          <i class="fa-solid fa-gear"></i> Cấu hình
        </button>
      `;
      const btnChange = document.getElementById('btn-change-drive-perm-step1');
      if (btnChange) {
        btnChange.addEventListener('click', () => this.openSetupModal());
      }
    } else {
      badgeWrap.innerHTML = `
        <button type="button" class="btn-setup-action" id="btn-grant-drive-perm-step1" style="background: #16a34a; color: #ffffff !important; padding: 8px 18px; font-size: 13px; font-weight: 700;">
          <i class="fa-solid fa-key"></i> Cấp quyền tự động lưu Google Drive
        </button>
      `;
      const btnGrant = document.getElementById('btn-grant-drive-perm-step1');
      if (btnGrant) {
        btnGrant.addEventListener('click', () => {
          if (this.supportsFileSystemAccess()) {
            this.selectLocalDriveFolder().then(res => {
              if (res.success) {
                window.Toast?.success(`Đã cấp quyền lưu vào Google Drive: "${res.folderName}"!`);
              }
            });
          } else {
            this.openSetupModal();
          }
        });
      }
    }
  },

  /**
   * Tự động lưu file gốc được tải lên phân tích vào thư mục Google Drive (5. Webapp Actigrivity)
   * Được gọi ngay khi người dùng kéo thả hoặc chọn file phân tích tại Bước 1
   */
  async autoSaveUploadedFile(file) {
    if (!file) return { success: false, reason: 'Không có file' };

    // 1. Nếu có handle thư mục cục bộ (Google Drive for Desktop)
    if (this.localDirHandle) {
      try {
        const saved = await this.saveToLocalDirectory(file, file.name);
        if (saved) {
          this.grantPermission('local_directory');
          return { success: true, method: 'local_drive_sync', fileName: file.name };
        }
      } catch (err) {
        console.warn('[GoogleDriveService] AutoSaveUploadedFile local error:', err);
      }
    }

    // 2. Nếu có Webhook hoặc OAuth token, upload trực tiếp lên Drive API
    if (this.hasWebhook() || (typeof localStorage !== 'undefined' && localStorage.getItem(this.config.STORAGE_KEY_TOKEN))) {
      try {
        const uploadRes = await this.uploadToGoogleDriveAPI(file, file.name);
        if (uploadRes && uploadRes.success) {
          this.grantPermission('cloud_api');
          return { success: true, method: uploadRes.method, fileName: file.name };
        }
      } catch (err) {
        console.warn('[GoogleDriveService] AutoSaveUploadedFile cloud error:', err);
      }
    }

    // 3. Tự động đánh dấu sẵn sàng lưu
    this.grantPermission('system_ready');
    return { success: false, reason: 'Chờ kết nối đám mây', fileName: file.name };
  },

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
   * Lấy Webhook URL đã lưu trong LocalStorage
   */
  getWebhookUrl() {
    if (typeof localStorage === 'undefined') return '';
    return (localStorage.getItem(this.config.STORAGE_KEY_WEBHOOK) || '').trim();
  },

  /**
   * Lưu hoặc xóa Webhook URL
   */
  setWebhookUrl(url) {
    if (typeof localStorage !== 'undefined') {
      const cleanUrl = (url || '').trim();
      if (cleanUrl) {
        localStorage.setItem(this.config.STORAGE_KEY_WEBHOOK, cleanUrl);
      } else {
        localStorage.removeItem(this.config.STORAGE_KEY_WEBHOOK);
      }
    }
  },

  /**
   * Kiểm tra xem người dùng đã cài đặt Webhook chưa
   */
  hasWebhook() {
    return Boolean(this.getWebhookUrl());
  },

  /**
   * Tạo đoạn mã Google Apps Script mẫu được điền sẵn Folder ID chính xác
   */
  getAppsScriptTemplate() {
    return `// ===============================================================
// GOOGLE APPS SCRIPT WEBHOOK - KHOA VI SINH ĐỨC GIANG
// Tự động lưu file Excel kháng sinh đồ vào thư mục: 5. Webapp Actigrivity
// ID Thư mục: ${this.config.FOLDER_ID}
// ===============================================================

function doPost(e) {
  try {
    var contents = (e && e.postData) ? e.postData.contents : "";
    var data = JSON.parse(contents);
    var targetFolderId = data.folderId || "${this.config.FOLDER_ID}";
    var folder = DriveApp.getFolderById(targetFolderId);
    
    var decoded = Utilities.base64Decode(data.fileData);
    var mime = data.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    var blob = Utilities.newBlob(decoded, mime, data.fileName || "AST_Export.xlsx");
    
    var file = folder.createFile(blob);
    
    var res = {
      status: "success",
      fileId: file.getId(),
      fileName: file.getName(),
      url: file.getUrl(),
      timestamp: new Date().toISOString()
    };
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var errRes = {
      status: "error",
      message: err.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errRes))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    folderId: "${this.config.FOLDER_ID}",
    folderName: "${this.config.FOLDER_NAME}",
    message: "Webhook Google Apps Script sẵn sàng nhận dữ liệu Excel!"
  })).setMimeType(ContentService.MimeType.JSON);
}`;
  },

  /**
   * Kiểm tra kết nối tới Webhook URL
   */
  async testWebhookConnection(url) {
    const targetUrl = (url || this.getWebhookUrl() || '').trim();
    if (!targetUrl) {
      return { success: false, message: 'Vui lòng nhập Webhook URL!' };
    }
    if (typeof fetch === 'undefined') {
      return { success: false, message: 'Môi trường không hỗ trợ fetch' };
    }

    try {
      const resp = await fetch(targetUrl, { method: 'GET' });
      if (resp.ok) {
        try {
          const data = await resp.json();
          return { success: true, message: data.message || 'Kết nối Webhook thành công!', data };
        } catch (e) {
          return { success: true, message: 'Kết nối Webhook thành công (HTTP 200)!' };
        }
      }
      return { success: false, message: `Lỗi máy chủ Webhook: HTTP ${resp.status}` };
    } catch (err) {
      // Trường hợp URL Google Apps Script hợp lệ nhưng bị chặn CORS khi gọi GET
      if (targetUrl.includes('script.google.com/macros/s/')) {
        return { success: true, message: 'Đã nhận dạng đúng định dạng URL Google Apps Script Web App!' };
      }
      return { success: false, message: 'Không thể kết nối Webhook: ' + err.message };
    }
  },

  /**
   * Chuyển đổi File Blob sang chuỗi Base64
   */
  async blobToBase64(fileBlob) {
    if (!fileBlob) return '';
    if (typeof FileReader !== 'undefined') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result || '';
          const base64 = typeof result === 'string' && result.includes(',')
            ? result.split(',')[1]
            : result;
          resolve(base64);
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(fileBlob);
      });
    }
    if (fileBlob && fileBlob.parts && typeof Buffer !== 'undefined') {
      try {
        return Buffer.from(fileBlob.parts[0]).toString('base64');
      } catch (e) {}
    }
    return '';
  },

  /**
   * Upload trực tiếp file lên Google Drive qua Webhook Apps Script hoặc OAuth REST API v3
   */
  async uploadToGoogleDriveAPI(fileBlob, fileName) {
    if (typeof localStorage === 'undefined' || typeof fetch === 'undefined') {
      return { success: false, reason: 'Môi trường không hỗ trợ kết nối mạng' };
    }

    const webhookUrl = this.getWebhookUrl();
    const token = localStorage.getItem(this.config.STORAGE_KEY_TOKEN);

    // 1. Gửi qua Webhook Google Apps Script nếu đã cấu hình
    if (webhookUrl) {
      try {
        const base64Data = await this.blobToBase64(fileBlob);
        const payload = {
          fileName: fileName,
          folderId: this.config.FOLDER_ID,
          fileData: base64Data,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          timestamp: new Date().toISOString()
        };
        const payloadStr = JSON.stringify(payload);

        // Gửi với text/plain để không kích hoạt CORS preflight OPTIONS
        try {
          const resp = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: payloadStr
          });
          if (resp.ok) {
            try {
              const resJson = await resp.json();
              if (resJson && (resJson.status === 'success' || resJson.fileId)) {
                return {
                  success: true,
                  method: 'webhook',
                  fileId: resJson.fileId,
                  link: resJson.url || this.config.FOLDER_URL
                };
              }
            } catch (jsonErr) {
              return {
                success: true,
                method: 'webhook_plain',
                link: this.config.FOLDER_URL
              };
            }
          }
        } catch (corsErr) {
          // Fallback: Nếu CORS chặn đọc phản hồi của Apps Script redirect, gửi bằng chế độ no-cors
          await fetch(webhookUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: payloadStr
          });
          return {
            success: true,
            method: 'webhook_no_cors',
            link: this.config.FOLDER_URL
          };
        }
      } catch (err) {
        console.warn('[GoogleDriveService] Webhook upload error:', err.message);
      }
    }

    // 2. Thử gửi qua Google Drive REST API multipart upload nếu có OAuth token
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
      reason: 'Chưa cấu hình Webhook Google Apps Script hoặc OAuth Token'
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

    // 4. Đồng bộ vào thư mục Google Drive trên máy tính (nếu đã chọn qua 1-Click)
    let savedToLocalDrive = false;
    if (this.localDirHandle && fileBlob) {
      savedToLocalDrive = await this.saveToLocalDirectory(fileBlob, fileName);
    }

    // 5. Đồng bộ lên Google Drive (Nếu đã lưu vào thư mục Drive trên máy -> Drive Desktop tự động sync lên cloud; hoặc qua Webhook)
    let driveUploadResult = { success: false, reason: 'Chờ kết nối' };
    if (savedToLocalDrive) {
      driveUploadResult = {
        success: true,
        method: 'local_drive_sync',
        link: this.config.FOLDER_URL
      };
    } else if (fileBlob) {
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
    this.lastArchivedFile = {
      ...archiveRecord,
      workbook: wb,
      records: validatedRecords
    };

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
      driveStatus: driveUploadResult.success
        ? 'Đã tải lên Google Drive'
        : 'Đã tải về máy • Chưa đồng bộ lên Drive',
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
  },

  /**
   * Đồng bộ lại file vừa tạo lên Google Drive (Dùng khi người dùng bấm nút Đồng bộ ngay)
   */
  async syncCurrentFileToDrive() {
    if (!this.lastArchivedFile) {
      return { success: false, reason: 'Chưa có file nào được tạo trong phiên này' };
    }

    let blob = null;
    if (this.lastArchivedFile.workbook) {
      blob = this.workbookToBlob(this.lastArchivedFile.workbook);
    } else if (this.lastArchivedFile.records && typeof XLSX !== 'undefined') {
      const wb = this.buildExcelWorkbook(this.lastArchivedFile.records, {}, this.lastArchivedFile.fileName);
      blob = this.workbookToBlob(wb);
    }

    if (!blob) {
      return { success: false, reason: 'Không thể tạo dữ liệu file để tải lên' };
    }

    let uploadRes = { success: false };
    if (this.localDirHandle) {
      const saved = await this.saveToLocalDirectory(blob, this.lastArchivedFile.fileName);
      if (saved) {
        uploadRes = { success: true, method: 'local_drive_sync', link: this.config.FOLDER_URL };
      }
    }

    if (!uploadRes.success) {
      uploadRes = await this.uploadToGoogleDriveAPI(blob, this.lastArchivedFile.fileName);
    }

    if (uploadRes.success) {
      this.lastArchivedFile.driveStatus = 'synced';
      this.lastArchivedFile.driveFileLink = uploadRes.link || this.config.FOLDER_URL;

      // Cập nhật bản ghi trong localStorage
      const archives = this.getSavedArchives();
      if (archives.length > 0 && archives[0].fileName === this.lastArchivedFile.fileName) {
        archives[0].driveStatus = 'synced';
        archives[0].driveFileLink = uploadRes.link || this.config.FOLDER_URL;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.config.STORAGE_KEY_ARCHIVES, JSON.stringify(archives));
        }
      }

      // Cập nhật giao diện nếu có
      if (typeof document !== 'undefined') {
        const syncBadgeEl = document.getElementById('drive-sync-badge');
        if (syncBadgeEl) {
          syncBadgeEl.className = 'badge-status badge-success';
          syncBadgeEl.style = 'background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-weight: 600;';
          syncBadgeEl.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Đã tải lên Google Drive (5. Webapp Actigrivity)';
        }
        const instructionBox = document.getElementById('drive-sync-instruction-box');
        if (instructionBox) {
          instructionBox.style.background = '#ecfdf5';
          instructionBox.style.borderColor = '#86efac';
          instructionBox.innerHTML = `
            <div style="font-weight: 700; color: #166534; font-size: 13px; margin-bottom: 4px;">
              <i class="fa-solid fa-circle-check"></i> Đã đồng bộ thành công vào Google Drive!
            </div>
            <div style="font-size: 12.5px; color: #15803d;">
              Tệp <strong>${this.lastArchivedFile.fileName}</strong> đã được lưu trực tiếp vào thư mục <strong>5. Webapp Actigrivity</strong> trên Google Drive.
            </div>
          `;
        }
      }
    }
    return uploadRes;
  },

  /**
   * Mở modal cấu hình Webhook Google Drive
   */
  openSetupModal() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('modal-google-drive-setup');
    if (!modal) return;

    // Điền mã Apps Script mẫu
    const codeArea = document.getElementById('drive-apps-script-code');
    if (codeArea) {
      codeArea.value = this.getAppsScriptTemplate();
    }

    // Điền URL hiện tại nếu đã có
    const inputUrl = document.getElementById('input-drive-webhook-url');
    if (inputUrl) {
      inputUrl.value = this.getWebhookUrl();
    }

    const localStatus = document.getElementById('local-drive-folder-status');
    if (localStatus) {
      const folder = this.getLocalFolderName();
      if (folder) {
        localStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> Đang liên kết: <strong>${folder}</strong> (Tự động đồng bộ)`;
      } else {
        localStatus.innerHTML = `<i class="fa-solid fa-circle-info"></i> Chưa chọn thư mục Google Drive trên máy tính`;
      }
    }

    const testStatus = document.getElementById('drive-webhook-test-status');
    if (testStatus) {
      testStatus.style.display = 'none';
      testStatus.innerHTML = '';
    }

    modal.classList.add('open');
  },

  /**
   * Đóng modal cấu hình
   */
  closeSetupModal() {
    if (typeof document !== 'undefined') {
      document.getElementById('modal-google-drive-setup')?.classList.remove('open');
    }
  },

  /**
   * Khởi tạo các sự kiện giao diện cho Google Drive Service
   */
  init() {
    if (typeof document === 'undefined') return;

    // Tự động khôi phục quyền lưu từ IndexedDB và cập nhật giao diện
    this.restoreLocalFolderHandle().then(() => {
      this.updatePermissionUI();
    }).catch(() => {});
    this.updatePermissionUI();

    // 1. Nút sao chép mã Apps Script
    const btnCopy = document.getElementById('btn-copy-apps-script');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        const codeArea = document.getElementById('drive-apps-script-code');
        if (codeArea) {
          codeArea.select();
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(codeArea.value).then(() => {
              btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép!';
              setTimeout(() => {
                btnCopy.innerHTML = '<i class="fa-solid fa-copy"></i> Sao chép mã';
              }, 2500);
            });
          } else {
            document.execCommand('copy');
            btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép!';
            setTimeout(() => {
              btnCopy.innerHTML = '<i class="fa-solid fa-copy"></i> Sao chép mã';
            }, 2500);
          }
        }
      });
    }

    // 2. Nút kiểm tra Webhook
    const btnTest = document.getElementById('btn-test-drive-webhook');
    if (btnTest) {
      btnTest.addEventListener('click', async () => {
        const inputUrl = document.getElementById('input-drive-webhook-url');
        const testStatus = document.getElementById('drive-webhook-test-status');
        const url = inputUrl?.value?.trim();
        if (!url) {
          if (testStatus) {
            testStatus.style.display = 'block';
            testStatus.style.color = '#dc2626';
            testStatus.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Vui lòng nhập URL Webhook!';
          }
          return;
        }

        btnTest.disabled = true;
        btnTest.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang test...';
        const res = await this.testWebhookConnection(url);
        btnTest.disabled = false;
        btnTest.innerHTML = '<i class="fa-solid fa-bolt"></i> Kiểm tra';

        if (testStatus) {
          testStatus.style.display = 'block';
          if (res.success) {
            testStatus.style.color = '#16a34a';
            testStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${res.message}`;
          } else {
            testStatus.style.color = '#dc2626';
            testStatus.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${res.message}`;
          }
        }
      });
    }

    // 3. Nút lưu cấu hình Webhook & Đồng bộ ngay
    const btnSave = document.getElementById('btn-save-drive-webhook');
    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const inputUrl = document.getElementById('input-drive-webhook-url');
        const url = inputUrl?.value?.trim() || '';
        this.setWebhookUrl(url);

        if (url) {
          window.Toast?.success('Đã lưu cấu hình Webhook Google Drive thành công!');
          // Nếu có file đang chờ, đồng bộ luôn
          if (this.lastArchivedFile) {
            btnSave.disabled = true;
            btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đồng bộ file...';
            try {
              const syncRes = await this.syncCurrentFileToDrive();
              if (syncRes.success) {
                window.Toast?.success(`Đã tải thành công ${this.lastArchivedFile.fileName} lên Google Drive!`);
              }
            } catch (e) {
              console.warn(e);
            } finally {
              btnSave.disabled = false;
              btnSave.innerHTML = '<i class="fa-solid fa-check"></i> Lưu Cấu Hình & Đồng Bộ Ngay';
            }
          }
        } else {
          window.Toast?.info('Đã xóa cấu hình Webhook Google Drive.');
        }

        this.closeSetupModal();
      });
    }

    // 4. Nút mở modal từ File Manager
    const btnOpenDriveConfig = document.getElementById('btn-open-drive-config');
    if (btnOpenDriveConfig) {
      btnOpenDriveConfig.addEventListener('click', () => {
        this.openSetupModal();
      });
    }

    // 5. Nút mở modal từ Bước 5 Import Wizard
    const btnOpenStep5 = document.getElementById('btn-open-drive-modal-step5');
    if (btnOpenStep5) {
      btnOpenStep5.addEventListener('click', () => {
        this.openSetupModal();
      });
    }

    // 6. Nút cấu hình Webhook từ instruction box
    const btnConfigWebhook = document.getElementById('btn-config-drive-webhook');
    if (btnConfigWebhook) {
      btnConfigWebhook.addEventListener('click', () => {
        this.openSetupModal();
      });
    }

    // 7. Nút đồng bộ ngay từ Bước 5
    const btnSyncNow = document.getElementById('btn-sync-drive-now');
    if (btnSyncNow) {
      btnSyncNow.addEventListener('click', async () => {
        if (!this.hasWebhook() && !this.hasLocalFolder()) {
          window.Toast?.info('Chưa liên kết thư mục hoặc Webhook Google Drive! Vui lòng chọn thư mục hoặc cài Webhook.');
          this.openSetupModal();
          return;
        }

        btnSyncNow.disabled = true;
        btnSyncNow.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đồng bộ lên Drive...';
        try {
          const res = await this.syncCurrentFileToDrive();
          if (res.success) {
            window.Toast?.success(`Đã đồng bộ thành công ${this.lastArchivedFile?.fileName} lên Google Drive!`);
          } else {
            window.Toast?.error('Đồng bộ thất bại: ' + (res.reason || 'Lỗi kết nối'));
          }
        } catch (err) {
          window.Toast?.error('Lỗi khi đồng bộ: ' + err.message);
        } finally {
          btnSyncNow.disabled = false;
          btnSyncNow.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Đồng bộ lên Google Drive ngay';
        }
      });
    }

    // 8. Nút chọn thư mục Google Drive trên máy tính (1 Lần Duy Nhất - Không cần code)
    const handlePickFolder = async () => {
      const res = await this.selectLocalDriveFolder();
      if (res.success) {
        window.Toast?.success(`Đã liên kết thư mục "${res.folderName}"! Dữ liệu sẽ tự động lưu vào đây.`);
        const localStatus = document.getElementById('local-drive-folder-status');
        if (localStatus) {
          localStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> Đang liên kết: <strong>${res.folderName}</strong> (Tự động đồng bộ)`;
        }
        if (this.lastArchivedFile) {
          await this.syncCurrentFileToDrive();
        }
      } else if (!res.cancelled) {
        window.Toast?.error(res.message);
      }
    };

    const btnPickModal = document.getElementById('btn-pick-local-drive-folder');
    if (btnPickModal) btnPickModal.addEventListener('click', handlePickFolder);

    const btnPickStep5 = document.getElementById('btn-pick-drive-step5');
    if (btnPickStep5) btnPickStep5.addEventListener('click', handlePickFolder);
  }
};

if (typeof window !== 'undefined') {
  window.GoogleDriveService = GoogleDriveService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleDriveService;
}
