/**
 * AST & CLINICAL DATA SERVICE - BAO-CAO-KHANG-THUOC
 * Xử lý truy vấn, lọc dữ liệu Kháng sinh đồ, Vi khuẩn, Bệnh phẩm, Bệnh nhân
 * Tự động chuyển đổi giữa Supabase Database và In-Memory Dataset
 */

const ASTService = {
  // Lấy dữ liệu tổng hợp phục vụ Dashboard và phân tích
  async getSurveillanceData(filters = {}) {
    const sb = window.SupabaseManager?.client;
    const hasDb = window.SupabaseManager?.hasTables;

    if (sb && hasDb) {
      try {
        return await this.fetchFromSupabase(filters);
      } catch (err) {
        console.warn('[ASTService] Supabase query failed, falling back to local demo data:', err);
      }
    }

    // Fallback In-memory / Demo data
    return this.fetchFromDemoData(filters);
  },

  // Truy vấn từ Supabase
  async fetchFromSupabase(filters = {}) {
    const sb = window.SupabaseManager.client;

    let astQuery = sb.from('ast_results').select(`
      id, culture_id, antibiotic_code, raw_result, normalized_result,
      mic, disk_zone, interpretation, testing_method, guideline, guideline_version, tested_date,
      import_job_id, file_name,
      cultures (
        id, culture_date, organism_name, organism_code, colony_count,
        specimens (
          id, specimen_type, collection_date, requesting_department,
          patients (
            id, patient_code, age, sex, department, inpatient_outpatient
          )
        )
      )
    `);

    if (filters.guideline) astQuery = astQuery.eq('guideline', filters.guideline);
    if (filters.interpretation) astQuery = astQuery.eq('interpretation', filters.interpretation);
    if (filters.startDate) astQuery = astQuery.gte('tested_date', filters.startDate);
    if (filters.endDate) astQuery = astQuery.lte('tested_date', filters.endDate);
    if (filters.file && filters.file !== 'ALL') {
      astQuery = astQuery.or(`file_name.eq.${filters.file},import_job_id.eq.${filters.file}`);
    }

    const { data: rawAst, error } = await astQuery.limit(2000);
    if (error) throw error;

    // Flatten nested structure
    const astList = (rawAst || []).map(row => {
      const cult = row.cultures || {};
      const spec = cult.specimens || {};
      const pat = spec.patients || {};
      return {
        id: row.id,
        culture_id: row.culture_id,
        antibiotic_code: row.antibiotic_code,
        raw_result: row.raw_result,
        normalized_result: row.normalized_result,
        interpretation: row.interpretation,
        mic: row.mic,
        disk_zone: row.disk_zone,
        tested_date: row.tested_date,
        guideline: row.guideline,
        guideline_version: row.guideline_version,
        file_name: row.file_name,
        import_job_id: row.import_job_id,
        organism_name: cult.organism_name || 'Chưa định danh',
        organism_code: cult.organism_code,
        specimen_type: spec.specimen_type || 'Khác',
        department: pat.department || spec.requesting_department || 'Khác',
        patient_code: pat.patient_code,
        age: pat.age,
        sex: pat.sex
      };
    });

    const { data: patients } = await sb.from('patients').select('id, patient_code, age, sex, department');
    const { data: specimens } = await sb.from('specimens').select('id, specimen_code, specimen_type, collection_date, requesting_department');
    const { data: cultures } = await sb.from('cultures').select('id, organism_name, organism_code, culture_date');
    const { data: jobs } = await sb.from('import_jobs').select('*').order('created_at', { ascending: false });

    return {
      patients: patients || [],
      specimens: specimens || [],
      cultures: cultures || [],
      astResults: astList,
      importJobs: jobs || [],
      source: 'supabase'
    };
  },

  // Truy vấn từ Demo Data
  fetchFromDemoData(filters = {}) {
    const raw = window.DemoDataService?.getAll() || {
      patients: [], specimens: [], cultures: [], astResults: [], importJobs: []
    };

    let filteredAst = [...raw.astResults];

    if (filters.file && filters.file !== 'ALL') {
      filteredAst = filteredAst.filter(a => a.file_name === filters.file || a.import_job_id === filters.file);
    }

    if (filters.organism && filters.organism !== 'ALL') {
      filteredAst = filteredAst.filter(a => a.organism_name === filters.organism || a.organism_code === filters.organism);
    }

    if (filters.specimenType && filters.specimenType !== 'ALL') {
      filteredAst = filteredAst.filter(a => a.specimen_type === filters.specimenType);
    }

    if (filters.department && filters.department !== 'ALL') {
      filteredAst = filteredAst.filter(a => a.department === filters.department);
    }

    if (filters.gram && filters.gram !== 'ALL') {
      filteredAst = filteredAst.filter(a => a.gram_stain === filters.gram);
    }

    return {
      patients: raw.patients,
      specimens: raw.specimens,
      cultures: raw.cultures,
      astResults: filteredAst,
      importJobs: raw.importJobs || [],
      source: 'local_demo'
    };
  },

  // Lấy danh sách toàn bộ các file đã nạp để đưa vào dropdown / quản lý
  async getAvailableFiles() {
    if (window.StorageQuotaManager) {
      return await window.StorageQuotaManager.getAllFilesList();
    }
    const raw = window.DemoDataService?.getAll();
    return raw?.importJobs || [];
  }
};

if (typeof window !== 'undefined') {
  window.ASTService = ASTService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ASTService };
}
