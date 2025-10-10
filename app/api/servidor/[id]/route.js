/* eslint-env node */
export async function GET() {
  return new Response(JSON.stringify({ error: 'The /api/servidor endpoint is deprecated. Use /api/colaborador instead.' }), { status: 410 });
}
