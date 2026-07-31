#!/bin/bash
set -e

echo "==> Post-merge setup başlıyor..."

# Install/update npm dependencies
echo "==> npm bağımlılıkları yükleniyor..."
npm install --prefer-offline 2>/dev/null || npm install

# Run database migrations/push if drizzle config exists
if [ -f "drizzle.config.ts" ] || [ -f "drizzle.config.js" ]; then
  echo "==> Veritabanı şeması güncelleniyor..."
  npm run db:push 2>/dev/null || npx drizzle-kit push --yes 2>/dev/null || echo "DB push atlandı (bağlantı yok olabilir)"
fi

echo "==> Post-merge setup tamamlandı."
