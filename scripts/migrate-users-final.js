/**
 * Migration script - Clean and create new users (using existing model)
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
  console.log('✅ Loaded .env.local\n');
}

const MONGODB_URI = process.env.MONGODB_URI;

const newUsers = [
  { name: 'Jaime Arantes Junior', username: 'jaimearantesjr@hotmail.com', password: 's3tj41m3!', role: 'admin' },
  { name: 'Ana Paula de Oliveira Pinto', username: 'anapaula@setagency.com.br', password: '4n4p4ul4-!', role: 'admin' },
  { name: 'Luciano Ferreira', username: 'luciano@setmodels.com.br', password: 'l5304n0u-)', role: 'staff' }
];

async function migrateUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    console.log('🗑️  Deleting existing users...');
    const deleteResult = await User.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} users\n`);

    console.log('📝 Creating new users...');
    for (const userData of newUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        username: userData.username,
        password: hashedPassword,
        role: userData.role
      });
      await user.save();
      console.log(`✅ Created ${userData.role}: ${userData.name} (${userData.username})`);
    }

    console.log('\n🔍 Verifying...');
    const total = await User.countDocuments();
    const admins = await User.countDocuments({ role: 'admin' });
    const staff = await User.countDocuments({ role: 'staff' });
    console.log(`Total: ${total} | Admins: ${admins} | Staff: ${staff}`);

    console.log('\n✅ Migration completed!');
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 USER CREDENTIALS SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');

    newUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} (${user.role.toUpperCase()})`);
      console.log(`   Email: ${user.username}`);
      console.log(`   Password: ${user.password}`);
      if (user.role === 'staff') {
        console.log(`   Access: /acoes, /colaboradores, /clientes (read & create only)`);
        console.log(`   Restricted: /dashboard, /contasapagar, /contasareceber`);
      } else {
        console.log(`   Access: Full access to all routes`);
      }
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected');
    process.exit(0);
  }
}

migrateUsers();
