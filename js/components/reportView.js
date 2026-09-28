/**
 * REPORT VIEW COMPONENT - BAO-CAO-KHANG-THUOC
 * Trình diễn Báo cáo Giám sát Kháng sinh đồ 9 phần chuẩn bệnh viện (Mục XXX & XXXI)
 */

const ReportView = {
  currentReportData: null,

  init() {
    this.bindEvents();
    window.addEventListener('tabChanged', (e) => {
      if (e.detail.tab === 'reports') {
        this.renderFullReport();
      }
    });
  },

  bindEvents() {
    const btnGen = document.getElementById('btn-generate-report');
    if (btnGen) {
      btnGen.addEventListener('click', () => this.renderFullReport());
    }

    const btnPrint = document.getElementById('btn-print-full-report');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => window.print());
    }

    const btnExcel = document.getElementById('btn-export-full-excel');
    if (btnExcel) {
      btnExcel.addEventListener('click', () => {
        if (this.currentReportData) {
          window.ReportExportService.exportExcelReportBundle(this.currentReportData);
        }
      });
    }
  },

  renderFullReport() {
    const filters = {
      time: document.getElementById('report-filter-time')?.value || '2026',
      organism: document.getElementById('report-filter-organism')?.value || 'ALL',
      specimenType: document.getElementById('report-filter-specimen')?.value || 'ALL'
    };

    const rep = window.ReportExportService.generateFullReportData(filters);
    this.currentReportData = rep;

    // Header metadata
    document.getElementById('rep-hospital-name').textContent = rep.metadata.hospitalName;
    document.getElementById('rep-department-name').textContent = rep.metadata.departmentName;
    document.getElementById('rep-timestamp').textContent = rep.metadata.createdAt;
    document.getElementById('rep-author').textContent = rep.metadata.author;
    document.getElementById('rep-filter-display').textContent = `Thời gian: ${rep.metadata.filtersApplied.period} | Vi khuẩn: ${rep.metadata.filtersApplied.organism} | Bệnh phẩm: ${rep.metadata.filtersApplied.specimen}`;

    // 1. Chỉ số tổng quan
    document.getElementById('rep-sum-total').textContent = rep.summary.totalRecords.toLocaleString();
    document.getElementById('rep-sum-s').textContent = `${rep.summary.sRate}% (${rep.summary.sCount})`;
    document.getElementById('rep-sum-i').textContent = `${rep.summary.iRate}% (${rep.summary.iCount})`;
    document.getElementById('rep-sum-r').textContent = `${rep.summary.rRate}% (${rep.summary.rCount})`;
    document.getElementById('rep-sum-mdr').textContent = `${rep.mdrStats.mdrRate}% (${rep.mdrStats.mdrCount} chủng)`;

    // 2. Bảng Phân bố vi khuẩn
    const orgTbody = document.getElementById('table-rep-org-body');
    if (orgTbody) {
      orgTbody.innerHTML = '';
      rep.orgDistribution.forEach((o, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="text-align: center;">${i + 1}</td>
          <td><strong>${o.name}</strong></td>
          <td style="text-align: center;">${o.count}</td>
          <td style="text-align: center; font-weight: 700;">${o.percent}%</td>
        `;
        orgTbody.appendChild(tr);
      });
    }

    // 3. Bảng Antibiogram
    const abgTbody = document.getElementById('table-rep-abg-body');
    if (abgTbody) {
      abgTbody.innerHTML = '';
      rep.antibiogram.forEach((a, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="text-align: center;">${i + 1}</td>
          <td><strong>${a.code}</strong></td>
          <td>${a.name}</td>
          <td style="text-align: center; color: var(--color-s); font-weight: 700;">${a.sRate}%</td>
          <td style="text-align: center; color: var(--color-i); font-weight: 700;">${a.iRate}%</td>
          <td style="text-align: center; color: var(--color-r); font-weight: 700;">${a.rRate}%</td>
          <td style="text-align: center; font-weight: 700;">${a.total}</td>
        `;
        abgTbody.appendChild(tr);
      });
    }

    // 4. So sánh các năm
    const yearTbody = document.getElementById('table-rep-years-body');
    if (yearTbody) {
      yearTbody.innerHTML = '';
      rep.yearComparison.forEach(y => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>Năm ${y.year}</strong></td>
          <td style="text-align: center;">${y.total}</td>
          <td style="text-align: center; color: var(--color-r); font-weight: 700;">${y.rRate}%</td>
          <td style="text-align: center; color: var(--color-i); font-weight: 700;">${y.iRate}%</td>
          <td style="text-align: center; color: var(--color-s); font-weight: 700;">${y.sRate}%</td>
        `;
        yearTbody.appendChild(tr);
      });
    }
  }
};

if (typeof window !== 'undefined') {
  window.ReportView = ReportView;
}
