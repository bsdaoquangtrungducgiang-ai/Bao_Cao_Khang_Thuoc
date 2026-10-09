/**
 * STORAGE QUOTA & FIFO PURGE MANAGER - BAO-CAO-KHANG-THUOC
 * Quản lý hạn mức dung lượng cơ sở dữ liệu Supabase & bộ nhớ đệm
 * Tự động xóa các đợt nhập liệu cũ nhất (FIFO: First-In, First-Out) khi đầy bộ nhớ để nạp dữ liệu mới
 */

const StorageQuotaManager = {
  // Hạn mức mặc định: 50.000 kết quả AST (phù hợp với mức tối ưu của Supabase Free Tier)
  config: {
    maxRecords: 50000,
    maxFiles: 30,
    autoPurgeEnabled: true
  },

  listeners: [],

  /**
   * Lấy thông tin thống kê dung lượng hiện tại
   */
  async getStorageUsage() {
    const sb = window.SupabaseManager?.client;
    const hasDb = window.SupabaseManager?.hasTables;

    let totalAst = 0;
    let files = [];

    if (sb && hasDb) {
      try {
        const { count, error } = await sb.from('ast_results').select('*', { count: 'exact', head: true });
        if (!error && typeof count === 'number') {
          totalAst = count;
        }

        const { data: jobs } = await sb.from('import_jobs')
          .select('id, file_name, file_type, file_size, record_count, created_at, processing_status')
          .order('created_at', { ascending: true });
        
        if (jobs) files = jobs;
      } catch (err) {
        console.warn('[StorageQuotaManager] Supabase count failed, using local count:', err);
      }
    }

    // Nếu không có Supabase hoặc chưa có dữ liệu Supabase, tính theo DemoDataService
    if (totalAst === 0) {
      const demo = window.DemoDataService?.getAll();
      if (demo) {
        totalAst = demo.astResults?.length || 0;
        files = demo.importJobs || [];
      }
    }

    const max = this.config.maxRecords;
    const percent = Math.min(100, Math.round((totalAst / max) * 100));
    const isFull = totalAst >= max || percent >= 95;

    return {
      currentRecords: totalAst,
      maxRecords: max,
      percent,
      isFull,
      totalFiles: files.length,
      files,
      autoPurgeEnabled: this.config.autoPurgeEnabled
    };
  },

  /**
   * Kiểm tra và tự động dọn dẹp FIFO trước khi nạp dữ liệu mới
   * @param {number} incomingRecords Số lượng bản ghi mới chuẩn bị nạp
   * @returns {Object} { purged: boolean, freedCount: number, purgedFiles: Array }
   */
  async ensureCapacity(incomingRecords = 0) {
    if (!this.config.autoPurgeEnabled) {
      return { purged: false, freedCount: 0, purgedFiles: [] };
    }

    const usage = await this.getStorageUsage();
    const needed = (usage.currentRecords + incomingRecords) - this.config.maxRecords;

    if (needed > 0 || usage.isFull) {
      console.log(`[StorageQuotaManager] Bộ nhớ đầy hoặc sắp vượt hạn mức (Hiện có: ${usage.currentRecords}, Thêm mới: ${incomingRecords}, Hạn mức: ${this.config.maxRecords}). Kích hoạt cơ chế FIFO xóa dữ liệu cũ nhất...`);
      return await this.purgeOldestUntilUnderQuota(needed > 0 ? needed : incomingRecords);
    }

    return { purged: false, freedCount: 0, purgedFiles: [] };
  },

  /**
   * Tiến hành xóa các đợt nhập liệu cũ nhất theo thứ tự thời gian (FIFO)
   * @param {number} recordsToFree Số lượng bản ghi tối thiểu cần giải phóng
   */
  async purgeOldestUntilUnderQuota(recordsToFree = 1000) {
    const sb = window.SupabaseManager?.client;
    const hasDb = window.SupabaseManager?.hasTables;
    const demo = window.DemoDataService?.getAll();

    let freedCount = 0;
    const purgedFiles = [];

    // Lấy danh sách các file/đợt nhập liệu theo thứ tự cũ nhất trước (created_at ASC)
    let jobs = [];

    if (sb && hasDb) {
      try {
        const { data } = await sb.from('import_jobs')
          .select('id, file_name, record_count, created_at')
          .order('created_at', { ascending: true });
        if (data) jobs = data;
      } catch (e) {
        console.warn('[StorageQuotaManager] Error querying old import jobs from Supabase:', e);
      }
    }

    if (jobs.length === 0 && demo?.importJobs) {
      jobs = [...demo.importJobs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    // Nếu vẫn chưa có danh sách jobs nhưng có dữ liệu mẫu Demo
    if (jobs.length === 0 && demo && demo.astResults?.length > 0) {
      jobs = [{
        id: 'demo-initial-job',
        file_name: 'Dữ liệu mẫu (Demo CLSI ban đầu)',
        record_count: 1000,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      }];
    }

    for (const job of jobs) {
      if (freedCount >= recordsToFree) break;

      const jobName = job.file_name || `Đợt nạp ${job.id}`;
      const count = job.record_count || 0;

      console.log(`[StorageQuotaManager] FIFO: Đang xóa đợt nhập cũ nhất "${jobName}" (${count} bản ghi)...`);

      // 1. Xóa trong Supabase (nếu có)
      if (sb && hasDb && job.id && job.id !== 'demo-initial-job') {
        try {
          // Xóa AST results gắn với job này
          await sb.from('ast_results').delete().eq('import_job_id', job.id);
          // Xóa bản ghi trong import_jobs
          await sb.from('import_jobs').delete().eq('id', job.id);
        } catch (err) {
          console.warn('[StorageQuotaManager] Lỗi xóa dữ liệu trên Supabase:', err);
        }
      }

      // 2. Xóa trong bộ nhớ đệm DemoDataService
      if (demo) {
        // Lọc bỏ AST results của file này
        const beforeAstCount = demo.astResults.length;
        demo.astResults = demo.astResults.filter(a => a.file_name !== jobName && a.import_job_id !== job.id);
        const diff = beforeAstCount - demo.astResults.length;
        freedCount += (diff > 0 ? diff : count);

        // Lọc bỏ khỏi danh sách importJobs
        if (demo.importJobs) {
          demo.importJobs = demo.importJobs.filter(j => j.id !== job.id && j.file_name !== jobName);
        }
      } else {
        freedCount += count;
      }

      purgedFiles.push({
        id: job.id,
        fileName: jobName,
        recordsFreed: count,
        createdAt: job.created_at
      });

      // Ghi audit log
      window.AuditService?.log('PURGE_FIFO', 'import_jobs', job.id, {
        fileName: jobName,
        recordsFreed: count,
        reason: 'Supabase memory full / quota exceeded'
      });
    }

    if (purgedFiles.length > 0) {
      const fileNames = purgedFiles.map(f => f.fileName).join(', ');
      window.Toast?.warning(`Bộ nhớ đầy. Đã tự động xóa dữ liệu cũ nhất [${fileNames}] theo cơ chế FIFO để giải phóng ${freedCount.toLocaleString()} bản ghi.`);
      this.notify();
    }

    return {
      purged: purgedFiles.length > 0,
      freedCount,
      purgedFiles
    };
  },

  /**
   * Xóa một file cụ thể do người dùng chủ động yêu cầu
   */
  async deleteFile(fileIdentifier) {
    const sb = window.SupabaseManager?.client;
    const hasDb = window.SupabaseManager?.hasTables;
    const demo = window.DemoDataService?.getAll();

    let deletedCount = 0;

    // Xóa từ Supabase
    if (sb && hasDb) {
      try {
        await sb.from('ast_results').delete().or(`import_job_id.eq.${fileIdentifier},file_name.eq.${fileIdentifier}`);
        await sb.from('import_jobs').delete().or(`id.eq.${fileIdentifier},file_name.eq.${fileIdentifier}`);
      } catch (err) {
        console.warn('[StorageQuotaManager] Error deleting file from Supabase:', err);
      }
    }

    // Xóa từ DemoDataService
    if (demo) {
      const before = demo.astResults.length;
      demo.astResults = demo.astResults.filter(a => a.file_name !== fileIdentifier && a.import_job_id !== fileIdentifier);
      deletedCount = before - demo.astResults.length;

      if (demo.importJobs) {
        demo.importJobs = demo.importJobs.filter(j => j.id !== fileIdentifier && j.file_name !== fileIdentifier);
      }
    }

    window.AuditService?.log('DELETE_FILE', 'import_jobs', fileIdentifier, {
      fileIdentifier,
      deletedCount
    });

    window.Toast?.success(`Đã xóa dữ liệu file "${fileIdentifier}" (${deletedCount.toLocaleString()} kết quả AST)!`);
    this.notify();

    // Làm mới lại giao diện phân tích
    if (window.App) {
      await window.App.refreshData();
    }

    return { success: true, deletedCount };
  },

  /**
   * Lấy danh sách đồng bộ các file lưu trong browser storage & demo data
   */
  getStoredFiles() {
    const list = [];
    const seen = new Set();
    if (typeof localStorage !== 'undefined') {
      try {
        const manifestStr = localStorage.getItem('amr_persisted_files_manifest');
        if (manifestStr) {
          const manifest = JSON.parse(manifestStr);
          if (Array.isArray(manifest)) {
            manifest.forEach(m => {
              if (m && m.fileName && !seen.has(m.fileName)) {
                seen.add(m.fileName);
                list.push({
                  id: m.id,
                  file_name: m.fileName,
                  fileName: m.fileName,
                  file_type: m.fileType,
                  file_size: m.fileSize,
                  record_count: m.recordCount,
                  created_at: m.createdAt
                });
              }
            });
          }
        }
      } catch (e) {}
    }
    const demo = window.DemoDataService?.getAll ? window.DemoDataService.getAll() : null;
    (demo?.importJobs || []).forEach(j => {
      if (j && j.file_name && !seen.has(j.file_name)) {
        seen.add(j.file_name);
        list.push({
          id: j.id,
          file_name: j.file_name,
          fileName: j.file_name,
          file_type: j.file_type,
          file_size: j.file_size,
          record_count: j.record_count,
          created_at: j.created_at
        });
      }
    });
    return list;
  },

  /**
   * Lấy danh sách tất cả các file / đợt nạp hiện có trong hệ thống
   */
  async getAllFilesList() {
    const usage = await this.getStorageUsage();
    const demo = window.DemoDataService?.getAll ? window.DemoDataService.getAll() : null;
    const map = new Map();

    // 0. Quét từ persisted files manifest trong localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        const manifestStr = localStorage.getItem('amr_persisted_files_manifest');
        if (manifestStr) {
          const manifest = JSON.parse(manifestStr);
          if (Array.isArray(manifest)) {
            manifest.forEach(m => {
              if (m && m.fileName) {
                map.set(m.fileName, {
                  id: m.id,
                  fileName: m.fileName,
                  fileType: m.fileType || (m.fileName.endsWith('.pdf') ? 'pdf' : (m.fileName.endsWith('.csv') ? 'csv' : 'xlsx')),
                  fileSize: m.fileSize || 0,
                  recordCount: m.recordCount || 0,
                  createdAt: m.createdAt || new Date().toISOString()
                });
              }
            });
          }
        }
      } catch (e) {}
    }

    // 1. Lấy từ jobs
    usage.files.forEach(f => {
      map.set(f.file_name, {
        id: f.id,
        fileName: f.file_name,
        fileType: f.file_type || (f.file_name.endsWith('.pdf') ? 'pdf' : (f.file_name.endsWith('.csv') ? 'csv' : 'xlsx')),
        fileSize: f.file_size || 0,
        recordCount: f.record_count || 0,
        createdAt: f.created_at || new Date().toISOString()
      });
    });

    // 2. Quét thêm từ astResults nếu có file_name riêng biệt
    if (demo && demo.astResults) {
      demo.astResults.forEach(a => {
        if (a.file_name && !map.has(a.file_name)) {
          map.set(a.file_name, {
            id: a.import_job_id || 'local-' + a.file_name,
            fileName: a.file_name,
            fileType: a.file_name.endsWith('.pdf') ? 'pdf' : (a.file_name.endsWith('.csv') ? 'csv' : 'xlsx'),
            fileSize: 0,
            recordCount: demo.astResults.filter(x => x.file_name === a.file_name).length,
            createdAt: a.created_at || new Date().toISOString()
          });
        }
      });
    }

    // 3. Nếu chưa có file nào, thêm mục mặc định Demo CLSI
    if (map.size === 0) {
      map.set('Dữ liệu mẫu (Demo CLSI)', {
        id: 'demo-default',
        fileName: 'Dữ liệu mẫu (Demo CLSI)',
        fileType: 'system',
        fileSize: 1024 * 1024,
        recordCount: demo?.astResults?.length || 1000,
        createdAt: '2026-01-01T08:00:00Z'
      });
    }

    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  onUsageChange(fn) {
    this.listeners.push(fn);
  },

  notify() {
    this.getStorageUsage().then(usage => {
      this.listeners.forEach(fn => fn(usage));
    });
  }
};

if (typeof window !== 'undefined') {
  window.StorageQuotaManager = StorageQuotaManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageQuotaManager };
}
