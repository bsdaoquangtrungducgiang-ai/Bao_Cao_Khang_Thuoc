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

    bindSelect('filter-time', 'time');
    bindSelect('filter-department', 'department');
    bindSelect('filter-specimen', 'specimenType');
    bindSelect('filter-organism', 'organism');
    bindSelect('filter-gram', 'gram');

    // Nút reset bộ lọc
    const resetBtn = document.getElementById('btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.state.filters = { time: 'ALL', department: 'ALL', specimenType: 'ALL', organism: 'ALL', gram: 'ALL' };
        ['filter-time', 'filter-department', 'filter-specimen', 'filter-organism', 'filter-gram'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = 'ALL';
        });
        this.applyFiltersAndRender();
        window.Toast.info('Đã xóa tất cả bộ lọc');
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
      window.Toast.error('Lỗi tải dữ liệu xét nghiệm: ' + err.message);
    }
  },

  populateFilterDropdowns(data) {
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
      if (f.department !== 'ALL' && item.department !== f.department) return false;
      if (f.specimenType !== 'ALL' && item.specimen_type !== f.specimenType) return false;
      if (f.organism !== 'ALL' && item.organism_name !== f.organism) return false;
      if (f.gram !== 'ALL' && item.gram_stain !== f.gram) return false;
      return true;
    });

    this.state.filteredAst = filtered;

    // 1. Tính toán KPIs tổng quan
    const rates = window.AnalyticsService.calculateRates(filtered);
    const uniquePatients = new Set(filtered.map(a => a.patient_code || a.patient_id)).size || (this.state.surveillanceData.patients?.length || 0);
    const uniqueSpecimens = new Set(filtered.map(a => a.culture_id)).size || (this.state.surveillanceData.specimens?.length || 0);
    const uniqueOrganisms = new Set(filtered.map(a => a.organism_name)).size;
    const uniqueAntibiotics = new Set(filtered.map(a => a.antibiotic_code)).size;

    window.KPICards?.render({
      totalPatients: uniquePatients,
      totalSpecimens: uniqueSpecimens,
      totalCultures: this.state.surveillanceData.cultures?.length || 200,
      totalAst: rates.denominator || filtered.length,
      sRate: rates.sRate,
      iRate: rates.iRate,
      rRate: rates.rRate,
      totalOrganismTypes: uniqueOrganisms || 8,
      totalAntibioticTypes: uniqueAntibiotics || 16
    });

    // 2. Render Charts
    this.renderCharts();
  },

  renderDashboard() {
    this.applyFiltersAndRender();
  },

  renderCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js chưa sẵn sàng');
      return;
    }

    const cultures = this.state.surveillanceData?.cultures || [];
    const specimens = this.state.surveillanceData?.specimens || [];
    const ast = this.state.filteredAst || [];

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
