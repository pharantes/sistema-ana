/* eslint-env node */
import 'dotenv/config';
import mongoose from 'mongoose';
import Cliente from '../../lib/db/models/Cliente.js';

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri);
  const updates = await Cliente.updateMany(
    { $or: [{ banco: { $exists: false } }, { conta: { $exists: false } }, { formaPgt: { $exists: false } }] },
    { $set: { banco: '', conta: '', formaPgt: '' } }
  );
  console.log('Updated clientes:', updates.modifiedCount);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
