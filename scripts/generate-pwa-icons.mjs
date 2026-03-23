/**
 * 生成 PWA 所需 PNG 图标（品牌色 #aa3bff），构建前执行。
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const brand = { r: 170, g: 59, b: 255, alpha: 1 }

async function writePng(size, name) {
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: brand,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(join(publicDir, name))
  console.log(`wrote ${name}`)
}

await writePng(192, 'pwa-192.png')
await writePng(512, 'pwa-512.png')
