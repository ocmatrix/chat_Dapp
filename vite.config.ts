import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './', // Crucial for IPFS
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'ethers', 'peerjs'],
            ui: ['@google/genai']
          }
        }
      }
    },
    plugins: [react()],
    define: {
      global: 'window',
      // Safe injection of API Key
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
      // Prevent crash if some lib accesses process.env directly
      'process.env': {} 
    }
  }
})