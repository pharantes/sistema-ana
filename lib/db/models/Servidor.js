import mongoose from 'mongoose';

const ServidorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  telefon: { type: String, required: true },
  bank: { type: String, required: true },
  account: { type: String, required: true },
  pix: { type: String, required: true },
});

export default mongoose.models.Servidor || mongoose.model('Servidor', ServidorSchema);