import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function injectPwaBuildId() {
  return {
    name: 'inject-pwa-build-id',
    closeBundle() {
      const swPath = resolve(__dirname, 'dist/service-worker.js')
      if (!existsSync(swPath)) return

      const buildId =
        process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
        process.env.VITE_BUILD_ID ||
        Date.now().toString(36)

      const content = readFileSync(swPath, 'utf8').replace(/__BUILD_ID__/g, buildId)
      writeFileSync(swPath, content)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), injectPwaBuildId()],
})
