// Keep configuration and timing testable without starting a server or GPU.
export function selectSmokeViewports(value) {
  if (value === undefined || value === 'both') return ['desktop', 'touch'];
  if (value === 'desktop' || value === 'touch') return [value];
  throw new Error('SMOKE_VIEWPORT must be desktop, touch, or both; omit it to run both.');
}

export function createSmokePhaseTimer(viewport, log = event => console.log(JSON.stringify({smokePhase: event})), now = () => performance.now()) {
  let active;
  const finish = status => {
    if (!active) return;
    log({viewport, phase: active.phase, status, elapsedMs: Math.round(now() - active.started)});
    active = undefined;
  };
  return {
    start(phase) {
      finish('passed');
      active = {phase, started: now()};
      log({viewport, phase, status: 'started'});
    },
    finish,
  };
}
