import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_SAVE_DATA,
  parseSaveData,
  saveData,
} from '../../src/game/persistence/saveData';

const VALID_SAVE = {
  version: 1 as const,
  settings: {
    masterVolume: 0.8,
    musicVolume: 0.6,
    effectsVolume: 0.7,
    reducedShake: true,
    reducedFlash: false,
    quality: 'medium' as const,
  },
  records: {
    bestScore: 12_345,
    bestTimeMs: 654_321,
  },
};

describe('parseSaveData', () => {
  it('accepts a complete valid save without changing its values', () => {
    expect(parseSaveData(JSON.stringify(VALID_SAVE))).toEqual(VALID_SAVE);
  });

  const invalidSaveCases: Array<[string, string | null]> = [
    ['null input', null],
    ['malformed JSON', '{not json'],
    ['wrong version', JSON.stringify({ ...VALID_SAVE, version: 2 })],
    ['missing settings', JSON.stringify({ version: 1, records: VALID_SAVE.records })],
    [
      'wrong nested type',
      JSON.stringify({
        ...VALID_SAVE,
        settings: { ...VALID_SAVE.settings, reducedFlash: 'no' },
      }),
    ],
    [
      'invalid quality',
      JSON.stringify({
        ...VALID_SAVE,
        settings: { ...VALID_SAVE.settings, quality: 'ultra' },
      }),
    ],
    [
      'negative score',
      JSON.stringify({
        ...VALID_SAVE,
        records: { ...VALID_SAVE.records, bestScore: -1 },
      }),
    ],
    [
      'non-finite score',
      JSON.stringify(VALID_SAVE).replace(
        '"bestScore":12345',
        '"bestScore":1e309',
      ),
    ],
    [
      'negative completion time',
      JSON.stringify({
        ...VALID_SAVE,
        records: { ...VALID_SAVE.records, bestTimeMs: -1 },
      }),
    ],
    [
      'non-finite completion time',
      JSON.stringify(VALID_SAVE).replace(
        '"bestTimeMs":654321',
        '"bestTimeMs":1e309',
      ),
    ],
    [
      'masterVolume below zero',
      JSON.stringify({
        ...VALID_SAVE,
        settings: { ...VALID_SAVE.settings, masterVolume: -0.01 },
      }),
    ],
    [
      'masterVolume above one',
      JSON.stringify({
        ...VALID_SAVE,
        settings: { ...VALID_SAVE.settings, masterVolume: 1.01 },
      }),
    ],
    [
      'musicVolume below zero',
      JSON.stringify({
        ...VALID_SAVE,
        settings: { ...VALID_SAVE.settings, musicVolume: -0.01 },
      }),
    ],
    [
      'musicVolume above one',
      JSON.stringify({
        ...VALID_SAVE,
        settings: { ...VALID_SAVE.settings, musicVolume: 1.01 },
      }),
    ],
    [
      'effectsVolume below zero',
      JSON.stringify({
        ...VALID_SAVE,
        settings: { ...VALID_SAVE.settings, effectsVolume: -0.01 },
      }),
    ],
    [
      'effectsVolume above one',
      JSON.stringify({
        ...VALID_SAVE,
        settings: { ...VALID_SAVE.settings, effectsVolume: 1.01 },
      }),
    ],
  ];

  it.each(invalidSaveCases)('returns the full default for %s', (_label, value) => {
    expect(parseSaveData(value)).toEqual(DEFAULT_SAVE_DATA);
  });

  it('accepts null as the absence of a best completion time', () => {
    const value = {
      ...VALID_SAVE,
      records: { ...VALID_SAVE.records, bestTimeMs: null },
    };

    expect(parseSaveData(JSON.stringify(value))).toEqual(value);
  });

  it('returns fresh defaults with no mutable aliases', () => {
    const first = parseSaveData(null);
    const second = parseSaveData(null);

    expect(first).not.toBe(second);
    expect(first.settings).not.toBe(second.settings);
    expect(first.records).not.toBe(second.records);
    expect(first.settings).not.toBe(DEFAULT_SAVE_DATA.settings);
    expect(first.records).not.toBe(DEFAULT_SAVE_DATA.records);

    first.settings.masterVolume = 0.1;
    first.records.bestScore = 99;
    expect(second).toEqual(DEFAULT_SAVE_DATA);
  });
});

describe('saveData', () => {
  it('serializes valid data and reports success', () => {
    const setItem = vi.fn();

    expect(saveData({ setItem }, VALID_SAVE)).toBe(true);
    expect(setItem).toHaveBeenCalledOnce();
    const [, serialized] = setItem.mock.calls[0] as [string, string];
    expect(JSON.parse(serialized)).toEqual(VALID_SAVE);
  });

  it('catches storage failures and reports failure without throwing', () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new DOMException('Storage is full', 'QuotaExceededError');
      }),
    };

    expect(() => saveData(storage, VALID_SAVE)).not.toThrow();
    expect(saveData(storage, VALID_SAVE)).toBe(false);
  });
});
