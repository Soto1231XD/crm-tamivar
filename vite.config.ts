import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  define: {
    __APP_BUILD__: JSON.stringify(
      `${process.env.npm_package_version ?? "0.0.0"}-${Date.now()}`,
    ),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["logo_web.png", "logo_pwa.png"],
      manifest: false,
      injectManifest: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      // Definimos que @ apunta a la carpeta src
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
