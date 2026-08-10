import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Publicamos en Netlify (dominio propio), así que la base es "/".
export default defineConfig({
  plugins: [react()],
  base: "/",
});
