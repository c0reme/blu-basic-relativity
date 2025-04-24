// @ts-check
import { defineConfig } from "astro/config";

import tailwind from "@tailwindcss/vite";

import solidJs from "@astrojs/solid-js";

export default defineConfig({
  site: "https://c0reme.github.io",
  base: "/blu-basic-relativity/",
  vite: { plugins: [tailwind()] },
  integrations: [solidJs()],
});
