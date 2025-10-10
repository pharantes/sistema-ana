const buckets = new Map();

function now() { return Date.now(); }

export function rateLimit({ idFn = (req) => req.ip || 'anon', windowMs = 10_000, limit = 20 } = {}) {
  return {
    check(req) {
      const id = idFn(req);
      const t = now();
      let b = buckets.get(id);
      if (!b) { b = []; buckets.set(id, b); }
      // purge old
      while (b.length && (t - b[0]) > windowMs) b.shift();
      if (b.length >= limit) {
        const err = new Error('Too Many Requests');
        err.status = 429;
        throw err;
      }
      b.push(t);
    }
  };
}
