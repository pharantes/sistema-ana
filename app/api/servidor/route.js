export const GET = () => new Response(JSON.stringify({ error: 'Deprecated endpoint. Use /api/colaborador.' }), { status: 410 });
export const POST = GET;
export const PATCH = GET;
export const DELETE = GET;