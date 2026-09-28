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
})
