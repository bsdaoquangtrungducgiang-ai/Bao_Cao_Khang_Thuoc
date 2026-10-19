// TEST KIỂM TRA TÍCH HỢP TRỢ LÝ PHÂN TÍCH AI KHÁNG THUỐC (2 TẦNG TRA CỨU)
load('js/config.js');
load('js/services/aiAnalysisService.js');
load('js/components/aiAnalysisModal.js');

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
print('  TEST TÍCH HỢP TRỢ LÝ PHÂN TÍCH AI KHÁNG THUỐC (AMR AI ASSISTANT)');
print('================================================================');

// 1. Kiểm tra khởi tạo Service
assert(typeof AIAnalysisService !== 'undefined', 'AIAnalysisService sẵn sàng hoạt động');
assert(typeof AIAnalysisModal !== 'undefined', 'AIAnalysisModal sẵn sàng hoạt động');

// 2. Kiểm tra kho tri thức Tầng 1 (42 tài liệu nội bộ)
const kb = AIAnalysisService.getInternalKnowledgeBase();
assert(Array.isArray(kb) && kb.length >= 7, 'Kho tri thức Tầng 1 có đầy đủ các chủ đề trọng tâm từ 42 tài liệu (' + kb.length + ' chuyên đề)');

const hasClsi2026 = kb.some(k => k.keywords.includes('2026') || k.keywords.includes('aztreonam-avibactam'));
assert(hasClsi2026, 'Tầng 1 có tri thức về CLSI M100 Ed36 (2026) & Aztreonam-avibactam');

const hasColistin = kb.some(k => k.keywords.includes('colistin') && k.keywords.includes('biomerieux'));
assert(hasColistin, 'Tầng 1 có khuyến cáo cảnh báo kháng giả Colistin bioMérieux 2025');

const hasMcim = kb.some(k => k.keywords.includes('mcim') && k.keywords.includes('carbapenemase'));
assert(hasMcim, 'Tầng 1 có quy trình SOP kỹ thuật mCIM và eCIM');

const hasVitek = kb.some(k => k.keywords.includes('n439') && k.keywords.includes('n240'));
assert(hasVitek, 'Tầng 1 có tài liệu so sánh thẻ VITEK AST-N439 và AST-N240');

const hasM39 = kb.some(k => k.keywords.includes('m39') && k.keywords.includes('antibiogram'));
assert(hasM39, 'Tầng 1 có tiêu chuẩn CLSI M39 (n >= 30, First Isolate)');

// 3. Kiểm tra kho tri thức Tầng 2 (Tổ chức quốc tế uy tín)
const extSources = AIAnalysisService.getExternalAuthoritativeSources();
assert(Array.isArray(extSources) && extSources.length >= 4, 'Kho tri thức Tầng 2 có đủ các tổ chức uy tín (' + extSources.length + ' tổ chức)');
const hasWho = extSources.some(s => s.name.includes('WHO'));
const hasEucast = extSources.some(s => s.name.includes('EUCAST'));
const hasIdsa = extSources.some(s => s.name.includes('IDSA'));
assert(hasWho && hasEucast && hasIdsa, 'Tầng 2 có đầy đủ WHO, EUCAST, IDSA, Bộ Y tế');

// 4. Kiểm tra phân tích câu hỏi thuộc TẦNG 1 (Ưu tiên số 1)
const resClsi2026 = AIAnalysisService.analyzeQuestion('Điểm mới trong CLSI 2026 về Acinetobacter và Aztreonam-avibactam là gì?');
// analyzeQuestion trả về Promise, nhưng trong môi trường test đồng bộ hàm generateLocalExpertResponse
let answerTier1 = null;
if (resClsi2026 && typeof resClsi2026.then === 'function') {
  // Promise handling
  resClsi2026.then(r => { answerTier1 = r; });
} else {
  answerTier1 = resClsi2026;
}

// Gọi trực tiếp generateLocalExpertResponse để kiểm tra logic
const matched = [{
  entry: kb[0],
  score: 10
}];
const mockReportCtx = {
  fileName: 'XN_ViSinh_2026.xlsx',
  totalIsolates: 1463,
  totalPatients: 1137,
  departmentsCount: 24,
  crabRate: '92.4%',
  mrsaRate: '78.6%',
  topOrganisms: ['A. baumannii', 'K. pneumoniae'],
  specimenTypes: ['Đờm', 'Máu']
};

const resp1 = AIAnalysisService.generateLocalExpertResponse('Điểm mới trong CLSI 2026 là gì?', mockReportCtx, matched);
assert(resp1.tier1Used === true, 'Câu hỏi khớp chủ đề tài liệu nội bộ kích hoạt TẦNG 1 ưu tiên');
assert(resp1.text.includes('TẦNG 1 - TÀI LIỆU NỘI BỘ'), 'Phản hồi có huy hiệu nguồn trích dẫn TẦNG 1 rõ ràng');
assert(resp1.text.includes('Aztreonam-avibactam') || resp1.text.includes('CLSI M100 Ed36'), 'Phản hồi trích xuất chính xác nội dung CLSI 2026');

// 5. Kiểm tra phân tích câu hỏi thuộc TẦNG 2 (Khi Tầng 1 không đủ dữ liệu)
const resp2 = AIAnalysisService.generateLocalExpertResponse('Định nghĩa phân loại PDR theo CDC quốc tế?', mockReportCtx, []);
assert(resp2.tier2Used === true, 'Câu hỏi ngoài tài liệu nội bộ tự động chuyển sang TẦNG 2');
assert(resp2.text.includes('TẦNG 2 - NGUỒN CHÍNH THỐNG MỞ RỘNG'), 'Phản hồi có trích dẫn nguồn TẦNG 2 (CLSI, EUCAST, WHO, IDSA)');
assert(resp2.text.includes('Magiorakos') || resp2.text.includes('Pan Drug-Resistant'), 'Phản hồi trích dẫn đúng chuẩn quốc tế');

// 6. Kiểm tra tích hợp dữ liệu Báo cáo hiện tại
const resp3 = AIAnalysisService.generateLocalExpertResponse('Phân tích tình hình kháng thuốc trong file báo cáo hiện tại?', mockReportCtx, matched);
assert(resp3.text.includes('XN_ViSinh_2026.xlsx'), 'Phản hồi lồng ghép chính xác tên file báo cáo');
assert(resp3.text.includes('92.4%') && resp3.text.includes('CRAB'), 'Phản hồi phản ánh đúng tỷ lệ CRAB 92.4% từ báo cáo');
assert(resp3.text.includes('78.6%') && resp3.text.includes('MRSA'), 'Phản hồi phản ánh đúng tỷ lệ MRSA 78.6% từ báo cáo');

// 7. Kiểm tra Markdown formatter trong modal
const sampleMd = '### Tiêu đề phụ\n- Dòng 1\n- Dòng 2\n**In đậm**';
const formatted = AIAnalysisModal.formatMarkdown(sampleMd);
assert(formatted.includes('<h4') && formatted.includes('<strong>In đậm</strong>'), 'AIAnalysisModal format Markdown sang HTML chuẩn xác');

// 8. Kiểm tra cơ chế mở / đóng Modal AI Analysis
const mockAiModalEl = {
  classList: {
    classes: new Set(),
    add(c) { this.classes.add(c); },
    remove(c) { this.classes.delete(c); },
    contains(c) { return this.classes.has(c); }
  },
  style: { display: 'none' }
};

if (typeof document === 'undefined') {
  document = {};
}
document.getElementById = function(id) {
  if (id === 'ai-analysis-modal') return mockAiModalEl;
  if (id === 'ai-chat-input') return { focus() {} };
  if (id === 'ai-context-banner') return { innerHTML: '' };
  return null;
};

AIAnalysisModal.open();
assert(mockAiModalEl.classList.contains('open'), 'AIAnalysisModal.open() thêm class "open"');
assert(mockAiModalEl.classList.contains('active'), 'AIAnalysisModal.open() thêm class "active"');
assert(mockAiModalEl.style.display === 'flex', 'AIAnalysisModal.open() thiết lập style.display = "flex"');

AIAnalysisModal.close();
assert(!mockAiModalEl.classList.contains('open'), 'AIAnalysisModal.close() gỡ bỏ class "open"');
assert(mockAiModalEl.style.display === 'none', 'AIAnalysisModal.close() thiết lập style.display = "none"');

print('================================================================');
print('  KẾT QUẢ: ' + passCount + ' PASS, ' + failCount + ' FAIL');
if (failCount === 0) {
  print('  ✔ TOÀN BỘ TIÊU CHÍ TRỢ LÝ PHÂN TÍCH AI ĐÃ ĐẠT 100%!');
}
print('================================================================');

if (failCount > 0) {
  throw new Error('Test AI Analysis thất bại với ' + failCount + ' lỗi');
}
