/**
 * CẤU HÌNH HỆ THỐNG - BAO-CAO-KHANG-THUOC
 * Khoa Vi sinh Bệnh viện - AMR Surveillance System
 */

const CONFIG = {
  APP_NAME: 'BAO-CAO-KHANG-THUOC',
  APP_VERSION: '1.0.0',
  ORGANIZATION_NAME: 'BỆNH VIỆN ĐA KHOA',
  DEPARTMENT_NAME: 'Khoa Vi Sinh',
  
  // Thông tin Supabase do người dùng cung cấp
  // Hỗ trợ lưu trữ trong localStorage để dễ dàng cấu hình hoặc thay đổi từ giao diện Settings
  SUPABASE: {
    DEFAULT_URL: 'https://xdwtryayaxodxebyfysx.supabase.co',
    FALLBACK_URL: 'https://wbzjkwudiaeisujoimfi.supabase.co',
    DEFAULT_KEY: 'sb_publishable_rR9eBuTH1XnfL0LKbJjCuQ_dZdrg-Al',
    STORAGE_BUCKET: 'import-files'
  },
  
  // Đồng bộ Google Drive & Tự động lưu file Excel Import (Yêu cầu Mục Dữ liệu & Nhập liệu)
  GOOGLE_DRIVE: {
    FOLDER_ID: '1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP',
    FOLDER_NAME: '5. Webapp Actigrivity',
    FOLDER_URL: 'https://drive.google.com/drive/folders/1AsfIs2iQHXZZ4oGpiehkDk_vPeyBMClP',
    FILE_PREFIX: 'STT',
    AUTO_DOWNLOAD_EXCEL: true,
    AUTO_SYNC_DRIVE: true
  },
  
  // Tiêu chuẩn kháng sinh đồ mặc định
  DEFAULT_GUIDELINE: 'CLSI',
  DEFAULT_GUIDELINE_VERSION: 'M100 2025',
  
  // Phân loại kết quả AST chuẩn (Section VIII & XLVII)
  INTERPRETATIONS: {
    S: { label: 'Susceptible (Nhạy cảm)', color: '#10b981', bg: '#d1fae5' },
    I: { label: 'Intermediate (Trung gian)', color: '#f59e0b', bg: '#fef3c7' },
    R: { label: 'Resistant (Kháng thuốc)', color: '#ef4444', bg: '#fee2e2' },
    SD: { label: 'Susceptible-Dose Dependent', color: '#6366f1', bg: '#e0e7ff' },
    NS: { label: 'Non-Susceptible', color: '#ec4899', bg: '#fce7f3' },
    NA: { label: 'Not Applicable', color: '#6b7280', bg: '#f3f4f6' }
  },

  // Vai trò người dùng (Section II & XXXVI)
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    USER: 'user',
    VIEWER: 'viewer'
  }
};

// Đọc cấu hình tùy chỉnh từ LocalStorage nếu có
function getActiveSupabaseConfig() {
  const customUrl = localStorage.getItem('CUSTOM_SUPABASE_URL');
  const customKey = localStorage.getItem('CUSTOM_SUPABASE_KEY');
  return {
    url: customUrl || CONFIG.SUPABASE.DEFAULT_URL,
    key: customKey || CONFIG.SUPABASE.DEFAULT_KEY
  };
}

if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
  window.getActiveSupabaseConfig = getActiveSupabaseConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, getActiveSupabaseConfig };
}
