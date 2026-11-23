import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  publicDir: fileURLToPath(new URL('./node_modules/@upscalerjs/esrgan-slim/models/x2/', import.meta.url)),
});
