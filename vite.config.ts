import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",
  build: {
    target: "es2022",
    outDir: "dist",
  },
  server: {
    host: true,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  plugins: [
    VitePWA({
      manifest: false,
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
            },
          },
        ],
      },
    }),
  ],
});
