import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // CRITICAL: Base must be './' for IPFS relative paths to work
    base: './',
    plugins: [react()],
    define: {
      // Polyfill for some web3 libraries that might expect global
      global: 'window',
      // Inject API Key safely during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    }
  }
})