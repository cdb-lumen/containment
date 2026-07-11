import { Buffer } from 'node:buffer';
import console from 'node:console';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import process from 'node:process';
import { pathToFileURL, URL } from 'node:url';
import { inflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const defaultAssetDirectory = new URL('../public/assets/characters/', import.meta.url);
const assetDirectory = process.env.CHARACTER_ASSET_DIRECTORY
  ? pathToFileURL(`${resolve(process.env.CHARACTER_ASSET_DIRECTORY)}${sep}`)
  : defaultAssetDirectory;
const EXPECTED_SHEETS = new Map([
  ['marine-sheet.png', [672, 96]],
  ['crawler-sheet.png', [672, 96]],
  ['brute-sheet.png', [672, 96]],
  ['spitter-sheet.png', [672, 96]],
  ['stalker-sheet.png', [672, 96]],
  ['carrier-sheet.png', [672, 96]],
  ['queen-sheet.png', [1120, 160]],
]);
const bloodAsset = process.env.BLOOD_DECAL_ASSET_FILE
  ? pathToFileURL(resolve(process.env.BLOOD_DECAL_ASSET_FILE))
  : new URL('../public/assets/effects/blood-decals-sheet.png', import.meta.url);

function makeCrcTable() {
  return Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  });
}
const CRC_TABLE = makeCrcTable();
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const distances = [Math.abs(estimate - left), Math.abs(estimate - above), Math.abs(estimate - upperLeft)];
  return distances[0] <= distances[1] && distances[0] <= distances[2]
    ? left : distances[1] <= distances[2] ? above : upperLeft;
}

function validatePng(file, expectedWidth, expectedHeight) {
  if (file.length < 8 || !file.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('not a PNG with the exact 8-byte signature');
  }

  let offset = 8;
  let chunkIndex = 0;
  let ihdr = null;
  let ihdrCount = 0;
  let sawIend = false;
  let sawIdat = false;
  let idatSequenceEnded = false;
  const idatParts = [];
  const knownCriticalChunks = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND']);

  while (offset < file.length) {
    if (file.length - offset < 12) throw new Error('truncated PNG chunk header');
    const length = file.readUInt32BE(offset);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > file.length || chunkEnd < offset) throw new Error('truncated PNG chunk data');
    const typeBytes = file.subarray(offset + 4, offset + 8);
    if (![...typeBytes].every((byte) => (byte >= 0x41 && byte <= 0x5a) || (byte >= 0x61 && byte <= 0x7a))) {
      throw new Error('PNG chunk type must contain only ASCII letters');
    }
    if ((typeBytes[2] & 0x20) !== 0) throw new Error('PNG chunk type has an invalid reserved bit');
    const type = typeBytes.toString('ascii');
    const data = file.subarray(offset + 8, offset + 8 + length);
    const storedCrc = file.readUInt32BE(offset + 8 + length);
    const actualCrc = crc32(file.subarray(offset + 4, offset + 8 + length));
    if (storedCrc !== actualCrc) throw new Error(`${type} chunk has an invalid CRC`);
    if ((typeBytes[0] & 0x20) === 0 && !knownCriticalChunks.has(type)) {
      throw new Error(`unknown critical PNG chunk ${type}`);
    }

    if (chunkIndex === 0 && type !== 'IHDR') throw new Error('IHDR must be the first chunk');
    if (type === 'IHDR') {
      ihdrCount += 1;
      if (ihdrCount > 1) throw new Error('IHDR must occur exactly once');
      if (length !== 13) throw new Error('IHDR must contain exactly 13 bytes');
      ihdr = {
        width: data.readUInt32BE(0), height: data.readUInt32BE(4), bitDepth: data[8],
        colorType: data[9], compression: data[10], filter: data[11], interlace: data[12],
      };
    } else if (type === 'IDAT') {
      if (!ihdr) throw new Error('IDAT encountered before IHDR');
      if (idatSequenceEnded) throw new Error('IDAT chunks must be consecutive');
      sawIdat = true;
      idatParts.push(data);
    } else if (type === 'IEND') {
      if (length !== 0) throw new Error('IEND must be empty');
      sawIend = true;
      offset = chunkEnd;
      if (offset !== file.length) throw new Error('trailing data after IEND');
      break;
    }
    if (sawIdat && type !== 'IDAT') idatSequenceEnded = true;
    offset = chunkEnd;
    chunkIndex += 1;
  }

  if (!ihdr || ihdrCount !== 1) throw new Error('missing IHDR');
  if (!sawIend) throw new Error('missing terminal IEND');
  if (idatParts.length === 0) throw new Error('missing IDAT');
  if (ihdr.width !== expectedWidth || ihdr.height !== expectedHeight) {
    throw new Error(`expected ${expectedWidth}x${expectedHeight}, found ${ihdr.width}x${ihdr.height}`);
  }
  if (ihdr.bitDepth !== 8 || ihdr.colorType !== 6 || ihdr.compression !== 0 || ihdr.filter !== 0 || ihdr.interlace !== 0) {
    throw new Error('IHDR must specify 8-bit RGBA, compression 0, filter 0, and no interlace');
  }
  const expectedBytes = ihdr.height * (1 + ihdr.width * 4);
  const compressed = Buffer.concat(idatParts);
  let inflated;
  try {
    const result = inflateSync(compressed, { info: true, maxOutputLength: expectedBytes });
    inflated = result.buffer;
    if (result.engine.bytesWritten !== compressed.length) {
      throw new Error('trailing data in IDAT zlib stream');
    }
  }
  catch (error) {
    throw new Error(`IDAT zlib stream is invalid (${error.message})`, { cause: error });
  }
  if (inflated.length !== expectedBytes) {
    throw new Error(`expected ${expectedBytes} decompressed scanline bytes, found ${inflated.length}`);
  }
  const rowBytes = 1 + ihdr.width * 4;
  for (let y = 0; y < ihdr.height; y += 1) {
    const filterByte = inflated[y * rowBytes];
    if (filterByte > 4) throw new Error(`invalid PNG filter byte ${filterByte} in row ${y}`);
  }
  const pixels = Buffer.alloc(ihdr.width * ihdr.height * 4);
  const stride = ihdr.width * 4;
  for (let y = 0; y < ihdr.height; y += 1) {
    const filterByte = inflated[y * rowBytes];
    const sourceOffset = y * rowBytes + 1;
    const targetOffset = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + x];
      const left = x >= 4 ? pixels[targetOffset + x - 4] : 0;
      const above = y > 0 ? pixels[targetOffset + x - stride] : 0;
      const upperLeft = y > 0 && x >= 4 ? pixels[targetOffset + x - stride - 4] : 0;
      const predictor = filterByte === 1 ? left
        : filterByte === 2 ? above
          : filterByte === 3 ? Math.floor((left + above) / 2)
            : filterByte === 4 ? paeth(left, above, upperLeft) : 0;
      pixels[targetOffset + x] = (raw + predictor) & 0xff;
    }
  }
  return { ...ihdr, pixels };
}

function validateBloodCells(pixels) {
  const allowedAlpha = new Set([0, 224, 255]);
  for (let cell = 0; cell < 12; cell += 1) {
    let visible = 0;
    let transparent = 0;
    for (let y = 0; y < 64; y += 1) {
      for (let localX = 0; localX < 64; localX += 1) {
        const alpha = pixels[(y * 768 + cell * 64 + localX) * 4 + 3];
        if (!allowedAlpha.has(alpha)) throw new Error(`cell ${cell} has unsupported alpha ${alpha}`);
        if (alpha === 0) transparent += 1;
        else visible += 1;
        if ((localX === 0 || localX === 63 || y === 0 || y === 63) && alpha !== 0) {
          throw new Error(`cell ${cell} lacks transparent edge padding`);
        }
      }
    }
    if (visible === 0) throw new Error(`cell ${cell} is empty`);
    if (transparent === 0) throw new Error(`cell ${cell} has no transparent pixels`);
  }
}

const errors = [];
for (const [fileName, [expectedWidth, expectedHeight]] of EXPECTED_SHEETS) {
  try {
    const file = await readFile(new URL(fileName, assetDirectory));
    const { width, height } = validatePng(file, expectedWidth, expectedHeight);
    console.log(`valid character sheet: ${fileName} (${width}x${height})`);
  } catch (error) {
    errors.push(error?.code === 'ENOENT'
      ? `${fileName}: missing expected file`
      : `${fileName}: ${error.message}`);
  }
}
try {
  const file = await readFile(bloodAsset);
  const { width, height, pixels } = validatePng(file, 768, 64);
  validateBloodCells(pixels);
  console.log(`valid blood decal sheet: blood-decals-sheet.png (${width}x${height}, 12 padded cells)`);
} catch (error) {
  errors.push(error?.code === 'ENOENT'
    ? 'blood-decals-sheet.png: missing expected file'
    : `blood-decals-sheet.png: ${error.message}`);
}
if (errors.length > 0) {
  console.error('Asset validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}
