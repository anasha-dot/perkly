import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const apiPort = process.env.PORT ?? "3001";

export default defineConfig({
  plugins: [vue()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${apiPort}`,
      },
    },
  },
});
