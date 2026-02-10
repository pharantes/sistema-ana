/* eslint-env node */
export function logError(scope, err) {
  try { process.stderr.write(`[${scope}] ${String(err && err.stack ? err.stack : err)}\n`); } catch { /* noop */ }
}

export function logWarn(scope, msg) {
  try { process.stderr.write(`[${scope}] ${String(msg)}\n`); } catch { /* noop */ }
}

export function logInfo(scope, msg) {
  try { process.stdout.write(`[${scope}] ${String(msg)}\n`); } catch { /* noop */ }
}
