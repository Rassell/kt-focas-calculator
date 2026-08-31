import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base is required for GitHub Pages project sites: https://<user>.github.io/<repo>/
// For a user/org site (<user>.github.io) set base to '/'. This repo is a project site.
export default defineConfig({
  base: '/kt-focas-calculator/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
