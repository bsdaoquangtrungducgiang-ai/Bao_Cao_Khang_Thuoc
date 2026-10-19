// TEST KIỂM TRA TÍCH HỢP THƯ VIỆN TÀI LIỆU CHUYÊN MÔN & TIÊU CHUẨN CLSI
load('js/config.js');
load('js/data/documentsData.js');
load('js/components/documentLibraryView.js');

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
print('  TEST TÍCH HỢP THƯ VIỆN TÀI LIỆU CHUYÊN MÔN & TIÊU CHUẨN CLSI');
print('================================================================');

// 1. Kiểm tra dữ liệu danh mục
assert(typeof DocumentLibraryData !== 'undefined', 'Dữ liệu DocumentLibraryData đã được load thành công');
assert(Array.isArray(DocumentLibraryData.categories), 'DocumentLibraryData.categories là một mảng');
assert(DocumentLibraryData.categories.length === 6, 'Có đủ 6 chuyên mục chuyên môn vi sinh (' + DocumentLibraryData.categories.length + '/6)');

const expectedCatIds = [
  'clsi_m100',
  'clsi_specialized',
  'vitek_cards',
  'special_resistance',
  'fungal_infections',
  'clinical_books'
];

expectedCatIds.forEach(catId => {
  const found = DocumentLibraryData.categories.some(c => c.id === catId);
  assert(found, 'Tìm thấy chuyên mục: ' + catId);
});

// 2. Kiểm tra tổng số 42 tài liệu
assert(Array.isArray(DocumentLibraryData.documents), 'DocumentLibraryData.documents là một mảng');
assert(DocumentLibraryData.documents.length === 42, 'Tổng số tài liệu chuẩn xác là 42 (' + DocumentLibraryData.documents.length + '/42)');

// 3. Kiểm tra tính toàn vẹn của từng tài liệu
let allValid = true;
let formats = new Set();
DocumentLibraryData.documents.forEach((doc, idx) => {
  if (!doc.id || !doc.title || !doc.category || !doc.cat_id || !doc.path || !doc.format || typeof doc.size_mb !== 'number') {
    allValid = false;
  }
  formats.add(doc.format);
});
assert(allValid, 'Toàn bộ 42 tài liệu đều có đầy đủ thông tin: ID, tiêu đề, phân loại, đường dẫn, định dạng và kích thước');

// 4. Kiểm tra các định dạng tài liệu
assert(formats.has('PDF'), 'Có tài liệu định dạng PDF');
assert(formats.has('XLSX'), 'Có tài liệu bảng tính Excel (XLSX)');
assert(formats.has('PPTX'), 'Có tài liệu bài giảng PowerPoint (PPTX)');
assert(formats.has('DOCX'), 'Có tài liệu quy trình Word (DOCX)');
assert(formats.has('PNG'), 'Có tài liệu ảnh Infographic (PNG)');

// 5. Kiểm tra tài liệu mới nhất CLSI 2026
const clsi2026Docs = DocumentLibraryData.documents.filter(d => d.title.includes('2026') || d.title.includes('Ed36'));
assert(clsi2026Docs.length >= 4, 'Nhóm CLSI 2026 có đầy đủ các tệp quan trọng (Toàn văn, Tóm tắt, Slide, Excel đề kháng tự nhiên, Infographic)');

// 6. Kiểm tra tài liệu Colistin và mCIM
const colistinDocs = DocumentLibraryData.documents.filter(d => d.cat_id === 'special_resistance');
assert(colistinDocs.length === 5, 'Nhóm Kháng thuốc đặc biệt có đủ 5 tài liệu (Colistin, mCIM, ESBL/Carbapenemase)');

// 7. Kiểm tra thẻ VITEK 2
const vitekDocs = DocumentLibraryData.documents.filter(d => d.cat_id === 'vitek_cards');
assert(vitekDocs.length === 6, 'Nhóm Thẻ kháng sinh đồ VITEK 2 có đủ 6 tài liệu (N439, N240, danh mục thẻ)');

print('================================================================');
print('  KẾT QUẢ: ' + passCount + ' PASS, ' + failCount + ' FAIL');
if (failCount === 0) {
  print('  ✔ TOÀN BỘ TIÊU CHÍ THƯ VIỆN TÀI LIỆU ĐÃ ĐẠT 100%!');
}
print('================================================================');

if (failCount > 0) {
  throw new Error('Test Document Library thất bại với ' + failCount + ' lỗi');
}
