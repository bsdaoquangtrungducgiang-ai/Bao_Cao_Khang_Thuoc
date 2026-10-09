/**
 * TEST SUITE: KIỂM TRA DANH SÁCH 12 NHÂN SỰ KHOA VI SINH - BV ĐA KHOA ĐỨC GIANG (JSC COMPATIBLE)
 */

var _sysPrint = (typeof print === 'function') ? print : function(msg) {};
var print = _sysPrint;

if (typeof console === 'undefined') {
  var console = {
    log: function(msg) { _sysPrint(msg); },
    warn: function(msg) { _sysPrint("[WARN] " + msg); },
    error: function(msg) { _sysPrint("[ERROR] " + msg); }
  };
}

if (typeof window === 'undefined') {
  var window = (typeof globalThis !== 'undefined') ? globalThis : this;
}

if (typeof localStorage === 'undefined') {
  var _storage = {};
  var localStorage = {
    getItem: function(k) { return _storage[k] || null; },
    setItem: function(k, v) { _storage[k] = String(v); },
    removeItem: function(k) { delete _storage[k]; }
  };
  window.localStorage = localStorage;
}

window.Toast = {
  success: function() {},
  error: function() {},
  info: function() {}
};

function assert(condition, message) {
  if (!condition) {
    _sysPrint('  [FAIL] ' + message);
    throw new Error('FAILED: ' + message);
  }
  _sysPrint('  [PASS] ' + message);
}

// Mock DOM cho SystemCatalogsView
function MockElement(id, tag) {
  this.id = id;
  this.tagName = (tag || 'DIV').toUpperCase();
  this.style = {};
  this.innerHTML = '';
  this.textContent = '';
  this.value = '';
  this.children = [];
  this.dataset = {};
  var self = this;
  this.classList = {
    _set: {},
    add: function(c) { self.classList._set[c] = true; },
    remove: function(c) { delete self.classList._set[c]; },
    contains: function(c) { return !!self.classList._set[c]; }
  };
  this.listeners = {};
  this.appendChild = function(child) {
    self.children.push(child);
    return child;
  };
  this.addEventListener = function(evt, handler) {
    self.listeners[evt] = handler;
  };
}

var mockElements = {};
function getOrCreateEl(id, tag) {
  if (!mockElements[id]) {
    mockElements[id] = new MockElement(id, tag);
  }
  return mockElements[id];
}

var document = {
  getElementById: function(id) {
    return getOrCreateEl(id);
  },
  createElement: function(tag) {
    return new MockElement(null, tag);
  },
  querySelectorAll: function() {
    return [];
  }
};
window.document = document;

// Nạp các script
if (typeof load !== 'undefined') {
  load('js/config.js');
  load('js/services/authService.js');
  load('js/components/systemCatalogsView.js');
}

print('\n================================================================');
print('  CHẠY BỘ TEST 10: DANH SÁCH 12 NHÂN SỰ KHOA VI SINH BV ĐỨC GIANG');
print('================================================================\n');

// 1. Kiểm tra số lượng nhân viên
var users = AuthService.getUserList();
assert(Array.isArray(users), 'AuthService.getUserList() trả về mảng danh sách');
assert(users.length === 12, 'Danh sách có chính xác 12 nhân sự (thực tế: ' + users.length + ')');

// 2. Danh sách dữ liệu mẫu: Duy nhất 1 Admin là Bsdaoquangtrung@gmail.com, 11 nhân viên còn lại là User
var expectedStaff = [
  { stt: 1, name: 'Đào Quang Trung', title: 'BS.CK2', email: 'bsdaoquangtrung@gmail.com', role: 'admin' },
  { stt: 2, name: 'Chu Thị Huyền', title: 'BS.CKI', email: 'huyenct1992@gmail.com', role: 'user' },
  { stt: 3, name: 'Vũ Thị Thu Trang', title: 'CN.XN', email: 'vutrangbvdg@gmail.com', role: 'user' },
  { stt: 4, name: 'Nguyễn Ngọc Linh', title: 'CN.XN', email: 'linh30011987@gmail.com', role: 'user' },
  { stt: 5, name: 'Đỗ Quốc Hưng', title: 'CN.XN', email: 'batqua3@gmail.com', role: 'user' },
  { stt: 6, name: 'Trần Thúy Liên', title: 'Thạc Sỹ', email: 'tranthuyliench22@gmail.com', role: 'user' },
  { stt: 7, name: 'Trần Thị Quy', title: 'Thạc Sỹ', email: 'quycnsh@gmail.com', role: 'user' },
  { stt: 8, name: 'Nguyễn Thị Kim Loan', title: 'KTV – CĐ', email: 'Kimloannguyen18977@gmail.com', role: 'user' },
  { stt: 9, name: 'Nghiêm Thị Làn', title: 'KTV – CĐ', email: 'chilanhn82@gmail.com', role: 'user' },
  { stt: 10, name: 'Trần Thanh Bình', title: 'KTV – CĐ', email: 'T.bjnho2@gmail.com', role: 'user' },
  { stt: 11, name: 'Nguyễn Duy Dũng', title: 'KTV – CĐ', email: 'nguyendungyk87@gmail.com', role: 'user' },
  { stt: 12, name: 'Nguyễn Thị Lan', title: 'Hộ Lý', email: 'nhim01011983@gmail.com', role: 'user' }
];

expectedStaff.forEach(function(exp, idx) {
  var actual = users[idx];
  assert(actual.stt === exp.stt, 'STT ' + exp.stt + ': Khớp số thứ tự ' + exp.stt);
  assert(actual.full_name === exp.name, 'STT ' + exp.stt + ': Tên "' + exp.name + '" chính xác');
  assert(actual.title === exp.title, 'STT ' + exp.stt + ': Chức danh "' + exp.title + '" chính xác');
  assert(actual.email === exp.email, 'STT ' + exp.stt + ': Email "' + exp.email + '" chính xác');
  assert(actual.role === exp.role, 'STT ' + exp.stt + ': Vai trò RBAC "' + exp.role + '" chuẩn xác');
  assert(actual.department === 'Khoa Vi sinh', 'STT ' + exp.stt + ': Thuộc Khoa Vi sinh');
  assert(actual.status === 'active', 'STT ' + exp.stt + ': Trạng thái active');
});

// 3. Kiểm tra chuyển vai trò demoUsers (backward compatibility)
AuthService.setDemoRole('admin');
assert(AuthService.getRole() === 'admin', 'Chuyển sang vai trò Admin thành công');
assert(AuthService.getProfile().email === 'bsdaoquangtrung@gmail.com', 'Admin profile là BS.CK2 Đào Quang Trung');

AuthService.setDemoRole('manager');
assert(AuthService.getRole() === 'manager', 'Chuyển sang vai trò Manager thành công');
assert(AuthService.getProfile().email === 'huyenct1992@gmail.com', 'Manager profile là BS.CKI Chu Thị Huyền');

AuthService.setDemoRole('user');
assert(AuthService.getRole() === 'user', 'Chuyển sang vai trò User thành công');
assert(AuthService.getProfile().email === 'vutrangbvdg@gmail.com', 'User profile là CN.XN Vũ Thị Thu Trang');

AuthService.setDemoRole('viewer');
assert(AuthService.getRole() === 'viewer', 'Chuyển sang vai trò Viewer thành công');
assert(AuthService.getProfile().email === 'nhim01011983@gmail.com', 'Viewer profile là Nguyễn Thị Lan');

// 4. Kiểm tra render bảng người dùng SystemCatalogsView
var tbody = getOrCreateEl('table-users-body', 'TBODY');
SystemCatalogsView.renderUsers();
assert(tbody.children.length === 12, 'SystemCatalogsView.renderUsers() render đúng 12 hàng nhân sự (thực tế: ' + tbody.children.length + ')');

// 5. Kiểm tra ĐĂNG NHẬP THEO QUY TẮC MỚI (Login Gate & RBAC)
print('\n--- KIỂM TRA ĐĂNG NHẬP PHÂN QUYỀN RBAC MỚI ---');

// 5.1. Đăng nhập Admin với mật khẩu "Admin"
AuthService.logout();
assert(!AuthService.isAuthenticated(), 'Đăng xuất thành công, chưa authenticated');

var adminLoginRes = AuthService.login('bsdaoquangtrung@gmail.com', 'Admin');
assert(AuthService.isAuthenticated(), 'Admin đăng nhập thành công');
assert(AuthService.getRole() === 'admin', 'Admin có role là admin');
assert(AuthService.hasRole(['admin']) === true, 'Admin có quyền admin để xem trường Hệ Thống');

// 5.2. Đăng nhập Admin với mật khẩu gõ "Amind" (theo mô tả yêu cầu)
AuthService.logout();
AuthService.login('bsdaoquangtrung@gmail.com', 'Amind');
assert(AuthService.getRole() === 'admin', 'Admin đăng nhập với mật khẩu "Amind" thành công');

// 5.3. Đăng nhập Nhân viên y tế (vutrangbvdg@gmail.com) với mật khẩu "User"
AuthService.logout();
var staffLoginRes = AuthService.login('vutrangbvdg@gmail.com', 'User');
assert(AuthService.isAuthenticated(), 'Nhân viên y tế đăng nhập thành công');
assert(AuthService.getRole() === 'user', 'Nhân viên y tế có role là user');
assert(AuthService.hasRole(['admin']) === false, 'Nhân viên y tế KHÔNG có quyền xem trường Hệ Thống');

// 5.4. Đăng nhập Khách với tài khoản "User" và mật khẩu "User"
AuthService.logout();
var guestLoginRes = AuthService.login('User', 'User');
assert(AuthService.isAuthenticated(), 'Tài khoản Khách đăng nhập thành công');
assert(AuthService.getRole() === 'user', 'Tài khoản Khách có role là user');
assert(AuthService.hasRole(['admin']) === false, 'Khách KHÔNG có quyền xem trường Hệ Thống');

// 5.5. Kiểm tra từ chối mật khẩu sai
var wrongPwCaught = false;
try {
  AuthService.login('bsdaoquangtrung@gmail.com', 'WrongPass');
} catch (e) {
  wrongPwCaught = true;
}
assert(wrongPwCaught === true, 'Báo lỗi và từ chối khi nhập sai mật khẩu Admin');

var wrongStaffPwCaught = false;
try {
  AuthService.login('vutrangbvdg@gmail.com', 'Admin');
} catch (e) {
  wrongStaffPwCaught = true;
}
assert(wrongStaffPwCaught === true, 'Báo lỗi khi nhân viên cố đăng nhập với mật khẩu Admin');

// 5.6. Kiểm tra từ chối tài khoản không tồn tại
var notFoundCaught = false;
try {
  AuthService.login('unknown_doctor@hospital.vn', 'User');
} catch (e) {
  notFoundCaught = true;
}
assert(notFoundCaught === true, 'Báo lỗi khi tài khoản không nằm trong danh sách 12 nhân viên hoặc User');

// 5.7. Kiểm tra phân quyền trường Hệ Thống (Chỉ Admin xem và thao tác được)
AuthService.login('vutrangbvdg@gmail.com', 'User');
assert(AuthService.hasRole(['admin']) === false, 'Nhân viên User: bị chặn truy cập trường Hệ Thống');
assert(AuthService.canManageUsers() === false, 'Nhân viên User: không được quản lý người dùng');
assert(AuthService.canDeleteData() === false, 'Nhân viên User: không được xóa dữ liệu');

AuthService.login('bsdaoquangtrung@gmail.com', 'Admin');
assert(AuthService.hasRole(['admin']) === true, 'Admin duy nhất: có toàn quyền truy cập trường Hệ Thống');
assert(AuthService.canManageUsers() === true, 'Admin duy nhất: được quyền quản lý danh sách người dùng');
assert(AuthService.canDeleteData() === true, 'Admin duy nhất: được quyền xóa dữ liệu');

print('\n================================================================');
print('  ✔ TOÀN BỘ CÁC BÀI TEST 12 NHÂN SỰ & PHÂN QUYỀN ĐĂNG NHẬP ĐẠT 100%!');
print('================================================================\n');

