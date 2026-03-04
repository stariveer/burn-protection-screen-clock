import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// 原生 App 构建时（Capacitor）禁用 Service Worker
// 使用：CAPACITOR=1 pnpm build
const isCapacitor = process.env.CAPACITOR === '1'

export default defineConfig({
    plugins: [
        vue(),
        VitePWA({
            // Native 构建时禁用 SW，避免 WKWebView 兼容问题
            disable: isCapacitor,
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            manifest: {
                name: '防烧屏时钟',
                short_name: 'BurnClock',
                description: 'OLED 屏幕防烧屏全屏时钟 PWA',
                theme_color: '#000000',
                background_color: '#000000',
                display: 'fullscreen',
                orientation: 'any',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf}'],
                // 新 SW 无需等待旧标签页关闭，立即激活
                skipWaiting: true,
                // 激活后立即接管所有已打开的页面
                clientsClaim: true,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                ],
            },
        }),
    ],
    server: {
        host: true, // 允许局域网 IP 访问
        port: 5173,
    },
    preview: {
        host: true, // 允许局域网 IP 访问预览
        port: 4173,
    },
})
