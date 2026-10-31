Original synthesized freeze-onset, shatter and reactor-boon cues. WAVs are direct PCM at production cue levels before user effects/master volume and compression; they are audition assets, not captured gameplay audio or listening approval. Source hashes are in manifest.json.

28 focused tests include real disabled-GPU/WebGL Chromium AudioContext checks for mute, rate caps, voice release, pause/resume and destruction. Full1533tests+1skip, assets,room-evidence and build pass. The initial full run found the extracted RAF test audio adapter missing syncFrozen; its original freeze assertions were retained and strengthened with blocked/recovering/paused audio-sync checks. Independent review addendum confirms repair.

Exact-head desktop CI, in-game mix and listening qualification remain pending. This does not close dense-horde readability, environmental lighting or broader issue12.
