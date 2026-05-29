import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'build', 'docs', '**/*.integration.test.{ts,tsx}'],
    // React Email re-exporte @react-email/render, dont le build node importe
    // `prettier/plugins/html` que le resolver externalise de Vitest n'arrive pas
    // a charger. Inliner ces deps laisse Vite resoudre le sous-chemin -> tests templates OK.
    server: {
      deps: {
        inline: ['@react-email/components', '@react-email/render'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // @react-email/render importe ces sous-chemins prettier (non resolvables ici)
      // uniquement pour le pretty-print -> stub no-op, render() n'est pas appele en test.
      'prettier/plugins/html': path.resolve(__dirname, './vitest.email-stub.ts'),
      'prettier/standalone': path.resolve(__dirname, './vitest.email-stub.ts'),
    },
  },
})
