/*
  Direct invocation smoke tests for App Router handlers.
  Useful when HTTP server isn’t reachable in CI or local shell.
*/
import './bootstrap-paths.mjs';
import { GET as contasGet, POST as contasPost, PATCH as contasPatch, DELETE as contasDel } from '../app/api/contasapagar/route.js';
import { GET as clienteById } from '../app/api/cliente/[id]/route.js';
import { GET as colaboradorById } from '../app/api/colaborador/[id]/route.js';
import { POST as actionReportById } from '../app/api/action/report/[id]/route.js';

function req(url, init = {}) {
  return new Request(url, init);
}

function ctx(params) { return { params }; }

async function toJson(res) {
  try { return await res.json(); } catch { return null; }
}

async function run() {
  const base = 'http://local.test';
  const out = [];

  try {
    const r1 = await contasGet(req(base + '/api/contasapagar'));
    out.push(['contasapagar GET', r1.status, await toJson(r1)]);
  } catch (e) {
    out.push(['contasapagar GET', 'ERR', String(e?.message || e)]);
  }

  try {
    const r2 = await contasPatch(req(base + '/api/contasapagar', { method: 'PATCH', body: JSON.stringify({}), headers: { 'content-type': 'application/json' } }));
    out.push(['contasapagar PATCH (unauth expected)', r2.status, await toJson(r2)]);
  } catch (e) {
    out.push(['contasapagar PATCH', 'ERR', String(e?.message || e)]);
  }

  try {
    const r3 = await clienteById(req(base + '/api/cliente/invalid-id'), ctx({ id: 'invalid-id' }));
    out.push(['cliente/[id] invalid', r3.status, await toJson(r3)]);
  } catch (e) {
    out.push(['cliente/[id] invalid', 'ERR', String(e?.message || e)]);
  }

  try {
    const r4 = await clienteById(req(base + '/api/cliente/651111111111111111111111'), ctx({ id: '651111111111111111111111' }));
    out.push(['cliente/[id] non-existent', r4.status, await toJson(r4)]);
  } catch (e) {
    out.push(['cliente/[id] non-existent', 'ERR', String(e?.message || e)]);
  }

  try {
    const r5 = await colaboradorById(req(base + '/api/colaborador/invalid-id'), ctx({ id: 'invalid-id' }));
    out.push(['colaborador/[id] invalid', r5.status, await toJson(r5)]);
  } catch (e) {
    out.push(['colaborador/[id] invalid', 'ERR', String(e?.message || e)]);
  }

  try {
    const r6 = await actionReportById(req(base + '/api/action/report/651111111111111111111111', { method: 'POST' }), ctx({ id: '651111111111111111111111' }));
    out.push(['action/report/[id] POST (forbidden expected)', r6.status, await toJson(r6)]);
  } catch (e) {
    out.push(['action/report/[id] POST', 'ERR', String(e?.message || e)]);
  }

  for (const [name, status, body] of out) {
    const shape = body && typeof body === 'object' && !Array.isArray(body)
      ? `{ ${Object.keys(body).slice(0, 5).join(', ')}${Object.keys(body).length > 5 ? ', …' : ''} }`
      : Array.isArray(body) ? `Array(${body.length})` : typeof body;
    console.log(`\n[${name}] status=${status} shape=${shape}`);
    if (body && body.error) console.log(`  error: ${body.error}`);
  }
}

run().catch((e) => { console.error('Smoke handlers error:', e); process.exit(1); });
