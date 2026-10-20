import { mkdir, writeFile } from 'node:fs/promises'
import { deflateSync } from 'node:zlib'

const output = new URL('../public/icons/', import.meta.url)

function crc32(buffer) {
  let crc = 0xffffffff

  for (const byte of buffer) {
    crc ^= byte

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const name = Buffer.from(type)
  const length = Buffer.alloc(4)
  const checksum = Buffer.alloc(4)

  length.writeUInt32BE(data.length)
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])))

  return Buffer.concat([length, name, data, checksum])
}

function createIcon(size, maskable = false) {
  const pixels = Buffer.alloc(size * (1 + size * 3))
  const scale = maskable ? 0.72 : 0.88

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (1 + size * 3)
    pixels[rowStart] = 0

    for (let x = 0; x < size; x += 1) {
      const px = (x / size - 0.5) / scale + 0.5
      const py = (y / size - 0.5) / scale + 0.5

      const vertical =
        px >= 0.32 && px <= 0.43 && py >= 0.23 && py <= 0.78
      const top =
        px >= 0.40 && px <= 0.68 && py >= 0.23 && py <= 0.34
      const middle =
        px >= 0.40 && px <= 0.68 && py >= 0.47 && py <= 0.58
      const right =
        px >= 0.61 && px <= 0.72 && py >= 0.28 && py <= 0.53

      const white = vertical || top || middle || right
      const index = rowStart + 1 + x * 3

      pixels[index] = white ? 255 : 200
      pixels[index + 1] = white ? 255 : 36
      pixels[index + 2] = white ? 255 : 50
    }
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 2

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

await mkdir(output, { recursive: true })
await writeFile(new URL('icon-192.png', output), createIcon(192))
await writeFile(new URL('icon-512.png', output), createIcon(512))
await writeFile(new URL('maskable-512.png', output), createIcon(512, true))

console.log('Parkly PWA icons generated.')