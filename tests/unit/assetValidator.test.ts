/* eslint-disable @typescript-eslint/ban-ts-comment -- Node globals are intentionally absent from the app tsconfig. */
// @ts-nocheck -- exercised by Vitest in Node; this project intentionally omits Node type declarations.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
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
