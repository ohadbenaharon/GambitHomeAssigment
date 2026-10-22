/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': `${import.meta.dirname}/src` },
  },
  build: {
    // Explicit, though it's Vite's default: production ships minified bundles
    // without .map files, so DevTools > Sources shows no original source.
    sourcemap: false,
  },
  test: {
    environment: 'node',
  },
})
