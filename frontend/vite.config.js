import { resolve } from 'path'

export default {
  root: resolve(__dirname, 'src'),
  
  // FIX: Tell Vite the public folder is one level UP from 'src'
  publicDir: resolve(__dirname, 'public'),
  
  build: {
    outDir: '../dist'
  },
  server: {
    port: 8081,
    proxy: {
      '/api/tmdb': {
        target: 'https://api.themoviedb.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tmdb/, ''),
      },
      '/api/nyt': {
        target: 'https://api.nytimes.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nyt/, ''),
      },
      '/api/lastfm': {
        target: 'https://ws.audioscrobbler.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lastfm/, ''),
      },
      '/api/itunes': {
        target: 'https://itunes.apple.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/itunes/, ''),
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        cookiePathRewrite: '/',      // Preserves cookie path
        cookieDomainRewrite: '',     // Preserves cookie domain
      },
    },
  },
  // silence Sass deprecation warnings
  css: {
      preprocessorOptions: {
          scss: {
            silenceDeprecations: [
              'import',
              'mixed-decls',
              'color-functions',
              'global-builtin',
            ],
          },
      },
  },
}