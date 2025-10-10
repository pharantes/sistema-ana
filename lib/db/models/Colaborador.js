import mongoose from 'mongoose';

const ColaboradorSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    set: v => String(v).padStart(4, '0')
  },
  nome: { type: String, required: true },
  empresa: { type: String },
  pix: { type: String },
  banco: { type: String },
  conta: { type: String },
  uf: { type: String },
  telefone: { type: String },
  email: { type: String },
  tipo: { type: String, enum: ['Pessoa Fisica', 'Pessoa Juridica'] },
  cnpjCpf: { type: String },
}, { timestamps: true });

export default mongoose.models.Colaborador || mongoose.model('Colaborador', ColaboradorSchema);
