import { createLowlight } from 'lowlight'

import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'

const lowlightInstance = createLowlight()

lowlightInstance.register({
  javascript,
  js: javascript,
  typescript,
  ts: typescript,
  css,
  html,
  xml: html,
  json,
  bash,
})

export const lowlight = lowlightInstance
