import mongoose from 'mongoose';

const ContasAPagarSchema = new mongoose.Schema({
  actionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Action', required: true },
  staffName: { type: String }, // present for staff lines
  costId: { type: mongoose.Schema.Types.ObjectId }, // present for extra cost lines
  colaboradorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Colaborador' }, // optional link for cost lines
  reportDate: { type: Date, required: true },
  pdfUrl: { type: String },
  status: { type: String, enum: ['ABERTO', 'PAGO'], default: 'ABERTO', required: true },
});

// Ensure one record per actionId+staffName for entries that have staffName defined
ContasAPagarSchema.index(
  { actionId: 1, staffName: 1 },
  { unique: true, partialFilterExpression: { staffName: { $exists: true } } }
);

// Ensure one record per actionId+costId for cost entries
ContasAPagarSchema.index(
  { actionId: 1, costId: 1 },
  { unique: true, partialFilterExpression: { costId: { $exists: true } } }
);

// In dev with HMR, force recompile to pick up schema changes
try { mongoose.deleteModel('ContasAPagar'); } catch { /* model not defined yet */ }
export default mongoose.model('ContasAPagar', ContasAPagarSchema);