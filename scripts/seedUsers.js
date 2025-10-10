#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console */
/* global process */
import 'dotenv/config';
import dbConnect from "../lib/db/connect.js";
import User from "../lib/db/models/User.js";
import bcrypt from "bcryptjs";

async function run() {
  await dbConnect();
  const users = [
    { username: 'admin', password: 'adminpassword', role: 'admin' },
    { username: 'staff', password: 'staffpassword', role: 'staff' },
  ];

  for (const u of users) {
    const exists = await User.findOne({ username: u.username });
    if (exists) {
      console.log(`User ${u.username} already exists`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 10);
    const created = await User.create({ username: u.username, password: hashed, role: u.role });
    console.log(`Created user ${created.username}`);
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
