/**
 * Clean Actions, Contas a Pagar, and Contas a Receber from Database
 * 
 * This script removes all test/old data from:
 * - Actions collection
 * - Contas a Pagar (embedded in actions)
 * - Contas a Receber collection
 * 
 * Keeps intact:
 * - Users
 * - Colaboradores
 * - Clientes
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Action from '../lib/db/models/Action.js';
import ContasAReceber from '../lib/db/models/ContasAReceber.js';

dotenv.config({ path: '.env.local' });

async function cleanDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count documents before deletion
    const actionsCount = await Action.countDocuments();
    const contasReceberCount = await ContasAReceber.countDocuments();

    console.log('📊 Current Database Status:');
    console.log(`   Actions: ${actionsCount} documents`);
    console.log(`   Contas a Receber: ${contasReceberCount} documents\n`);

    // Confirm deletion
    console.log('⚠️  WARNING: This will delete all actions and contas data!');
    console.log('   Users, Colaboradores, and Clientes will be preserved.\n');

    // Delete all actions (this includes embedded contas a pagar)
    console.log('🗑️  Deleting all actions...');
    const actionsResult = await Action.deleteMany({});
    console.log(`✅ Deleted ${actionsResult.deletedCount} actions\n`);

    // Delete all contas a receber
    console.log('🗑️  Deleting all contas a receber...');
    const contasReceberResult = await ContasAReceber.deleteMany({});
    console.log(`✅ Deleted ${contasReceberResult.deletedCount} contas a receber\n`);

    // Verify deletion
    const remainingActions = await Action.countDocuments();
    const remainingContasReceber = await ContasAReceber.countDocuments();

    console.log('📊 Final Database Status:');
    console.log(`   Actions: ${remainingActions} documents`);
    console.log(`   Contas a Receber: ${remainingContasReceber} documents\n`);

    console.log('✅ Database cleanup completed successfully!');
    console.log('   All actions and contas data have been removed.');
    console.log('   Users, Colaboradores, and Clientes remain intact.\n');

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanDatabase()
  .then(() => {
    console.log('\n🎉 Cleanup process finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup process failed:', error);
    process.exit(1);
  });
