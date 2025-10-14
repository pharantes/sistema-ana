/*
  Simple smoke tests against dev server endpoints to validate status codes and JSON shapes.
  Run while `npm run dev` is active.
*/

const base = process.env.BASE_URL || 'http://localhost:3000';

async function hit(path, init) {
  const url = base + path;
  try {
    const res = await fetch(url, init);
    const ct = res.headers.get('content-type') || '';
    let body;
    if (ct.includes('application/json')) {
      try { body = await res.json(); } catch { body = null; }
    } else {
      try { body = await res.text(); } catch { body = null; }
    }
    return { url, status: res.status, ok: res.ok, body };
  } catch (e) {
    return { url, error: String(e?.message || e) };
  }
}

function summarize(name, result) {
  const { url, status, ok, body, error } = result;
  const shape = body && typeof body === 'object' && !Array.isArray(body)
    ? `{ ${Object.keys(body).slice(0, 5).join(', ')}${Object.keys(body).length > 5 ? ', …' : ''} }`
    : Array.isArray(body) ? `Array(${body.length})` : typeof body;
  console.log(`\n[${name}] ${url}`);
  if (error) {
    console.log(`  ERROR: ${error}`);
  } else {
    console.log(`  Status: ${status} (${ok ? 'ok' : 'not ok'})`);
    console.log(`  Shape: ${shape}`);
    if (body && body.error) console.log(`  Error message: ${body.error}`);
  }
}

async function main() {
  const results = [];

  // 1) GET /api/contasapagar (may 200 with array or 500 with { error })
  results.push(['GET contasapagar', await hit('/api/contasapagar')]);

  // 2) PATCH /api/contasapagar (expect 401 Unauthorized without session)
  results.push(['PATCH contasapagar (unauth)', await hit('/api/contasapagar', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({}) })]);

  // 3) cliente/[id] invalid id => 400
  results.push(['GET cliente invalid id', await hit('/api/cliente/invalid-id')]);

  // 4) cliente/[id] valid but non-existent => 404 (or 500 if DB unavailable)
  results.push(['GET cliente non-existent', await hit('/api/cliente/651111111111111111111111')]);

  // 5) colaborador/[id] invalid id => 400
  results.push(['GET colaborador invalid id', await hit('/api/colaborador/invalid-id')]);

  // 6) action/report/[id] without admin session => 403
  results.push(['POST action report (forbidden)', await hit('/api/action/report/651111111111111111111111', { method: 'POST' })]);

  for (const [name, r] of results) summarize(name, r);

  // Simple success criteria summary
  const summary = results.map(([name, r]) => ({ name, status: r?.status, ok: r?.ok, error: r?.body?.error || r?.error || null }));
  console.log('\nSummary:', summary);
}

main().catch((e) => { console.error('Smoke test runner error:', e); process.exit(1); });
