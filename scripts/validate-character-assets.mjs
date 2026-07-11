import { Buffer } from 'node:buffer';
import console from 'node:console';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { URL } from 'node:url';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ASSET_DIRECTORY = new URL('../public/assets/characters/', import.meta.url);
const EXPECTED_SHEETS = new Map([
  ['marine-sheet.png', [672, 96]],
  ['crawler-sheet.png', [672, 96]],
  ['brute-sheet.png', [672, 96]],
  ['spitter-sheet.png', [672, 96]],
  ['stalker-sheet.png', [672, 96]],
  ['carrier-sheet.png', [672, 96]],
  ['queen-sheet.png', [1120, 160]],
]);

const errors = [];

for (const [fileName, [expectedWidth, expectedHeight]] of EXPECTED_SHEETS) {
  const fileUrl = new URL(fileName, ASSET_DIRECTORY);

  try {
    const file = await readFile(fileUrl);

    if (file.length < 8 || !file.subarray(0, 8).equals(PNG_SIGNATURE)) {
      errors.push(`${fileName}: not a PNG with the exact 8-byte signature`);
      continue;
    }

    if (
      file.length < 24 ||
      file.readUInt32BE(8) !== 13 ||
      file.subarray(12, 16).toString('ascii') !== 'IHDR'
    ) {
      errors.push(`${fileName}: missing a valid IHDR header`);
      continue;
    }

    const width = file.readUInt32BE(16);
    const height = file.readUInt32BE(20);

    if (width !== expectedWidth || height !== expectedHeight) {
      errors.push(
        `${fileName}: expected ${expectedWidth}x${expectedHeight}, found ${width}x${height}`,
      );
      continue;
    }

    console.log(`valid character sheet: ${fileName} (${width}x${height})`);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      errors.push(`${fileName}: missing expected file`);
    } else {
      errors.push(`${fileName}: unable to read (${error.message})`);
    }
  }
}

if (errors.length > 0) {
  console.error('Character asset validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
}
