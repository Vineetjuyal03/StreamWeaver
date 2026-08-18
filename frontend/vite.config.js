import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standard Vite 8 + React 19 Config
export default defineConfig({
  plugins: [react()],
});