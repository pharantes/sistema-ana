import Servidor from '@/lib/db/models/Servidor';
import connect from '@/lib/db/connect';

export async function GET() {
  await connect();
  const servidores = await Servidor.find();
  return Response.json(servidores);
}

export async function POST(request) {
  await connect();
  const data = await request.json();
  const servidor = await Servidor.create(data);
  return Response.json(servidor);
}