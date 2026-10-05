import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    base: process.env.VITE_BASE_PATH || '/',
    server: {
        proxy: {
            '/api': {
                target: 'https://newtronome.jsjweb0.workers.dev',
                changeOrigin: true,
            },
        },
    },
    plugins: [
        react(),
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (
                        id.includes('/node_modules/firebase/') ||
                        id.includes('/node_modules/@firebase/')
                    ) {
                        return 'firebase';
                    }

                    if (
                        id.includes('/node_modules/react/') ||
                        id.includes('/node_modules/react-dom/') ||
                        id.includes('/node_modules/scheduler/')
                    ) {
                        return 'react-vendor';
                    }
                },
            },
        },
    },
})
