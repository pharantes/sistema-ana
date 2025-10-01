import dbConnect from './connect.js';
import Action from './models/Action.js';
import Cliente from './models/Cliente.js';
import Servidor from './models/Servidor.js';

async function migrate() {
  await dbConnect();
  console.log('Connected');

  const actions = await Action.find({}).lean();
  console.log(`Found ${actions.length} actions`);

  for (const a of actions) {
    const updates = {};
    // resolve client id
    if (a.client && /^[0-9a-fA-F]{24}$/.test(String(a.client))) {
      try {
        const cli = await Cliente.findById(a.client).lean();
        if (cli) updates.client = cli.nome || cli.name || a.client;
      } catch (err) { }
    }

    // enrich staff entries using servidor ids (if present)
    if (Array.isArray(a.staff)) {
      const newStaff = [];
      function parseCurrency(v) {
        if (v == null) return 0;
        if (typeof v === 'number') return v;
        const cleaned = String(v).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
        const n = parseFloat(cleaned);
        return Number.isFinite(n) ? n : 0;
      }

      for (const s of a.staff) {
        if (s && s._id) {
          try {
            const serv = await Servidor.findById(s._id).lean();
            if (serv) {
              newStaff.push({ name: serv.nome || serv.name || s.name || '', value: parseCurrency(s.value || s.valor), pix: serv.pix || '', bank: serv.banco || '' });
              continue;
            }
          } catch (err) { }
        }
        // fallback: keep existing but ensure numeric value
        newStaff.push({ name: s.name || s.nome || '', value: parseCurrency(s.value || s.valor), pix: s.pix || '', bank: s.bank || '' });
      }
      updates.staff = newStaff;
    }

    if (Object.keys(updates).length) {
      await Action.updateOne({ _id: a._id }, { $set: updates });
      console.log('Updated action', a._id.toString());
    }
  }

  console.log('Migration finished');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
