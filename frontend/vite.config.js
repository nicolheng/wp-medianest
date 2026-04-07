import { resolve } from 'path'

export default {
  root: resolve(__dirname, 'src'),

  // FIX: Tell Vite the public folder is one level UP from 'src'
  publicDir: resolve(__dirname, 'public'),
  
  build: {
    outDir: '../dist'
  },
  server: {
    port: 8080
  },
  // Optional: Silence Sass deprecation warnings. See note below.
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