/*
 * NoSQL-injection sanitiser.
 *
 * Replaces express-mongo-sanitize, which is incompatible with Express 5:
 * it reassigns req.query, but in Express 5 that property is a prototype getter
 * with no setter, so every request carrying a query string threw
 * "Cannot set property query of #<IncomingMessage>" and returned 500.
 *
 * A key is dangerous if it:
 *   - starts with "$"   — a Mongo operator such as $ne, $gt or $where
 *   - contains "."      — dotted path traversal into a subdocument
 *   - contains "[$"     — an operator smuggled through bracket syntax, which
 *                         the default Express 5 query parser leaves as a flat
 *                         literal key like "price[$gt]"
 */

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Buffer.isBuffer(value);

const isDangerousKey = (key) =>
  key.startsWith("$") || key.includes(".") || key.includes("[$");

/* Walks a parsed request payload and strips dangerous keys in place.
   Returns the number of keys removed so callers can log suspicious traffic. */
export const stripOperators = (value, depth = 0) => {
  /* Guard against deeply nested payloads crafted to burn CPU. */
  if (!isPlainObject(value) || depth > 10) return 0;

  let removed = 0;

  if (Array.isArray(value)) {
    for (const item of value) {
      removed += stripOperators(item, depth + 1);
    }
    return removed;
  }

  for (const key of Object.keys(value)) {
    if (isDangerousKey(key)) {
      delete value[key];
      removed += 1;
      continue;
    }
    removed += stripOperators(value[key], depth + 1);
  }

  return removed;
};

export const sanitizeRequest = (req, _res, next) => {
  let removed = 0;

  /* req.body and req.params are plain writable objects. */
  removed += stripOperators(req.body);
  removed += stripOperators(req.params);

  /* req.query is a prototype getter in Express 5 that re-parses the query
     string on every access, so mutating what it returns is useless — the next
     read hands back a fresh, unsanitised object. Sanitise one copy and pin it
     as an own property, which shadows the getter for the rest of the request. */
  const query = req.query;
  if (isPlainObject(query)) {
    removed += stripOperators(query);
    Object.defineProperty(req, "query", {
      value: query,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  if (removed > 0) {
    console.warn(`Sanitised ${removed} suspicious key(s) on ${req.method} ${req.path}`);
  }

  return next();
};

export default sanitizeRequest;
