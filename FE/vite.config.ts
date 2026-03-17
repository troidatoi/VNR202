import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  define: {
    global: "window",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "antd-vendor": ["antd", "@ant-design/icons"],
          "ui-vendor": ["framer-motion", "lucide-react", "react-icons"],
          "chart-vendor": ["chart.js", "react-chartjs-2"],
          "editor-vendor": [
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/extension-heading",
            "@tiptap/extension-bullet-list",
            "@tiptap/extension-ordered-list",
            "@tiptap/extension-list-item",
            "@tiptap/extension-underline",
            "draft-js",
            "react-draft-wysiwyg",
            "react-quill",
          ],
          "payment-vendor": ["@paypal/react-paypal-js"],
          "utils-vendor": [
            "axios",
            "date-fns",
            "date-fns-tz",
            "jose",
            "jwt-decode",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    sourcemap: false, // Disable sourcemaps for production
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "antd",
      "@ant-design/icons",
    ],
  },
});
