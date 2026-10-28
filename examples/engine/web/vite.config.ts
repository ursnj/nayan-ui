import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: { dedupe: ["react", "react-dom", "@nayan-ui/engine"] },
});
