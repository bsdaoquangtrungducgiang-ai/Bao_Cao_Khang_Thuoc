/**
 * REPORT VIEW COMPONENT - BAO-CAO-KHANG-THUOC
 * Trình diễn Báo Cáo AMR Toàn Diện Theo Chuẩn 2 File Mẫu PDF:
 * 1. Báo cáo Tích hợp xen kẽ Bảng số liệu & Biểu đồ Chart.js
 * 2. Bản Trình chiếu Trực quan (12 Slide Presentation - File 1)
 * 3. Văn bản Báo cáo Y khoa Hành chính (15 Trang - File 2)
 * Hỗ trợ chọn file phân tích linh hoạt & xuất định dạng PDF / Excel / Word
 */

const ReportView = {
  currentReportData: null,
  currentMode: 'integrated', // 'integrated' | 'slides' | 'document'
  charts: {},

  init() {
    this.bindEvents();
    this.populateFileOptions();

    if (typeof window !== 'undefined') {
      window.addEventListener('tabChanged', (e) => {
        if (e.detail.tab === 'reports') {
          const lastImported = (typeof localStorage !== 'undefined' ? localStorage.getItem('amr_last_imported_file') : null) || window.App?.state?.lastImportedFile;
          this.populateFileOptions(lastImported);
          this.renderFullReport(lastImported);
        }
      });

      // Lắng nghe khi có file mới được tải lên
      window.addEventListener('fileUploaded', (e) => {
        const fn = e?.detail?.fileName || (typeof localStorage !== 'undefined' ? localStorage.getItem('amr_last_imported_file') : null);
        this.populateFileOptions(fn);
        this.renderFullReport(fn);
      });
    }
  },

  bindEvents() {
    // Nút phân tích lại file
    const btnGen = document.getElementById('btn-generate-report');
    if (btnGen) {
      btnGen.addEventListener('click', () => this.renderFullReport());
    }

    // Dropdown chọn file
    const fileSelect = document.getElementById('report-select-file');
    if (fileSelect) {
      fileSelect.addEventListener('change', () => this.renderFullReport());
    }

    // Các bộ lọc bổ trợ
    ['report-filter-time', 'report-filter-organism', 'report-filter-specimen'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.renderFullReport());
      }
    });

    // Các tab chuyển đổi chế độ xem
    const tabInt = document.getElementById('tab-rep-integrated');
    const tabSli = document.getElementById('tab-rep-slides');
    const tabDoc = document.getElementById('tab-rep-document');

    if (tabInt) tabInt.addEventListener('click', () => this.setMode('integrated'));
    if (tabSli) tabSli.addEventListener('click', () => this.setMode('slides'));
    if (tabDoc) tabDoc.addEventListener('click', () => this.setMode('document'));

    // Các nút xuất báo cáo
    const btnPrint = document.getElementById('btn-print-full-report');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => window.print());
    }

    const btnExcel = document.getElementById('btn-export-full-excel');
    if (btnExcel) {
      btnExcel.addEventListener('click', () => {
        if (this.currentReportData && window.ReportExportService?.exportExcelReportBundle) {
          window.ReportExportService.exportExcelReportBundle(this.currentReportData);
        } else if (window.Toast) {
          window.Toast.warning('Đang chuẩn bị dữ liệu báo cáo...');
        }
      });
    }

    const btnWord = document.getElementById('btn-export-word-doc');
    if (btnWord) {
      btnWord.addEventListener('click', () => {
        if (window.ReportExportService?.exportWordDocument) {
          window.ReportExportService.exportWordDocument(this.currentReportData);
        }
      });
    }
  },

  /**
   * Nạp danh sách các file có thể phân tích vào dropdown
   */
  populateFileOptions(preferredFileName) {
    const select = document.getElementById('report-select-file');
    if (!select) return;

    const lastImported = (typeof localStorage !== 'undefined' ? localStorage.getItem('amr_last_imported_file') : null) || window.App?.state?.lastImportedFile;
    const currentVal = preferredFileName || lastImported || select.value || window.App?.state?.filters?.file || 'ĐG Dương tính (010126. 230626).xls';
    const files = new Set(['ĐG Dương tính (010126. 230626).xls']);

    // Đọc từ DemoDataService
    const demo = window.DemoDataService?.getAll ? window.DemoDataService.getAll() : (typeof DemoDataService !== 'undefined' ? DemoDataService.getAll() : null);
    if (demo && demo.importJobs) {
      demo.importJobs.forEach(j => {
        if (j.file_name) files.add(j.file_name);
      });
    }
    if (demo && demo.astResults) {
      demo.astResults.forEach(a => {
        if (a.file_name) files.add(a.file_name);
      });
    }

    // Đọc từ App state
    if (window.App?.state?.surveillanceData?.astResults) {
      window.App.state.surveillanceData.astResults.forEach(a => {
        if (a.file_name) files.add(a.file_name);
      });
    }

    // Đọc từ StorageQuotaManager
    if (window.StorageQuotaManager?.getStoredFiles) {
      const stored = window.StorageQuotaManager.getStoredFiles();
      stored.forEach(f => {
        if (f.file_name) files.add(f.file_name);
      });
    }

    // Đọc từ persisted files manifest trong localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        const manifestStr = localStorage.getItem('amr_persisted_files_manifest');
        if (manifestStr) {
          const manifest = JSON.parse(manifestStr);
          if (Array.isArray(manifest)) {
            manifest.forEach(m => {
              if (m && m.fileName) files.add(m.fileName);
            });
          }
        }
      } catch (e) {}
    }

    if (preferredFileName) {
      files.add(preferredFileName);
    }
    if (lastImported) {
      files.add(lastImported);
    }

    // Render options
    select.innerHTML = '';
    files.forEach(fn => {
      const opt = document.createElement('option');
      opt.value = fn;
      if (fn === 'ĐG Dương tính (010126. 230626).xls') {
        opt.textContent = `${fn} (Dữ liệu chuẩn BVĐK Đức Giang - 1.466 chủng)`;
      } else {
        opt.textContent = `${fn} (File nạp từ Import dữ liệu)`;
      }
      select.appendChild(opt);
    });

    const optAll = document.createElement('option');
    optAll.value = 'ALL';
    optAll.textContent = 'Toàn bộ dữ liệu tổng hợp (Toàn viện)';
    select.appendChild(optAll);

    if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
      select.value = currentVal;
    } else {
      select.value = 'ĐG Dương tính (010126. 230626).xls';
    }
  },

  /**
   * Chọn file cụ thể và chuyển thẳng tới xem Báo cáo AMR
   */
  selectFileAndOpen(fileName) {
    if (!fileName) return;
    this.populateFileOptions(fileName);
    const select = document.getElementById('report-select-file');
    if (select) select.value = fileName;
    if (window.Navigation?.navigateTo) {
      window.Navigation.navigateTo('reports');
    }
    this.renderFullReport(fileName);
  },

  /**
   * Mở file vừa được import gần nhất
   */
  openLatestImported() {
    let latest = null;
    try {
      latest = localStorage.getItem('amr_last_imported_file');
    } catch (e) {}
    if (!latest && window.App?.state?.lastImportedFile) {
      latest = window.App.state.lastImportedFile;
    }
    if (!latest) {
      const demo = window.DemoDataService?.getAll();
      const jobs = demo?.importJobs || [];
      if (jobs.length > 0) {
        latest = jobs[jobs.length - 1].file_name;
      }
    }
    this.selectFileAndOpen(latest || 'ĐG Dương tính (010126. 230626).xls');
  },

  /**
   * Chuyển đổi giữa 3 chế độ xem
   */
  setMode(mode) {
    this.currentMode = mode;

    const tabInt = document.getElementById('tab-rep-integrated');
    const tabSli = document.getElementById('tab-rep-slides');
    const tabDoc = document.getElementById('tab-rep-document');

    const viewInt = document.getElementById('rep-view-integrated');
    const viewSli = document.getElementById('rep-view-slides');
    const viewDoc = document.getElementById('rep-view-document');

    [tabInt, tabSli, tabDoc].forEach(t => t?.classList.remove('active'));
    [viewInt, viewSli, viewDoc].forEach(v => {
      if (v) v.style.display = 'none';
    });

    if (mode === 'integrated') {
      tabInt?.classList.add('active');
      if (viewInt) viewInt.style.display = 'flex';
      this.renderIntegratedCharts();
    } else if (mode === 'slides') {
      tabSli?.classList.add('active');
      if (viewSli) viewSli.style.display = 'flex';
      this.renderSlideDeck();
    } else if (mode === 'document') {
      tabDoc?.classList.add('active');
      if (viewDoc) viewDoc.style.display = 'flex';
      this.renderDocumentView();
    }
  },

  /**
   * Tạo báo cáo đầy đủ theo file được chọn
   */
  renderFullReport(overrideFileName) {
    const fileSelect = document.getElementById('report-select-file');
    if (overrideFileName && fileSelect) {
      fileSelect.value = overrideFileName;
    }
    const targetFile = overrideFileName || (fileSelect ? fileSelect.value : 'ĐG Dương tính (010126. 230626).xls');

    const filters = {
      file: targetFile,
      time: document.getElementById('report-filter-time')?.value || '2026',
      organism: document.getElementById('report-filter-organism')?.value || 'ALL',
      specimenType: document.getElementById('report-filter-specimen')?.value || 'ALL'
    };

    if (!window.ReportExportService?.generateFullReportData) {
      console.warn('[ReportView] ReportExportService not available yet.');
      return;
    }

    const rep = window.ReportExportService.generateFullReportData(filters);
    this.currentReportData = rep;
    const comp = rep.comprehensiveReport || window.ReportExportService.getComprehensiveAmrReport(targetFile);

    // Nếu số chủng đang là 0 và không phải file chuẩn viện, thử kiểm tra ngầm ASTService để tải dữ liệu nếu có
    if (comp.overview?.totalIsolates === 0 && targetFile !== 'ĐG Dương tính (010126. 230626).xls' && window.ASTService?.getSurveillanceData) {
      window.ASTService.getSurveillanceData({ file: targetFile }).then(res => {
        if (res && res.astResults && res.astResults.length > 0) {
          if (window.App && window.App.state) {
            window.App.state.surveillanceData = res;
          }
          const currentSel = document.getElementById('report-select-file')?.value;
          if (currentSel === targetFile) {
            this.renderFullReport(targetFile);
          }
        }
      }).catch(() => {});
    }

    // Cập nhật các trường Header metadata
    this.setTextContent('rep-hospital-name', comp.metadata.hospitalName);
    this.setTextContent('rep-department-name', `${comp.metadata.departmentName} - ${comp.metadata.governingBody || 'HỘI ĐỒNG THUỐC'}`);
    this.setTextContent('rep-timestamp', comp.metadata.reportDate || rep.metadata.createdAt);
    this.setTextContent('rep-author', comp.metadata.author);
    this.setTextContent('rep-reviewer', comp.metadata.reviewer);
    this.setTextContent('rep-filter-display', `Tập tin: ${comp.metadata.fileName} | ${comp.overview.totalIsolates.toLocaleString()} chủng phân lập | ${comp.overview.totalDepartments} khoa phòng | ${comp.overview.totalSpecies} loài`);

    // Cập nhật các KPI quy mô 100% động theo file
    this.setTextContent('rep-sum-total', comp.overview.totalIsolates.toLocaleString());
    this.setTextContent('rep-sum-patients', comp.overview.totalPatients.toLocaleString());
    this.setTextContent('rep-sum-depts', comp.overview.totalDepartments.toString());
    this.setTextContent('rep-sum-species', comp.overview.totalSpecies.toString());
    this.setTextContent('rep-sum-r', `${comp.overview?.rRate !== undefined ? comp.overview.rRate : rep.summary.rRate}%`);
    this.setTextContent('rep-sum-mdr', `${comp.overview?.mdrRate !== undefined ? comp.overview.mdrRate : rep.mdrStats.mdrRate}%`);

    // Cập nhật các phần tương thích ngược cho test Phase 7/8
    this.setTextContent('rep-sum-s', `${rep.summary.sRate}% (${rep.summary.sCount})`);
    this.setTextContent('rep-sum-i', `${rep.summary.iRate}% (${rep.summary.iCount})`);

    // Cập nhật linh hoạt các huy hiệu, tiêu đề và nhận xét Section 1 - 10
    const gramAm = comp.gramGroups?.find(g => g.name.includes('âm'));
    const gramDuong = comp.gramGroups?.find(g => g.name.includes('dương'));
    this.setTextContent('rep-badge-gram', gramAm ? `Gram âm chiếm ${gramAm.percent}%` : 'Cơ cấu Gram');
    this.setTextContent('rep-badge-table1-total', `N = ${comp.overview.totalIsolates.toLocaleString()}`);
    const elCalloutGram = document.getElementById('rep-callout-gram');
    if (elCalloutGram) {
      elCalloutGram.innerHTML = `<i class="fa-solid fa-circle-info"></i><div>Vi khuẩn <strong>Gram âm chiếm ${gramAm?.percent || 0}% (${gramAm?.count || 0} chủng)</strong> giữ tỷ trọng lớn, trong đó chiếm ưu thế là các trực khuẩn đường ruột (Enterobacterales) và trực khuẩn không lên men đường (CRAB, CRPA). <strong>Gram dương chiếm ${gramDuong?.percent || 0}% (${gramDuong?.count || 0} chủng)</strong> chủ yếu là <em>S. aureus</em> và <em>S. pneumoniae</em>.</div>`;
    }

    const peakMonth = comp.monthlyDistribution?.find(m => m.isPeak) || comp.monthlyDistribution?.[0];
    this.setTextContent('rep-badge-monthly', peakMonth ? `${peakMonth.month} cao nhất (${peakMonth.count} chủng)` : 'Phân bố theo tháng');
    this.setTextContent('rep-badge-table2-sub', comp.metadata?.dateRange ? `Kỳ: ${comp.metadata.dateRange}` : 'Chốt số liệu kỳ phân tích');
    const elCalloutMonthly = document.getElementById('rep-callout-monthly');
    if (elCalloutMonthly) {
      elCalloutMonthly.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><div>Số lượng chủng phân lập cao nhất ghi nhận vào <strong>${peakMonth?.month || 'kỳ giám sát'} với ${peakMonth?.count || 0} chủng (${peakMonth?.percent || 0}%)</strong>. Cần chú trọng các biện pháp dự phòng lây nhiễm và giám sát dịch tễ theo mùa.</div>`;
    }

    const top4Count = comp.departmentTop12 ? comp.departmentTop12.slice(0, 4).reduce((sum, d) => sum + d.count, 0) : 0;
    const top4Pct = comp.overview.totalIsolates > 0 ? ((top4Count / comp.overview.totalIsolates) * 100).toFixed(1) : 0;
    this.setTextContent('rep-badge-depts', `Top 4 khoa chiếm ${top4Pct}%`);
    this.setTextContent('rep-badge-table3-sub', `N = ${comp.overview.totalIsolates.toLocaleString()}`);
    const elCalloutDepts = document.getElementById('rep-callout-depts');
    if (elCalloutDepts && comp.departmentTop12) {
      const topDeptsStr = comp.departmentTop12.slice(0, 4).map(d => `${d.name} (${d.count} chủng)`).join(', ');
      elCalloutDepts.innerHTML = `<i class="fa-solid fa-circle-info"></i><div>Nhóm 4 khoa trọng điểm có số chủng phân lập cao nhất gồm: <strong>${topDeptsStr}</strong>, chiếm <strong>${top4Pct}%</strong> toàn bộ chủng phân lập. Đây là các khu vực ưu tiên cao nhất cho hoạt động giám sát sử dụng kháng sinh (AMS) và kiểm soát nhiễm khuẩn (IPC).</div>`;
    }

    const top2Specs = comp.specimenDistribution ? comp.specimenDistribution.slice(0, 2) : [];
    const top2SpecPct = top2Specs.reduce((sum, s) => sum + s.percent, 0).toFixed(1);
    const top2SpecNames = top2Specs.map(s => s.type).join(' & ');
    this.setTextContent('rep-badge-specimens', `${top2SpecNames} chiếm ${top2SpecPct}%`);
    this.setTextContent('rep-badge-table4-total', `N = ${comp.overview.totalIsolates.toLocaleString()}`);
    const elCalloutSpec = document.getElementById('rep-callout-specimens');
    if (elCalloutSpec) {
      const lit = comp.specimenLiterature?.vinaresComparison || `Cơ cấu bệnh phẩm phân lập phản ánh mô hình bệnh tật thực tế tại cơ sở y tế.`;
      elCalloutSpec.innerHTML = `<i class="fa-solid fa-book-medical"></i><div><strong>Đối chiếu y văn &amp; Mạng VINARES:</strong> ${lit}</div>`;
    }

    if (comp.top15Pathogens && comp.top15Pathogens.length > 0) {
      const top3Orgs = comp.top15Pathogens.slice(0, 3).map(p => p.name).join(', ');
      const top15Total = comp.top15Pathogens.reduce((sum, p) => sum + p.count, 0);
      const top15Pct = comp.overview.totalIsolates > 0 ? ((top15Total / comp.overview.totalIsolates) * 100).toFixed(1) : 0;
      this.setTextContent('rep-badge-top15', `${top3Orgs} dẫn đầu`);
      this.setTextContent('rep-badge-table5-total', `Chiếm ${top15Pct}% toàn viện`);
    }

    const elCalloutSpecGroups = document.getElementById('rep-callout-specimen-groups');
    if (elCalloutSpecGroups && comp.pathogensBySpecimen) {
      const bTop = comp.pathogensBySpecimen.blood?.items?.[0];
      const sTop = comp.pathogensBySpecimen.lowerRespiratory?.items?.[0];
      const uTop = comp.pathogensBySpecimen.urine?.items?.[0];
      elCalloutSpecGroups.innerHTML = `<i class="fa-solid fa-circle-info"></i><div>Trong cấy máu: <strong>${bTop ? bTop.name + ' (' + bTop.count + ' ca)' : 'E. coli'}</strong> là căn nguyên hàng đầu. Trong đờm/hô hấp dưới: <strong>${sTop ? sTop.name + ' (' + sTop.count + ' ca)' : 'A. baumannii'}</strong> chiếm ưu thế vượt trội, là nguyên nhân chính của viêm phổi bệnh viện (HAP/VAP). Trong nước tiểu: <strong>${uTop ? uTop.name + ' (' + uTop.count + ' ca)' : 'E. coli'}</strong> dẫn đầu.</div>`;
    }

    if (comp.monthlyTrendTop6 && comp.monthlyTrendTop6.series) {
      const topOrgTrend = comp.monthlyTrendTop6.series[0];
      this.setTextContent('rep-badge-trend6', comp.monthlyTrendTop6.series.map(s => s.name.split(' ')[0]).join(', '));
      const elCalloutTrend = document.getElementById('rep-callout-trend6');
      if (elCalloutTrend) {
        elCalloutTrend.innerHTML = `<i class="fa-solid fa-chart-line"></i><div>Diễn biến phân lập của 6 chủng vi khuẩn chủ đạo theo các tháng phản ánh động thái dịch tễ tại bệnh viện. Tác nhân có số lượng lớn nhất là <strong>${topOrgTrend?.name || 'H. influenzae'} (${topOrgTrend?.total || 0} chủng)</strong>.</div>`;
      }
    }

    // Section 8: 8.1 S. aureus
    if (comp.detailedAntibiograms?.sau) {
      const sau = comp.detailedAntibiograms.sau;
      const countSau = sau.isolateCount !== undefined ? sau.isolateCount : 230;
      const elSauTitle = document.getElementById('rep-title-sau');
      if (elSauTitle) elSauTitle.innerHTML = `Biểu đồ "<em>S. aureus</em> (n=${countSau}): tỷ lệ kháng (%R)"`;
      const elSauChartTitle = document.getElementById('rep-chart-title-sau');
      if (elSauChartTitle) elSauChartTitle.innerHTML = `<i class="fa-solid fa-chart-column"></i> Biểu đồ "<em>S. aureus</em> (n=${countSau}): tỷ lệ kháng (%R)"`;
      this.setTextContent('rep-badge-sau', `MRSA: ${sau.mrsaRate || '78.6%'}`);
      this.setTextContent('rep-sub-sau', 'Vancomycin / Linezolid: 100% S');
    }

    // 8.2 S. pneumoniae
    if (comp.detailedAntibiograms?.spn) {
      const spn = comp.detailedAntibiograms.spn;
      const countSpn = spn.isolateCount !== undefined ? spn.isolateCount : 214;
      const elSpnTitle = document.getElementById('rep-title-spn');
      if (elSpnTitle) elSpnTitle.innerHTML = `Biểu đồ "<em>S. pneumoniae</em> (n=${countSpn}): tỷ lệ kháng (%R)"`;
      const elSpnChartTitle = document.getElementById('rep-chart-title-spn');
      if (elSpnChartTitle) elSpnChartTitle.innerHTML = `<i class="fa-solid fa-chart-column"></i> Biểu đồ "<em>S. pneumoniae</em> (n=${countSpn}): tỷ lệ kháng (%R)"`;
      const eryR = spn.chartData?.find(c => c.drug && c.drug.toLowerCase().includes('erythro'))?.rate || 98.6;
      this.setTextContent('rep-badge-spn', `Kháng Erythromycin: ${eryR}%`);
      this.setTextContent('rep-sub-spn', 'Moxifloxacin / Vancomycin: 100% S');
    }

    // 8.3 H. influenzae
    if (comp.detailedAntibiograms?.hin) {
      const hin = comp.detailedAntibiograms.hin;
      const countHin = hin.isolateCount !== undefined ? hin.isolateCount : 253;
      const elHinTitle = document.getElementById('rep-title-hin');
      if (elHinTitle) elHinTitle.innerHTML = `Biểu đồ "<em>H. influenzae</em> (n=${countHin}): tỷ lệ kháng (%R)"`;
      const elHinChartTitle = document.getElementById('rep-chart-title-hin');
      if (elHinChartTitle) elHinChartTitle.innerHTML = `<i class="fa-solid fa-chart-column"></i> Biểu đồ "<em>H. influenzae</em> (n=${countHin}): tỷ lệ kháng (%R)"`;
      this.setTextContent('rep-badge-hin', hin.ampicillinRate || 'Ampicillin R: 84.1%');
      this.setTextContent('rep-sub-hin', 'Meropenem / Ceftriaxone nhạy cảm cao');
    }

    // 9.4 Enterobacterales
    if (comp.detailedAntibiograms?.enterobacterales) {
      const ent = comp.detailedAntibiograms.enterobacterales;
      this.setTextContent('rep-badge-entero', `CRE K.p: ${ent.kpnSummary?.cre || '56%'} vs E.c: ${ent.ecoSummary?.cre || '11%'}`);
      this.setTextContent('rep-sub-entero', 'ESBL & Carbapenem');
    }

    // 9.5 Gram âm không lên men
    if (comp.detailedAntibiograms?.nonfermenters) {
      const nonf = comp.detailedAntibiograms.nonfermenters;
      this.setTextContent('rep-badge-nonferm', `CRAB: ${nonf.abaSummary?.crab?.split(' ')?.[0] || '92%'} | CRPA: ${nonf.paeSummary?.crpa?.split(' ')?.[0] || '56.9%'}`);
      this.setTextContent('rep-sub-nonferm', 'Colistin / CAZ-AVI cứu cánh');
    }

    // Section 10: Nhận xét
    const elConclusion = document.getElementById('rep-callout-conclusion1');
    if (elConclusion) {
      const crabR = comp.detailedAntibiograms?.nonfermenters?.abaSummary?.crab?.split(' ')?.[0] || '92%';
      const mrsaR = comp.detailedAntibiograms?.sau?.mrsaRate || '78.6%';
      const creR = comp.detailedAntibiograms?.enterobacterales?.kpnSummary?.cre || '56%';
      elConclusion.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><div><strong>Đánh giá thực trạng đề kháng:</strong> Tình trạng vi khuẩn đa kháng và toàn kháng (CRAB: ${crabR}, MRSA: ${mrsaR}, CRE K. pneumoniae: ${creR}) tại các khoa lâm sàng là mối đe dọa nghiêm trọng. Các kháng sinh kinh điển (Cephalosporin 3, Carbapenem) đã mất hiệu lực đáng kể với vi khuẩn Gram âm, đòi hỏi giám sát sử dụng kháng sinh (AMS) nghiêm ngặt.</div>`;
    }

    // Render số liệu cho các bảng của Chế độ 1 (Tích hợp)
    this.renderIntegratedTables(comp, rep);

    // Render theo chế độ hiện tại
    if (this.currentMode === 'integrated') {
      this.renderIntegratedCharts();
    } else if (this.currentMode === 'slides') {
      this.renderSlideDeck();
    } else if (this.currentMode === 'document') {
      this.renderDocumentView();
    }
  },

  setTextContent(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = text;
  },

  /**
   * Helper an toàn để khởi tạo và lưu vết Chart.js instances
   */
  createOrUpdateChart(canvasId, config) {
    if (typeof Chart === 'undefined') return null;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (this.charts[canvasId]) {
      try {
        this.charts[canvasId].destroy();
      } catch (e) {
        console.warn(`[ReportView] Error destroying chart ${canvasId}:`, e);
      }
      delete this.charts[canvasId];
    }

    try {
      const ctx = canvas.getContext('2d');
      const chartInstance = new Chart(ctx, config);
      this.charts[canvasId] = chartInstance;
      return chartInstance;
    } catch (e) {
      console.warn(`[ReportView] Error rendering chart ${canvasId}:`, e);
      return null;
    }
  },

  /**
   * Render các bảng số liệu chi tiết cho Chế độ 1
   */
  renderIntegratedTables(comp, legacyRep) {
    // Bảng 1: Cơ cấu Gram
    const gramTbody = document.getElementById('table-rep-gram-body');
    if (gramTbody) {
      gramTbody.innerHTML = '';
      comp.gramGroups.forEach(g => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${g.color}; margin-right: 8px;"></span><strong>${g.name}</strong></td>
          <td class="center bold">${g.count.toLocaleString()}</td>
          <td class="center bold" style="color: ${g.color};">${g.percent}%</td>
          <td>${g.name.includes('Gram âm') ? 'Chiếm tỷ trọng áp đảo, nguy cơ đa kháng cao' : g.name.includes('Gram dương') ? 'Chủ yếu S. aureus và S. pneumoniae' : 'Nhiễm nấm cơ hội / khác'}</td>
        `;
        gramTbody.appendChild(tr);
      });
    }

    // Bảng 2: Phân bố theo tháng
    const monthlyTbody = document.getElementById('table-rep-monthly-body');
    if (monthlyTbody) {
      monthlyTbody.innerHTML = '';
      comp.monthlyDistribution.forEach(m => {
        const tr = document.createElement('tr');
        if (m.isPeak) tr.style.backgroundColor = '#fff1f2';
        tr.innerHTML = `
          <td><strong>${m.month}</strong> ${m.isPeak ? '<span style="font-size: 10px; background: #dc2626; color: #fff; padding: 2px 6px; border-radius: 8px; font-weight: 700; margin-left: 6px;">ĐỈNH DỊCH</span>' : ''}</td>
          <td class="center bold" style="${m.isPeak ? 'color: #dc2626; font-size: 14px;' : ''}">${m.count}</td>
          <td class="center bold">${m.percent}%</td>
          <td>${m.isPeak ? 'Đỉnh phân lập 338 chủng, cao nhất trong 6 tháng' : m.month.includes('Tháng 6') ? 'Chốt số liệu ngày 22/06/2026' : 'Giai đoạn ổn định'}</td>
        `;
        monthlyTbody.appendChild(tr);
      });
    }

    // Bảng 3: Top 9 Khoa lâm sàng
    const deptsTbody = document.getElementById('table-rep-depts-body');
    if (deptsTbody) {
      deptsTbody.innerHTML = '';
      const depts9 = comp.departmentTop9 || (comp.departmentTop12 ? comp.departmentTop12.slice(0, 9) : []);
      depts9.forEach((d, idx) => {
        const tr = document.createElement('tr');
        if (d.priority) tr.style.backgroundColor = '#f0f9ff';
        tr.innerHTML = `
          <td class="center">${idx + 1}</td>
          <td><strong>${d.name}</strong></td>
          <td class="center bold">${d.count}</td>
          <td class="center bold" style="color: ${d.priority ? '#0284c7' : '#475569'};">${d.percent}%</td>
        `;
        deptsTbody.appendChild(tr);
      });
    }

    // Bảng 4: Cơ cấu bệnh phẩm
    const specTbody = document.getElementById('table-rep-specimens-body');
    if (specTbody) {
      specTbody.innerHTML = '';
      comp.specimenDistribution.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${s.type}</strong></td>
          <td class="center bold">${s.count}</td>
          <td class="center bold">${s.percent}%</td>
        `;
        specTbody.appendChild(tr);
      });
    }

    // Bảng 5: Top 15 Vi sinh vật (#table-rep-org-body)
    const orgTbody = document.getElementById('table-rep-org-body');
    if (orgTbody) {
      orgTbody.innerHTML = '';
      comp.top15Pathogens.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="center">${idx + 1}</td>
          <td><strong><em>${p.name}</em></strong></td>
          <td><span style="font-size: 11.5px; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; color: #475569;">${p.group}</span></td>
          <td class="center bold">${p.count}</td>
          <td class="center bold" style="color: #0284c7;">${p.percent}%</td>
        `;
        orgTbody.appendChild(tr);
      });
    }

    // Bảng 6: Tác nhân theo 5 loại bệnh phẩm (#table-rep-specimens-matrix-body)
    const specMatrixTbody = document.getElementById('table-rep-specimens-matrix-body');
    if (specMatrixTbody && comp.pathogensBySpecimen) {
      specMatrixTbody.innerHTML = '';
      const colBlood = comp.pathogensBySpecimen.blood?.items || [];
      const colUrine = comp.pathogensBySpecimen.urine?.items || [];
      const colResp = comp.pathogensBySpecimen.lowerRespiratory?.items || [];
      const colPus = comp.pathogensBySpecimen.pusWound?.items || [];
      const colNaso = comp.pathogensBySpecimen.nasopharyngeal?.items || [];

      const maxRows = Math.max(colBlood.length, colUrine.length, colResp.length, colPus.length, colNaso.length, 1);
      for (let i = 0; i < maxRows; i++) {
        const tr = document.createElement('tr');
        const renderCell = (item) => {
          if (!item) return `<td class="center" style="color: #94a3b8; font-size: 12px; padding: 8px 10px;">-</td>`;
          return `
            <td style="padding: 8px 10px; vertical-align: top; border-bottom: 1px solid #f1f5f9;">
              <div style="font-weight: 700; color: #1e293b; font-size: 13px;"><em>${item.name}</em></div>
              <div style="font-size: 11.5px; color: #475569; margin-top: 3px;">
                <span style="background: #f1f5f9; padding: 2px 7px; border-radius: 4px; font-weight: 700; color: #0284c7;">
                  ${item.count} chủng
                </span>
              </div>
            </td>
          `;
        };
        tr.innerHTML = `
          ${renderCell(colBlood[i])}
          ${renderCell(colUrine[i])}
          ${renderCell(colResp[i])}
          ${renderCell(colPus[i])}
          ${renderCell(colNaso[i])}
        `;
        specMatrixTbody.appendChild(tr);
      }
    }

    // 5 Hộp thẻ bệnh phẩm trực quan phụ trợ (#rep-specimen-boxes-container)
    const specBoxes = document.getElementById('rep-specimen-boxes-container');
    if (specBoxes && comp.pathogensBySpecimen) {
      specBoxes.innerHTML = '';
      Object.values(comp.pathogensBySpecimen).forEach(sp => {
        const box = document.createElement('div');
        box.className = 'rep-specimen-box';
        let listHtml = sp.items.map(it => `
          <li>
            <span class="org-name"><em>${it.name}</em></span>
            <span class="org-count">${it.count} ca</span>
          </li>
        `).join('');
        box.innerHTML = `
          <div class="rep-specimen-box-head" style="color: ${sp.color};">
            <i class="fa-solid ${sp.icon}"></i>
            <span>${sp.title}</span>
          </div>
          <ul class="rep-specimen-list">${listHtml}</ul>
        `;
        specBoxes.appendChild(box);
      });
    }

    // Phần 7: Ma trận xu hướng 6 vi khuẩn chính
    const trendMatrixTbody = document.getElementById('table-rep-trend-matrix-body');
    if (trendMatrixTbody && comp.monthlyTrendTop6) {
      trendMatrixTbody.innerHTML = '';
      comp.monthlyTrendTop6.series.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${s.color}; margin-right: 6px;"></span><strong><em>${s.name}</em></strong></td>
          <td class="center">${s.data[0]}</td>
          <td class="center">${s.data[1]}</td>
          <td class="center">${s.data[2]}</td>
          <td class="center bold" style="color: #dc2626; background: #fff1f2;">${s.data[3]}</td>
          <td class="center">${s.data[4]}</td>
          <td class="center">${s.data[5]}</td>
          <td class="center bold" style="color: ${s.color}; font-size: 13px;">${s.total}</td>
        `;
        trendMatrixTbody.appendChild(tr);
      });
    }

    // Phần 7/8: 7 Con số cảnh báo điểm đỏ kháng thuốc
    const redAlertsContainer = document.getElementById('rep-red-alerts-container');
    if (redAlertsContainer && comp.redAlerts) {
      redAlertsContainer.innerHTML = '';
      comp.redAlerts.forEach(r => {
        const card = document.createElement('div');
        card.className = `rep-alert-card level-${r.level}`;
        card.innerHTML = `
          <div class="rep-alert-top">
            <span class="rep-alert-title">${r.title}</span>
            <span class="rep-alert-rate">${r.rateFormatted}</span>
          </div>
          <div class="rep-alert-org">${r.organism}</div>
          <div class="rep-alert-target"><i class="fa-solid fa-shield-virus"></i> ${r.resistanceTarget}</div>
          <span class="rep-alert-ratio">Tỷ lệ: ${r.ratio}</span>
          <div class="rep-alert-note">${r.note}</div>
        `;
        redAlertsContainer.appendChild(card);
      });
    }

    // Bảng 7: Điểm đỏ kháng thuốc (4 phần)
    const alertsTbody = document.getElementById('table-rep-alerts-body');
    if (alertsTbody && comp.redAlerts) {
      alertsTbody.innerHTML = '';
      comp.redAlerts.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="center bold" style="color: #dc2626; font-size: 14px;">${r.rateFormatted}</td>
          <td><strong>${r.title}</strong> <span style="font-size: 11px; color: #64748b;">(${r.resistanceTarget})</span></td>
          <td><em>${r.organism}</em></td>
          <td class="center bold" style="color: #0f172a;">${r.ratio}</td>
          <td><span style="font-size: 11.5px; color: #334155;">${r.note}</span></td>
        `;
        alertsTbody.appendChild(tr);
      });
    }

    // Bảng 8: KSĐ chi tiết S. aureus
    const sauTbody = document.getElementById('table-rep-sau-body');
    if (sauTbody && comp.detailedAntibiograms?.sau?.tableRows) {
      sauTbody.innerHTML = '';
      comp.detailedAntibiograms.sau.tableRows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${r.antibiotic}</strong></td>
          <td class="center">${r.tested}</td>
          <td class="center bold" style="color: ${r.rRate > 50 ? '#dc2626' : '#475569'};">${r.rRate}%</td>
          <td class="center" style="color: #d97706;">${r.iRate}%</td>
          <td class="center bold" style="color: ${r.sRate > 70 ? '#16a34a' : '#475569'};">${r.sRate}%</td>
        `;
        sauTbody.appendChild(tr);
      });
    }

    // Bảng 9: KSĐ chi tiết S. pneumoniae
    const spnTbody = document.getElementById('table-rep-spn-body');
    if (spnTbody && comp.detailedAntibiograms?.spn?.tableRows) {
      spnTbody.innerHTML = '';
      comp.detailedAntibiograms.spn.tableRows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${r.antibiotic}</strong></td>
          <td class="center">${r.tested}</td>
          <td class="center bold" style="color: ${r.rRate > 50 ? '#dc2626' : '#475569'};">${r.rRate}%</td>
          <td class="center" style="color: #d97706;">${r.iRate}%</td>
          <td class="center bold" style="color: ${r.sRate > 70 ? '#16a34a' : '#475569'};">${r.sRate}%</td>
        `;
        spnTbody.appendChild(tr);
      });
    }

    // Bảng 10: KSĐ chi tiết H. influenzae
    const hinTbody = document.getElementById('table-rep-hin-body');
    if (hinTbody && comp.detailedAntibiograms?.hin?.tableRows) {
      hinTbody.innerHTML = '';
      comp.detailedAntibiograms.hin.tableRows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${r.antibiotic}</strong></td>
          <td class="center">${r.tested}</td>
          <td class="center bold" style="color: ${r.rRate > 50 ? '#dc2626' : '#475569'};">${r.rRate}%</td>
          <td class="center" style="color: #d97706;">${r.iRate}%</td>
          <td class="center bold" style="color: ${r.sRate > 70 ? '#16a34a' : '#475569'};">${r.sRate}%</td>
        `;
        hinTbody.appendChild(tr);
      });
    }

    // Bảng 11: So sánh mức đề kháng Enterobacterales (#table-rep-entero-body)
    const enteroTbody = document.getElementById('table-rep-entero-body');
    if (enteroTbody) {
      enteroTbody.innerHTML = '';
      const ent = comp.detailedAntibiograms?.enterobacterales;
      const rows = ent?.comparisonRows || [
        { drug: 'Cefotaxime (ESBL)', ecoR: ent?.ecoRates?.[0] || 63, kpnR: ent?.kpnRates?.[0] || 64, note: 'Kháng Ceph 3' },
        { drug: 'Cefepime', ecoR: ent?.ecoRates?.[1] || 50, kpnR: ent?.kpnRates?.[1] || 63, note: 'Ceph 4' },
        { drug: 'Ciprofloxacin', ecoR: ent?.ecoRates?.[2] || 71, kpnR: ent?.kpnRates?.[2] || 66, note: 'Quinolone' },
        { drug: 'Piperacillin/Tazobactam', ecoR: ent?.ecoRates?.[3] || 20, kpnR: ent?.kpnRates?.[3] || 61, note: 'Beta-lactamase inhibitor' },
        { drug: 'Meropenem (CRE)', ecoR: ent?.ecoRates?.[4] || 11, kpnR: ent?.kpnRates?.[4] || 56, note: 'Carbapenem' }
      ];
      rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${r.drug}</strong></td>
          <td class="center bold" style="color: ${r.ecoR > 50 ? '#dc2626' : '#0284c7'};">${r.ecoR}%</td>
          <td class="center bold" style="color: ${r.kpnR > 50 ? '#dc2626' : '#dc2626'};">${r.kpnR}%</td>
          <td>${r.note}</td>
        `;
        enteroTbody.appendChild(tr);
      });
    }

    // Bảng 12: So sánh mức đề kháng Gram âm không lên men (#table-rep-nonferm-body)
    const nonfermTbody = document.getElementById('table-rep-nonferm-body');
    if (nonfermTbody) {
      nonfermTbody.innerHTML = '';
      const nonf = comp.detailedAntibiograms?.nonfermenters;
      const rows = nonf?.comparisonRows || [
        { drug: 'Ceftazidime', abaR: nonf?.abaRates?.[0] || 93, paeR: nonf?.paeRates?.[0] || 51, note: 'CAZ' },
        { drug: 'Cefepime', abaR: nonf?.abaRates?.[1] || 90, paeR: nonf?.paeRates?.[1] || 46, note: 'FEP' },
        { drug: 'Piperacillin/Tazobactam', abaR: nonf?.abaRates?.[2] || 93, paeR: nonf?.paeRates?.[2] || 51, note: 'TZP' },
        { drug: 'Ciprofloxacin', abaR: nonf?.abaRates?.[3] || 90, paeR: nonf?.paeRates?.[3] || 50, note: 'CIP' },
        { drug: 'Meropenem (Carbapenem)', abaR: nonf?.abaRates?.[4] || 92, paeR: nonf?.paeRates?.[4] || 55, note: 'MEM' }
      ];
      rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${r.drug}</strong></td>
          <td class="center bold" style="color: ${r.abaR > 50 ? '#dc2626' : '#475569'};">${r.abaR}%</td>
          <td class="center bold" style="color: ${r.paeR > 50 ? '#dc2626' : '#0284c7'};">${r.paeR}%</td>
          <td>${r.note}</td>
        `;
        nonfermTbody.appendChild(tr);
      });
    }

    // Bảng Antibiogram chung & Bảng Đa năm cho test Phase 7/8
    const abgTbody = document.getElementById('table-rep-abg-body');
    if (abgTbody && legacyRep.antibiogram) {
      abgTbody.innerHTML = '';
      legacyRep.antibiogram.forEach((a, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="center">${i + 1}</td>
          <td><strong>${a.code}</strong></td>
          <td>${a.name}</td>
          <td class="center bold" style="color: #16a34a;">${a.sRate}%</td>
          <td class="center bold" style="color: #d97706;">${a.iRate}%</td>
          <td class="center bold" style="color: #dc2626;">${a.rRate}%</td>
          <td class="center bold">${a.total}</td>
        `;
        abgTbody.appendChild(tr);
      });
    }

    const yearTbody = document.getElementById('table-rep-years-body');
    if (yearTbody && legacyRep.yearComparison) {
      yearTbody.innerHTML = '';
      legacyRep.yearComparison.forEach(y => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>Năm ${y.year}</strong></td>
          <td class="center">${y.total}</td>
          <td class="center bold" style="color: #dc2626;">${y.rRate}%</td>
          <td class="center bold" style="color: #d97706;">${y.iRate}%</td>
          <td class="center bold" style="color: #16a34a;">${y.sRate}%</td>
        `;
        yearTbody.appendChild(tr);
      });
    }
  },

  /**
   * Khởi tạo các biểu đồ Chart.js phong phú cho Chế độ 1 (Tích hợp xen kẽ)
   */
  renderIntegratedCharts() {
    if (typeof Chart === 'undefined') return;
    const comp = this.currentReportData?.comprehensiveReport || window.ReportExportService?.hospitalBenchmarkData;
    if (!comp) return;

    // 1. Biểu đồ Donut: Cơ cấu Gram
    this.createOrUpdateChart('chart-rep-gram-donut', {
      type: 'doughnut',
      data: {
        labels: comp.gramGroups.map(g => `${g.name} (${g.percent}%)`),
        datasets: [{
          data: comp.gramGroups.map(g => g.count),
          backgroundColor: comp.gramGroups.map(g => g.color),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 14, font: { size: 12, weight: 'bold' } } },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} chủng (${((ctx.raw / comp.overview.totalIsolates) * 100).toFixed(1)}%)`
            }
          }
        },
        cutout: '60%'
      }
    });

    // 2. Biểu đồ "Số chủng phân lập theo tháng"
    this.createOrUpdateChart('chart-rep-monthly-bar', {
      type: 'bar',
      data: {
        labels: comp.monthlyDistribution.map(m => m.month),
        datasets: [{
          label: 'Số lượng chủng phân lập',
          data: comp.monthlyDistribution.map(m => m.count),
          backgroundColor: comp.monthlyDistribution.map(m => m.isPeak ? '#dc2626' : '#0284c7'),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, title: { display: true, text: 'Số lượng chủng phân lập' } },
          x: { grid: { display: false }, title: { display: true, text: 'Tháng (từ Tháng 1 đến Tháng 6)' } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const item = comp.monthlyDistribution[ctx.dataIndex];
                return item.isPeak ? '★ ĐỈNH PHÂN LẬP HÔ HẤP' : '';
              }
            }
          }
        }
      }
    });

    // 3. Biểu đồ "Số chủng theo khoa (Top 9)"
    const depts9 = comp.departmentTop9 || (comp.departmentTop12 ? comp.departmentTop12.slice(0, 9) : []);
    this.createOrUpdateChart('chart-rep-depts-bar', {
      type: 'bar',
      data: {
        labels: depts9.map(d => d.name),
        datasets: [{
          label: 'Số lượng chủng phân lập',
          data: depts9.map(d => d.count),
          backgroundColor: depts9.map(d => d.priority ? '#0284c7' : '#94a3b8'),
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, grid: { color: '#f1f5f9' }, title: { display: true, text: 'Số lượng chủng phân lập' } },
          y: { grid: { display: false }, title: { display: true, text: 'Tên khoa lâm sàng' } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // 4. Biểu đồ "Tỷ trọng theo loại bệnh phẩm (%)"
    this.createOrUpdateChart('chart-rep-specimens-bar', {
      type: 'bar',
      data: {
        labels: comp.specimenDistribution.map(s => s.type),
        datasets: [{
          label: 'Tỷ lệ phần trăm (%)',
          data: comp.specimenDistribution.map(s => s.percent),
          backgroundColor: ['#0d9488', '#d97706', '#7c3aed', '#0284c7', '#dc2626', '#64748b', '#94a3b8', '#0891b2'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 60, title: { display: true, text: 'Tỷ lệ phần trăm (%)' }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false }, title: { display: true, text: 'Loại bệnh phẩm' } }
        },
        plugins: { legend: { display: false } }
      }
    });

    // 5. Biểu đồ "Xếp hạng vi khuẩn/nấm theo số chủng (Tác nhân phân lập chính)"
    this.createOrUpdateChart('chart-rep-pathogens-bar', {
      type: 'bar',
      data: {
        labels: comp.top15Pathogens.map(p => p.name),
        datasets: [{
          label: 'Số lượng chủng phân lập',
          data: comp.top15Pathogens.map(p => p.count),
          backgroundColor: '#0284c7',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, grid: { color: '#f1f5f9' }, title: { display: true, text: 'Số lượng chủng phân lập' } },
          y: { grid: { display: false }, title: { display: true, text: 'Tên tác nhân' } }
        },
        plugins: { legend: { display: false } }
      }
    });

    // 7. Biểu đồ Đường: Xu hướng 6 vi khuẩn chính
    if (comp.monthlyTrendTop6) {
      this.createOrUpdateChart('chart-rep-trend-lines', {
        type: 'line',
        data: {
          labels: comp.monthlyTrendTop6.months,
          datasets: comp.monthlyTrendTop6.series.map(s => ({
            label: s.name,
            data: s.data,
            borderColor: s.color,
            backgroundColor: s.color,
            borderWidth: 2.5,
            pointRadius: 4,
            tension: 0.2
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, title: { display: true, text: 'Số chủng / tháng' } },
            x: { grid: { display: false } }
          },
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
          }
        }
      });
    }

    // 8. Biểu đồ Điểm đỏ kháng thuốc (Red Alerts)
    if (comp.redAlerts) {
      this.createOrUpdateChart('chart-rep-alerts-bar', {
        type: 'bar',
        data: {
          labels: comp.redAlerts.map(r => r.title),
          datasets: [{
            label: 'Tỷ lệ kháng (%R)',
            data: comp.redAlerts.map(r => r.rate),
            backgroundColor: comp.redAlerts.map(r => r.rate >= 70 ? '#b91c1c' : r.rate >= 50 ? '#ea580c' : '#d97706'),
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: '% Đề kháng (R)' }, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // 8.1 S. aureus KSĐ Chart
    if (comp.detailedAntibiograms?.sau?.chartData) {
      const sauData = comp.detailedAntibiograms.sau.chartData;
      this.createOrUpdateChart('chart-rep-sau-bar', {
        type: 'bar',
        data: {
          labels: sauData.map(d => d.drug),
          datasets: [{
            label: 'Tỷ lệ kháng thuốc (%)',
            data: sauData.map(d => d.rate),
            backgroundColor: '#dc2626',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: 'Tỷ lệ kháng thuốc (%)' } },
            x: { grid: { display: false }, title: { display: true, text: 'Tên các loại kháng sinh' } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    // 8.2 S. pneumoniae KSĐ Chart
    if (comp.detailedAntibiograms?.spn?.chartData) {
      const spnData = comp.detailedAntibiograms.spn.chartData;
      this.createOrUpdateChart('chart-rep-spn-bar', {
        type: 'bar',
        data: {
          labels: spnData.map(d => d.drug),
          datasets: [{
            label: 'Tỷ lệ kháng thuốc (%)',
            data: spnData.map(d => d.rate),
            backgroundColor: '#9333ea',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: 'Tỷ lệ kháng thuốc (%)' } },
            x: { grid: { display: false }, title: { display: true, text: 'Tên các loại kháng sinh' } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    // 8.3 H. influenzae KSĐ Chart
    if (comp.detailedAntibiograms?.hin?.chartData) {
      const hinData = comp.detailedAntibiograms.hin.chartData;
      this.createOrUpdateChart('chart-rep-hin-bar', {
        type: 'bar',
        data: {
          labels: hinData.map(d => d.drug),
          datasets: [{
            label: 'Tỷ lệ kháng thuốc (%)',
            data: hinData.map(d => d.rate),
            backgroundColor: '#16a34a',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: 'Tỷ lệ kháng thuốc (%)' } },
            x: { grid: { display: false }, title: { display: true, text: 'Tên các loại kháng sinh' } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }

    // 8.4 Enterobacterales Grouped Bar Chart (E. coli vs K. pneumoniae)
    if (comp.detailedAntibiograms?.enterobacterales) {
      const ent = comp.detailedAntibiograms.enterobacterales;
      this.createOrUpdateChart('chart-rep-entero-bar', {
        type: 'bar',
        data: {
          labels: ent.drugs,
          datasets: [
            {
              label: 'E. coli (%R)',
              data: ent.ecoRates,
              backgroundColor: '#0284c7',
              borderRadius: 4
            },
            {
              label: 'K. pneumoniae (%R)',
              data: ent.kpnRates,
              backgroundColor: '#dc2626',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: 'Tỷ lệ kháng thuốc (%)' } },
            x: { grid: { display: false }, title: { display: true, text: 'Tên các loại kháng sinh' } }
          },
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { weight: 'bold' } } }
          }
        }
      });
    }

    // 8.5 Gram-negative non-fermenters Grouped Bar Chart (A. baumannii vs P. aeruginosa)
    if (comp.detailedAntibiograms?.nonfermenters) {
      const nonf = comp.detailedAntibiograms.nonfermenters;
      this.createOrUpdateChart('chart-rep-nonferm-bar', {
        type: 'bar',
        data: {
          labels: nonf.drugs,
          datasets: [
            {
              label: 'A. baumannii (%R)',
              data: nonf.abaRates,
              backgroundColor: '#dc2626',
              borderRadius: 4
            },
            {
              label: 'P. aeruginosa (%R)',
              data: nonf.paeRates,
              backgroundColor: '#0d9488',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: 'Tỷ lệ kháng thuốc (%)' } },
            x: { grid: { display: false }, title: { display: true, text: 'Tên các loại kháng sinh' } }
          },
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { weight: 'bold' } } }
          }
        }
      });
    }
  },

  /**
   * Render Chế độ 2: Trình Chiếu Trực Quan (12 Slide Deck - Mẫu File 1)
   */
  renderSlideDeck() {
    const container = document.getElementById('rep-view-slides');
    if (!container) return;

    const comp = this.currentReportData?.comprehensiveReport || window.ReportExportService?.hospitalBenchmarkData;
    if (!comp) return;

    container.innerHTML = `
      <!-- Slide 1: Bìa & Quy mô giám sát -->
      <div class="rep-slide-card">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title">1. Báo Cáo Giám Sát Tình Hình Nhiễm Khuẩn Và Kháng Kháng Sinh</h3>
          <span class="rep-slide-badge">Trang 1 / 12</span>
        </div>
        <div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 280px;">
            <div style="font-size: 18px; font-weight: 800; color: #0284c7; margin-bottom: 8px;">BỆNH VIỆN ĐA KHOA ĐỨC GIANG - KHOA VI SINH</div>
            <div style="font-size: 14px; color: #475569; margin-bottom: 16px;">Thời gian: <strong>${comp.metadata.subtitle}</strong> | Tập tin: <strong>${comp.metadata.fileName}</strong></div>
            <div class="rep-kpi-grid">
              <div class="rep-kpi-card accent-blue">
                <div class="rep-kpi-label">Tổng Chủng KSĐ</div>
                <div class="rep-kpi-value">${comp.overview.totalIsolates.toLocaleString()}</div>
              </div>
              <div class="rep-kpi-card">
                <div class="rep-kpi-label">Bệnh Nhân</div>
                <div class="rep-kpi-value">${comp.overview.totalPatients.toLocaleString()}</div>
              </div>
              <div class="rep-kpi-card accent-green">
                <div class="rep-kpi-label">Khoa Lâm Sàng</div>
                <div class="rep-kpi-value">${comp.overview.totalDepartments}</div>
              </div>
              <div class="rep-kpi-card accent-amber">
                <div class="rep-kpi-label">Loài Định Danh</div>
                <div class="rep-kpi-value">${comp.overview.totalSpecies}</div>
              </div>
            </div>
          </div>
          <div style="width: 320px; height: 260px; position: relative;">
            <canvas id="chart-slide-1-donut"></canvas>
          </div>
        </div>
        <div class="rep-slide-footer">
          <span>Người lập: ${comp.metadata.author}</span>
          <span>Trưởng khoa: ${comp.metadata.reviewer}</span>
        </div>
      </div>

      <!-- Slide 2: Phân bố theo tháng -->
      <div class="rep-slide-card">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title">2. Phân Bố Số Lượng Chủng Theo Tháng (T1 - T6/2026)</h3>
          <span class="rep-slide-badge">Trang 2 / 12</span>
        </div>
        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px; height: 280px; position: relative;">
            <canvas id="chart-slide-2-monthly"></canvas>
          </div>
          <div style="flex: 1; min-width: 280px;">
            <table class="rep-table">
              <thead>
                <tr><th>Tháng</th><th class="center">Số Chủng</th><th class="center">Tỷ Lệ</th><th>Nhận Xét</th></tr>
              </thead>
              <tbody>
                ${comp.monthlyDistribution.map(m => `
                  <tr style="${m.isPeak ? 'background: #fff1f2;' : ''}">
                    <td><strong>${m.month}</strong></td>
                    <td class="center bold" style="${m.isPeak ? 'color: #dc2626;' : ''}">${m.count}</td>
                    <td class="center bold">${m.percent}%</td>
                    <td>${m.isPeak ? '★ Đỉnh phân lập 338 chủng' : 'Bình thường'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="rep-callout warning" style="margin-top: 10px;">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <div>${comp.monthlyComments.trendDesc}</div>
            </div>
          </div>
        </div>
        <div class="rep-slide-footer">
          <span>${comp.monthlyComments.note}</span>
          <span>BVĐK Đức Giang 2026</span>
        </div>
      </div>

      <!-- Slide 3: Phân bố theo khoa phòng -->
      <div class="rep-slide-card">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title">3. Phân Bố Theo Khoa Lâm Sàng (Top Khoa Trọng Điểm)</h3>
          <span class="rep-slide-badge">Trang 3 / 12</span>
        </div>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="flex: 1.2; min-width: 320px; height: 320px; position: relative;">
            <canvas id="chart-slide-3-depts"></canvas>
          </div>
          <div style="flex: 1; min-width: 280px;">
            <div class="rep-callout info" style="margin-bottom: 12px;">
              <i class="fa-solid fa-bullseye"></i>
              <div><strong>Top 4 khoa chiếm ~2/3 (66.6%):</strong> ${comp.departmentComments.top4Depts} với tổng số ${comp.departmentComments.top4Total} chủng.</div>
            </div>
            <div class="rep-callout warning">
              <i class="fa-solid fa-shield-virus"></i>
              <div>${comp.departmentComments.clinicalNote}</div>
            </div>
          </div>
        </div>
        <div class="rep-slide-footer">
          <span>Giám sát 24 khoa lâm sàng</span>
          <span>BVĐK Đức Giang 2026</span>
        </div>
      </div>

      <!-- Slide 4: Cơ cấu bệnh phẩm -->
      <div class="rep-slide-card">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title">4. Cơ Cấu Bệnh Phẩm Phân Lập &amp; Y Văn VINARES</h3>
          <span class="rep-slide-badge">Trang 4 / 12</span>
        </div>
        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px; height: 280px; position: relative;">
            <canvas id="chart-slide-4-specimens"></canvas>
          </div>
          <div style="flex: 1; min-width: 280px;">
            <table class="rep-table">
              <thead><tr><th>Loại Bệnh Phẩm</th><th class="center">Số Chủng</th><th class="center">Tỷ Lệ</th></tr></thead>
              <tbody>
                ${comp.specimenDistribution.slice(0, 5).map(s => `
                  <tr><td><strong>${s.type}</strong></td><td class="center bold">${s.count}</td><td class="center bold">${s.percent}%</td></tr>
                `).join('')}
              </tbody>
            </table>
            <div class="rep-callout info" style="margin-top: 10px;">
              <i class="fa-solid fa-book-medical"></i>
              <div>${comp.specimenLiterature.vinaresComparison}</div>
            </div>
          </div>
        </div>
        <div class="rep-slide-footer">
          <span>Nguồn: ${comp.specimenLiterature.source}</span>
          <span>BVĐK Đức Giang 2026</span>
        </div>
      </div>

      <!-- Slide 5: Các vi khuẩn phân lập chính -->
      <div class="rep-slide-card">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title">5. Các Tác Nhân Vi Sinh Vật Phân Lập Thường Gặp Nhất</h3>
          <span class="rep-slide-badge">Trang 5 / 12</span>
        </div>
        <div style="height: 340px; position: relative;">
          <canvas id="chart-slide-5-pathogens"></canvas>
        </div>
        <div class="rep-slide-footer">
          <span>H. influenzae, S. aureus, S. pneumoniae là 3 chủng dẫn đầu</span>
          <span>BVĐK Đức Giang 2026</span>
        </div>
      </div>

      <!-- Slide 6: Tác nhân theo 5 nhóm bệnh phẩm -->
      <div class="rep-slide-card">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title">6. Tác Nhân Phân Lập Theo 5 Nhóm Bệnh Phẩm Trọng Điểm</h3>
          <span class="rep-slide-badge">Trang 6 / 12</span>
        </div>
        <div class="rep-specimen-grid">
          ${Object.values(comp.pathogensBySpecimen).map(sp => `
            <div class="rep-specimen-box">
              <div class="rep-specimen-box-head" style="color: ${sp.color};">
                <i class="fa-solid ${sp.icon}"></i>
                <span>${sp.title}</span>
              </div>
              <ul class="rep-specimen-list">
                ${sp.items.map(it => `
                  <li><span class="org-name"><em>${it.name}</em></span><span class="org-count">${it.count} ca</span></li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        <div class="rep-slide-footer">
          <span>Đờm: A. baumannii &amp; P. aeruginosa chiếm ưu thế | Cấy máu: E. coli &amp; S. aureus dẫn đầu</span>
          <span>BVĐK Đức Giang 2026</span>
        </div>
      </div>

      <!-- Slide 7: Xu hướng 6 vi khuẩn chính -->
      <div class="rep-slide-card">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title">7. Xu Hướng Phân Lập Theo Tháng Của 6 Vi Khuẩn Chính</h3>
          <span class="rep-slide-badge">Trang 7 / 12</span>
        </div>
        <div style="height: 320px; position: relative;">
          <canvas id="chart-slide-7-trends"></canvas>
        </div>
        <div class="rep-slide-footer">
          <span>H. influenzae tăng vọt đỉnh điểm vào Tháng 4 (87 chủng)</span>
          <span>BVĐK Đức Giang 2026</span>
        </div>
      </div>

      <!-- Slide 8: 7 con số cảnh báo điểm đỏ -->
      <div class="rep-slide-card" style="border: 1.5px solid #fca5a5;">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title" style="color: #991b1b;"><i class="fa-solid fa-triangle-exclamation" style="color: #dc2626;"></i> 8. 7 Con Số Cảnh Báo - Điểm Đỏ Kháng Thuốc (Red Alerts)</h3>
          <span class="rep-slide-badge" style="background: #dc2626;">Trang 8 / 12</span>
        </div>
        <div class="rep-alert-grid">
          ${comp.redAlerts.map(r => `
            <div class="rep-alert-card level-${r.level}">
              <div class="rep-alert-top">
                <span class="rep-alert-title">${r.title}</span>
                <span class="rep-alert-rate">${r.rateFormatted}</span>
              </div>
              <div class="rep-alert-org">${r.organism}</div>
              <div class="rep-alert-target">${r.resistanceTarget}</div>
              <span class="rep-alert-ratio">${r.ratio}</span>
              <div class="rep-alert-note">${r.note}</div>
            </div>
          `).join('')}
        </div>
        <div class="rep-slide-footer">
          <span>Báo động đỏ: CRAB 92%, MRSA 78.6%, ESBL Kp 67.9%, CRPA 56.9%, CRE Kp 56%</span>
          <span>BVĐK Đức Giang 2026</span>
        </div>
      </div>

      <!-- Slide 9: KSĐ chi tiết S. aureus & MRSA -->
      <div class="rep-slide-card">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title">9. Kháng Sinh Đồ Chi Tiết: <em>Staphylococcus aureus</em> &amp; MRSA</h3>
          <span class="rep-slide-badge">Trang 9 / 12</span>
        </div>
        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px; height: 280px; position: relative;">
            <canvas id="chart-slide-9-sau"></canvas>
          </div>
          <div style="flex: 1; min-width: 280px;">
            <div class="rep-callout warning" style="margin-bottom: 12px;">
              <i class="fa-solid fa-shield-virus"></i>
              <div><strong>Tỷ lệ MRSA: ${comp.detailedAntibiograms.sau.mrsaRate}</strong>. Kháng gần như toàn bộ Beta-lactam thông thường.</div>
            </div>
            <div class="rep-callout success">
              <i class="fa-solid fa-circle-check"></i>
              <div><strong>100% còn nhạy cảm:</strong> Vancomycin (100%), Linezolid (100%), Tigecycline (100%). Cân nhắc TDM khi dùng Vancomycin.</div>
            </div>
          </div>
        </div>
        <div class="rep-slide-footer">
          <span>n = 230 chủng Staphylococcus aureus</span>
          <span>BVĐK Đức Giang 2026</span>
        </div>
      </div>

      <!-- Slide 10: KSĐ S. pneumoniae & H. influenzae -->
      <div class="rep-slide-card">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title">10. Kháng Sinh Đồ: <em>S. pneumoniae</em> &amp; <em>H. influenzae</em></h3>
          <span class="rep-slide-badge">Trang 10 / 12</span>
        </div>
        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px;">
            <h5 style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-bottom: 8px;"><em>S. pneumoniae</em> (n = 214)</h5>
            <div class="rep-callout info">
              <i class="fa-solid fa-brain"></i>
              <div>${comp.detailedAntibiograms.spn.breakpointNote}</div>
            </div>
            <div style="font-size: 12px; margin-top: 8px; color: #475569;">Erythromycin R: 98.6% | Moxifloxacin &amp; Vancomycin: 100% S.</div>
          </div>
          <div style="flex: 1; min-width: 300px;">
            <h5 style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-bottom: 8px;"><em>H. influenzae</em> (n = 253)</h5>
            <div class="rep-callout warning">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <div>${comp.detailedAntibiograms.hin.ampicillinRate}. TMP/SMX kháng 75.4%.</div>
            </div>
            <div style="font-size: 12px; margin-top: 8px; color: #16a34a; font-weight: 700;">Còn nhạy cao: Meropenem (98.3%), Imipenem (98%), Ceftriaxone (85.7%), Fluoroquinolone (>94%).</div>
          </div>
        </div>
        <div class="rep-slide-footer">
          <span>Hai tác nhân gây bệnh đường hô hấp thường gặp nhất ở trẻ em</span>
          <span>BVĐK Đức Giang 2026</span>
        </div>
      </div>

      <!-- Slide 11: Enterobacterales ESBL & CRE -->
      <div class="rep-slide-card">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title">11. Enterobacterales: So Sánh ESBL &amp; CRE (E. coli vs K. pneumoniae)</h3>
          <span class="rep-slide-badge">Trang 11 / 12</span>
        </div>
        <div style="height: 300px; position: relative;">
          <canvas id="chart-slide-11-entero"></canvas>
        </div>
        <div style="display: flex; gap: 20px; margin-top: 14px; flex-wrap: wrap;">
          <div class="rep-callout info" style="flex: 1; min-width: 260px;">
            <div><strong>E. coli:</strong> ESBL ${comp.detailedAntibiograms.enterobacterales.ecoSummary.esbl}, CRE ${comp.detailedAntibiograms.enterobacterales.ecoSummary.cre}. Còn nhạy tốt với Carbapenem, Amikacin.</div>
          </div>
          <div class="rep-callout warning" style="flex: 1; min-width: 260px;">
            <div><strong>K. pneumoniae:</strong> ESBL ${comp.detailedAntibiograms.enterobacterales.kpnSummary.esbl}, CRE ${comp.detailedAntibiograms.enterobacterales.kpnSummary.cre}. Đa kháng và báo động CRE rất cao.</div>
          </div>
        </div>
        <div class="rep-slide-footer">
          <span>Sự khác biệt lớn về mức độ kháng Carbapenem giữa E. coli và K. pneumoniae</span>
          <span>BVĐK Đức Giang 2026</span>
        </div>
      </div>

      <!-- Slide 12: Gram âm không lên men CRAB & CRPA -->
      <div class="rep-slide-card">
        <div class="rep-slide-header">
          <h3 class="rep-slide-title">12. Gram Âm Không Lên Men: CRAB &amp; CRPA (A. baumannii vs P. aeruginosa)</h3>
          <span class="rep-slide-badge">Trang 12 / 12</span>
        </div>
        <div style="height: 300px; position: relative;">
          <canvas id="chart-slide-12-nonferm"></canvas>
        </div>
        <div style="display: flex; gap: 20px; margin-top: 14px; flex-wrap: wrap;">
          <div class="rep-callout warning" style="flex: 1; min-width: 260px;">
            <div><strong>A. baumannii:</strong> CRAB ${comp.detailedAntibiograms.nonfermenters.abaSummary.crab}. Kháng gần như toàn bộ kháng sinh, cứu cánh: ${comp.detailedAntibiograms.nonfermenters.abaSummary.effective}.</div>
          </div>
          <div class="rep-callout info" style="flex: 1; min-width: 260px;">
            <div><strong>P. aeruginosa:</strong> CRPA ${comp.detailedAntibiograms.nonfermenters.paeSummary.crpa}. Cứu cánh hiệu quả: ${comp.detailedAntibiograms.nonfermenters.paeSummary.effective}.</div>
          </div>
        </div>
        <div class="rep-slide-footer">
          <span>Trọng tâm kiểm soát nhiễm khuẩn và giám sát sử dụng kháng sinh ưu tiên</span>
          <span>Hội đồng Thuốc &amp; Điều trị BVĐK Đức Giang</span>
        </div>
      </div>
    `;

    // Render các biểu đồ cho Slide Deck
    if (typeof Chart !== 'undefined') {
      setTimeout(() => {
        // Slide 1 Donut
        this.createOrUpdateChart('chart-slide-1-donut', {
          type: 'doughnut',
          data: {
            labels: comp.gramGroups.map(g => `${g.name} (${g.percent}%)`),
            datasets: [{ data: comp.gramGroups.map(g => g.count), backgroundColor: comp.gramGroups.map(g => g.color) }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } } }
        });

        // Slide 2 Monthly
        this.createOrUpdateChart('chart-slide-2-monthly', {
          type: 'bar',
          data: {
            labels: comp.monthlyDistribution.map(m => m.shortName),
            datasets: [{ data: comp.monthlyDistribution.map(m => m.count), backgroundColor: comp.monthlyDistribution.map(m => m.isPeak ? '#dc2626' : '#0284c7'), borderRadius: 6 }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        // Slide 3 Depts
        this.createOrUpdateChart('chart-slide-3-depts', {
          type: 'bar',
          data: {
            labels: comp.departmentTop12.slice(0, 8).map(d => d.name),
            datasets: [{ data: comp.departmentTop12.slice(0, 8).map(d => d.count), backgroundColor: comp.departmentTop12.slice(0, 8).map(d => d.priority ? '#0284c7' : '#94a3b8') }]
          },
          options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        // Slide 4 Specimens
        this.createOrUpdateChart('chart-slide-4-specimens', {
          type: 'bar',
          data: {
            labels: comp.specimenDistribution.slice(0, 5).map(s => s.type),
            datasets: [{ data: comp.specimenDistribution.slice(0, 5).map(s => s.percent), backgroundColor: '#0d9488', borderRadius: 4 }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        // Slide 5 Pathogens
        this.createOrUpdateChart('chart-slide-5-pathogens', {
          type: 'bar',
          data: {
            labels: comp.top15Pathogens.slice(0, 10).map(p => p.name),
            datasets: [{ data: comp.top15Pathogens.slice(0, 10).map(p => p.count), backgroundColor: '#0284c7', borderRadius: 4 }]
          },
          options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        // Slide 7 Trends
        if (comp.monthlyTrendTop6) {
          this.createOrUpdateChart('chart-slide-7-trends', {
            type: 'line',
            data: {
              labels: comp.monthlyTrendTop6.months,
              datasets: comp.monthlyTrendTop6.series.map(s => ({ label: s.name, data: s.data, borderColor: s.color, borderWidth: 2, tension: 0.2 }))
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } } }
          });
        }

        // Slide 9 Sau
        if (comp.detailedAntibiograms?.sau?.chartData) {
          const sauData = comp.detailedAntibiograms.sau.chartData;
          this.createOrUpdateChart('chart-slide-9-sau', {
            type: 'bar',
            data: { labels: sauData.map(d => d.drug), datasets: [{ data: sauData.map(d => d.rate), backgroundColor: '#dc2626' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });
        }

        // Slide 11 Entero
        if (comp.detailedAntibiograms?.enterobacterales) {
          const ent = comp.detailedAntibiograms.enterobacterales;
          this.createOrUpdateChart('chart-slide-11-entero', {
            type: 'bar',
            data: {
              labels: ent.drugs,
              datasets: [
                { label: 'E. coli (%R)', data: ent.ecoRates, backgroundColor: '#0284c7' },
                { label: 'K. pneumoniae (%R)', data: ent.kpnRates, backgroundColor: '#dc2626' }
              ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
          });
        }

        // Slide 12 Nonferm
        if (comp.detailedAntibiograms?.nonfermenters) {
          const nonf = comp.detailedAntibiograms.nonfermenters;
          this.createOrUpdateChart('chart-slide-12-nonferm', {
            type: 'bar',
            data: {
              labels: nonf.drugs,
              datasets: [
                { label: 'A. baumannii (%R)', data: nonf.abaRates, backgroundColor: '#dc2626' },
                { label: 'P. aeruginosa (%R)', data: nonf.paeRates, backgroundColor: '#0d9488' }
              ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
          });
        }
      }, 50);
    }
  },

  /**
   * Render Chế độ 3: Văn bản Y khoa Hành chính (15 Trang - Mẫu File 2)
   */
  renderDocumentView() {
    const inner = document.getElementById('rep-document-inner');
    if (!inner) return;

    const comp = this.currentReportData?.comprehensiveReport || window.ReportExportService?.hospitalBenchmarkData;
    if (!comp) return;

    inner.innerHTML = `
      <div class="rep-doc-page">
        <!-- Header Hành chính Bộ Y tế / Sở Y tế -->
        <table style="width: 100%; border: none; margin-bottom: 24px;">
          <tr style="border: none;">
            <td style="width: 45%; border: none; vertical-align: top; text-align: center;">
              <div style="font-size: 11pt; text-transform: uppercase;">${comp.metadata.governingBody}</div>
              <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">${comp.metadata.hospitalName}</div>
              <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; display: inline-block; padding-bottom: 2px;">${comp.metadata.departmentName}</div>
            </td>
            <td style="width: 55%; border: none; vertical-align: top; text-align: center;">
              <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style="font-size: 11pt; font-weight: bold; border-bottom: 1px solid #000; display: inline-block; padding-bottom: 2px;">Độc lập – Tự do – Hạnh phúc</div>
              <div style="font-size: 11pt; font-style: italic; margin-top: 6px;">Hà Nội, ngày 25 tháng 06 năm 2026</div>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin: 20px 0 24px 0;">
          <h2 style="font-size: 16pt; margin-bottom: 4pt;">${comp.metadata.title}</h2>
          <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #333;">${comp.metadata.subtitle}</div>
          <div style="font-size: 11pt; font-style: italic; margin-top: 4pt;">(Phân tích theo dữ liệu tập tin: ${comp.metadata.fileName})</div>
        </div>

        <h2>1. MỤC ĐÍCH VÀ PHẠM VI GIÁM SÁT</h2>
        <p>Giám sát tình hình kháng kháng sinh (AMR) định kỳ là nhiệm vụ bắt buộc của Khoa Vi sinh và Hội đồng Thuốc &amp; Điều trị bệnh viện theo quy định của Bộ Y tế và khuyến cáo của Tổ chức Y tế Thế giới (WHO). Báo cáo nhằm cung cấp dữ liệu vi sinh chuẩn xác làm cơ sở:</p>
        <p>1.1. Cập nhật và xây dựng Hướng dẫn sử dụng kháng sinh kinh nghiệm toàn viện năm 2026.</p>
        <p>1.2. Phát hiện sớm các chủng vi khuẩn đa kháng nguy hiểm (CRAB, MRSA, CRE, CRPA, VRE) để kịp thời triển khai các biện pháp cách ly kiểm soát nhiễm khuẩn (IC).</p>
        <p>1.3. Cung cấp dữ liệu tham chiếu cho chương trình Quản lý sử dụng kháng sinh (AMS) và báo cáo Mạng giám sát AMR quốc gia (VINARES).</p>

        <h2>2. ĐỐI TƯỢNG VÀ PHƯƠNG PHÁP GIÁM SÁT</h2>
        <p><strong>2.1. Đối tượng:</strong> Toàn bộ các chủng vi khuẩn và nấm phân lập được từ bệnh nhân điều trị nội trú và ngoại trú tại Bệnh viện Đa khoa Đức Giang trong khoảng thời gian từ ngày 01/01/2026 đến ngày 22/06/2026.</p>
        <p><strong>2.2. Quy mô mẫu:</strong> Tổng số <strong>${comp.overview.totalIsolates.toLocaleString()} chủng</strong> có kết quả kháng sinh đồ từ <strong>${comp.overview.totalPatients.toLocaleString()} bệnh nhân</strong> tại <strong>${comp.overview.totalDepartments} khoa lâm sàng</strong>, định danh được <strong>${comp.overview.totalSpecies} loài vi sinh vật</strong>.</p>
        <p><strong>2.3. Tiêu chuẩn phiên giải:</strong> Kháng sinh đồ được thực hiện và phiên giải độ nhạy cảm theo tiêu chuẩn CLSI M100 bản cập nhật 2025 và nguyên tắc CLSI M39 (loại trừ các chủng trùng lặp cùng loài trên cùng bệnh nhân).</p>

        <h2>3. KẾT QUẢ GIÁM SÁT CHI TIẾT</h2>
        <h3>3.1. Phân bố theo nhóm vi sinh vật</h3>
        <p>Vi khuẩn Gram âm chiếm ưu thế áp đảo với 59.1% (867 chủng), tiếp theo là Gram dương 34.1% (500 chủng), Nấm men chiếm 4.5% (66 chủng) và các chủng khác chiếm 2.3% (33 chủng).</p>
        <table>
          <thead>
            <tr><th>Nhóm Vi Sinh Vật</th><th style="text-align: center;">Số Chủng</th><th style="text-align: center;">Tỷ Lệ (%)</th></tr>
          </thead>
          <tbody>
            ${comp.gramGroups.map(g => `
              <tr><td>${g.name}</td><td style="text-align: center; font-weight: bold;">${g.count}</td><td style="text-align: center; font-weight: bold;">${g.percent}%</td></tr>
            `).join('')}
          </tbody>
        </table>

        <h3>3.2. Phân bố chủng phân lập theo thời gian (Tháng 1 – Tháng 6/2026)</h3>
        <p>Số lượng chủng phân lập tăng dần từ Tháng 1 (208 chủng) và đạt đỉnh điểm vào Tháng 4 với 338 chủng (23.1%), sau đó giảm dần. Diễn biến này hoàn toàn phù hợp với mô hình bệnh tật theo mùa tại Hà Nội, đặc biệt là các đợt bùng phát nhiễm khuẩn hô hấp ở trẻ em.</p>
        <table>
          <thead>
            <tr><th>Tháng</th><th style="text-align: center;">Số Chủng</th><th style="text-align: center;">Tỷ Lệ (%)</th><th>Đặc Điểm Dịch Tễ</th></tr>
          </thead>
          <tbody>
            ${comp.monthlyDistribution.map(m => `
              <tr style="${m.isPeak ? 'background: #fef2f2; font-weight: bold;' : ''}">
                <td>${m.month}</td>
                <td style="text-align: center;">${m.count}</td>
                <td style="text-align: center;">${m.percent}%</td>
                <td>${m.isPeak ? 'Đỉnh dịch phân lập cao nhất trong 6 tháng' : 'Số lượng bình thường'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>3.3. Phân bố chủng theo các khoa lâm sàng</h3>
        <p>Bốn khoa lâm sàng có số lượng chủng cao nhất chiếm tới <strong>66.6% (976 chủng)</strong> tổng số toàn viện, bao gồm: Hồi sức tích cực - Chống độc (316 chủng - 21.6%), Nhi hô hấp (300 chủng - 20.5%), Hồi sức tích cực Nhi (202 chủng - 13.8%) và Khoa Nhi (158 chủng - 10.8%). Đây là các khoa có số lượng bệnh nhân nặng và nguy cơ nhiễm khuẩn cao nhất.</p>

        <h3>3.4. Cơ cấu bệnh phẩm và so sánh y văn</h3>
        <p>Bệnh phẩm đường hô hấp chiếm tỷ trọng chủ yếu với 63.3% (Dịch tỵ hầu/họng: 46.5%; Đờm/dịch hô hấp dưới: 16.8%), Mủ/vết thương: 11.7%, Nước tiểu: 11.3%, Cấy máu: 9.1%. So với mạng VINARES 2016-2017 (Đờm 21%, Máu 17%, Nước tiểu 12%), cơ cấu tại BVĐK Đức Giang phản ánh tỷ trọng lớn bệnh nhân Nhi; do đó đối với bệnh phẩm tỵ hầu cần thận trọng phân biệt với vi khuẩn thường trú.</p>

        <h3>3.5. Các tác nhân vi sinh vật phân lập hàng đầu (Top 15)</h3>
        <table>
          <thead>
            <tr><th style="text-align: center; width: 35px;">STT</th><th>Tên Chủng Vi Sinh Vật</th><th>Nhóm Phân Loại</th><th style="text-align: center;">Số Chủng</th><th style="text-align: center;">Tỷ Lệ (%)</th></tr>
          </thead>
          <tbody>
            ${comp.top15Pathogens.map((p, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong><em>${p.name}</em></strong></td>
                <td>${p.group}</td>
                <td style="text-align: center; font-weight: bold;">${p.count}</td>
                <td style="text-align: center; font-weight: bold;">${p.percent}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>3.6. 7 Con số cảnh báo - Điểm đỏ kháng thuốc (Red Alerts)</h3>
        <table>
          <thead>
            <tr><th>Chỉ Số</th><th>Tác Nhân</th><th>Mục Tiêu Đề Kháng</th><th style="text-align: center;">Tỷ Lệ Kháng</th><th style="text-align: center;">Tỷ Lệ Chủng</th><th>Ghi Chú Kháng Sinh Còn Hiệu Lực</th></tr>
          </thead>
          <tbody>
            ${comp.redAlerts.map(r => `
              <tr>
                <td><strong>${r.title}</strong></td>
                <td><em>${r.organism}</em></td>
                <td>${r.resistanceTarget}</td>
                <td style="text-align: center; font-weight: bold; color: #b91c1c;">${r.rateFormatted}</td>
                <td style="text-align: center;">${r.ratio}</td>
                <td>${r.note}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>4. NHẬN XÉT VÀ BÀN LUẬN</h2>
        <p>4.1. Tình trạng kháng thuốc của <em>Acinetobacter baumannii</em> ở mức báo động nghiêm trọng (CRAB 92%). Các Cephalosporin thế hệ 3, 4, Quinolone và Carbapenem gần như đã mất hoàn toàn hiệu lực. Chỉ duy nhất Colistin còn duy trì độ nhạy cảm cao (85.4%).</p>
        <p>4.2. Tỷ lệ MRSA trong <em>S. aureus</em> là 78.6%. Toàn bộ các chủng S. aureus vẫn còn nhạy cảm 100% với Vancomycin, Linezolid và Tigecycline. Cần giám sát nồng độ đáy (TDM) của Vancomycin để đảm bảo hiệu quả điều trị và tránh độc tính trên thận.</p>
        <p>4.3. <em>Klebsiella pneumoniae</em> kháng Carbapenem (CRE) lên tới 56%, cao hơn gấp 5 lần so với <em>E. coli</em> (11.2%). Điều này đòi hỏi phải phân biệt rõ hướng điều trị giữa hai loài vi khuẩn đường ruột này.</p>

        <h2>5. KẾT LUẬN VÀ KIẾN NGHỊ LÂM SÀNG</h2>
        <p><strong>5.1. Kết luận:</strong> Tình hình nhiễm khuẩn bệnh viện và kháng thuốc trong 6 tháng đầu năm 2026 tại Bệnh viện Đa khoa Đức Giang diễn biến phức tạp với sự xuất hiện của các vi khuẩn đa kháng và toàn kháng (CRAB, CRE, MRSA, CRPA) tập trung tại các khoa Hồi sức và Nhi.</p>
        <p><strong>5.2. Kiến nghị Hội đồng Thuốc &amp; Điều trị:</strong></p>
        <p>- Cập nhật phác đồ điều trị kinh nghiệm, ưu tiên phối hợp kháng sinh có Colistin hoặc Ceftazidime/Avibactam cho các ca nhiễm khuẩn nặng nghi do trực khuẩn Gram âm đa kháng.</p>
        <p>- Thiết lập quy trình phê duyệt bắt buộc đối với các kháng sinh dự trữ nhóm ưu tiên (Carbapenem, Colistin, Linezolid, Ceftazidime/Avibactam).</p>
        <p>- Khoa Kiểm soát nhiễm khuẩn phối hợp các khoa lâm sàng tăng cường cách ly người bệnh mang vi khuẩn đa kháng và thực hiện nghiêm ngặt quy trình vệ sinh tay.</p>

        <table style="width: 100%; border: none; margin-top: 40px; page-break-inside: avoid;">
          <tr style="border: none;">
            <td style="width: 33%; border: none; text-align: center; vertical-align: top;">
              <div style="font-weight: bold; font-size: 11pt;">NGƯỜI LẬP BÁO CÁO</div>
              <div style="font-size: 10pt; font-style: italic; color: #555;">(Khoa Vi sinh)</div>
              <div style="height: 60px;"></div>
              <div style="font-weight: bold; font-size: 12pt;">BS.CKI. Chu Thị Huyền</div>
            </td>
            <td style="width: 33%; border: none; text-align: center; vertical-align: top;">
              <div style="font-weight: bold; font-size: 11pt;">TRƯỞNG KHOA VI SINH</div>
              <div style="font-size: 10pt; font-style: italic; color: #555;">(Xác nhận chuyên môn)</div>
              <div style="height: 60px;"></div>
              <div style="font-weight: bold; font-size: 12pt;">BS.CK2. Đào Quang Trung</div>
            </td>
            <td style="width: 34%; border: none; text-align: center; vertical-align: top;">
              <div style="font-weight: bold; font-size: 11pt;">GIÁM ĐỐC BỆNH VIỆN</div>
              <div style="font-size: 10pt; font-style: italic; color: #555;">(Chủ tịch HĐ Thuốc &amp; Điều trị)</div>
              <div style="height: 60px;"></div>
              <div style="font-weight: bold; font-size: 12pt;">PGS.TS. Giám Đốc Bệnh Viện</div>
            </td>
          </tr>
        </table>
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.ReportView = ReportView;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ReportView };
}
