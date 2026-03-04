#!/usr/bin/env bash
# package-ios.sh — 从 Xcode DerivedData 提取构建产物，打包为 AltStore 可用的 IPA
# 用法：pnpm package:ios
# 前提：已在 Xcode 中完成 Cmd+R 构建（连接真机）

set -euo pipefail

# ── 1. 找到最新构建的 App.app ──────────────────────────────────────────────
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData \
  -name "App.app" \
  -path "*/Debug-iphoneos/*" \
  -not -path "*/Index.noindex/*" \
  2>/dev/null | head -1)

if [ -z "$APP_PATH" ]; then
  echo "❌ 未找到构建产物"
  echo "   请先在 Xcode 中连接真机并执行 Cmd+R 构建"
  exit 1
fi

echo "📦 找到构建：$APP_PATH"

# ── 2. 输出路径（桌面，带时间戳） ────────────────────────────────────────
OUTPUT="$HOME/Desktop/BurnClock-$(date +%Y%m%d-%H%M).ipa"
TMPDIR_IPA="/tmp/BurnClockIPA_$$"

# ── 3. 打包 ────────────────────────────────────────────────────────────────
rm -rf "$TMPDIR_IPA"
mkdir -p "$TMPDIR_IPA/Payload"
cp -r "$APP_PATH" "$TMPDIR_IPA/Payload/"

# 删除 Xcode Previews 辅助库（AltStore 重签名时无法处理）
# 注意：保留 App.debug.dylib —— Debug 构建的主体代码，不能删
rm -f "$TMPDIR_IPA/Payload/App.app/__preview.dylib"

cd "$TMPDIR_IPA"
zip -qr "$OUTPUT" Payload/
rm -rf "$TMPDIR_IPA"

echo "✅ IPA 已保存：$OUTPUT"
echo ""
echo "下一步："
echo "  1. AirDrop 发送到目标 iPhone"
echo "  2. 手机上选择用 AltStore 打开 → 安装"
echo "  3. AltStore 会自动每 7 天续签（需连同一 WiFi 且 AltServer 运行）"

# 可选：在 Finder 中高亮显示 IPA 文件
open -R "$OUTPUT" 2>/dev/null || true
