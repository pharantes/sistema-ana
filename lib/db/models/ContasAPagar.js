import mongoose from 'mongoose';

const ContasAPagarSchema = new mongoose.Schema({
  actionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Action', required: true },
  reportDate: { type: Date, required: true },
  pdfUrl: { type: String },
  status: { type: String, enum: ['ABERTO', 'PAGO'], default: 'ABERTO', required: true },
});

export default mongoose.models.ContasAPagar || mongoose.model('ContasAPagar', ContasAPagarSchema);