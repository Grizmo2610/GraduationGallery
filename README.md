Công nghệ


Frontend: HTML, CSS, JavaScript (render danh sách ảnh, tìm kiếm, filter, tương tác UI) Backend: Python (ví dụ dùng framework như Flask hoặc FastAPI) Dữ liệu: * Nguồn ban đầu: CSV * Sau đó convert sang database (SQLite / PostgreSQL tùy chọn) Lưu trữ ảnh: Google Drive (chỉ lưu link, không lưu file trong server) Cấu trúc dữ liệu Mỗi ảnh có các trường: id tên ảnh người đăng (author) link drive (file id hoặc URL) link hiển thị (dạng lh3.googleusercontent.com hoặc tương đương) metadata khác nếu cần Trang chính (Main Page)


Thanh tìm kiếm Input text Tìm theo: * tên ảnh * tên người đăng Hoạt động realtime hoặc submit
Bộ lọc (Filter) Dropdown danh sách người đăng Cho phép chọn nhiều (multiple checkbox) Khi chọn: * chỉ hiển thị ảnh thuộc các người được tick
Grid hiển thị ảnh Layout dạng grid (nhiều cột) Mỗi ảnh là một block hình chữ nhật đứng Nội dung mỗi block: * Ảnh (fit theo chiều cao box) * Tên ảnh (optional) * Tên người đăng
Hiệu ứng khi hover / click Khi hover vào block: Hiện overlay mờ Hiện 3 nút: Drive Mở link gốc trên Google Drive (tab mới) View Hiển thị ảnh: * modal popup (overlay full màn hình) * hoặc trang riêng (detail view) Ảnh hiển thị kích thước lớn hơn Download Trigger tải ảnh từ Drive: * dùng link dạng /uc?id=...&export=download * hoặc backend proxy file về Backend (Python)
API cung cấp dữ liệu /images * trả danh sách ảnh (JSON) * hỗ trợ query: * search keyword * filter theo author (list)
Xử lý CSV Đọc CSV Parse thành record Insert vào database
Xử lý link Drive Convert: * link /file/d/.../view → link hiển thị (img src) → link download
Optional: proxy download Endpoint: * /download/{id} Backend fetch file từ Drive và trả về client Luồng hoạt động Backend load dữ liệu từ DB Frontend gọi API /images Render grid ảnh Người dùng: * nhập search → gọi lại API * chọn filter → gọi lại API Click: * Drive → mở link * View → mở modal * Download → tải file Tổng kết chức năng Hiển thị toàn bộ ảnh dạng grid Tìm kiếm theo text Filter nhiều người đăng Xem ảnh (modal / page) Mở ảnh gốc trên Drive Tải ảnh từ Drive Không có upload, dữ liệu nhập từ CSV ban đầu