import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist/package',
  format: ['esm', 'cjs'],
  dts: true,
  clean: false,
  sourcemap: true,
  minify: true,
  target: 'es2022',
  splitting: false,
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' }
  },
})
