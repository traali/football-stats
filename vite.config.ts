import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'
import { pathFormTarget } from './src/utils/pathForm'

const commitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'prod'
  }
})()
const buildTime = new Date().toISOString()
const isGitHubPages = process.env.GITHUB_PAGES === '1'
const base = isGitHubPages ? '/football-stats/' : '/'

/**
 * Path-form links (/match/<id>, /team/<id>, /player/<id>) open the hash route.
 * - Runs inline in <head>, before the bundle, with the build's base path.
 * - Cloudflare Pages: no 404.html, so every deep path gets index.html (SPA fallback).
 * - GitHub Pages: 404.html is a copy of index.html, so deep paths get the same page.
 * Asset URLs stay absolute (base), so a deep path never resolves a script to index.html.
 */
function pathFormForward(): Plugin {
    let outDir = 'dist'
    return {
        name: 'path-form-forward',
        configResolved(config) {
            outDir = resolve(config.root, config.build.outDir)
        },
        // Replaces the <!-- path-form-forward --> marker at the top of <head>, before any
        // module script, so the redirect happens before the router ever starts.
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                const code = `(function(){var t=(${pathFormTarget.toString()})(location.pathname,location.search,location.hash,${JSON.stringify(base)});if(t)location.replace(t)})()`
                if (!html.includes('<!-- path-form-forward -->')) throw new Error('index.html lost the <!-- path-form-forward --> marker')
                return html.replace('<!-- path-form-forward -->', `<script>${code}</script>`)
            },
        },
        writeBundle() {
            if (isGitHubPages) copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
        },
    }
}

export default defineConfig({
    base,
    define: {
        __APP_VERSION__: JSON.stringify('1.0.0'),
        __COMMIT_HASH__: JSON.stringify(commitHash),
        __BUILD_TIME__: JSON.stringify(buildTime),
    },
    plugins: [
        pathFormForward(),
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'Jalkapallo',
                short_name: 'Jalkapallo',
                description: 'Junioriottelut, tulokset ja sarjataulukot Palloliiton tulospalvelusta',
                theme_color: '#111111',
                background_color: '#111111',
                display: 'standalone',
                orientation: 'portrait',
                start_url: base,
                scope: base,
                lang: 'fi',
                icons: [
                    { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
                    { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
                ],
            },
            workbox: {
                navigateFallback: `${base}index.html`,
                globPatterns: ['**/*.{js,css,html,svg,woff2,png,ico}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'fonts',
                            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                        },
                    },
                ],
            },
        }),
    ],
})
