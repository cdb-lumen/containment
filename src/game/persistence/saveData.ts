import { STORAGE_KEY } from '../constants';

export type SaveData = {
  version: 1;
  settings: {
    masterVolume: number;
    musicVolume: number;
    effectsVolume: number;
    reducedShake: boolean;
    reducedFlash: boolean;
    quality: 'auto' | 'low' | 'medium' | 'high';
  };
  records: {
    bestScore: number;
    bestTimeMs: number | null;
  };
};

export type ReadonlySaveData = Readonly<{
  version: SaveData['version'];
  settings: Readonly<SaveData['settings']>;
  records: Readonly<SaveData['records']>;
}>;

export const DEFAULT_SAVE_DATA: ReadonlySaveData = Object.freeze({
  version: 1,
  settings: Object.freeze({
    masterVolume: 0.8,
    musicVolume: 0.65,
    effectsVolume: 0.8,
    reducedShake: false,
    reducedFlash: false,
    quality: 'auto',
  }),
  records: Object.freeze({
    bestScore: 0,
    bestTimeMs: null,
  }),
});

const cloneSaveData = (data: ReadonlySaveData): SaveData => ({
  version: 1,
  settings: { ...data.settings },
  records: { ...data.records },
});

const freshDefault = (): SaveData => cloneSaveData(DEFAULT_SAVE_DATA);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean => {
  const keys = Object.keys(value);
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.hasOwn(value, key))
  );
};

const isUnitNumber = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 1;

const isNonnegativeSafeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const isQuality = (
  value: unknown,
): value is SaveData['settings']['quality'] =>
  value === 'auto' ||
  value === 'low' ||
  value === 'medium' ||
  value === 'high';

const isSaveData = (value: unknown): value is SaveData => {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['version', 'settings', 'records']) ||
    value.version !== 1 ||
    !isRecord(value.settings) ||
    !hasExactKeys(value.settings, [
      'masterVolume',
      'musicVolume',
      'effectsVolume',
      'reducedShake',
      'reducedFlash',
      'quality',
    ]) ||
    !isRecord(value.records) ||
    !hasExactKeys(value.records, ['bestScore', 'bestTimeMs'])
  ) {
    return false;
  }

  const { settings, records } = value;
  return (
    isUnitNumber(settings.masterVolume) &&
    isUnitNumber(settings.musicVolume) &&
    isUnitNumber(settings.effectsVolume) &&
    typeof settings.reducedShake === 'boolean' &&
    typeof settings.reducedFlash === 'boolean' &&
    isQuality(settings.quality) &&
    isNonnegativeSafeInteger(records.bestScore) &&
    (records.bestTimeMs === null ||
      isNonnegativeSafeInteger(records.bestTimeMs))
  );
};

export const parseSaveData = (value: string | null): SaveData => {
  if (value === null) {
    return freshDefault();
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return isSaveData(parsed) ? cloneSaveData(parsed) : freshDefault();
  } catch {
    return freshDefault();
  }
};

export const saveData = (
  storage: Pick<Storage, 'setItem'>,
  data: SaveData,
): boolean => {
  try {
    if (!isSaveData(data)) {
      return false;
    }

    const serialized = JSON.stringify(data);
    if (typeof serialized !== 'string') {
      return false;
    }

    storage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
};
