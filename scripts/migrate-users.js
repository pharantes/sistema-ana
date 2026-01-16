/**
 * Migration script to clean and populate users with correct credentials
 * 
 * New users:
 * - 2 Admins (full access)
 * - 1 Staff (limited access: only /acoes, /colaboradores, /clientes - read & create only, no delete)
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envLocalPath = join(__dirname, '..', '.env.local');
const envPath = join(__dirname, '..', '.env');

if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('📄 Loaded .env.local');
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('📄 Loaded .env');
} else {
  console.log('⚠️  No .env file found, using environment variables');
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-ana';

// User Schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 30,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 128
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      required: true
    },
  },
  { timestamps: true }
);

// Delete model if it exists
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model('User', userSchema);

// New users data
const newUsers = [
  {
    name: 'Jaime Arantes Junior',
    username: 'jaimearantesjr@hotmail.com',
    password: 's3tj41m3!',
    role: 'admin'
  },
  {
    name: 'Ana Paula de Oliveira Pinto',
    username: 'anapaula@setagency.com.br',
    password: '4n4p4ul4-!',
    role: 'admin'
  },
  {
    name: 'Luciano Ferreira',
    username: 'luciano@setmodels.com.br',
    password: 'l5304n0u-)',
    role: 'staff'
  }
];

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function migrateUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log(`📍 Connection string: ${MONGODB_URI.replace(/\/\/.*:.*@/, '//<credentials>@')}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Delete all existing users
    console.log('🗑️  Deleting existing users...');
    try {
      const deleteResult = await User.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} users\n`);
    } catch (deleteError) {
      console.log('⚠️  No users to delete or delete error:', deleteError.message);
    }

    // Step 2: Create new users with hashed passwords
    console.log('📝 Creating new users...');

    for (const userData of newUsers) {
      try {
        const hashedPassword = await hashPassword(userData.password);

        const user = await User.create({
          username: userData.username,
          password: hashedPassword,
          role: userData.role
        });

        console.log(`✅ Created ${userData.role}: ${userData.name}`);
        console.log(`   Email: ${userData.username}`);
        console.log(`   Role: ${userData.role}`);
      } catch (createError) {
        console.error(`❌ Error creating user ${userData.name}:`, createError.message);
      }
    }

    // Step 3: Verify the data
    console.log('\n🔍 Verifying users...');
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    const staffCount = await User.countDocuments({ role: 'staff' });

    console.log(`✅ Total users: ${totalUsers}`);
    console.log(`   👑 Admins: ${adminCount}`);
    console.log(`   👤 Staff: ${staffCount}`);

    // Show all users
    console.log('\n📊 User List:');
    const users = await User.find().select('username role createdAt');
    users.forEach((user, idx) => {
      console.log(`\n${idx + 1}. ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 User Credentials Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    newUsers.forEach((user, idx) => {
      console.log(`\n${idx + 1}. ${user.name} (${user.role.toUpperCase()})`);
      console.log(`   Email: ${user.username}`);
      console.log(`   Password: ${user.password}`);
      if (user.role === 'staff') {
        console.log(`   Access: /acoes, /colaboradores, /clientes (read & create only, no delete)`);
        console.log(`   Restricted: /dashboard, /contasapagar, /contasareceber`);
      } else {
        console.log(`   Access: Full access to all routes`);
      }
    });
    console.log('\n═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}
