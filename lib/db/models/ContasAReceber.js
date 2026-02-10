/**
 * ContasAReceber Model - Tracks receivable accounts from clients
 */
import mongoose from 'mongoose';

/**
 * ContasAReceber schema - Manages client payment receivables with installment support
 */
const ContasAReceberSchema = new mongoose.Schema({
  actionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Action', required: true }],
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  // When the receivable was registered (document date)
  reportDate: { type: Date, required: true },
  status: { type: String, enum: ['ABERTO', 'RECEBIDO'], default: 'ABERTO', required: true },
  // Admin-selected receiving bank/account information
  banco: { type: String },
  conta: { type: String },
  formaPgt: { type: String },
  // Description of the receivable
  descricao: { type: String },
  // Recorrente vs Parcelas flags
  recorrente: { type: Boolean, default: false },
  parcelas: { type: Boolean, default: false },
  // Quantidade e valor por parcela
  qtdeParcela: { type: Number },
  valorParcela: { type: Number },
  // Valores totais e datas
  valor: { type: Number },
  dataVencimento: { type: Date },
  dataRecebimento: { type: Date },
  // Individual installments - used when qtdeParcela > 1
  installments: [{
    number: { type: Number, required: true },      // 1, 2, 3...
    value: { type: Number, required: true },       // value of this installment
    dueDate: { type: Date, required: true },       // vencimento for this installment
    status: { type: String, enum: ['ABERTO', 'RECEBIDO'], default: 'ABERTO', required: true },
    paidDate: { type: Date }                       // when it was actually paid
  }]
}, { timestamps: true });

try { mongoose.deleteModel('ContasAReceber'); } catch { /* ignore */ }
export default mongoose.model('ContasAReceber', ContasAReceberSchema);
