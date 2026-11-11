#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# 🌠 Khởi chạy Màn Sao Rơi trên Màn LED / Kiosk
# ═══════════════════════════════════════════════════════════════════════
# Cách dùng:
#   chmod +x chay-man-led.sh
#   ./chay-man-led.sh
#
# Script sẽ tự mở Chrome/Chromium ở chế độ kiosk toàn màn hình,
# ẩn thanh địa chỉ, ẩn con trỏ chuột — phù hợp cho màn LED sân khấu.
# ═══════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HTML_FILE="$SCRIPT_DIR/man-sao-roi-bundle.html"

# Tìm trình duyệt
BROWSER=""
for b in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$b" &>/dev/null; then
    BROWSER="$b"
    break
  fi
done

if [ -z "$BROWSER" ]; then
  echo "❌ Không tìm thấy Chrome hoặc Chromium."
  echo "   Cài đặt: sudo apt install chromium-browser"
  echo "   Hoặc mở thủ công: file://$HTML_FILE"
  exit 1
fi

echo "🌠 Đang mở Màn Sao Rơi trên màn LED..."
echo "   File: $HTML_FILE"
echo "   Browser: $BROWSER"
echo ""
echo "   Nhấn Ctrl+C hoặc Alt+F4 để thoát."

# Ẩn con trỏ chuột (nếu có unclutter)
if command -v unclutter &>/dev/null; then
  unclutter -idle 1 -root &
  UNCLUTTER_PID=$!
fi

# Chạy Chrome kiosk mode
"$BROWSER" \
  --kiosk \
  --start-fullscreen \
  --no-first-run \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-translate \
  --noerrdialogs \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --user-data-dir="/tmp/man-sao-roi-kiosk-profile" \
  "file://$HTML_FILE" \
  2>/dev/null

# Cleanup
if [ -n "$UNCLUTTER_PID" ]; then
  kill "$UNCLUTTER_PID" 2>/dev/null
fi

echo "🌙 Đã tắt màn sao rơi."

