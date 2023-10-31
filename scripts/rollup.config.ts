import path from 'node:path'
import fs from 'node:fs'
import esbuild from 'rollup-plugin-esbuild'
import dts from 'rollup-plugin-dts'
import { ModuleResolutionKind } from 'typescript'
import type { OutputOptions, RollupOptions } from 'rollup'

const root = path.resolve(__dirname, '../')
const dist = path.resolve(root, 'dist')
const pkg = JSON.parse(
  fs.readFileSync(path.resolve(root, 'package.json')).toString(),
)

const pluginEsbuild = esbuild({
  target: 'esNext',
})
const configs: RollupOptions[] = []

const output: OutputOptions[] = [
  {
    format: 'es',
    file: `${dist}/index.mjs`,
  },
  {
    format: 'cjs',
    file: `${dist}/index.cjs`,
  },
]

const c: RollupOptions = {
  input: `${root}/src/index.ts`,
  output,
  plugins: [pluginEsbuild],
  external: (id: string) => {
    return Object.keys(pkg.dependencies).includes(id) || id.startsWith('node:')
  },
}
configs.push(c)

const pluginDts = dts({
  tsconfig: path.resolve(root, 'tsconfig.json'),
  compilerOptions: {
    composite: false,
    moduleResolution: ModuleResolutionKind.Bundler,
    tsBuildInfoFile: '',
  },
})

configs.push({
  input: `${root}/src/index.ts`,
  output: {
    file: `${dist}/index.d.ts`,
  },
  plugins: [pluginDts],
})

export default configs
