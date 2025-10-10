// Server-only CJS shim to provide a function that constructs a credentials provider instance.
// Export a factory function: module.exports = function(authorizeCallback) => providerInstance
try {
  const cred = require('next-auth/providers/credentials');
  const factory = typeof cred === 'function' ? cred : (cred && typeof cred.default === 'function' ? cred.default : null);
  if (factory) {
    module.exports = function (authorizeCallback) {
      return factory({
        name: 'credentials',
        credentials: {
          username: { label: 'Username', type: 'text' },
          password: { label: 'Password', type: 'password' },
        },
        authorize: authorizeCallback,
      });
    };
  } else {
    // If provider factory shape unknown, export null to signal fallback
    module.exports = null;
  }
} catch {
  // Shim couldn't load provider (e.g., during client bundling). Export null to signal fallback.
  module.exports = null;
}
