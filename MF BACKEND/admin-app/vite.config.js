import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Build output to public/admin-app so Express can serve it
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../public/admin-app",
  },
});
