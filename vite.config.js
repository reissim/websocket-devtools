import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "vite-plugin-web-extension";
import { readdirSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    webExtension({
      manifest: "./src/manifest.json",
      watchFilePaths: ["src/**/*"],
      additionalInputs: [
        "src/content/injected.js",
        "src/devtools/panel.html",
        "src/popup/popup.html",
      ],
      onBundleReady: () => {
        const srcDir = resolve(__dirname, "icons");
        const destDir = resolve(__dirname, "dist/icons");

        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }

        const icons = readdirSync(srcDir);
        icons.forEach((icon) => {
          copyFileSync(resolve(srcDir, icon), resolve(destDir, icon));
        });
      },
    }),
  ],
  build: {
    minify: mode === "development" ? false : true,
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
      },
    },
    watch:
      mode === "development"
        ? {
            include: ["src/**/*"],
            exclude: ["node_modules/**", "dist/**"],
            buildDelay: 300,
          }
        : null,
  },
}));
