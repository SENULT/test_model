import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  assetsInclude: ['**/*.wasm', '**/*.pmx', '**/*.vmd'],
  optimizeDeps: {
    exclude: ['pose_solver', 'babylon-mmd']
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'babylon': ['@babylonjs/core'],
          'babylon-mmd': ['babylon-mmd']
        }
      }
    }
  },
  worker: {
    format: 'es'
  }
})
