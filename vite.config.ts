import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './', // Crucial for IPFS/4EVERLAND deployment
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'ethers', 'peerjs'],
            ai: ['@google/genai']
          }
        }
      }
    },
    plugins: [react()],
    define: {
      // Polyfill global for libraries like PeerJS/Ethers in browser
      global: 'window',
      // Inject API Key specifically. 
      // NOTE: We do NOT set 'process.env': {} generally, as it can wipe out the specific key below in some build versions.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
    }
  }
})