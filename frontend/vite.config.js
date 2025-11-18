import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/', 
  build: {
    // Ensures the build directory is 'dist' (default, but good to check)
    outDir: 'dist',
  },
  
  // 🚀 SERVER CONFIGURATION WITH PROXY 🚀
  server: {
    proxy: {
      // All requests starting with '/api' (like /api/contact) will be forwarded
      // to your backend running on port 5000.
      '/api': {
        target: 'http://localhost:5000', // <-- Backend URL and PORT
        changeOrigin: true, // Necessary for virtual hosting
        secure: false,      // Allows connecting to the backend if it's not HTTPS
      },
    },
  },
  // 🚀 END SERVER CONFIGURATION 🚀
})