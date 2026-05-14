import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
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
        includeAssets: ["favicon.svg"],
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
              src: "favicon.svg",
              sizes: "32x32",
              type: "image/svg+xml",
              purpose: "any",
            },
          ],
        },
      }),
      traeBadgePlugin({
        variant: "dark",
        position: "bottom-right",
        prodOnly: true,
        clickable: true,
        clickUrl: "https://www.trae.ai/solo?showJoin=1",
        autoTheme: true,
        autoThemeTarget: "#root",
      }),
      tsconfigPaths(),
    ],
  };
});
