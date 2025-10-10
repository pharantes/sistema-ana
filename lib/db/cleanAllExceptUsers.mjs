/* eslint-env node */
/* eslint-disable no-console */
import dbConnect from './connect.js';
import mongoose from 'mongoose';

// Models to purge (intentionally excluding Users)
import Action from './models/Action.js';
import Cliente from './models/Cliente.js';
import Colaborador from './models/Colaborador.js';
import ContasAPagar from './models/ContasAPagar.js';
import ContasAReceber from './models/ContasAReceber.js';
import ContaFixa from './models/ContaFixa.js';
// Legacy/unused models that may still have documents
try { await import('./models/Servidor.js'); } catch { /* ignore if removed */ }

async function main() {
  await dbConnect();
  const conn = mongoose.connection;
  console.log('[clean] Connected to MongoDB:', conn.name);

  const tasks = [];
  const pushDel = (label, fn) => {
    tasks.push(
      fn().then((res) => { console.log(`[clean] ${label}:`, res?.deletedCount ?? 'ok'); })
        .catch((e) => { console.warn(`[clean] ${label} failed:`, e?.message || e); })
    );
  };

  pushDel('Actions', () => Action.deleteMany({}));
  pushDel('Clientes', () => Cliente.deleteMany({}));
  pushDel('Colaboradores', () => Colaborador.deleteMany({}));
  pushDel('ContasAPagar', () => ContasAPagar.deleteMany({}));
  pushDel('ContasAReceber', () => ContasAReceber.deleteMany({}));
  pushDel('ContaFixa', () => ContaFixa.deleteMany({}));

  // Attempt to also clear legacy collections not modeled, but do not fail build if missing
  const maybeDrop = async (name) => {
    try {
      const exists = await conn.db.listCollections({ name }).hasNext();
      if (exists) {
        await conn.db.collection(name).deleteMany({});
        console.log(`[clean] Legacy collection cleared: ${name}`);
      }
    } catch { /* noop */ }
  };
  // Common legacy/pluralization candidates
  tasks.push(maybeDrop('servidors'));
  tasks.push(maybeDrop('servidores'));

  await Promise.all(tasks);
  console.log('[clean] Done. Users collection was preserved.');
  process.exit(0);
}

main().catch((err) => { console.error('[clean] Fatal:', err); process.exit(1); });
