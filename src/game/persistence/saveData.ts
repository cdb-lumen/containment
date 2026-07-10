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

export const SAVE_DATA_STORAGE_KEY = 'alien-shooter-containment-save';

export const DEFAULT_SAVE_DATA: SaveData = {
  version: 1,
  settings: {
    masterVolume: 0.8,
    musicVolume: 0.65,
    effectsVolume: 0.8,
    reducedShake: false,
    reducedFlash: false,
    quality: 'auto',
  },
  records: {
    bestScore: 0,
    bestTimeMs: null,
  },
};

const cloneSaveData = (data: SaveData): SaveData => ({
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

const isNonnegativeFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

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
    isNonnegativeFiniteNumber(records.bestScore) &&
    (records.bestTimeMs === null ||
      isNonnegativeFiniteNumber(records.bestTimeMs))
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
    storage.setItem(SAVE_DATA_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
};
