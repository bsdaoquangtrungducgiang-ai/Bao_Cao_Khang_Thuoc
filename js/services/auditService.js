/**
 * AUDIT SERVICE - BAO-CAO-KHANG-THUOC
 * Ghi nhật ký kiểm toán hệ thống theo yêu cầu y tế (Section XXXV & XLVII)
 */

const AuditService = {
  localLogs: [],

  /**
   * Ghi log hành động
   * @param {string} action LOGIN, LOGOUT, UPLOAD, IMPORT, EDIT, DELETE, EXPORT, REPORT
   * @param {string} entity patients, specimens, cultures, ast_results, import_jobs, guidelines
   * @param {string} entityId ID bản ghi tác động
   * @param {Object} metadata Dữ liệu chi tiết bổ sung
   */
  async log(action, entity, entityId = null, metadata = {}) {
    const user = window.AuthService?.getUser();
    const profile = window.AuthService?.getProfile();

    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      user_id: user?.id || null,
      user_email: user?.email || 'system@hospital.vn',
      action,
      entity,
      entity_id: entityId ? String(entityId) : null,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };

    // Lưu cục bộ để hiển thị ngay tức thì
    this.localLogs.unshift(logEntry);
    if (this.localLogs.length > 200) this.localLogs.pop();

    // Đồng bộ vào Supabase database nếu có kết nối
    const sb = window.SupabaseManager?.client;
    if (sb && window.SupabaseManager?.hasTables) {
      try {
        await sb.from('audit_logs').insert([{
          user_id: user?.id,
          user_email: user?.email,
          action,
          entity,
          entity_id: entityId ? String(entityId) : null,
          metadata
        }]);
      } catch (err) {
        console.warn('[AuditService] Failed to insert audit log to Supabase:', err);
      }
    }

    return logEntry;
  },

  async getRecentLogs(limit = 50) {
    const sb = window.SupabaseManager?.client;
    if (sb && window.SupabaseManager?.hasTables) {
      try {
        const { data, error } = await sb
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('[AuditService] Fetch audit logs error:', e);
      }
    }
    return this.localLogs.slice(0, limit);
  }
};

if (typeof window !== 'undefined') {
  window.AuditService = AuditService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuditService };
}
