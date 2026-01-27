// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths' 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),          // React support
    tsconfigPaths(),  // Respect tsconfig paths 
  ],
  test: {
    globals: true,           // Allows using describe/it/test without importing
    environment: 'jsdom',   // Simulates browser for React components
    setupFiles: './src/setupTests.ts', // Global test setup (e.g., jest-dom)
    include: ['src/**/*.{test,spec}.{ts,tsx}'], // Only test files
    coverage: {
      provider: 'v8',       // Fast and standard coverage tool
      reporter: ['text', 'lcov'], // CLI summary + HTML for CI
      include: ['src/**/*.{ts,tsx}'],             // Include all files, even untested
      exclude: [
        '**/*.d.ts',
        '**/index.ts',
        '**/*.test.*',
        '**/*.spec.*',
      ], // Exclude type definitions or entry files
    },
    watch: false,           // Disable watch by default for production CI
  },
})
