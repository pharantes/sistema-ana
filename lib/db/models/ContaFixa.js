import mongoose from 'mongoose';

const ContaFixaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  empresa: { type: String, required: true },
  tipo: { type: String, enum: ['quizenal', 'mensal'], required: true },
  valor: { type: Number },
  status: { type: String, enum: ['ABERTO', 'PAGO'], default: 'ABERTO' },
  lastPaidAt: { type: Date },
  vencimento: { type: Date },
  nextDueAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.ContaFixa || mongoose.model('ContaFixa', ContaFixaSchema);
