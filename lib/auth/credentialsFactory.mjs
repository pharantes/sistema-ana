/**
 * Checks if a value is a valid function
 * @param {any} value - Value to check
 * @returns {boolean} Whether value is a function
 */
function isFunction(value) {
  return typeof value === 'function';
}

/**
 * Checks if a value is a plain object
 * @param {any} value - Value to check
 * @returns {boolean} Whether value is an object
 */
function isObject(value) {
  return value && typeof value === 'object';
}

/**
 * Attempts to find a function in an object by preferred key names
 * @param {Object} moduleObject - Module object to search
 * @returns {Function|null} Found function or null
 */
function findByPreferredKeys(moduleObject) {
  const preferredKeys = ['default', 'Credentials', 'credentials', 'provider'];

  for (const key of preferredKeys) {
    if (moduleObject[key] && isFunction(moduleObject[key])) {
      return moduleObject[key];
    }
  }

  return null;
}

/**
 * Scans object values to find first function
 * @param {Object} moduleObject - Object to scan
 * @returns {Function|null} Found function or null
 */
function scanForFunction(moduleObject) {
  for (const value of Object.values(moduleObject)) {
    if (isFunction(value)) {
      return value;
    }
  }
  return null;
}

/**
 * Recursively searches nested objects for functions
 * @param {Object} moduleObject - Object to search
 * @param {number} remainingDepth - Remaining recursion depth
 * @returns {Function|null} Found function or null
 */
function searchNestedObjects(moduleObject, remainingDepth) {
  if (remainingDepth <= 0) return null;

  for (const value of Object.values(moduleObject)) {
    if (isObject(value)) {
      const foundFunction = findFirstFunction(value, remainingDepth - 1);
      if (foundFunction) return foundFunction;
    }
  }

  return null;
}

/**
 * Finds the first function value in a module object (depth-limited search)
 * @param {Object} moduleObject - Module object to search
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {Function|null} Found function or null
 */
function findFirstFunction(moduleObject, maxDepth = 2) {
  if (!moduleObject || maxDepth < 0) return null;
  if (isFunction(moduleObject)) return moduleObject;
  if (!isObject(moduleObject)) return null;

  // Try preferred key names first
  const preferredFunction = findByPreferredKeys(moduleObject);
  if (preferredFunction) return preferredFunction;

  // Scan direct values
  const directFunction = scanForFunction(moduleObject);
  if (directFunction) return directFunction;

  // Recurse into nested objects
  return searchNestedObjects(moduleObject, maxDepth);
}

/**
 * Creates credentials provider configuration object
 * @param {Function} authorizeCallback - Authorization callback function
 * @returns {Object} Provider configuration
 */
function createProviderConfig(authorizeCallback) {
  return {
    id: 'credentials',
    name: 'credentials',
    credentials: {
      username: { label: 'Username', type: 'text' },
      password: { label: 'Password', type: 'password' },
    },
    authorize: authorizeCallback,
  };
}

/**
 * Logs error to stderr if available
 * @param {string} message - Error message
 */
function logError(message) {
  try {
    if (globalThis?.process && typeof globalThis.process.stderr?.write === 'function') {
      globalThis.process.stderr.write(message + '\n');
    }
  } catch {
    // Ignore logging errors
  }
}

/**
 * Attempts last-ditch factory lookup
 * @param {Object} module - Module object
 * @param {Function} authorizeCallback - Authorization callback
 * @returns {Object|null} Provider instance or null
 */
function tryLastDitchFactory(module, authorizeCallback) {
  try {
    if (module?.default && isFunction(module.default.default)) {
      return module.default.default(createProviderConfig(authorizeCallback));
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Gets Next-Auth credentials provider with dynamic factory resolution
 * @param {Function} authorizeCallback - Authorization callback function
 * @returns {Promise<Object|null>} Provider instance or null if unavailable
 */
export async function getCredentialsProvider(authorizeCallback) {

  try {
    const credentialsModule = await import('next-auth/providers/credentials');
    // Try to aggressively locate a factory function in the imported module
    const factoryFunction = findFirstFunction(credentialsModule, 3);

    if (!factoryFunction) {
      // Last-ditch: if module.default is an object with a 'default' function
      const lastDitchResult = tryLastDitchFactory(credentialsModule, authorizeCallback);
      if (lastDitchResult) {
        return lastDitchResult;
      }

      // Nothing usable found - log diagnostic info
      try {
        const moduleKeys = isObject(credentialsModule)
          ? Object.keys(credentialsModule).join(',')
          : String(typeof credentialsModule);
        logError(`credentialsFactory: no factory found; modKeys=${moduleKeys}`);
      } catch {
        // Ignore diagnostic errors
      }

      return null;
    }

    // Call the factory with our options and return the provider instance
    return factoryFunction(createProviderConfig(authorizeCallback));
  } catch (err) {
    // Log import failure diagnostics
    const errorMessage = err && err.stack ? err.stack : String(err);
    logError('credentialsFactory import failed: ' + errorMessage);
    return null;
  }
}
