// Capture-only policy. Call only for ERR_ABORTED; other failures stay fatal.
export function isCompletedDuplicateModule(url, loadedUrls) {
  if (!loadedUrls.has(url)) return false;
  let parsed;
  try { parsed = new URL(url); } catch { return false; }
  return /\.[cm]?[jt]sx?$/.test(parsed.pathname)
    || (parsed.pathname.endsWith('.json') && parsed.searchParams.has('import'));
}
