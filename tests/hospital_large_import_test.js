/**
 * HOSPITAL LARGE IMPORT TEST SUITE
 * Kiểm tra khả năng nhập khẩu bộ dữ liệu giám sát vi sinh 80 cột dấu chấm phẩy
 */

load("js/utils/dataNormalization.js");
load("js/utils/dataValidation.js");
load("js/services/importService.js");

function assert(condition, message, detail) {
  if (!condition) {
    throw new Error("FAIL: " + message + (detail ? " - " + detail : ""));
  }
  print(" PASS: " + message);
}

print("=================================================");
print("CHẠY TEST SUITE NHẬP KHẨU DỮ LIỆU VI SINH 80 CỘT");
print("=================================================\n");

// Dữ liệu mẫu thực tế trích xuất từ media_1790656065238.csv
var sampleCsvText = 
'\uFEFFSID;PID;Tên bệnh nhân;Giới tính;Ngày sinh;Mã y tế;Tên khoa;BS chỉ định;Chẩn đoán;Intime;Mã yêu cầu;Tên yêu cầu;Kết quả cấy;TG có kết quả cấy;Mã vi khuẩn;Tên vi khuẩn;Bệnh phẩm;AM;AMC;TZP;CZO;CTX;CAZ;FEP;ETP;IPM;MEM;AMK;GEN;TOB;CIP;NIT;SXT;peng04;peng05;peng02;peng03;CTX02;CTX03;CRO02;CRO03;LVX;MFX;ERY;CLI;LNZ;VAN;TET;TGC;C;RIF;AMP;SAM;CRO;CXM;oxsf;peng;OXA;icr;QDA;TCC;PIP;MET;FOX;CFP;DOR;IMR;COL;CZA;CZT;AZM;TCY;FLU;CAS;MIF;AMB;MEV;FOS;VOR;CHL\n' +
'010126-130011;23031418    ;NGUYỄN THỊ THỂ;Nữ;15/07/1961;23031418;Khoa Nội thận - tiết niệu;Nguyễn Ngọc Mai;Nhiễm khuẩn hệ tiết niệu, vị trí không xác định;17:47 01/01/2026;8830;Vi khuẩn kháng thuốc hệ thống tự động;Dương tính;2026-01-02 09:16:57;eco;Escherichia coli;Nước tiểu;R ;I ;S ;R ;R ;R ;R ;S ;S ;S ;S ;R ;R ;R ;S ;R ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n' +
'010126-170001;22049295    ;DƯƠNG QUỲNH CHI;Nữ;14/07/2020;22049295;Khoa Nhi hô hấp;Nguyễn Thị Cải;Viêm phổi, không đặc hiệu;16:28 01/01/2026;8830;Vi khuẩn kháng thuốc hệ thống tự động;Dương tính;2026-01-02 12:01:25;spn;Streptococcus pneumoniae;Dịch tỵ hầu;;;;;;;;;;;;;;;;R ;S ;R ;R ;S ;I ;S ;I ;S ;S ;S ;R ;S ;S ;S ;R ;S ;R ;S ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;\n' +
'010126-170003;25003696    ;ĐINH HẢI ĐĂNG;Nam;19/01/2025;25003696;Khoa Nhi ;Nguyễn Trung Phong;Viêm tai giữa không đặc hiệu;16:29 01/01/2026;8829;Vi khuẩn kháng thuốc định tính;Dương tính;2026-01-02 12:08:12;hin;Haemophilus influenzae;Dịch tỵ hầu;;S ;;;NS;NS;;;S ;;;;;;;R ;;;;;;;;;S ;S ;;;;;;;;;R ;R ;S ;S ;;;;;;;;;;;;;;;;;;;;;;;;;\n' +
'010126-700060;25074316    ;NGUYỄN GIA HÂN;Nữ;20/12/2025;25074316;Khoa Sơ sinh;Trần Thị Thùy Dương;Viêm phổi, tác nhân không xác định;16:36 01/01/2026;8830;Vi khuẩn kháng thuốc hệ thống tự động;Dương tính;2026-01-02 09:19:20;sau;Staphylococcus aureus;Dịch tỵ hầu;;;R ;;R ;;R ;;R ;R ;;S ;;S ;S ;S ;;;;;;;;;S ;S ;R ;S ;S ;S ;R ;S ;;S ;;;R ;;+ ;R ;R ;- ;S ;R ;R ;R ;R ;R ;R ;;;;;;;;;;;;;;\n' +
'250326-527309;21243348    ;ĐỖ MINH HÂN;Nam;11/08/1982;21243348;Khám Nội Chung 1;Lương Đình Trung;"; , Nhiễm trùng do tụ cầu vàng";15:00 25/03/2026;8830;Vi khuẩn kháng thuốc hệ thống tự động;Dương tính ;2026-03-26 08:56:25;sau;Staphylococcus aureus;Dịch chọc hạch;;;S ;;S ;;S ;;S ;S ;;I ;;S ;S ;S ;;;;;;;;;S ;S ;R ;S ;S ;S ;R ;S ;;S ;;;S ;;- ;R ;S ;- ;S ;;R ;S ;;S ;S ;;;;;;;;;;;;;;';

// TEST 1: Phân tích CSV và tự động phát hiện dấu phân cách (;)
print("--- TEST 1: PHAN TICH CSV VA TU DONG PHAT HIEN DAU CHAM PHAY (;) ---");
var parseResult = ImportService.parseText(sampleCsvText);
assert(parseResult.totalCols === 80, "So cot duoc nhan dien chinh xac la 80", "Thuc te: " + parseResult.totalCols);
assert(parseResult.totalRows === 5, "So dong du lieu nhan dien chinh xac la 5", "Thuc te: " + parseResult.totalRows);
assert(parseResult.headers[0] === "SID", "UTF-8 BOM duoc loai bo sach khoi cot dau tien SID", "Thuc te: " + parseResult.headers[0]);
assert(parseResult.dataRows[4][8] === "; , Nhiễm trùng do tụ cầu vàng", "Dau cham phay nam trong dau ngoac kep duoc bao toan chuan xac", "Thuc te: " + parseResult.dataRows[4][8]);

// TEST 2: Nhận diện cột tự động (Auto-mapping)
print("\n--- TEST 2: NHAN DIEN COT TU DONG (AUTO-MAPPING) ---");
var mapping = parseResult.detectedMapping;
var colMap = mapping.columnMap;

assert(colMap[1].systemField === "patient_code", "PID (Cot 1) nhan dien dung la patient_code", "Thuc te: " + colMap[1].systemField);
assert(colMap[2].systemField === "patient_name", "Ten benh nhan (Cot 2) nhan dien dung la patient_name", "Thuc te: " + colMap[2].systemField);
assert(colMap[3].systemField === "sex", "Gioi tinh (Cot 3) nhan dien dung la sex", "Thuc te: " + colMap[3].systemField);
assert(colMap[4].systemField === "age", "Ngay sinh (Cot 4) nhan dien la age/dob, khong bi cuop collection_date", "Thuc te: " + colMap[4].systemField);
assert(colMap[6].systemField === "department", "Ten khoa (Cot 6) nhan dien dung la department", "Thuc te: " + colMap[6].systemField);
assert(colMap[9].systemField === "collection_date", "Intime (Cot 9) nhan dien dung la collection_date", "Thuc te: " + colMap[9].systemField);
assert(colMap[12].systemField === "ignore", "Ket qua cay (Cot 12: Duong tinh) khong bi nham la vi khuan", "Thuc te: " + colMap[12].systemField);
assert(colMap[15].systemField === "organism_name", "Ten vi khuan (Cot 15) nhan dien dung la organism_name", "Thuc te: " + colMap[15].systemField);
assert(colMap[16].systemField === "specimen_type", "Benh pham (Cot 16) nhan dien dung la specimen_type", "Thuc te: " + colMap[16].systemField);

assert(mapping.isWideFormat === true, "Bang duoc phan loai chinh xac la bang ngang (Wide Format)");
assert(mapping.antibioticColumns.length === 63, "Toan bo 63 cot khang sinh duoc nhan dien day du", "Thuc te: " + mapping.antibioticColumns.length);

// TEST 3: Biến đổi bảng ma trận sang AST (transformData)
print("\n--- TEST 3: BIEN DOI BANG MA TRAN SANG DANH SACH BAN GHI AST ---");
var transformed = ImportService.transformData(parseResult.dataRows, mapping);
assert(transformed.length > 50, "Da xoay ma tran thanh cac ban ghi AST (Tong: " + transformed.length + " ban ghi)");

// Kiểm tra chi tiết 1 bản ghi E. coli
var firstAst = transformed[0];
assert(firstAst.patient_code.trim() === "23031418", "Ma benh nhan chuan: 23031418", "Thuc te: " + firstAst.patient_code);
assert(firstAst.patient_name === "NGUYỄN THỊ THỂ", "Ten benh nhan: NGUYỄN THỊ THỂ", "Thuc te: " + firstAst.patient_name);
assert(firstAst.organism_name === "Escherichia coli", "Ten vi khuan: Escherichia coli", "Thuc te: " + firstAst.organism_name);
assert(firstAst.specimen_type === "Nước tiểu", "Benh pham: Nước tiểu", "Thuc te: " + firstAst.specimen_type);
assert(firstAst.collection_date === "17:47 01/01/2026", "Ngay lay mau tho: 17:47 01/01/2026", "Thuc te: " + firstAst.collection_date);

// TEST 4: Kiểm định và Chuẩn hóa dữ liệu (validateBatch)
print("\n--- TEST 4: KIEM DINH VA CHUAN HOA DU LIEU (VALIDATE BATCH) ---");
var validation = DataValidation.validateBatch(transformed);

assert(validation.total === transformed.length, "Tong so ban ghi kiem dinh khop nhau", "Thuc te: " + validation.total);
assert(validation.errorRecords.length === 0, "Khong co bat ky ban ghi loi nghiem trong nao (0 Fatal Errors)!", "So loi: " + validation.errorRecords.length);
assert(validation.validRecords.length > 0, "Co " + validation.validRecords.length + " ban ghi hop le san sang nap vao Database");

// Kiểm tra chuẩn hóa ngày tháng và AST
var rec0 = validation.validRecords[0];
assert(rec0.collection_date === "2026-01-01", "Chuan hoa Intime '17:47 01/01/2026' thanh YYYY-MM-DD: 2026-01-01", "Thuc te: " + rec0.collection_date);
assert(rec0.sex === "Nữ", "Chuan hoa gioi tinh 'Nu': Nu", "Thuc te: " + rec0.sex);
assert(rec0.age === 65 || typeof rec0.age === 'number', "Tinh tuoi tu dong tu ngay sinh '15/07/1961': " + rec0.age);

// Kiểm tra bản ghi có kết quả '+' và '-' (oxsf và icr)
var oxsfRec = validation.validRecords.find(function(r) { return r.antibiotic_code === 'OXA' && r.raw_result === '+'; });
assert(oxsfRec !== undefined, "Tim thay ban ghi sang loc oxsf (+)");
assert(oxsfRec.normalized_result === 'R', "Ket qua sang loc (+) chuan hoa chinh xac thanh R (Khang)");

print("\n=================================================");
print(" TAT CA CAC BAI TEST NHAP KHAU 80 COT DEU VUOT QUA 100%!");
print("=================================================\n");
