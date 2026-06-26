import type { Browser } from 'puppeteer-core'

function getExecutablePath(): string {
  // ให้ set PUPPETEER_EXECUTABLE_PATH ใน .env.local เพื่อ override
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }
  if (process.platform === 'win32') {
    // ใช้ env vars แทน hardcode เพื่อไม่ให้ Next.js standalone tracer copy path ผิด
    const x86 = process.env['ProgramFiles(x86)'] ?? ['C:', 'Program Files (x86)'].join('\\')
    const pf  = process.env['ProgramFiles']       ?? ['C:', 'Program Files'].join('\\')
    const edge   = [x86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'].join('\\')
    const chrome = [pf,  'Google', 'Chrome', 'Application', 'chrome.exe'].join('\\')
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs') as typeof import('fs')
      if (fs.existsSync(edge)) return edge
      if (fs.existsSync(chrome)) return chrome
    } catch { /* ignore */ }
    return edge
  }
  // Linux (Docker): system chromium
  return '/usr/bin/chromium'
}

export async function launchBrowser(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default
  const executablePath = getExecutablePath()

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  })
}
