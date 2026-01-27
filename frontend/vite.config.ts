import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tsconfigPaths from 'vite-tsconfig-paths' (optional)

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),          // React support
//     tsconfigPaths(),  // Respect tsconfig paths (optional)
//   ],
//   test: {
//     globals: true,           // Allows using describe/it/test without importing
//     environment: 'jsdom',   // Simulates browser for React components
//     setupFiles: './src/setupTests.ts', // Global test setup (e.g., jest-dom)
//     include: ['src/**/*.{test,spec}.{ts,tsx}'], // Only test files
//     coverage: {
//       provider: 'c8',       // Fast and standard coverage tool
//       reporter: ['text', 'lcov'], // CLI summary + HTML for CI
//       all: true,             // Include all files, even untested
//       src: ['src'],          // Only include source files
//       exclude: ['**/*.d.ts', '**/index.ts'], // Exclude type definitions or entry files
//     },
//     watch: false,           // Disable watch by default for production CI
//   },
// })
