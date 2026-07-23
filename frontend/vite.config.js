import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // This tells Vite to push the finished files directly into your backend folder!
    outDir: '../backend/ui',
    
    // This tells Vite to automatically delete the old 'ui' files before making the new ones
    emptyOutDir: true 
  }
})