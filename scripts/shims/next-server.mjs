export const NextResponse = {
  json(data, init = {}) {
    const body = JSON.stringify(data);
    const headers = new Headers(init.headers || {});
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    return new Response(body, { ...init, headers });
  }
};
