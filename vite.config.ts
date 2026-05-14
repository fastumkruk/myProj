import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(() => {
  const base = process.env.VITE_BASE_PATH || "/";

  return {
    base,
    build: {
      sourcemap: "hidden",
    },
    plugins: [
      react({
        babel: {
          plugins: ["react-dev-locator"],
        },
      }),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.svg",
          "favicon-32.png",
          "apple-touch-icon.png",
          "pwa-192.png",
          "pwa-512.png",
        ],
        manifest: {
          name: "Списки покупок",
          short_name: "Покупки",
          description: "Общие списки покупок с синхронизацией",
          theme_color: "#0A0B0D",
          background_color: "#0A0B0D",
          display: "standalone",
          orientation: "portrait",
          start_url: base,
          scope: base,
          icons: [
            {
              src: "pwa-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "pwa-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
      tsconfigPaths(),
    ],
  };
});
