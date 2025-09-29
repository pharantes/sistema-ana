import mongoose from 'mongoose';

const ContasAPagarSchema = new mongoose.Schema({
  actionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Action', required: true },
  reportDate: { type: Date, required: true },
  pdfUrl: { type: String },
});

export default mongoose.models.ContasAPagar || mongoose.model('ContasAPagar', ContasAPagarSchema);