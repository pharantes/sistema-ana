import ContasAPagar from '@/lib/db/models/ContasAPagar';
import connect from '@/lib/db/connect';

export async function GET() {
  await connect();
  const contas = await ContasAPagar.find().populate('actionId');
  return Response.json(contas);
}

export async function POST(request) {
  await connect();
  const data = await request.json();
  const conta = await ContasAPagar.create(data);
  return Response.json(conta);
}

export async function DELETE(request) {
  await connect();
  const { id } = await request.json();
  await ContasAPagar.findByIdAndDelete(id);
  return Response.json({ success: true });
}