/**
 * ANTIBIOGRAM VIEW COMPONENT - BAO-CAO-KHANG-THUOC
 * Báo cáo Antibiogram tương tác động theo mục XIX & XX
 */

const AntibiogramView = {
  currentChart: null,

  init() {
    this.bindEvents();
    window.addEventListener('tabChanged', (e) => {
      if (e.detail.tab === 'analytics_antibiogram') {
        this.populateDropdowns();
        this.renderAntibiogram();
      }
    });
  },

  bindEvents() {
    const bindChange = (id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => this.renderAntibiogram());
    };

    bindChange('abg-select-organism');
    bindChange('abg-select-specimen');
    bindChange('abg-select-year');

    // Nút xuất Excel Antibiogram
    const btnExportExcel = document.getElementById('btn-export-abg-excel');
    if (btnExportExcel) {
      btnExportExcel.addEventListener('click', () => this.exportExcel());
    }

    // Nút in ấn Antibiogram
    const btnPrint = document.getElementById('btn-print-abg');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => window.print());
    }
  },

  populateDropdowns() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    // Vi khuẩn
    const orgSelect = document.getElementById('abg-select-organism');
    if (orgSelect && orgSelect.options.length <= 1) {
      const orgs = [...new Set((data.cultures || []).map(c => c.organism_name).filter(Boolean))];
      orgs.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o;
        opt.textContent = o;
        if (o === 'Escherichia coli') opt.selected = true;
        orgSelect.appendChild(opt);
      });
    }

    // Bệnh phẩm
    const specSelect = document.getElementById('abg-select-specimen');
    if (specSelect && specSelect.options.length <= 1) {
      const specs = [...new Set((data.specimens || []).map(s => s.specimen_type).filter(Boolean))];
      specs.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        if (s === 'Nước tiểu') opt.selected = true;
        specSelect.appendChild(opt);
      });
    }
  },

  renderAntibiogram() {
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    if (!data) return;

    const org = document.getElementById('abg-select-organism')?.value || 'Escherichia coli';
    const spec = document.getElementById('abg-select-specimen')?.value || 'Nước tiểu';
    const year = document.getElementById('abg-select-year')?.value || '2026';
    const activeFile = window.App?.state?.filters?.file;

    const titleEl = document.getElementById('abg-report-title');
    if (titleEl) {
      const fileSuffix = (activeFile && activeFile !== 'ALL') ? ` — [Nguồn: ${activeFile}]` : '';
      titleEl.textContent = `Antibiogram: ${org} — ${spec} (${year})${fileSuffix}`;
    }

    // Lấy tập dữ liệu AST (lọc theo file nếu người dùng đã chọn file)
    const astList = window.App?.getActiveAstRecords ? window.App.getActiveAstRecords() : (data.astResults || []);

    // Sinh bảng Antibiogram qua AnalyticsService
    const rows = window.AnalyticsService.generateAntibiogram(astList, org, spec);
    this.renderTable(rows);
    this.renderChart(rows);
  },

  renderTable(rows = []) {
    const tbody = document.getElementById('table-abg-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 24px; color: var(--text-muted);">Không có dữ liệu kháng sinh đồ cho tiêu chí lọc này</td></tr>';
      return;
    }

    rows.forEach((r, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center; color: var(--text-muted);">${idx + 1}</td>
        <td><strong>${r.code}</strong></td>
        <td>${r.name || r.code}</td>
        <td style="text-align: center; font-weight: 700; color: var(--color-s);">${r.sRate}% <span style="font-size: 10.5px; color: var(--text-muted);">(${r.sCount})</span></td>
        <td style="text-align: center; font-weight: 700; color: var(--color-i);">${r.iRate}% <span style="font-size: 10.5px; color: var(--text-muted);">(${r.iCount})</span></td>
        <td style="text-align: center; font-weight: 700; color: var(--color-r);">${r.rRate}% <span style="font-size: 10.5px; color: var(--text-muted);">(${r.rCount})</span></td>
        <td style="text-align: center; font-weight: 700;">${r.total}</td>
        <td>
          <div style="display:flex; height: 6px; border-radius: 3px; overflow: hidden; background: #e2e8f0;">
            <div style="width: ${r.sRate}%; background: var(--color-s);"></div>
            <div style="width: ${r.iRate}%; background: var(--color-i);"></div>
            <div style="width: ${r.rRate}%; background: var(--color-r);"></div>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  renderChart(rows = []) {
    const ctx = document.getElementById('chart-abg-bars')?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;

    if (this.currentChart) {
      this.currentChart.destroy();
    }

    const labels = rows.map(r => r.code);
    const sRates = rows.map(r => r.sRate);
    const iRates = rows.map(r => r.iRate);
    const rRates = rows.map(r => r.rRate);

    this.currentChart = new Chart(ctx, {
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
          legend: { position: 'top' }
        }
      }
    });
  },

  exportExcel() {
    const org = document.getElementById('abg-select-organism')?.value || 'E_coli';
    const spec = document.getElementById('abg-select-specimen')?.value || 'Urine';
    const data = window.App?.state?.surveillanceData || window.DemoDataService?.getAll();
    const rows = window.AnalyticsService.generateAntibiogram(data.astResults || [], org, spec);

    if (rows.length === 0) {
      window.Toast.info('Không có dữ liệu để xuất file!');
      return;
    }

    const excelRows = rows.map(r => ({
      'Mã kháng sinh': r.code,
      'Tên kháng sinh': r.name,
      'Số lượng Nhạy (S)': r.sCount,
      'Tỷ lệ Nhạy (%S)': r.sRate,
      'Số lượng Trung gian (I)': r.iCount,
      'Tỷ lệ Trung gian (%I)': r.iRate,
      'Số lượng Kháng (R)': r.rCount,
      'Tỷ lệ Kháng (%R)': r.rRate,
      'Tổng số mẫu thử': r.total
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Antibiogram');

    XLSX.writeFile(wb, `Antibiogram_${org}_${spec}_2026.xlsx`);
    window.Toast.success('Đã xuất file Antibiogram Excel thành công!');
  }
};

if (typeof window !== 'undefined') {
  window.AntibiogramView = AntibiogramView;
}
