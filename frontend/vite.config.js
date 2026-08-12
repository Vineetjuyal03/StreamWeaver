import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Fixed: replaced dot with slash

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-window', 'papaparse'], // Pre-bundles CommonJS modules
  },
});