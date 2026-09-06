export const DEFAULT_MASTER_VOLUME = .3;
export const AUDIO_STORAGE_KEY = 'containment.audio.v1';
export type AudioPreferences = Readonly<{master: number; muted: boolean}>;
type AudioStorage = Pick<Storage, 'getItem' | 'setItem'> | null;

export function loadAudioPreferences(storage: AudioStorage): AudioPreferences {
  try {
    const saved: unknown = JSON.parse(storage?.getItem(AUDIO_STORAGE_KEY) ?? 'null');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      const {master, muted} = saved as Record<string, unknown>;
      return {
        master: typeof master === 'number' && Number.isFinite(master) && master >= 0 && master <= 1 ? master : DEFAULT_MASTER_VOLUME,
        muted: muted === true,
      };
    }
  } catch { /* Storage can be unavailable or contain an older, invalid value. */ }
  return {master: DEFAULT_MASTER_VOLUME, muted: false};
}

export function saveAudioPreferences(storage: AudioStorage, preferences: AudioPreferences): void {
  try { storage?.setItem(AUDIO_STORAGE_KEY, JSON.stringify(preferences)); }
  catch { /* Keep live controls usable when storage is blocked or full. */ }
}
