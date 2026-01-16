/**
 * Test script to verify user roles in the database
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import User from '../lib/db/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envLocalPath = join(__dirname, '..', '.env.local');
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find().select('username role');

    console.log('📋 Current Users in Database:');
    console.log('═══════════════════════════════════════════════════');
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });

    // Check specific staff user
    const staffUser = await User.findOne({ username: 'luciano@setmodels.com.br' });
    if (staffUser) {
      console.log('✅ Staff user found:');
      console.log(`   Username: ${staffUser.username}`);
      console.log(`   Role: ${staffUser.role}`);
      console.log(`   Role type: ${typeof staffUser.role}`);
    } else {
      console.log('❌ Staff user NOT found!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected');
    process.exit(0);
  }
}

checkUsers();
