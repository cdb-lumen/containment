/* eslint-disable @typescript-eslint/ban-ts-comment -- Node globals are intentionally absent from the app tsconfig. */
// @ts-nocheck -- exercised by Vitest in Node; this project intentionally omits Node type declarations.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { deflateSync, inflateSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';

const projectRoot = resolve(import.meta.dirname, '../..');
const sourcePng = readFileSync(resolve(projectRoot, 'public/assets/effects/blood-decals-sheet.png'));
const temporaryDirectories: string[] = [];

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length);
  return chunk;
}

function chunks(file: Buffer): Buffer[] {
  const result: Buffer[] = [];
  for (let offset = 8; offset < file.length;) {
    const end = offset + 12 + file.readUInt32BE(offset);
    result.push(file.subarray(offset, end));
    offset = end;
  }
  return result;
}

function decodeRgbaPixels(file: Buffer): Buffer {
  const idat = chunks(file)
    .filter((chunk) => chunk.subarray(4, 8).toString('ascii') === 'IDAT')
    .map((chunk) => chunk.subarray(8, chunk.length - 4));
  const scanlines = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(768 * 64 * 4);
  const stride = 768 * 4;

  for (let y = 0; y < 64; y += 1) {
    const filter = scanlines[y * (stride + 1)];
    const sourceOffset = y * (stride + 1) + 1;
    const targetOffset = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= 4 ? pixels[targetOffset + x - 4] : 0;
      const above = y > 0 ? pixels[targetOffset + x - stride] : 0;
      const upperLeft = y > 0 && x >= 4 ? pixels[targetOffset + x - stride - 4] : 0;
      const estimate = left + above - upperLeft;
      const paeth = Math.abs(estimate - left) <= Math.abs(estimate - above)
        && Math.abs(estimate - left) <= Math.abs(estimate - upperLeft)
        ? left : Math.abs(estimate - above) <= Math.abs(estimate - upperLeft) ? above : upperLeft;
      const predictor = filter === 1 ? left
        : filter === 2 ? above
          : filter === 3 ? Math.floor((left + above) / 2)
            : filter === 4 ? paeth : 0;
      pixels[targetOffset + x] = (scanlines[sourceOffset + x] + predictor) & 0xff;
    }
  }
  return pixels;
}

function replacePixels(file: Buffer, mutate: (pixels: Buffer) => void): Buffer {
  const pixels = decodeRgbaPixels(file);
  mutate(pixels);
  const stride = 768 * 4;
  const scanlines = Buffer.alloc(64 * (stride + 1));
  for (let y = 0; y < 64; y += 1) {
    scanlines[y * (stride + 1)] = 0;
    pixels.copy(scanlines, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const sourceChunks = chunks(file);
  const firstIdat = sourceChunks.findIndex((chunk) => chunk.subarray(4, 8).toString('ascii') === 'IDAT');
  const beforeIdat = sourceChunks.slice(0, firstIdat);
  const afterIdat = sourceChunks.slice(firstIdat)
    .filter((chunk) => chunk.subarray(4, 8).toString('ascii') !== 'IDAT');
  return Buffer.concat([
    file.subarray(0, 8),
    ...beforeIdat,
    pngChunk('IDAT', deflateSync(scanlines)),
    ...afterIdat,
  ]);
}

function copyCell(pixels: Buffer, sourceCell: number, targetCell: number): void {
  const rowBytes = 64 * 4;
  const sheetStride = 768 * 4;
  for (let y = 0; y < 64; y += 1) {
    const sourceOffset = y * sheetStride + sourceCell * rowBytes;
    const targetOffset = y * sheetStride + targetCell * rowBytes;
    pixels.copy(pixels, targetOffset, sourceOffset, sourceOffset + rowBytes);
  }
}

function validateMutation(mutated: Buffer) {
  const directory = mkdtempSync(join(tmpdir(), 'blood-validator-'));
  temporaryDirectories.push(directory);
  const file = join(directory, 'mutated.png');
  writeFileSync(file, mutated);
  return spawnSync(process.execPath, ['scripts/validate-character-assets.mjs'], {
    cwd: projectRoot,
    env: { ...process.env, BLOOD_DECAL_ASSET_FILE: file },
    encoding: 'utf8',
  });
}

afterEach(() => {
  while (temporaryDirectories.length > 0) rmSync(temporaryDirectories.pop()!, { recursive: true, force: true });
});

describe('PNG chunk ordering validation', () => {
  const signature = sourcePng.subarray(0, 8);
  const sourceChunks = chunks(sourcePng);
  const palette = pngChunk('PLTE', Buffer.from([0, 0, 0]));

  it('rejects a CRC-valid PLTE after the first IDAT', () => {
    const firstIdat = sourceChunks.findIndex((chunk) => chunk.subarray(4, 8).toString('ascii') === 'IDAT');
    const mutated = Buffer.concat([signature, ...sourceChunks.slice(0, firstIdat + 1), palette, ...sourceChunks.slice(firstIdat + 1)]);
    const result = validateMutation(mutated);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('PLTE must precede IDAT');
  });

  it('rejects duplicate CRC-valid PLTE chunks', () => {
    const mutated = Buffer.concat([signature, sourceChunks[0], palette, palette, ...sourceChunks.slice(1)]);
    const result = validateMutation(mutated);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('PLTE must occur at most once');
  });
});

describe('blood decal geometry validation', () => {
  it('rejects a non-elongated human streak cell', () => {
    const mutated = replacePixels(sourcePng, (pixels) => copyCell(pixels, 0, 3));
    const result = validateMutation(mutated);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('cell 3 streak must have horizontal opaque bounds aspect ratio >= 1.8');
  });

  it('rejects identical masks within a blood decal group', () => {
    const mutated = replacePixels(sourcePng, (pixels) => copyCell(pixels, 0, 1));
    const result = validateMutation(mutated);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('cells 0 and 1 are insufficiently distinct (0 mask pixels differ)');
  });
});
