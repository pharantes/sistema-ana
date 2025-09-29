import Cliente from '@/lib/db/models/Cliente';
import connect from '@/lib/db/connect';

export async function GET() {
  await connect();
  const clientes = await Cliente.find();
  return Response.json(clientes);
}

export async function POST(request) {
  await connect();
  const data = await request.json();
  const cliente = await Cliente.create(data);
  return Response.json(cliente);
}