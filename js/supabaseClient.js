/**
 * SUPABASE CLIENT WRAPPER - BAO-CAO-KHANG-THUOC
 * Quản lý kết nối Supabase, kiểm tra sức khỏe cơ sở dữ liệu và xử lý fallback
 */

const SupabaseManager = {
  client: null,
  isConnected: false,
  hasTables: false,
  statusMessage: 'Đang khởi tạo kết nối...',
  listeners: [],

  // Khởi tạo Supabase Client
  init() {
    try {
      const { url, key } = window.getActiveSupabaseConfig();
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        this.client = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        console.log('[Supabase] Initialized with URL:', url);
        this.checkHealth();
      } else {
        console.warn('[Supabase] Supabase JS CDN not loaded. Fallback to Local/Demo mode.');
        this.setStatus(false, false, 'Không tìm thấy Supabase JS SDK (Chạy chế độ Demo)');
      }
    } catch (err) {
      console.error('[Supabase] Initialization error:', err);
      this.setStatus(false, false, 'Lỗi kết nối Supabase: ' + err.message);
    }
  },

  // Kiểm tra kết nối và kiểm tra bảng đã được tạo trên Supabase chưa
  async checkHealth() {
    if (!this.client) return;
    try {
      this.setStatus(null, null, 'Đang kiểm tra kết nối Supabase...');
      
      // Thử truy vấn bảng organisms hoặc ast_results
      const { data, error } = await this.client
        .from('organisms')
        .select('id, organism_code')
        .limit(1);

      if (error) {
        // Nếu lỗi liên quan đến bảng chưa tồn tại (relation "public.organisms" does not exist)
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
          this.setStatus(true, false, 'Đã kết nối Supabase nhưng chưa chạy SQL Migration tạo bảng!');
        } else {
          this.setStatus(false, false, 'Supabase báo lỗi: ' + (error.message || 'Lỗi kết nối'));
        }
      } else {
        this.setStatus(true, true, 'Đã kết nối thành công Supabase PostgreSQL Database');
      }
    } catch (e) {
      console.warn('[Supabase] Check health failed:', e);
      this.setStatus(false, false, 'Không thể kết nối đến Supabase (Chạy chế độ Demo Data)');
    }
  },

  // Đăng ký lắng nghe thay đổi trạng thái kết nối
  onStatusChange(fn) {
    this.listeners.push(fn);
  },

  // Cập nhật trạng thái
  setStatus(connected, hasTables, message) {
    this.isConnected = connected;
    this.hasTables = hasTables;
    this.statusMessage = message;
    this.notify();
  },

  notify() {
    this.listeners.forEach(fn => fn({
      isConnected: this.isConnected,
      hasTables: this.hasTables,
      message: this.statusMessage
    }));
  }
};

if (typeof window !== 'undefined') {
  window.SupabaseManager = SupabaseManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupabaseManager };
}
