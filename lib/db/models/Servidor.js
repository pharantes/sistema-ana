import mongoose from 'mongoose';

const ServidorSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    set: v => String(v).padStart(4, '0')
  },
  nome: { type: String, required: true },
  pix: { type: String, required: true },
  banco: { type: String, required: true },
  uf: { type: String, required: true },
  telefone: { type: String, required: true },
  email: { type: String, required: true },
  tipo: { type: String, required: true },
  cnpjCpf: { type: String, required: true },
});

export default mongoose.models.Servidor || mongoose.model('Servidor', ServidorSchema);