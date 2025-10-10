export function isObjectIdLike(id) {
  return /^[0-9a-fA-F]{24}$/.test(String(id || ''));
}

export function toPlainDoc(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const o = { ...doc };
  // Handle Mongoose lean docs (_id/createdAt/etc.)
  if (o._id != null) o._id = String(o._id);
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (v instanceof Date) o[k] = v.toISOString();
  }
  return o;
}

export function toPlainDocs(list) {
  if (!Array.isArray(list)) return [];
  return list.map(toPlainDoc);
}
