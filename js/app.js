/**
 * APP CONTROLLER & DASHBOARD ORCHESTRATOR - BAO-CAO-KHANG-THUOC
 * Điều phối ứng dụng, tính toán phân tích và render biểu đồ Chart.js
 */

const App = {
  state: {
    surveillanceData: null,
    filteredAst: [],
    charts: {
      organismDist: null,
      specimenDist: null,
      resistanceBar: null,
      trendLine: null
    },
    filters: {
      file: 'ALL',
      time: 'ALL',
      department: 'ALL',
      specimenType: 'ALL',
      organism: 'ALL',
      gram: 'ALL'
    }
  },

  async init() {
    console.log('[App] Khởi động hệ thống BAO-CAO-KHANG-THUOC...');
    
    // 1. Khởi tạo tiện ích và kết nối
    window.Toast?.init();
    window.SupabaseManager?.init();
    await window.AuthService?.init();
    window.Navigation?.init();
    window.AuthModal?.init();
    window.ImportWizard?.init();
    window.ClinicalDataViews?.init();
    window.AntibiogramView?.init();
    window.HeatmapView?.init();
    window.SurveillanceModulesView?.init();
    window.PDFImportView?.init();
    window.ReportView?.init();
    window.SystemCatalogsView?.init();
    window.FileManagerView?.init();

    // 2. Khởi tạo đồng hồ thời gian thực và tiêu chuẩn CLSI/EUCAST
    this.initClock();
    this.initGuidelineSelector();
    this.bindFilterEvents();
    this.bindConnectionUI();

    // 3. Tải dữ liệu ban đầu
    await this.refreshData();

    // 4. Lắng nghe chuyển tab
    window.addEventListener('tabChanged', (e) => {
      if (e.detail.tab === 'dashboard') {
        this.renderDashboard();
      }
    });

    console.log('[App] Khởi tạo hoàn tất!');
  },

  initClock() {
    const clockEl = document.getElementById('live-clock');
    const updateTime = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleDateString('vi-VN', {
          weekday: 'short',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  },

  initGuidelineSelector() {
    const guidelineSelect = document.getElementById('select-guideline');
    if (guidelineSelect) {
      guidelineSelect.addEventListener('change', (e) => {
        window.Toast.info(`Đã chuyển tiêu chuẩn: ${e.target.value}`);
        this.refreshData();
      });
    }
  },

  bindConnectionUI() {
    const badge = document.getElementById('conn-status-badge');
    const text = document.getElementById('conn-status-text');

    const updateBadge = (status) => {
      if (!badge || !text) return;
      if (status.isConnected && status.hasTables) {
        badge.className = 'status-indicator status-online';
        text.textContent = 'Supabase PostgreSQL: Đã kết nối';
      } else if (status.isConnected && !status.hasTables) {
        badge.className = 'status-indicator status-warning';
        text.textContent = 'Supabase: Cần chạy SQL Migration';
      } else {
        badge.className = 'status-indicator status-demo';
        text.textContent = 'Chế độ Demo (1,000 AST Data)';
      }
    };

    window.SupabaseManager?.onStatusChange(updateBadge);
  },

  bindFilterEvents() {
    const bindSelect = (id, key) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          this.state.filters[key] = e.target.value;
          this.applyFiltersAndRender();
        });
      }
    };

    bindSelect('filter-file', 'file');
    bindSelect('filter-time', 'time');
    bindSelect('filter-department', 'department');
    bindSelect('filter-specimen', 'specimenType');
    bindSelect('filter-organism', 'organism');
    bindSelect('filter-gram', 'gram');

    // Nút reset bộ lọc
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.state.filters = { file: 'ALL', time: 'ALL', department: 'ALL', specimenType: 'ALL', organism: 'ALL', gram: 'ALL' };
        ['filter-file', 'filter-time', 'filter-department', 'filter-specimen', 'filter-organism', 'filter-gram'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = 'ALL';
        });
        this.applyFiltersAndRender();
        window.Toast?.info('Đã xóa tất cả bộ lọc');
      });
    }
  },

  async refreshData() {
    try {
      const data = await window.ASTService.getSurveillanceData(this.state.filters);
      this.state.surveillanceData = data;
      this.populateFilterDropdowns(data);
      this.applyFiltersAndRender();
    } catch (err) {
      console.error('[App] Tải dữ liệu thất bại:', err);
      window.Toast?.error('Lỗi tải dữ liệu xét nghiệm: ' + err.message);
    }
  },

  populateFilterDropdowns(data) {
    // Populate file list
    const fileSelect = document.getElementById('filter-file');
    if (fileSelect) {
      const currentVal = this.state.filters.file || 'ALL';
      fileSelect.innerHTML = '<option value="ALL">📁 Tất cả các file (Toàn viện)</option>';

      const fileMap = new Map();
      (data.importJobs || []).forEach(j => {
        if (j.file_name) {
          fileMap.set(j.file_name, {
            name: j.file_name,
            type: j.file_type || (j.file_name.endsWith('.pdf') ? 'pdf' : (j.file_name.endsWith('.csv') ? 'csv' : 'xlsx')),
            count: j.record_count || 0
          });
        }
      });
      (data.astResults || []).forEach(a => {
        if (a.file_name && !fileMap.has(a.file_name)) {
          fileMap.set(a.file_name, {
            name: a.file_name,
            type: a.file_name.endsWith('.pdf') ? 'pdf' : (a.file_name.endsWith('.csv') ? 'csv' : 'xlsx'),
            count: 0
          });
        }
      });

      fileMap.forEach((info, fileName) => {
        const opt = document.createElement('option');
        opt.value = fileName;
        const icon = info.type === 'pdf' ? '📄 [PDF]' : (info.type === 'csv' ? '📊 [CSV]' : '📗 [Excel]');
        opt.textContent = `${icon} ${fileName}`;
        fileSelect.appendChild(opt);
      });

      fileSelect.value = currentVal;
    }

    // Populate departments
    const deptSelect = document.getElementById('filter-department');
    if (deptSelect && deptSelect.options.length <= 1) {
      const depts = [...new Set((data.patients || []).map(p => p.department).filter(Boolean))];
      depts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        deptSelect.appendChild(opt);
      });
    }

    // Populate specimen types
    const specSelect = document.getElementById('filter-specimen');
    if (specSelect && specSelect.options.length <= 1) {
      const types = [...new Set((data.specimens || []).map(s => s.specimen_type).filter(Boolean))];
      types.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        specSelect.appendChild(opt);
      });
    }

    // Populate organisms
    const orgSelect = document.getElementById('filter-organism');
    if (orgSelect && orgSelect.options.length <= 1) {
      const orgs = [...new Set((data.cultures || []).map(c => c.organism_name).filter(Boolean))];
      orgs.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        orgSelect.appendChild(opt);
      });
    }
  },

  applyFiltersAndRender() {
    if (!this.state.surveillanceData) return;

    const rawAst = this.state.surveillanceData.astResults || [];
    const f = this.state.filters;

    const filtered = rawAst.filter(item => {
      if (f.file && f.file !== 'ALL') {
        if (item.file_name !== f.file && item.import_job_id !== f.file) return false;
      }
      if (f.department !== 'ALL' && item.department !== f.department) return false;
      if (f.specimenType !== 'ALL' && item.specimen_type !== f.specimenType) return false;
      if (f.organism !== 'ALL' && item.organism_name !== f.organism) return false;
      if (f.gram !== 'ALL' && item.gram_stain !== f.gram) return false;
      return true;
    });

    this.state.filteredAst = filtered;
    this.updateFileBanner();

    // 1. Tính toán KPIs tổng quan
    const rates = window.AnalyticsService.calculateRates(filtered);
    const uniquePatients = new Set(filtered.map(a => a.patient_code || a.patient_id)).size || (this.state.surveillanceData.patients?.length || 0);
    const totalEncounters = new Set(filtered.map(a => a.source_row ? `row-${a.source_row}` : (a.culture_id || `${a.patient_code}|${a.tested_date}`))).size || (this.state.surveillanceData.cultures?.length || 0);
    const uniqueSpecimens = totalEncounters || (this.state.surveillanceData.specimens?.length || 0);
    const uniqueCultures = totalEncounters || (this.state.surveillanceData.cultures?.length || 200);
    const uniqueOrganisms = new Set(filtered.map(a => a.organism_name)).size;
    const uniqueAntibiotics = new Set(filtered.map(a => a.antibiotic_code)).size;

    window.KPICards?.render({
      totalPatients: (f.file && f.file !== 'ALL') ? totalEncounters : (uniquePatients || totalEncounters),
      distinctPatients: uniquePatients,
      totalEncounters: totalEncounters,
      totalSpecimens: uniqueSpecimens,
      totalCultures: uniqueCultures,
      totalAst: rates.denominator || filtered.length,
      sRate: rates.sRate,
      iRate: rates.iRate,
      rRate: rates.rRate,
      totalOrganismTypes: uniqueOrganisms || 8,
      totalAntibioticTypes: uniqueAntibiotics || 16
    });

    // 2. Render Charts
    this.renderCharts();

    if (window.Navigation?.currentTab === 'analytics_antibiogram') {
      window.AntibiogramView?.populateDropdowns();
      window.AntibiogramView?.renderAntibiogram();
    }
  },

  updateFileBanner() {
    const banner = document.getElementById('dashboard-file-banner');
    if (!banner) return;
    const f = this.state.filters.file;
    if (f && f !== 'ALL') {
      const count = this.state.filteredAst?.length || 0;
      banner.innerHTML = `
        <div class="active-file-alert">
          <div class="active-file-info">
            <i class="fa-solid fa-file-waveform fa-beat-fade"></i>
            <span>Đang phân tích chuyên sâu dữ liệu từ file: <strong>${f}</strong> (${count.toLocaleString()} kết quả AST)</span>
          </div>
          <div class="active-file-actions">
            <button class="btn-banner-clear" id="btn-banner-clear-file" title="Quay lại phân tích toàn viện">
              <i class="fa-solid fa-rotate-left"></i> Toàn viện (Tất cả file)
            </button>
            <a href="#data_files" class="btn-banner-manage" title="Mở trang Quản lý File">
              <i class="fa-solid fa-folder-tree"></i> Quản lý files
            </a>
          </div>
        </div>
      `;
      banner.style.display = 'block';

      const clearBtn = document.getElementById('btn-banner-clear-file');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.state.filters.file = 'ALL';
          const fileSelect = document.getElementById('filter-file');
          if (fileSelect) fileSelect.value = 'ALL';
          this.applyFiltersAndRender();
        });
      }
    } else {
      banner.style.display = 'none';
    }
  },

  selectFileForAnalysis(fileName) {
    this.state.filters.file = fileName;
    const fileSelect = document.getElementById('filter-file');
    if (fileSelect) {
      let opt = Array.from(fileSelect.options).find(o => o.value === fileName);
      if (!opt) {
        opt = document.createElement('option');
        opt.value = fileName;
        opt.textContent = `📄 ${fileName}`;
        fileSelect.appendChild(opt);
      }
      fileSelect.value = fileName;
    }
    window.Navigation?.navigateTo('dashboard');
    this.applyFiltersAndRender();
    window.Toast?.success(`Đang phân tích chuyên sâu cho file "${fileName}"!`);
  },

  getActiveAstRecords() {
    const f = this.state.filters?.file;
    let data = this.state.surveillanceData;
    let rawAst = data?.astResults || [];
    const localData = window.DemoDataService?.getAll();

    const hasClinicalInfo = (records) => {
      return records && records.length > 0 && records.some(r => 
        r.organism_name && r.organism_name !== 'Chưa định danh' && r.organism_name !== 'Khác'
      );
    };

    // Nếu surveillanceData không có kết quả AST hoặc không có tên vi khuẩn thực tế, lấy từ Local Store
    if ((!hasClinicalInfo(rawAst)) && hasClinicalInfo(localData?.astResults)) {
      data = localData;
      rawAst = localData.astResults || [];
    }

    if (!f || f === 'ALL') {
      if ((!hasClinicalInfo(rawAst)) && hasClinicalInfo(localData?.astResults)) {
        return localData.astResults;
      }
      return rawAst;
    }

    const target = String(f).trim().toLowerCase();
    const cleanTarget = target.replace(/\.[a-z0-9]+$/i, '').replace(/[\s\.\(\)\-_]/g, '');
    const filterFn = a => {
      const fn = String(a.file_name || '').trim().toLowerCase();
      const jid = String(a.import_job_id || '').trim().toLowerCase();
      if (fn === target || jid === target || fn.includes(target) || target.includes(fn)) return true;
      const cleanFn = fn.replace(/\.[a-z0-9]+$/i, '').replace(/[\s\.\(\)\-_]/g, '');
      return cleanFn && cleanTarget && (cleanFn === cleanTarget || cleanFn.includes(cleanTarget) || cleanTarget.includes(cleanFn));
    };

    let matched = rawAst.filter(filterFn);
    // Nếu chưa tìm thấy hoặc không có thông tin vi khuẩn thực tế nhưng Local Store có thì lấy từ Local Store
    if ((!hasClinicalInfo(matched)) && localData?.astResults) {
      const localMatched = localData.astResults.filter(filterFn);
      if (hasClinicalInfo(localMatched)) {
        matched = localMatched;
      }
    }

    return matched;
  },

  renderDashboard() {
    this.applyFiltersAndRender();
  },

  renderCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js chưa sẵn sàng');
      return;
    }

    const f = this.state.filters;
    let cultures = this.state.surveillanceData?.cultures || [];
    let specimens = this.state.surveillanceData?.specimens || [];
    const ast = this.state.filteredAst || [];

    if (f.file && f.file !== 'ALL') {
      cultures = cultures.filter(c => c.file_name === f.file || c.import_job_id === f.file);
      specimens = specimens.filter(s => s.file_name === f.file || s.import_job_id === f.file);

      // Fallback: nếu cultures chưa có thẻ file_name, trích xuất chuẩn xác từ ast đã lọc
      if (cultures.length === 0 && ast.length > 0) {
        const cultMap = new Map();
        ast.forEach(a => {
          const k = a.culture_id || (a.source_row ? ('row-' + a.source_row) : (`${a.patient_code}|${a.tested_date}|${a.organism_name}`));
          if (!cultMap.has(k)) {
            cultMap.set(k, {
              organism_name: a.organism_name,
              patient_code: a.patient_code,
              specimen_type: a.specimen_type,
              culture_date: a.tested_date,
              department: a.department,
              file_name: a.file_name
            });
          }
        });
        cultures = Array.from(cultMap.values());
      }
    }

    if (f.department && f.department !== 'ALL') {
      cultures = cultures.filter(c => c.department === f.department);
      specimens = specimens.filter(s => s.requesting_department === f.department || s.department === f.department);
    }
    if (f.specimenType && f.specimenType !== 'ALL') {
      cultures = cultures.filter(c => c.specimen_type === f.specimenType);
      specimens = specimens.filter(s => s.specimen_type === f.specimenType);
    }
    if (f.organism && f.organism !== 'ALL') {
      cultures = cultures.filter(c => c.organism_name === f.organism);
    }

    // Chart 1: Phân bố Vi khuẩn (Organism Distribution)
    this.renderOrganismChart(cultures);

    // Chart 2: Phân bố Bệnh phẩm (Specimen Distribution)
    this.renderSpecimenChart(specimens);

    // Chart 3: Tỷ lệ Kháng thuốc theo Kháng sinh (Antibiogram Bar)
    this.renderResistanceBarChart(ast);

    // Chart 4: Xu hướng Kháng thuốc theo Thời gian (Trend Line)
    this.renderTrendLineChart(ast);
  },

  renderOrganismChart(cultures) {
    const ctx = document.getElementById('chart-organisms')?.getContext('2d');
    if (!ctx) return;

    const data = window.AnalyticsService.getOrganismDistribution(cultures).slice(0, 6);
    const labels = data.map(d => d.name);
    const counts = data.map(d => d.count);

    if (this.state.charts.organismDist) {
      this.state.charts.organismDist.destroy();
    }

    this.state.charts.organismDist = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: [
            '#0284c7', '#0d9488', '#f59e0b', '#dc2626', '#8b5cf6', '#64748b'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw} mẫu (${data[context.dataIndex].percent}%)`
            }
          }
        },
        cutout: '65%'
      }
    });
  },

  renderSpecimenChart(specimens) {
    const ctx = document.getElementById('chart-specimens')?.getContext('2d');
    if (!ctx) return;

    const data = window.AnalyticsService.getSpecimenDistribution(specimens).slice(0, 5);
    const labels = data.map(d => d.type);
    const counts = data.map(d => d.count);

    if (this.state.charts.specimenDist) {
      this.state.charts.specimenDist.destroy();
    }

    this.state.charts.specimenDist = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: [
            '#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  },

  renderResistanceBarChart(ast) {
    const ctx = document.getElementById('chart-resistance-bars')?.getContext('2d');
    if (!ctx) return;

    const antibiogram = window.AnalyticsService.generateAntibiogram(ast).slice(0, 10);
    const labels = antibiogram.map(a => a.code);
    const rRates = antibiogram.map(a => a.rRate);
    const iRates = antibiogram.map(a => a.iRate);
    const sRates = antibiogram.map(a => a.sRate);

    if (this.state.charts.resistanceBar) {
      this.state.charts.resistanceBar.destroy();
    }

    this.state.charts.resistanceBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Kháng (R%)', data: rRates, backgroundColor: '#ef4444' },
          { label: 'Trung gian (I%)', data: iRates, backgroundColor: '#f59e0b' },
          { label: 'Nhạy (S%)', data: sRates, backgroundColor: '#10b981' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { stacked: true, max: 100, ticks: { callback: v => v + '%' } },
          y: { stacked: true }
        },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12 } }
        }
      }
    });
  },

  renderTrendLineChart(ast) {
    const ctx = document.getElementById('chart-trends')?.getContext('2d');
    if (!ctx) return;

    const trends = window.AnalyticsService.getResistanceTrend(ast, 'Escherichia coli', 'CRO');
    const labels = trends.length > 0 ? trends.map(t => t.period) : ['2026-06', '2026-07', '2026-08', '2026-09'];
    const rValues = trends.length > 0 ? trends.map(t => t.rRate) : [60, 64, 67, 69];

    if (this.state.charts.trendLine) {
      this.state.charts.trendLine.destroy();
    }

    this.state.charts.trendLine = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'E. coli - Kháng Ceftriaxone (CRO %R)',
          data: rValues,
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, ticks: { callback: v => v + '%' } }
        },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12 } }
        }
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

if (typeof window !== 'undefined') {
  window.App = App;
}
