# KOHA

Website xem phim dùng dữ liệu từ https://phimapi.com (HTML + CSS + JS thuần, không cần build).

## Chạy
Mở `index.html` bằng trình duyệt có kết nối mạng. (Hoặc chạy `python3 -m http.server` trong thư mục này rồi mở http://localhost:8000)

## Cấu trúc
- `index.html` – khung trang
- `css/style.css` – toàn bộ giao diện
- `js/images.js` – xử lý hình ảnh (nhiều CDN/proxy, timeout, placeholder, chẩn đoán)
- `js/player.js` – trình phát video HLS tùy chỉnh
- `js/app.js` – dữ liệu, hero, hàng phim, modal, tìm kiếm

## Ảnh không hiện?
Nhấn **Shift + D** để mở bảng chẩn đoán ảnh, bấm vào bảng để sao chép nội dung.
