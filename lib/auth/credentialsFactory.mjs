export async function getCredentialsProvider(authorizeCallback) {
  // Helper: find the first function value in the module object (depth-limited)
  function findFirstFunction(obj, depth = 2) {
    if (!obj || depth < 0) return null;
    if (typeof obj === 'function') return obj;
    if (typeof obj !== 'object') return null;
    // Prefer common names
    const prefer = ['default', 'Credentials', 'credentials', 'provider'];
    for (const key of prefer) {
      if (obj[key] && typeof obj[key] === 'function') return obj[key];
    }
    // Fall back to scanning values
    for (const val of Object.values(obj)) {
      if (typeof val === 'function') return val;
    }
    // Recurse one level
    for (const val of Object.values(obj)) {
      if (typeof val === 'object') {
        const fn = findFirstFunction(val, depth - 1);
        if (fn) return fn;
      }
    }
    return null;
  }

  try {
    const mod = await import('next-auth/providers/credentials');
    // Try to aggressively locate a factory function in the imported module
    const factory = findFirstFunction(mod, 3);

    if (!factory) {
      try {
        // Last-ditch: if module.default is an object with a 'default' function
        if (mod && mod.default && typeof mod.default.default === 'function') {
          return mod.default.default({
            id: 'credentials',
            name: 'credentials',
            credentials: {
              username: { label: 'Username', type: 'text' },
              password: { label: 'Password', type: 'password' },
            },
            authorize: authorizeCallback,
          });
        }
      } catch {
        void 0;
      }
      // nothing usable found
      if (globalThis?.process && typeof globalThis.process.stderr?.write === 'function') {
        try {
          const keys = mod && typeof mod === 'object' ? Object.keys(mod).join(',') : String(typeof mod);
          globalThis.process.stderr.write(`credentialsFactory: no factory found; modKeys=${keys}\n`);
        } catch { void 0; }
      }
      return null;
    }

    // Call the factory with our options and return the provider instance
    return factory({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: authorizeCallback,
    });
  } catch (err) {
    // Prefer stderr for diagnostics; avoid console to keep lint clean
    try { process?.stderr?.write('credentialsFactory import failed: ' + String(err && err.stack ? err.stack : err) + "\n"); } catch { void 0; }
    return null;
  }
}
