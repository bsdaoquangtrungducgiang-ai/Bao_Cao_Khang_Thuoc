# BAO-CAO-KHANG-THUOC 🧪📊
### Hệ Thống Báo Cáo & Giám Sát Kháng Kháng Sinh (AMR Surveillance & Antibiogram)
**Đơn vị sử dụng:** Khoa Vi sinh / Khoa Xét nghiệm / Ban Kiểm soát Nhiễm khuẩn Bệnh viện  
**Công nghệ:** HTML5, CSS3, JavaScript thuần (Vanilla ES6+ Modular), Supabase PostgreSQL, Chart.js v4.4, SheetJS

---

## I. TỔNG QUAN HỆ THỐNG
Hệ thống **BAO-CAO-KHANG-THUOC** là ứng dụng chuyên biệt phục vụ công tác giám sát dịch tễ học vi sinh và tình hình kháng kháng sinh (Antimicrobial Resistance - AMR) tại bệnh viện. Ứng dụng hỗ trợ quy trình khép kín:
```
UPLOAD FILE → ĐỌC DỮ LIỆU → NHẬN DIỆN CỘT → CHUẨN HÓA → KIỂM TRA → LƯU DATABASE → PHÂN TÍCH → BIỂU ĐỒ → BÁO CÁO AMR
```

### Điểm nổi bật:
- **Kiến trúc Clean & Modular:** Mã nguồn viết bằng JavaScript thuần rõ ràng, không phụ thuộc framework phức tạp, chạy trực tiếp trên mọi trình duyệt web hoặc máy chủ web tĩnh.
- **Kết nối Trực tiếp Supabase:** Kết nối Supabase JavaScript Client qua CDN `@supabase/supabase-js` v2, hỗ trợ PostgreSQL với Row Level Security (RLS) đa tầng.
- **Bộ Công thức Chuẩn CLSI / EUCAST:** Động cơ phân tích trung tâm tính toán tỷ lệ $S\%$, $I\%$, $R\%$ chuẩn hóa, tự động loại trừ các kết quả `NA`, `NS`, `Not Tested` khỏi mẫu số.
- **Sẵn sàng Hoạt động Tức thì:** Tích hợp bộ dữ liệu mẫu (Demo Store) gồm **100 bệnh nhân**, **150 bệnh phẩm**, **200 chủng vi khuẩn** và **1,000 kết quả AST** (tỷ lệ $S = 62\%$, $I = 8\%$, $R = 30\%$) giúp người dùng trải nghiệm và kiểm thử ngay lập tức ngay cả khi chưa kết nối database.

---

## II. CẤU TRÚC THƯ MỤC
```text
bao-cao-khang-thuoc/
├── index.html                   # Giao diện chính phòng xét nghiệm (Dashboard, Filters, Modals)
├── css/
│   ├── style.css                # Hệ thống thiết kế UI Medical Blue & Slate chuẩn y tế
│   └── responsive.css           # Tối ưu hiển thị Desktop, Laptop và Tablet
├── js/
│   ├── config.js                # Cấu hình hệ thống, URL Supabase, phiên bản CLSI
│   ├── supabaseClient.js        # Quản lý kết nối Supabase và kiểm tra sức khỏe cơ sở dữ liệu
│   ├── services/
│   │   ├── authService.js       # Xác thực người dùng, Supabase Auth & Role-based Access Control
│   │   ├── auditService.js      # Nhật ký kiểm toán y tế (Audit Log) theo tiêu chuẩn an ninh
│   │   ├── demoDataService.js   # Bộ phát sinh dữ liệu mẫu 1,000 kết quả AST theo mục XLIX & L
│   │   ├── analyticsService.js  # Động cơ tính toán dịch tễ, Antibiogram, Heatmap, Xu hướng
│   │   └── astService.js        # Dịch vụ truy vấn và đồng bộ dữ liệu kháng sinh đồ
│   ├── components/
│   │   ├── navigation.js        # Điều hướng thanh bên Sidebar theo danh mục mục XXXIX
│   │   ├── kpiCards.js          # Thẻ KPI tổng quan phòng xét nghiệm vi sinh
│   │   ├── authModal.js         # Hộp thoại đăng nhập & chuyển đổi vai trò (Role Switcher)
│   │   └── toast.js             # Thông báo trạng thái Toast Alerts
│   └── app.js                   # Bộ điều phối trung tâm ứng dụng và biểu đồ Chart.js
├── supabase/
│   ├── migrations/              # Trọn bộ 10 file migration SQL chuẩn quan hệ
│   │   ├── 001_create_profiles.sql
│   │   ├── 002_create_patients.sql
│   │   ├── 003_create_specimens.sql
│   │   ├── 004_create_organisms.sql
│   │   ├── 005_create_antibiotics.sql
│   │   ├── 006_create_cultures.sql
│   │   ├── 007_create_ast_results.sql
│   │   ├── 008_create_import_jobs.sql
│   │   ├── 009_create_audit_logs.sql
│   │   └── 010_create_rls.sql
│   ├── seed/
│   │   └── seed_data.sql        # Script nạp dữ liệu mẫu 100 BN, 150 mẫu, 1,000 AST vào Supabase
│   └── full_schema_and_seed.sql # File gộp tất cả migration & seed (Chạy 1 lần trong Supabase)
├── tests/
│   ├── phase1_tests.js          # Bộ kiểm thử chuẩn Node.js
│   └── run_jsc_tests.js         # Bộ kiểm thử tương thích JavaScriptCore (macOS native)
├── .env.example
├── .gitignore
└── README.md
```

---

## III. HƯỚNG DẪN CÀI ĐẶT & KẾT NỐI SUPABASE

### 1. Thông tin Supabase
Cấu hình mặc định trong `js/config.js`:
- **SUPABASE_URL:** `https://xdwtryayaxodxebyfysx.supabase.co`
- **SUPABASE_KEY:** `sb_publishable_rR9eBuTH1XnfL0LKbJjCuQ_dZdrg-Al`

### 2. Khởi tạo Cơ sở dữ liệu PostgreSQL trên Supabase
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn dự án của bạn &rarr; Chọn menu **SQL Editor** ở thanh công cụ bên trái.
3. Nhấn **New Query**.
4. Mở file [supabase/full_schema_and_seed.sql](supabase/full_schema_and_seed.sql), sao chép toàn bộ nội dung và dán vào SQL Editor.
5. Nhấn nút **Run** (hoặc tổ hợp phím `Ctrl + Enter` / `Cmd + Enter`).
6. Supabase sẽ tự động khởi tạo:
   - 10 bảng dữ liệu có ràng buộc khóa ngoại (Foreign Keys)
   - Các chỉ mục (Indexes) tối ưu hóa truy vấn triệu bản ghi
   - Chính sách Row Level Security (RLS) phân quyền y tế
   - Tự động nạp sẵn danh mục vi khuẩn, kháng sinh, khoa phòng và **1,000 kết quả kháng sinh đồ mẫu**.

### 3. Chạy Ứng dụng
Vì ứng dụng được xây dựng hoàn toàn bằng **HTML, CSS, JavaScript thuần**, bạn có thể:
- Mở trực tiếp file `index.html` trên trình duyệt (Google Chrome, Microsoft Edge, Safari, Firefox).
- Hoặc phục vụ qua bất kỳ máy chủ HTTP đơn giản nào:
```bash
# Sử dụng Python 3 có sẵn trên máy:
python3 -m http.server 8080

# Sau đó truy cập: http://localhost:8080
```

---

## IV. PHÂN QUYỀN NGƯỜI DÙNG (RBAC)
Hệ thống thiết lập 4 cấp độ người dùng theo mục II & XXXVI:

| Vai trò (Role) | Upload File | Sửa dữ liệu | Xóa dữ liệu | Xem báo cáo | Quản lý User |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Admin** | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ✅ Có |
| **Manager** | ✅ Có | ✅ Có | ❌ Không | ✅ Có | ❌ Không |
| **User** | ✅ Có | ❌ Không | ❌ Không | ✅ Có | ❌ Không |
| **Viewer** | ❌ Không | ❌ Không | ❌ Không | ✅ Có | ❌ Không |

> **Thử nghiệm nhanh:** Nhấn vào ô thông tin người dùng ở góc trên bên phải màn hình để mở hộp thoại chuyển đổi vai trò tức thì giữa Admin, Manager, User và Viewer.

---

## V. CÔNG THỨC TÍNH TOÁN DỊCH TỄ HỌC VI SINH (ANALYTICS ENGINE)
Mọi công thức phân tích đều được tập trung duy nhất tại `js/services/analyticsService.js`:
- Mẫu số thực tế ($Denominator$):
  $$\text{Denominator} = S + I + R$$
  *(Tuyệt đối không tính các kết quả NA, NS, SD, Not Tested vào mẫu số theo mục XLVI).*
- Tỷ lệ kháng ($R\%$):
  $$R\% = \frac{R}{S + I + R} \times 100$$
- Tỷ lệ nhạy cảm ($S\%$):
  $$S\% = \frac{S}{S + I + R} \times 100$$
- Tỷ lệ trung gian ($I\%$):
  $$I\% = \frac{I}{S + I + R} \times 100$$
- Kiểm tra tính toàn vẹn: $S + I + R = \text{Denominator}$ và $R\% \le 100\%$.

---

## VI. BỘ KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTS)
Hệ thống cung cấp sẵn bộ kiểm thử xác thực 65 tiêu chí y tế và kỹ thuật.
Để chạy kiểm thử trên macOS:
```bash
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/run_jsc_tests.js
```
Kết quả kiểm thử: **65/65 TESTS ĐẠT (100%)**.
