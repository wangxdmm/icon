# @monan/iconify

Fork of https://github.com/iconify/tools/blob/main/%40iconify-demo/create-bundle/src/bundle-component-full.ts

And I made it use as a cli.

## Install

```sh

pnpm install @monan/iconify

```

## Usage

```sh
# define a icon.config.{js,ts,json} file

export interface Config {
  root: string
  name?: string
  commonJS?: boolean
  component:
  | '@iconify/react'
  | '@iconify/vue'
  | '@iconify/vue2'
  | '@iconify/svelte'
  svg?: BundleScriptCustomSVGConfig[]
  icons?: string[]
  json?: (string | BundleScriptCustomJSONConfig)[]
  targetDir?: string
  ext?: 'js' | 'ts'
  exportJson?: boolean
}

igo

```
