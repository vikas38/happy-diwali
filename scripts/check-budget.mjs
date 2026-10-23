import { readdir, readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
let total = 0
for (const file of await readdir('dist/assets'))
  if (file.endsWith('.js')) total += gzipSync(await readFile('dist/assets/' + file)).length
console.log('JavaScript gzip:', (total / 1024).toFixed(1), 'KiB / 150 KiB')
if (total > 150 * 1024) process.exit(1)
