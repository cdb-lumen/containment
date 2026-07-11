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

function validatePng(file, expectedWidth, expectedHeight) {
  if (file.length < 8 || !file.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('not a PNG with the exact 8-byte signature');
  }

  let offset = 8;
  let chunkIndex = 0;
  let ihdr = null;
  let ihdrCount = 0;
  let sawIend = false;
  const idatParts = [];

  while (offset < file.length) {
    if (file.length - offset < 12) throw new Error('truncated PNG chunk header');
    const length = file.readUInt32BE(offset);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > file.length || chunkEnd < offset) throw new Error('truncated PNG chunk data');
    const type = file.subarray(offset + 4, offset + 8).toString('ascii');
    const data = file.subarray(offset + 8, offset + 8 + length);
    const storedCrc = file.readUInt32BE(offset + 8 + length);
    const actualCrc = crc32(file.subarray(offset + 4, offset + 8 + length));
    if (storedCrc !== actualCrc) throw new Error(`${type} chunk has an invalid CRC`);

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
      idatParts.push(data);
    } else if (type === 'IEND') {
      if (length !== 0) throw new Error('IEND must be empty');
      sawIend = true;
      offset = chunkEnd;
      if (offset !== file.length) throw new Error('trailing data after IEND');
      break;
    }
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
  let inflated;
  try { inflated = inflateSync(Buffer.concat(idatParts)); }
  catch (error) {
    throw new Error(`IDAT zlib stream is invalid (${error.message})`, { cause: error });
  }
  const expectedBytes = ihdr.height * (1 + ihdr.width * 4);
  if (inflated.length !== expectedBytes) {
    throw new Error(`expected ${expectedBytes} decompressed scanline bytes, found ${inflated.length}`);
  }
  return ihdr;
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
if (errors.length > 0) {
  console.error('Character asset validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}
