import NextAuth from "next-auth";
import baseOptions, { authorizeUser } from "../../../../lib/auth/authOptionsBase";

// Build the final auth options at runtime: prefer server-side shim, else inline provider
async function buildAuthOptions() {
  const authorizeWrapper = async (credentials) => {
    return await authorizeUser(credentials);
  };
  // Prefer an ESM shim that attempts to import next-auth's credentials provider in the server runtime
  try {
    const { getCredentialsProvider } = await import('../../../../lib/auth/credentialsFactory.mjs');
    if (typeof getCredentialsProvider === 'function') {
      const providerFromShim = await getCredentialsProvider(authorizeWrapper);
      if (providerFromShim) return { ...baseOptions, providers: [providerFromShim] };
    }
  } catch {
    // ignore and try CJS shim next
  }

  // Try server-side CJS shim (importing CJS via dynamic import will expose a default)
  try {
    const cjs = await import('../../../../lib/auth/credentialsFactory.cjs');
    const factory = cjs && (typeof cjs === 'function' ? cjs : cjs.default);
    if (typeof factory === 'function') {
      const providerFromCjs = await factory(authorizeWrapper);
      if (providerFromCjs) return { ...baseOptions, providers: [providerFromCjs] };
    }
  } catch {
    // fall through to error
  }

  // If we reach here, no shim produced a provider
  throw new Error('No credentials provider available from shims');
}

const handler = async (req, res) => {
  try {
    const options = await buildAuthOptions();
    // NextAuth import can be a namespace object depending on bundling; prefer function export
    let NextAuthFn = NextAuth;
    if (typeof NextAuthFn !== 'function' && NextAuth && typeof NextAuth.default === 'function') {
      NextAuthFn = NextAuth.default;
    }
    if (typeof NextAuthFn !== 'function') {
      process.stderr.write('NextAuth is not a function; module shape: ' + String(typeof NextAuth) + "\n");
      throw new Error('NextAuth import is not callable');
    }
    const nextAuthHandler = NextAuthFn(options);
    return await nextAuthHandler(req, res);
  } catch (err) {
    // Log and return a clear JSON error so logs capture the stack
    try {
      process.stderr.write('NextAuth handler error ' + (err && err.stack ? err.stack : String(err)) + "\n");
    } catch {
      // ignore
    }
    // For App Router, return a Response if res isn't a Node response
    if (res && typeof res.setHeader === 'function') {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: String(err?.message || err) }));
      return;
    }
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export { handler as GET, handler as POST };