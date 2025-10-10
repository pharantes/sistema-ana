#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console */
/* global process, console */
import 'dotenv/config';
import dbConnect from '../lib/db/connect.js';
import mongoose from 'mongoose';
import Action from '../lib/db/models/Action.js';
import Cliente from '../lib/db/models/Cliente.js';
import Colaborador from '../lib/db/models/Colaborador.js';
import ContasAPagar from '../lib/db/models/ContasAPagar.js';

async function run() {
  await dbConnect();
  const collections = [
    // Skipping users as requested; keep existing users intact
    { name: 'actions', model: Action },
    { name: 'clientes', model: Cliente },
    { name: 'colaboradors', model: Colaborador },
    { name: 'contasapagars', model: ContasAPagar },
  ];
  for (const { name, model } of collections) {
    try {
      const res = await model.deleteMany({});
      console.log(`Cleared ${name}: ${res.deletedCount}`);
    } catch (err) {
      console.error(`Error clearing ${name}`, err);
    }
  }
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
