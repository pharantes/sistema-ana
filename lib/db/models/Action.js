import mongoose from "mongoose";
const { Schema } = mongoose;

const staffEntrySchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: Number, required: true },
    pix: { type: String },
    bank: { type: String },
    pgt: { type: String },
    vencimento: { type: Date },
  },
  { _id: false }
);

// Extra costs associated with the action
const costEntrySchema = new Schema(
  {
    description: { type: String, required: true },
    value: { type: Number, required: true },
    pix: { type: String },
    bank: { type: String },
    pgt: { type: String },
    vencimento: { type: Date },
    colaboradorId: { type: Schema.Types.ObjectId, ref: 'Colaborador' },
    vendorName: { type: String },
    vendorEmpresa: { type: String },
  },
  { _id: true }
);

const actionSchema = new Schema(
  {
    name: { type: String }, // event/title
    event: { type: String }, // optional alias
    client: { type: String },
    date: { type: Date }, // creation date for the action entry (first column "Criado em")
    startDate: { type: Date },
    endDate: { type: Date },
    paymentMethod: { type: String },
    dueDate: { type: Date },
    staff: { type: [staffEntrySchema], required: true },
    costs: { type: [costEntrySchema], required: false, default: [] },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Indexes to speed up common queries
actionSchema.index({ client: 1 });
actionSchema.index({ 'costs.colaboradorId': 1 });
actionSchema.index({ 'staff.name': 1 });
actionSchema.index({ 'costs.vendorName': 1 });

// In dev with HMR, force recompile to pick up schema changes (like new 'costs')
try { mongoose.deleteModel('Action'); } catch { /* model not defined yet */ }
export default mongoose.model('Action', actionSchema);
