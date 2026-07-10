import { describe, expect, it, vi } from 'vitest';

import { STORAGE_KEY } from '../../src/game/constants';
import {
  DEFAULT_SAVE_DATA,
  parseSaveData,
  saveData,
} from '../../src/game/persistence/saveData';
import type { SaveData } from '../../src/game/persistence/saveData';

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

const assertDefaultSaveDataIsDeeplyReadonly = () => {
  // @ts-expect-error Exported defaults must not allow nested settings mutation.
  DEFAULT_SAVE_DATA.settings.masterVolume = 0;
  // @ts-expect-error Exported defaults must not allow nested records mutation.
  DEFAULT_SAVE_DATA.records.bestScore = 1;
};
void assertDefaultSaveDataIsDeeplyReadonly;

const invalidRecordJson = (
  field: 'bestScore' | 'bestTimeMs',
  literal: string,
): string =>
  JSON.stringify(VALID_SAVE).replace(
    field === 'bestScore'
      ? '"bestScore":12345'
      : '"bestTimeMs":654321',
    `"${field}":${literal}`,
  );

const INVALID_INTEGER_LITERALS = [
  ['NaN', 'NaN'],
  ['positive infinity', '1e309'],
  ['negative infinity', '-1e309'],
  ['negative value', '-1'],
  ['fraction', '1.5'],
  ['unsafe integer', String(Number.MAX_SAFE_INTEGER + 1)],
] as const;

const INVALID_PARSE_RECORD_CASES = (
  ['bestScore', 'bestTimeMs'] as const
).flatMap((field) =>
  INVALID_INTEGER_LITERALS.map(
    ([label, literal]): [string, string] => [
      `${field} ${label}`,
      invalidRecordJson(field, literal),
    ],
  ),
);

const INVALID_RECORD_VALUES = [
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  -1,
  1.5,
  Number.MAX_SAFE_INTEGER + 1,
];

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

  it.each(INVALID_PARSE_RECORD_CASES)(
    'rejects %s while parsing',
    (_label, value) => {
      expect(parseSaveData(value)).toEqual(DEFAULT_SAVE_DATA);
    },
  );

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

  it('deep-freezes defaults so runtime mutation cannot alter later defaults', () => {
    expect(Object.isFrozen(DEFAULT_SAVE_DATA)).toBe(true);
    expect(Object.isFrozen(DEFAULT_SAVE_DATA.settings)).toBe(true);
    expect(Object.isFrozen(DEFAULT_SAVE_DATA.records)).toBe(true);

    const mutableView = DEFAULT_SAVE_DATA as unknown as SaveData;
    expect(() => {
      mutableView.settings.masterVolume = 0;
    }).toThrow(TypeError);
    expect(() => {
      mutableView.records.bestScore = 1;
    }).toThrow(TypeError);

    expect(parseSaveData(null)).toEqual({
      version: 1,
      settings: {
        masterVolume: 0.8,
        musicVolume: 0.65,
        effectsVolume: 0.8,
        reducedShake: false,
        reducedFlash: false,
        quality: 'auto',
      },
      records: { bestScore: 0, bestTimeMs: null },
    });
  });
});

describe('saveData', () => {
  it('serializes valid data under the canonical storage key and reports success', () => {
    const setItem = vi.fn();

    expect(saveData({ setItem }, VALID_SAVE)).toBe(true);
    expect(setItem).toHaveBeenCalledOnce();
    const [key, serialized] = setItem.mock.calls[0] as [string, string];
    expect(key).toBe(STORAGE_KEY);
    expect(JSON.parse(serialized)).toEqual(VALID_SAVE);
  });

  it.each(['bestScore', 'bestTimeMs'] as const)(
    'rejects invalid %s values without writing to storage',
    (field) => {
      for (const invalidValue of INVALID_RECORD_VALUES) {
        const setItem = vi.fn();
        const invalidSave = {
          ...VALID_SAVE,
          records: { ...VALID_SAVE.records, [field]: invalidValue },
        } as SaveData;

        expect(saveData({ setItem }, invalidSave)).toBe(false);
        expect(setItem).not.toHaveBeenCalled();
      }
    },
  );

  it('catches JSON serialization failures without writing or throwing', () => {
    const setItem = vi.fn();
    const throwingData = {
      ...VALID_SAVE,
      settings: { ...VALID_SAVE.settings },
      records: { ...VALID_SAVE.records },
    } as SaveData & { toJSON?: () => never };
    const toJSON = vi.fn(() => {
      throw new TypeError('Cannot serialize save data');
    });
    Object.defineProperty(throwingData, 'toJSON', {
      enumerable: false,
      value: toJSON,
    });

    let result: boolean | undefined;
    expect(() => {
      result = saveData({ setItem }, throwingData);
    }).not.toThrow();
    expect(result).toBe(false);
    expect(toJSON).toHaveBeenCalledOnce();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('catches storage failures and reports failure without throwing', () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new DOMException('Storage is full', 'QuotaExceededError');
      }),
    };

    expect(saveData(storage, VALID_SAVE)).toBe(false);
    expect(storage.setItem).toHaveBeenCalledOnce();
  });
});
