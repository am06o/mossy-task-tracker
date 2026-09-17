// 앱 아이콘 = 보관함 버튼과 같은 모양(테마 초록 원 + 흰색 lucide Sparkles).
// 브라우저 canvas로 1024px 원본을 그린 뒤 각 크기로 리샘플링해 scripts/icon-raw/에 뒀다.
// 이 스크립트는 그 PNG들을 build/icon.png, build/icon.ico로 합쳐 저장하기만 한다.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const SIZES = [256, 64, 48, 32, 16]

function loadPng(size) {
  return readFileSync(new URL(`icon-raw/icon-${size}.png`, import.meta.url))
}

function buildICO(sizes) {
  const images = sizes.map((size) => ({ size, png: loadPng(size) }))
  const headerSize = 6 + images.length * 16
  let offset = headerSize
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  const entries = []
  for (const img of images) {
    const entry = Buffer.alloc(16)
    entry[0] = img.size >= 256 ? 0 : img.size
    entry[1] = img.size >= 256 ? 0 : img.size
    entry[2] = 0
    entry[3] = 0
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(img.png.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += img.png.length
    entries.push(entry)
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)])
}

mkdirSync('build', { recursive: true })
writeFileSync('build/icon.png', loadPng(256))
writeFileSync('build/icon.ico', buildICO(SIZES))
console.log('icon written to build/icon.png, build/icon.ico')
