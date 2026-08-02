import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  // root "client" olduğu için .env'i proje kökünden okumasını sağlıyoruz
  envDir: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        /*
         * Satıcı paketlerini ayrı parçalara böler.
         *
         * Amaç yalnızca "ilk yüklemeyi küçültmek" değil, aynı zamanda
         * ÖNBELLEĞİ KORUMAK: uygulama kodu her dağıtımda değişir, satıcı
         * paketleri neredeyse hiç değişmez. Ayrı tutulduklarında kullanıcı
         * her güncellemede React'i ve arayüz kütüphanesini yeniden indirmez.
         *
         * Sayfa kodları zaten rota bazında tembel yükleniyor (App.tsx);
         * buradaki bölme onun tamamlayıcısı.
         */
        manualChunks: {
          react: ["react", "react-dom", "wouter"],
          query: ["@tanstack/react-query"],
          charts: ["recharts"],
          // Radix arayüz ilkelleri: çok sayıda küçük paket, hepsi birlikte
          // kullanılıyor ve sürümleri seyrek değişiyor.
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          icons: ["lucide-react", "react-icons"],
          dates: ["date-fns"],
        },
      },
    },
  },
  server: {
    port: 5173,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
