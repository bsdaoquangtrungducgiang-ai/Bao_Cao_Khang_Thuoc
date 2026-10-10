// TEST KIỂM TRA BẢO VỆ XUẤT PDF VÀ LOẠI BỎ TRIỆT ĐỂ SỐ LIỆU MẶC ĐỊNH TRONG BÁO CÁO AMR
load('js/config.js');
load('js/services/storageQuotaManager.js');
load('js/services/demoDataService.js');
load('js/services/analyticsService.js');
load('js/services/specializedAMRService.js');
load('js/services/reportExportService.js');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    print('  [PASS] ' + message);
    passCount++;
  } else {
    print('  [FAIL] ' + message);
    failCount++;
  }
}

print('================================================================');
print('  TEST XUẤT PDF BIỂU ĐỒ & TRIỆT TIÊU SỐ LIỆU MẶC ĐỊNH BẢO CÁO AMR');
print('================================================================');

// 1. Kiểm tra DOM và CSS không rò rỉ bảng mặc định
// Giả lập DOM tối thiểu
const elements = {};
const queryMap = {};

function createElementMock(tag) {
  return {
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    },
    children: [],
    appendChild(child) {
      this.children.push(child);
      child.parentElement = this;
      return child;
    },
    querySelector(selector) {
      if (selector === '.rep-chart-print-img') {
        return this.children.find(c => c.className === 'rep-chart-print-img') || null;
      }
      return null;
    },
    closest(selector) {
      if (selector === '.rep-chart-canvas-wrapper' && this.parentElement) {
        return this.parentElement;
      }
      return null;
    },
    remove() {
      if (this.parentElement) {
        const idx = this.parentElement.children.indexOf(this);
        if (idx >= 0) this.parentElement.children.splice(idx, 1);
      }
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    hasAttribute(k) { return this[k] !== undefined; },
    removeAttribute(k) { delete this[k]; }
  };
}

globalThis.document = {
  documentElement: createElementMock('html'),
  body: createElementMock('body'),
  getElementById(id) {
    if (!elements[id]) {
      elements[id] = createElementMock('div');
      elements[id].id = id;
    }
    return elements[id];
  },
  createElement(tag) {
    return createElementMock(tag);
  },
  querySelectorAll(sel) {
    if (sel === '.rep-table-scroll') {
      return [document.getElementById('mock-scroll')];
    }
    if (sel === '.has-print-img') {
      const list = [];
      Object.values(elements).forEach(el => {
        if (el.classList && el.classList.contains('has-print-img')) {
          list.push(el);
        }
      });
      return list;
    }
    return [];
  }
};

load('js/components/reportView.js');

// 2. Kiểm tra tính toán động Bảng 11 & Bảng 12 với dữ liệu 0%
const mockEmptyComp = {
  overview: { totalIsolates: 0, totalPatients: 0, totalDepartments: 0, totalSpecies: 0 },
  metadata: { hospitalName: 'BV TEST', departmentName: 'KHOA TEST', fileName: 'Test_Zero.xlsx' },
  detailedAntibiograms: {
    sau: { isolateCount: 0, mrsaRate: '0%', tableRows: [] },
    spn: { isolateCount: 0, chartData: [], tableRows: [] },
    hin: { isolateCount: 0, ampicillinRate: 'Ampicillin R: 0%', tableRows: [] },
    enterobacterales: {
      comparisonRows: [
        { drug: 'Cefotaxime (ESBL)', ecoR: 0, kpnR: 0, note: '-' },
        { drug: 'Cefepime', ecoR: 0, kpnR: 0, note: '-' },
        { drug: 'Ciprofloxacin', ecoR: 0, kpnR: 0, note: '-' },
        { drug: 'Piperacillin/Tazobactam', ecoR: 0, kpnR: 0, note: '-' },
        { drug: 'Meropenem (CRE)', ecoR: 0, kpnR: 0, note: '-' }
      ]
    },
    nonfermenters: {
      comparisonRows: [
        { drug: 'Ceftazidime', abaR: 0, paeR: 0, note: '-' },
        { drug: 'Cefepime', abaR: 0, paeR: 0, note: '-' },
        { drug: 'Piperacillin/Tazobactam', abaR: 0, paeR: 0, note: '-' },
        { drug: 'Ciprofloxacin', abaR: 0, paeR: 0, note: '-' },
        { drug: 'Meropenem (Carbapenem)', abaR: 0, paeR: 0, note: '-' }
      ],
      abaSummary: { crab: '0%' },
      paeSummary: { crpa: '0%' }
    }
  }
};

ReportView.renderIntegratedTables(mockEmptyComp, {});

const enteroTbody = document.getElementById('table-rep-entero-body');
assert(enteroTbody.children.length === 5, '1. Bảng 11 (Enterobacterales) hiển thị đủ 5 dòng');
const firstEnteroHtml = enteroTbody.children[0].innerHTML;
assert(firstEnteroHtml.includes('0%') && !firstEnteroHtml.includes('63%') && !firstEnteroHtml.includes('64%'), '2. Bảng 11 hiển thị đúng 0%, TUYỆT ĐỐI KHÔNG rơi về số mặc định 63% hay 64%');

const nonfermTbody = document.getElementById('table-rep-nonferm-body');
assert(nonfermTbody.children.length === 5, '3. Bảng 12 (Gram âm không lên men) hiển thị đủ 5 dòng');
const firstNonfermHtml = nonfermTbody.children[0].innerHTML;
assert(firstNonfermHtml.includes('0%') && !firstNonfermHtml.includes('93%') && !firstNonfermHtml.includes('51%'), '4. Bảng 12 hiển thị đúng 0%, TUYỆT ĐỐI KHÔNG rơi về số mặc định 93% hay 51%');

// 3. Kiểm tra Huy hiệu và Nhận xét Mục 10 khi không có chủng phân lập
const compEmptyReport = ReportExportService.createDynamicEmptyReportForFile('Empty_File.xlsx');
assert(compEmptyReport.overview.totalIsolates === 0, '5. File rỗng có 0 chủng phân lập');
assert(compEmptyReport.detailedAntibiograms.sau.isolateCount === 0, '6. File rỗng có 0 chủng S. aureus');
assert(compEmptyReport.detailedAntibiograms.spn.isolateCount === 0, '7. File rỗng có 0 chủng S. pneumoniae');
assert(compEmptyReport.detailedAntibiograms.hin.isolateCount === 0, '8. File rỗng có 0 chủng H. influenzae');
assert(compEmptyReport.detailedAntibiograms.enterobacterales.comparisonRows[0].ecoR === 0, '9. File rỗng có tỷ lệ kháng E. coli = 0%');

// 4. Kiểm tra quy trình snapshot ảnh in prepareChartsForPrint & cleanupChartsAfterPrint
const wrapperMock = createElementMock('div');
wrapperMock.className = 'rep-chart-canvas-wrapper';
elements['mock-wrapper'] = wrapperMock;

const canvasMock = createElementMock('canvas');
canvasMock.id = 'chart-test-print';
wrapperMock.appendChild(canvasMock);
elements['chart-test-print'] = canvasMock;

ReportView.charts = {
  'chart-test-print': {
    update: function() {},
    toBase64Image: function() {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
  }
};

ReportView.prepareChartsForPrint();
assert(wrapperMock.classList.contains('has-print-img'), '10. prepareChartsForPrint đánh dấu has-print-img trên wrapper');
const printImg = wrapperMock.querySelector('.rep-chart-print-img');
assert(printImg !== null, '11. prepareChartsForPrint tạo thẻ img.rep-chart-print-img');
assert(printImg.src.startsWith('data:image/png;base64,'), '12. Ảnh in có định dạng Base64 PNG sắc nét');

ReportView.cleanupChartsAfterPrint();
assert(!wrapperMock.classList.contains('has-print-img'), '13. cleanupChartsAfterPrint xóa bỏ class has-print-img');
assert(wrapperMock.querySelector('.rep-chart-print-img') === null, '14. cleanupChartsAfterPrint dọn dẹp thẻ img sau khi in');

print('================================================================');
print('  KẾT QUẢ: ' + passCount + ' PASS, ' + failCount + ' FAIL');
print('================================================================');

if (failCount > 0) {
  quit(1);
} else {
  quit(0);
}
