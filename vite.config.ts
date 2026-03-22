import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],
      manifest: {
        name: "Fit Track",
        short_name: "FitTrack",
        description:
          "Offline-first fit tracker suly, etkezes, edzes es testmeret naplozassal.",
        theme_color: "#101418",
        background_color: "#101418",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "hu",
        orientation: "portrait",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("react-router-dom")
          ) {
            return "react-vendor";
          }

          if (id.includes("@supabase/supabase-js")) {
            return "supabase-vendor";
          }

          if (
            id.includes("@tanstack/react-query") ||
            id.includes("dexie") ||
            id.includes("zod") ||
            id.includes("zustand")
          ) {
            return "data-vendor";
          }
        }
      }
    }
  }
});
