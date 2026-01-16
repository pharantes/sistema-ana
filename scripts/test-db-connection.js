/**
 * Simple test to check DB connection and users
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envLocalPath = join(__dirname, '..', '.env.local');
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

const MONGODB_URI = process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
}, { timestamps: true });

if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model('User', userSchema);

async function testConnection() {
  try {
    console.log('Connecting...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected!');

    const count = await User.countDocuments();
    console.log(`Total users: ${count}`);

    const users = await User.find().select('username role');
    users.forEach(u => console.log(`- ${u.username} (${u.role})`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Done');
    process.exit(0);
  }
}

testConnection();
