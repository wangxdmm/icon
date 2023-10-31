import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import {
  cleanupSVG,
  importDirectory,
  isEmptyColor,
  parseColors,
  runSVGO,
} from '@iconify/tools'
import { getIcons, minifyIconSet, stringToIcon } from '@iconify/utils'
import type { IconifyJSON, IconifyMetaData } from '@iconify/types'

export interface BundleScriptCustomSVGConfig {
  dir: string
  monotone: boolean
  prefix: string
}

export interface BundleScriptCustomJSONConfig {
  filename: string
  icons?: string[]
}

export interface BundleScriptConfig {
  svg?: BundleScriptCustomSVGConfig[]
  icons?: string[]
  json?: (string | BundleScriptCustomJSONConfig)[]
}

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

export async function icons(config: Config) {
  if (!config)
    throw new Error('No config found')

  const {
    svg = [],
    icons = [],
    json = [],
    root = process.cwd(),
    name = 'index',
    component,
    commonJS = false,
    targetDir = resolve(root, './iconify'),
    ext = 'js',
    exportJson = false,
  } = config

  const sources: BundleScriptConfig = {
    svg,
    icons,
    json,
  }

  let bundle = commonJS
    ? `const { addCollection } = require('${component}');\n\n`
    : `import { addCollection } from '${component}';\n\n`

  const dir = targetDir
  await fs.mkdir(dir, {
    recursive: true,
  })

  if (sources.icons) {
    const sourcesJSON = sources.json ? sources.json : (sources.json = [])
    const organizedList = organizeIconsList(sources.icons)

    for (const prefix in organizedList) {
      const filename = require.resolve(`@iconify/json/json/${prefix}.json`)
      sourcesJSON.push({
        filename,
        icons: organizedList[prefix],
      })
    }
  }

  if (sources.json) {
    for (let i = 0; i < sources.json.length; i++) {
      const item = sources.json[i]
      const filename = typeof item === 'string' ? item : item.filename

      let content = JSON.parse(
        await fs.readFile(filename, 'utf8'),
      ) as IconifyJSON

      if (typeof item !== 'string' && item.icons?.length) {
        const filteredContent = getIcons(content, item.icons)
        if (!filteredContent)
          throw new Error(`Cannot find required icons in ${filename}`)

        content = filteredContent
      }

      removeMetaData(content)
      minifyIconSet(content)
      bundle += `addCollection(${JSON.stringify(content)});\n`
    }
  }

  if (sources.svg) {
    for (let i = 0; i < sources.svg.length; i++) {
      const source = sources.svg[i]

      // Import icons
      const iconSet = await importDirectory(source.dir, {
        prefix: source.prefix,
      })

      // Validate, clean up, fix palette and optimise
      await iconSet.forEach(async (name, type) => {
        if (type !== 'icon')
          return

        // Get SVG instance for parsing
        const svg = iconSet.toSVG(name)
        if (!svg) {
          // Invalid icon
          iconSet.remove(name)
          return
        }

        // Clean up and optimise icons
        try {
          // Clean up icon code
          cleanupSVG(svg)

          if (source.monotone) {
            // Replace color with currentColor, add if missing
            // If icon is not monotone, remove this code
            await parseColors(svg, {
              defaultColor: 'currentColor',
              callback: (attr, colorStr, color) => {
                return !color || isEmptyColor(color) ? colorStr : 'currentColor'
              },
            })
          }

          // Optimise
          runSVGO(svg)
        }
        catch (err) {
          // Invalid icon
          console.error(`Error parsing ${name} from ${source.dir}:`, err)
          iconSet.remove(name)
          return
        }

        // Update icon from SVG instance
        iconSet.fromSVG(name, svg)
      })

      const content = iconSet.export()

      // Export to JSON
      if (exportJson) {
        await fs.writeFile(
    `${resolve(targetDir, `./${source.prefix}`)}.json`,
    JSON.stringify(content),
    'utf-8',
        )
      }

      bundle += `addCollection(${JSON.stringify(content)});\n`
    }
  }

  // Save to file
  await fs.writeFile(resolve(targetDir, `${name}.${ext}`), bundle, 'utf8')
}

function removeMetaData(iconSet: IconifyJSON) {
  const props: (keyof IconifyMetaData)[] = [
    'info',
    'chars',
    'categories',
    'themes',
    'prefixes',
    'suffixes',
  ]
  props.forEach((prop) => {
    delete iconSet[prop]
  })
}
function organizeIconsList(icons: string[]): Record<string, string[]> {
  const sorted: Record<string, string[]> = Object.create(null)
  icons.forEach((icon) => {
    const item = stringToIcon(icon)
    if (!item)
      return

    const prefix = item.prefix
    const prefixList = sorted[prefix] ? sorted[prefix] : (sorted[prefix] = [])

    const name = item.name
    if (!prefixList.includes(name))
      prefixList.push(name)
  })

  return sorted
}
