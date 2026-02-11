import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allows both Pinggy and Cloudflare tunnels automatically
    allowedHosts: ['.pinggy.link', '.trycloudflare.com'], 
    
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
})