import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss(), cloudflare()],
    server: {
        proxy: {
            '/api': {
                target: 'https://api-v2.soundcloud.com',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api/, ''),
            },
        },
    },
})