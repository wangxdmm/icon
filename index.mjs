#!/usr/bin/env node
'use strict'

import { loadConfig } from 'unconfig'
import { icons } from './dist/index.mjs'

(async () => {
  const { config } = await loadConfig({
    sources: [{ files: 'icon.config' }],
  })

  await icons(config)
})()
