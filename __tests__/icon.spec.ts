import { resolve } from 'node:path'
import fs from 'node:fs'
import { type Config, icons } from 'src/index'
import { rimrafSync } from 'rimraf'

const root = resolve(__dirname, './')

describe('Icon', () => {
  beforeEach(async () => {
    rimrafSync(resolve(root, './dist'))
  })

  it('icons is ok', async () => {
    const config: Config = {
      root,
      component: '@iconify/vue2',
      exportJson: true,
      targetDir: resolve(root, './dist'),
      svg: [
        {
          dir: resolve(root, './project_one/'),
          prefix: 'p1',
          monotone: false,
        },
        {
          dir: resolve(root, './project_two/'),
          prefix: 'p2',
          monotone: false,
        },
      ],
    }

    await icons(config)

    expect(fs.existsSync(resolve(root, './dist/index.js'))).toBe(true)
    expect(fs.existsSync(resolve(root, './dist/p1.json'))).toBe(true)
    expect(fs.existsSync(resolve(root, './dist/p2.json'))).toBe(true)
  })
})
