# Lễ Thành Hôn — Minh Châu & Khôi Nguyên (Màn Sao Rơi)

Giao diện màn sao rơi Dải Ngân Hà độ phân giải cao (WebGL + High-DPI Canvas 2D), tối ưu hiển thị toàn màn hình cho màn hình LED sân khấu.

## Bật GitHub Pages (lấy link mở trên màn LED)

1. Vào **Settings → Pages** của repository này trên GitHub.
2. Ở mục **Build and deployment → Source**, chọn **Deploy from a branch**.
3. Chọn branch **`main`** và thư mục **`/ (root)`**, sau đó bấm **Save**.
4. Chờ ~1 phút để nhận link `https://<username>.github.io/<ten-repo>/`.

## Tham số URL khi chiếu màn LED

- Ẩn toàn bộ nút điều khiển: `?hud=0`
- Đổi chế độ sao rơi (`balanced`, `shower`, `meteors`, `dreamy`): `?mode=shower`
- Đổi ngày hiển thị: `?date=14/11/2026`

Ví dụ:
```text
https://<username>.github.io/<ten-repo>/?hud=0&mode=balanced
```

## Phím tắt sân khấu

- `F`: Bật/tắt toàn màn hình
- `Space` hoặc Click: Thả mưa sao băng
- `C`: Mở/đóng bảng tùy chỉnh nội dung & hiệu ứng
- `H`: Ẩn/hiện thanh nút điều khiển
- `R`: Phát lại hiệu ứng chữ mở màn

