import mongoose from 'mongoose';

const ClienteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  telefon: { type: String, required: true },
  bank: { type: String, required: true },
});

export default mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);