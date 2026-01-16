/**
 * Verification script to check colaboradores data
 */
import mongoose from 'mongoose';
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
} else if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-ana';

const ColaboradorSchema = new mongoose.Schema({
  codigo: { type: String },
  nome: { type: String },
  pix: { type: String },
  banco: { type: String },
  telefone: { type: String },
  email: { type: String },
  tipo: { type: String },
  cnpjCpf: { type: String },
}, { timestamps: true });

if (mongoose.models.Colaborador) {
  delete mongoose.models.Colaborador;
}

const Colaborador = mongoose.model('Colaborador', ColaboradorSchema);

async function verifyData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count total
    const total = await Colaborador.countDocuments();
    console.log(`📊 Total colaboradores: ${total}\n`);

    // Count by tipo
    const pessoaFisica = await Colaborador.countDocuments({ tipo: 'Pessoa Fisica' });
    const pessoaJuridica = await Colaborador.countDocuments({ tipo: 'Pessoa Juridica' });
    console.log(`👤 Pessoa Física: ${pessoaFisica}`);
    console.log(`🏢 Pessoa Jurídica: ${pessoaJuridica}\n`);

    // Find records without email
    const noEmail = await Colaborador.countDocuments({ $or: [{ email: '' }, { email: null }] });
    console.log(`⚠️  Records without email: ${noEmail}\n`);

    // Group by banco
    const bancos = await Colaborador.aggregate([
      { $group: { _id: '$banco', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    console.log('🏦 Top 10 Bancos:');
    bancos.forEach(b => {
      console.log(`   ${b._id || 'N/A'}: ${b.count}`);
    });

    console.log('\n✅ Verification completed!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

verifyData();
