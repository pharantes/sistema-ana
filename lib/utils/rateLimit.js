// Storage for rate limit buckets by identifier
const requestBuckets = new Map();

function getCurrentTimestamp() {
  return Date.now();
}

function createRateLimitError() {
  const error = new Error('Too Many Requests');
  error.status = 429;
  return error;
}

function purgeExpiredRequests(bucket, windowMs, currentTime) {
  while (bucket.length > 0 && (currentTime - bucket[0]) > windowMs) {
    bucket.shift();
  }
}

function getOrCreateBucket(identifier) {
  let bucket = requestBuckets.get(identifier);

  if (!bucket) {
    bucket = [];
    requestBuckets.set(identifier, bucket);
  }

  return bucket;
}

/**
 * Creates a rate limiter that tracks requests per identifier within a time window.
 * Throws a 429 error when limit is exceeded.
 * 
 * @param {Function} idFn - Function to extract identifier from request
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} limit - Maximum requests per window
 */
export function rateLimit({ idFn = (request) => request.ip || 'anon', windowMs = 10_000, limit = 20 } = {}) {
  return {
    check(request) {
      const identifier = idFn(request);
      const currentTime = getCurrentTimestamp();
      const bucket = getOrCreateBucket(identifier);

      purgeExpiredRequests(bucket, windowMs, currentTime);

      if (bucket.length >= limit) {
        throw createRateLimitError();
      }

      bucket.push(currentTime);
    }
  };
}
