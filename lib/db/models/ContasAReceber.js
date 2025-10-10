import mongoose from 'mongoose';

const ContasAReceberSchema = new mongoose.Schema({
  actionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Action', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  reportDate: { type: Date, required: true },
  status: { type: String, enum: ['ABERTO', 'RECEBIDO'], default: 'ABERTO', required: true },
});

try { mongoose.deleteModel('ContasAReceber'); } catch { /* ignore */ }
export default mongoose.model('ContasAReceber', ContasAReceberSchema);
