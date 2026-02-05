#!/usr/bin/env node
/**
 * Clean Up Duplicate Collections
 * 
 * Removes test data collections and fixes collection names:
 * - colaboradores (8 test) → DELETE, use colaboradors (155)
 * - contasapagar (20 test) → DELETE, use contasapagars (16)
 * - contasareceber (15 test) → DELETE, use contasarecebers (0 but correct name)
 * - contafixas (2) → DELETE, use contasfixas (5)
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-ana';

async function cleanupCollections(db) {
  console.log('\n🧹 Cleaning up duplicate collections...\n');

  // Get all collections
  const collections = await db.listCollections().toArray();
  console.log('Found collections:');
  collections.forEach(c => console.log(`  - ${c.name}`));

  // Collections to drop (test data)
  const toDrop = [
    'colaboradores',  // Test data (8 docs), keep colaboradors (155)
    'contasapagar',   // Test data (20 docs), keep contasapagars (16)
    'contasareceber', // Test data (15 docs), keep contasarecebers
    'contafixas',     // Wrong name (2 docs), keep contasfixas (5)
  ];

  console.log('\n📋 Collections to drop:');

  for (const collectionName of toDrop) {
    try {
      const exists = collections.find(c => c.name === collectionName);
      if (exists) {
        const count = await db.collection(collectionName).countDocuments();
        console.log(`\n  Dropping '${collectionName}' (${count} documents)...`);
        await db.collection(collectionName).drop();
        console.log(`  ✅ Dropped successfully`);
      } else {
        console.log(`\n  ⏭️  '${collectionName}' not found, skipping`);
      }
    } catch (error) {
      console.log(`  ⚠️  Error dropping ${collectionName}:`, error.message);
    }
  }

  console.log('\n✅ Cleanup complete!');
}

async function verifyCorrectCollections(db) {
  console.log('\n📊 Verifying correct collections...\n');

  const correctCollections = {
    'actions': 'Action',
    'clientes': 'Cliente',
    'colaboradors': 'Colaborador',
    'contasapagars': 'ContasAPagar',
    'contasarecebers': 'ContasAReceber',
    'contasfixas': 'ContaFixa',
    'users': 'User',
  };

  for (const [collectionName, modelName] of Object.entries(correctCollections)) {
    const count = await db.collection(collectionName).countDocuments();
    console.log(`  ✓ ${collectionName} (${count} documents) - Model: ${modelName}`);
  }
}

async function main() {
  console.log('\n🗄️  Database Collection Cleanup\n');
  console.log('='.repeat(60));

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    await cleanupCollections(db);
    await verifyCorrectCollections(db);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All duplicate collections removed!');
    console.log('\n📝 Correct collection names:');
    console.log('  - colaboradors (not colaboradores)');
    console.log('  - contasapagars (not contasapagar)');
    console.log('  - contasarecebers (not contasareceber)');
    console.log('  - contasfixas (not contafixas)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
