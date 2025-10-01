import mongoose from 'mongoose';

const ClienteSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    set: v => String(v).padStart(4, '0')
  },
  nome: { type: String, required: true },
  endereco: { type: String, required: true },
  cidade: { type: String, required: true },
  uf: { type: String, required: true },
  telefone: { type: String, required: true },
  email: { type: String, required: true },
  nomeContato: { type: String, required: true },
  tipo: { type: String, required: true },
  cnpjCpf: { type: String, required: true },
});

export default mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);